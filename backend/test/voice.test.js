import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter, once } from 'node:events';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import WebSocket from 'ws';
import { createVoiceServer, allowedRequest, completionText } from '../src/voice-server.js';

test('voice is restricted to the local dashboard and exact host/path', () => {
  const request = { url: '/voice', headers: { host: '127.0.0.1:4319', origin: 'http://127.0.0.1:3002' } };
  assert.equal(allowedRequest(request), true);
  for (const origin of [undefined, 'null', 'https://evil.example', 'http://127.0.0.1:3002.evil.example']) assert.equal(allowedRequest({ ...request, headers: { ...request.headers, origin } }), false);
  assert.equal(allowedRequest({ ...request, headers: { ...request.headers, host: 'evil.example:4319' } }), false);
  assert.equal(allowedRequest({ ...request, url: '/elsewhere' }), false);
});

function sse(text, done = true) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\r\n\r\n${done ? 'data: [DONE]\r\n\r\n' : ''}`;
}
test('SSE preserves multilingual text across split UTF-8 bytes and rejects truncation/filter errors', async () => {
  const input = Buffer.from(sse('एक भिन्न is a fraction.'));
  async function* fragmented() { for (const byte of input) yield Uint8Array.of(byte); }
  const output = [];
  for await (const delta of completionText(fragmented())) output.push(delta);
  assert.equal(output.join(''), 'एक भिन्न is a fraction.');
  await assert.rejects(async () => { for await (const delta of completionText([Buffer.from(sse('partial', false))])) void delta; }, /ended early/);
  await assert.rejects(async () => { for await (const delta of completionText([Buffer.from('data: {"choices":[{"finish_reason":"content_filter"}]}\n')])) void delta; }, /rephrase/);
});

test('microphone calibrates 16/44.1/48 kHz to PCM16 mono and flushes the last short chunk', async () => {
  const code = await readFile(new URL('../../public/orby-mic-worklet.js', import.meta.url), 'utf8');
  for (const rate of [16000, 44100, 48000]) {
    let Processor;
    const output = [];
    const context = vm.createContext({ sampleRate: rate, AudioWorkletProcessor: class { constructor() { this.port = { postMessage: data => output.push(data) }; } }, registerProcessor: (_, constructor) => { Processor = constructor; } });
    vm.runInContext(code, context);
    const processor = new Processor();
    const count = rate * 1.25;
    for (let offset = 0; offset < count; offset += 128) processor.process([[new Float32Array(Math.min(128, count - offset)).fill(0.5)]]);
    processor.port.onmessage({ data: 'stop' });
    assert.equal(output.pop(), 'stopped');
    const pcm = output.flatMap(buffer => [...new Int16Array(buffer)]);
    assert.equal(pcm.length, 20000);
    assert.ok(pcm.every(value => Math.abs(value - 16384) <= 1), 'PCM quantization stays within one unit');
    assert.equal(output.at(-1).byteLength, 800 * 2, 'Final partial chunk is preserved');
    assert.equal(processor.process([]), false);
  }
});

async function fixture(t) {
  const upstreams = [], calls = [], texts = [];
  class FakeSarvam extends EventEmitter {
    constructor(url) {
      super(); this.url = url; this.readyState = 0; this.bufferedAmount = 0; this.detectedLanguage = 'en-IN';
      upstreams.push(this);
      queueMicrotask(() => {
        if (this.readyState === 3) return;
        this.readyState = 1; this.emit('open');
        if (this.url.includes('speech-to-text')) this.message({ event: 'session.begin' });
      });
    }
    message(data) { this.emit('message', Buffer.from(JSON.stringify(data))); }
    send(data) {
      const message = JSON.parse(data);
      if (message.event === 'speech_end') queueMicrotask(() => this.message({ event: 'transcript.final', text: this.silent ? '' : 'Explain a fraction.', language: this.detectedLanguage, language_confidence: this.confidence ?? 0.99 }));
      if (message.type === 'config') this.config = message.data;
      if (message.type === 'text') texts.push(message.data.text);
      if (message.type === 'flush') queueMicrotask(() => {
        this.message({ type: 'audio', data: { content_type: 'audio/pcm', audio: Buffer.alloc(100).toString('base64') } });
        this.message({ type: 'event', data: { event_type: 'final' } });
      });
    }
    close() { this.readyState = 3; this.emit('close'); }
    terminate() { this.close(); }
  }
  const server = createVoiceServer({ key: 'test-only', getToken: async () => 'test-token', endpoint: 'https://example.invalid', deployment: 'fast', Client: FakeSarvam, request: async (_, options) => { calls.push(JSON.parse(options.body)); return { ok: true, body: [Buffer.from(sse('A fraction represents part of a whole. One half is one of two equal parts.'))] }; } });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  const client = new WebSocket(`ws://127.0.0.1:${server.address().port}/voice`, { origin: 'http://127.0.0.1:3002', headers: { Host: '127.0.0.1:4319' } });
  const events = [];
  client.on('message', (bytes, binary) => events.push(binary ? { type: 'audio', bytes: bytes.length } : JSON.parse(bytes)));
  await once(client, 'open');
  t.after(async () => { client.terminate(); await new Promise(resolve => server.close(resolve)); });
  const until = async type => {
    const end = Date.now() + 1500;
    while (!events.some(event => event.type === type) && Date.now() < end) await new Promise(resolve => setTimeout(resolve, 5));
    assert.ok(events.some(event => event.type === type), `Expected ${type}: ${JSON.stringify(events)}`);
    return events.find(event => event.type === type);
  };
  return { client, upstreams, calls, texts, events, until, send: message => client.send(JSON.stringify(message)) };
}

test('second click finalizes STT, streams Azure into the classroom voice, and retains recent dialogue', async t => {
  const f = await fixture(t);
  for (let i = 0; i < 2; i++) {
    f.events.length = 0;
    f.send({ type: 'start', language: 'Hindi' }); await f.until('listening');
    f.upstreams.at(-1).detectedLanguage = 'hi-IN';
    f.client.send(Buffer.alloc(3200));
    assert.equal(f.calls.length, i, 'Must not answer before stop');
    f.send({ type: 'stop' }); await f.until('done');
    assert.deepEqual(f.events.map(event => event.type), ['listening', 'transcript', 'speaking', 'audio', 'done']);
    assert.equal(f.calls[i].messages.length, 2 + i * 2);
    assert.match(f.calls[i].messages[0].content, /Hindi/);
    assert.equal(f.calls[i].reasoning_effort, 'none');
  }
  assert.equal(f.texts.join(''), 'A fraction represents part of a whole. One half is one of two equal parts.'.repeat(2));
});

test('introduction speaks each student name without STT, AI, or fake dialogue', async t => {
  const f = await fixture(t);
  for (const name of ['Aanya', 'Ravi', 'अनन्या', '  ', null]) {
    f.events.length = 0;
    f.send({ type: 'greet', name });
    const result = await f.until('done');
    assert.equal(result.text, `Hi ${typeof name === 'string' && name.trim() ? name : 'Student'}! Welcome to your workspace by Beyond Marks AI Academy. I'm Orby, your study companion. Click me whenever you're ready to ask a question.`);
    assert.deepEqual(f.events.map(event => event.type), ['speaking', 'audio', 'done']);
  }
  assert.equal(f.calls.length, 0);
  assert.ok(f.upstreams.every(socket => socket.url.includes('text-to-speech')));
  f.events.length = 0;
  f.send({ type: 'start', language: 'English' }); await f.until('listening');
  f.send({ type: 'stop' }); await f.until('done');
  assert.equal(f.calls[0].messages.length, 2);
});

test('greeting bounds names and releases speech when hidden', async t => {
  const f = await fixture(t);
  f.send({ type: 'greet', name: 'A'.repeat(200) });
  assert.ok((await f.until('done')).text.startsWith(`Hi ${'A'.repeat(40)}!`));
  f.events.length = 0;
  f.send({ type: 'greet', name: 'Ravi' });
  f.send({ type: 'cancel' });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.ok(f.upstreams.every(socket => socket.readyState === 3));
  assert.equal(f.calls.length, 0);
});

test('cancel releases upstreams and ignores a late transcript', async t => {
  const f = await fixture(t);
  f.send({ type: 'start', language: 'English' }); await f.until('listening');
  f.send({ type: 'cancel' });
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(f.upstreams[0].readyState, 3);
  f.upstreams[0].message({ event: 'transcript.final', text: 'late question' });
  assert.equal(f.calls.length, 0);
});

test('silent input and malformed PCM do not trigger paid AI answers', async t => {
  const f = await fixture(t);
  f.send({ type: 'start', language: 'English' }); await f.until('listening');
  f.upstreams[0].silent = true; f.send({ type: 'stop' });
  assert.match((await f.until('error')).message, /hear/); f.events.length = 0;
  f.send({ type: 'start', language: 'English' }); await f.until('listening');
  f.client.send(Buffer.alloc(3)); await f.until('error');
  assert.equal(f.calls.length, 0);
});

test('auto-detection switches answer and speech language for all eleven supported languages', async t => {
  const f = await fixture(t);
  const cases = [['en-IN', 'English'], ['hi-IN', 'Hindi'], ['bn-IN', 'Bengali'], ['gu-IN', 'Gujarati'], ['kn-IN', 'Kannada'], ['ml-IN', 'Malayalam'], ['mr-IN', 'Marathi'], ['or-IN', 'Odia'], ['pa-IN', 'Punjabi'], ['ta-IN', 'Tamil'], ['te-IN', 'Telugu']];
  for (const [code, name] of cases) {
    f.events.length = 0;
    f.send({ type: 'start' }); await f.until('listening');
    const stt = f.upstreams.at(-1);
    assert.equal(new URL(stt.url).searchParams.get('language_code'), 'auto');
    assert.equal(new URL(stt.url).searchParams.get('model'), 'saaras:v4');
    stt.detectedLanguage = code;
    f.send({ type: 'stop' }); await f.until('done');
    assert.equal(f.events.find(event => event.type === 'transcript').language, name);
    assert.ok(f.calls.at(-1).messages[0].content.includes(`Answer in ${name},`));
    assert.equal(f.upstreams.at(-1).config.language_code, code === 'or-IN' ? 'od-IN' : code);
  }
});

test('Assamese, unsupported and missing detected languages never silently use another voice', async t => {
  const f = await fixture(t);
  for (const code of ['as-IN', 'ur-IN', undefined, '__proto__']) {
    f.events.length = 0;
    f.send({ type: 'start' }); await f.until('listening');
    f.upstreams.at(-1).detectedLanguage = code;
    f.send({ type: 'stop' });
    assert.match((await f.until('error')).message, code === 'as-IN' ? /beta/ : /supported spoken language/);
  }
  assert.equal(f.calls.length, 0);
  assert.ok(f.upstreams.every(socket => socket.url.includes('speech-to-text')));
});

test('uncertain language detection asks for a longer question without generating the wrong-language answer', async t => {
  const f = await fixture(t);
  f.send({ type: 'start' }); await f.until('listening');
  f.upstreams[0].confidence = 0.42;
  f.send({ type: 'stop' });
  assert.match((await f.until('error')).message, /longer question/);
  assert.equal(f.calls.length, 0);
  assert.equal(f.upstreams.length, 1);
});
