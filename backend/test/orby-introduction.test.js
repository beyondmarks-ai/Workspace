import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const { transform } = require('next/dist/build/swc');
const source = await readFile(new URL('../../app/dashboard/orby.js', import.meta.url), 'utf8');
const compiled = await transform(source, { filename: 'orby.js', jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' }, module: { type: 'commonjs' } });

async function mount(introduce) {
  const effects = [], sockets = [], sources = [], requests = [];
  let completions = 0;
  class Socket {
    static OPEN = 1;
    constructor() { this.readyState = 1; sockets.push(this); queueMicrotask(() => this.onopen?.()); }
    send(value) { requests.push(JSON.parse(value)); }
    close() { this.readyState = 3; }
    message(value) { this.onmessage({ data: typeof value === 'object' && !(value instanceof ArrayBuffer) ? JSON.stringify(value) : value }); }
  }
  class Audio {
    constructor() { this.state = 'running'; this.currentTime = 0; }
    resume() { return Promise.resolve(); }
    close() { this.state = 'closed'; return Promise.resolve(); }
    createBuffer(_, length, sampleRate) { return { duration: length / sampleRate, getChannelData: () => new Float32Array(length) }; }
    createBufferSource() { const node = { connect() {}, disconnect() {}, start() {}, stop() { this.onended?.(); } }; sources.push(node); return node; }
  }
  const fakeReact = { ...require('react'), useState: value => [value, () => {}], useRef: value => ({ current: value }), useEffect: effect => effects.push(effect) };
  const module = { exports: {} };
  vm.runInNewContext(compiled.code, { module, exports: module.exports, require: name => name === 'react' ? fakeReact : name.includes('shdr-02') ? () => null : require(name), document: { addEventListener() {}, removeEventListener() {} }, AudioContext: Audio, WebSocket: Socket, setTimeout, clearTimeout, ArrayBuffer, DataView, Float32Array });
  module.exports.default({ studentName: 'Aanya', introduce, onIntroduced: () => completions++, onClose() {} });
  const cleanups = effects.map(effect => effect());
  await new Promise(resolve => setTimeout(resolve, 10));
  return { sockets, sources, requests, completions: () => completions, cleanup: () => cleanups.forEach(cleanup => cleanup?.()) };
}

test('a completed introduction stays silent when the orb mounts again', async () => {
  const view = await mount(false);
  try { assert.equal(view.requests.filter(request => request.type === 'greet').length, 0); }
  finally { view.cleanup(); }
});

test('introduction completes only after speech finishes playing, not when audio download finishes', async () => {
  const view = await mount(true);
  try {
    assert.equal(view.requests.filter(request => request.type === 'greet').length, 1);
    view.sockets[0].message({ type: 'speaking' });
    view.sockets[0].message(new ArrayBuffer(48000));
    view.sockets[0].message(new ArrayBuffer(24000));
    view.sockets[0].message({ type: 'done' });
    assert.equal(view.completions(), 0);
    view.sources[0].onended();
    assert.equal(view.completions(), 0, 'The last audio chunk must also finish');
    view.sources[1].onended();
    assert.equal(view.completions(), 1);
    view.sources[0].onended();
    assert.equal(view.completions(), 1);
  } finally { view.cleanup(); }
});

test('hiding or interrupting the greeting cannot mark it completed', async () => {
  const view = await mount(true);
  view.sockets[0].message({ type: 'speaking' });
  view.sockets[0].message(new ArrayBuffer(48000));
  view.sockets[0].message({ type: 'done' });
  view.cleanup();
  assert.equal(view.completions(), 0);
});
