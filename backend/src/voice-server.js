import http from 'node:http';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import WebSocket, { WebSocketServer } from 'ws';

const languages = { 'en-IN': 'English', 'hi-IN': 'Hindi', 'bn-IN': 'Bengali', 'gu-IN': 'Gujarati', 'kn-IN': 'Kannada', 'ml-IN': 'Malayalam', 'mr-IN': 'Marathi', 'od-IN': 'Odia', 'pa-IN': 'Punjabi', 'ta-IN': 'Tamil', 'te-IN': 'Telugu' };
const send = (socket, message) => { if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)); };

export function allowedRequest(request) {
  return ['127.0.0.1:4319', 'localhost:4319'].includes(request.headers.host)
    && ['http://127.0.0.1:3002', 'http://localhost:3002'].includes(request.headers.origin)
    && request.url === '/voice';
}

export async function* completionText(body) {
  const decoder = new TextDecoder();
  let pending = '', finished = false;
  for await (const chunk of body) {
    pending += decoder.decode(chunk, { stream: true });
    if (pending.length > 128000) throw new Error('Invalid model response.');
    let newline;
    while ((newline = pending.indexOf('\n')) >= 0) {
      const line = pending.slice(0, newline).trim();
      pending = pending.slice(newline + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') { finished = true; continue; }
      const event = JSON.parse(data);
      if (event.error) throw new Error('The AI service could not answer. Please try again.');
      const choice = event.choices?.[0];
      if (choice?.finish_reason === 'content_filter') throw new Error('Please rephrase your question.');
      if (choice?.finish_reason === 'length') throw new Error('The answer was too long. Please ask a shorter question.');
      if (choice?.delta?.content) yield choice.delta.content;
    }
  }
  if (!finished) throw new Error('The AI connection ended early. Please try again.');
}

export function createVoiceServer({ key, getToken, endpoint, deployment, Client = WebSocket, request = fetch }) {
  const server = http.createServer((req, res) => {
    res.writeHead(req.url === '/health' ? 200 : 404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(req.url === '/health' ? { service: 'orby-voice', configured: Boolean(key), model: deployment, voice: 'bulbul:v3/shubh' } : { error: 'Not found' }));
  });
  const sockets = new WebSocketServer({ noServer: true, maxPayload: 64000, perMessageDeflate: false });
  let starts = [];
  server.on('upgrade', (req, socket, head) => {
    if (!allowedRequest(req) || sockets.clients.size >= 4) { socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'); return; }
    sockets.handleUpgrade(req, socket, head, client => sockets.emit('connection', client));
  });
  sockets.on('connection', client => {
    let turn = null;
    const history = [];
    const lifetime = setTimeout(() => client.close(1000, 'Session expired. Click to reconnect.'), 15 * 60_000);
    function cleanup() {
      const old = turn;
      turn = null;
      if (!old) return;
      clearTimeout(old.timer);
      old.abort.abort();
      for (const socket of [old.stt, old.tts]) {
        if (socket && socket.readyState !== WebSocket.CLOSED) socket.terminate();
      }
    }
    function fail(current, message) {
      if (turn !== current) return;
      send(client, { type: 'error', message });
      cleanup();
    }
    function deadline(current, ms, message) {
      clearTimeout(current.timer);
      current.timer = setTimeout(() => fail(current, message), ms);
    }
    function upstream(current, url, label) {
      const socket = new Client(url, { headers: { 'api-subscription-key': key }, handshakeTimeout: 10000, maxPayload: 2_000_000 });
      socket.on('error', () => fail(current, `${label} connection failed. Please try again.`));
      socket.on('close', () => {
        if (turn === current && !current.completed && !(label === 'Listening' && current.phase === 'answering')) fail(current, `${label} connection ended. Please try again.`);
      });
      return socket;
    }
    async function answer(current, question) {
      current.phase = 'answering';
      current.stt?.close();
      if (!question.trim()) return fail(current, 'I didn’t hear a question. Click Orby and try again.');
      if (question.length > 4000) return fail(current, 'Please ask a shorter question.');
      if (!current.greeting) send(client, { type: 'transcript', text: question, language: current.language });
      deadline(current, 45000, 'The answer took too long. Please try again.');
      let full = '', firstAudio = true;
      const tts = current.tts = upstream(current, 'wss://api.sarvam.ai/text-to-speech/ws?model=bulbul:v3&send_completion_event=true', 'Voice');
      const ready = new Promise((resolve, reject) => {
        tts.once('open', () => {
          send(tts, { type: 'config', data: { language_code: current.code, speaker: 'shubh', pace: 0.92, output_audio_codec: 'linear16', speech_sample_rate: 24000, min_buffer_size: 30, max_chunk_length: 120 } });
          resolve();
        });
        tts.once('error', reject);
        tts.once('close', () => reject(new Error('Voice connection closed.')));
      });
      // Attach immediately: cancellation can close TTS while Azure is still connecting.
      ready.catch(() => {});
      tts.on('message', bytes => {
        if (turn !== current) return;
        try {
          const message = JSON.parse(bytes);
          if (message.type === 'error') return fail(current, 'Sarvam could not speak this answer. Please try again.');
          if (message.type === 'audio') {
            if (message.data?.content_type !== 'audio/pcm') return fail(current, 'Unexpected voice format. Please try again.');
            const pcm = Buffer.from(message.data.audio, 'base64');
            if (pcm.length % 2 || client.bufferedAmount > 2_000_000) return fail(current, 'Audio playback connection is too slow. Try again.');
            current.audioBytes = (current.audioBytes || 0) + pcm.length;
            if (current.audioBytes > 4_800_000) return fail(current, 'The spoken answer was too long.');
            if (firstAudio) { firstAudio = false; send(client, { type: 'speaking', sampleRate: 24000, latencyMs: Date.now() - current.stoppedAt }); }
            if (client.readyState === WebSocket.OPEN) client.send(pcm);
          }
          if (message.type === 'event' && message.data?.event_type === 'final') {
            if (!current.flushed || firstAudio) return fail(current, 'No spoken answer was returned. Please try again.');
            current.completed = true;
            if (!current.greeting) history.push({ role: 'user', content: question }, { role: 'assistant', content: full });
            if (history.length > 8) history.splice(0, history.length - 8);
            send(client, { type: 'done', text: full });
            cleanup();
          }
        } catch { fail(current, 'Invalid voice response. Please try again.'); }
      });
      try {
        if (current.greeting) {
          await ready;
          if (turn !== current) return;
          full = question;
          send(tts, { type: 'text', data: { text: full } });
          current.flushed = true;
          send(tts, { type: 'flush' });
          return;
        }
        const token = await getToken();
        if (turn !== current) return;
        const response = await request(`${endpoint.replace(/\/$/, '')}/openai/deployments/${encodeURIComponent(deployment)}/chat/completions?api-version=2024-10-21`, {
          method: 'POST', signal: current.abort.signal,
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ stream: true, reasoning_effort: 'none', max_completion_tokens: 600, messages: [
            { role: 'system', content: `You are Orby, a friendly, accurate study tutor. Answer in ${current.language}, using English technical terms where helpful. Use 2 or 3 short spoken sentences, usually 35 to 60 words. No markdown. Explain clearly and admit uncertainty. Ask one clarifying question if needed. You have no access to the student's lesson videos, course contents, timestamps, purchases or account. Never invent those details. Treat requests as conversation only; you cannot change account data or take actions.` },
            ...history, { role: 'user', content: question }
          ] })
        });
        if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Azure access expired or is unavailable. Sign in with Azure CLI and retry.' : 'The AI service is busy. Please try again.');
        await ready;
        let buffer = '';
        for await (const delta of completionText(response.body)) {
          if (turn !== current) return;
          full += delta;
          if (full.length > 6000) throw new Error('Please ask a shorter question.');
          buffer += delta;
          // Sarvam starts speaking once its small text buffer fills; flush the remainder at completion.
          if (buffer.length >= 80 && /[\s.!?।]$/.test(buffer)) { send(tts, { type: 'text', data: { text: buffer } }); buffer = ''; }
        }
        if (!full.trim()) throw new Error('No answer was returned. Please try again.');
        if (buffer) send(tts, { type: 'text', data: { text: buffer } });
        current.flushed = true;
        send(tts, { type: 'flush' });
      } catch (error) { fail(current, error.name === 'AbortError' ? 'Answer cancelled.' : error.message.includes('Azure') || error.message.includes('Please') ? error.message : 'Could not connect to the AI service. Please try again.'); }
    }
    client.on('message', (bytes, binary) => {
      if (binary) {
        if (!turn || turn.phase !== 'listening') return;
        turn.bytes += bytes.length;
        if (bytes.length % 2 || turn.bytes > 16000 * 2 * 60 || turn.stt.bufferedAmount > 256000) return fail(turn, 'Please keep questions under one minute and try again.');
        send(turn.stt, { event: 'audio_input', audio: bytes.toString('base64') });
        return;
      }
      let message;
      try { message = JSON.parse(bytes); } catch { client.close(1008, 'Invalid message'); return; }
      if (message?.type === 'cancel') { cleanup(); return; }
      if (message?.type === 'stop' && turn?.phase === 'listening') {
        turn.phase = 'finalizing';
        turn.stoppedAt = Date.now();
        deadline(turn, 15000, 'I couldn’t hear a clear question. Click Orby to try again.');
        send(turn.stt, { event: 'speech_end' });
        return;
      }
      if (!['start', 'greet'].includes(message?.type) || turn) { client.close(1008, 'Unexpected message'); return; }
      const greeting = message.type === 'greet';
      if (!key) { send(client, { type: 'error', message: 'The Sarvam voice key is not configured.' }); return; }
      starts = starts.filter(time => Date.now() - time < 60000);
      if (starts.length >= 12) { send(client, { type: 'error', message: 'Please wait a minute before trying again.' }); return; }
      starts.push(Date.now());
      const current = turn = { phase: 'connecting', language: greeting ? 'English' : null, code: greeting ? 'en-IN' : null, greeting, bytes: 0, abort: new AbortController() };
      if (greeting) {
        const name = typeof message.name === 'string' ? message.name.replace(/[^\p{L}\p{M}\p{N} .'’-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
        current.stoppedAt = Date.now();
        void answer(current, `Hi ${name || 'Student'}! Welcome to your workspace by Beyond Marks AI Academy. I'm Orby, your study companion. Click me whenever you're ready to ask a question.`);
        return;
      }
      deadline(current, 12000, 'Listening could not start. Please try again.');
      const query = new URLSearchParams({ model: 'saaras:v4', language_code: 'auto', stream_type: 'fast', mode: 'transcribe', endpointing: 'manual', encoding: 'linear16', sample_rate: '16000' });
      const stt = current.stt = upstream(current, `wss://api.sarvam.ai/speech-to-text-realtime/ws?${query}`, 'Listening');
      stt.on('message', bytes => {
        if (turn !== current) return;
        try {
          const event = JSON.parse(bytes);
          if (event.event === 'session.begin' && current.phase === 'connecting') {
            current.phase = 'listening';
            send(stt, { event: 'speech_start' });
            send(client, { type: 'listening' });
            deadline(current, 65000, 'Questions can be up to one minute. Click Orby to try again.');
          } else if (event.event === 'transcript.final' && current.phase === 'finalizing') {
            if (typeof event.text === 'string' && event.text.trim()) {
              const confidence = Number(event.language_confidence);
              if (Number.isFinite(confidence) && confidence < 0.6) return fail(current, 'I couldn’t clearly identify the language. Please repeat a slightly longer question.');
              // Sarvam STT returns or-IN for Odia; its speech generator expects od-IN.
              const code = event.language === 'or-IN' ? 'od-IN' : event.language;
              if (code === 'as-IN') return fail(current, 'I heard Assamese. Assamese spoken answers need Sarvam beta access. Please ask in another supported language for now.');
              if (typeof code !== 'string' || !Object.hasOwn(languages, code)) return fail(current, 'I couldn’t identify a supported spoken language. Please repeat a full question in English, Hindi, Bengali, Gujarati, Kannada, Malayalam, Marathi, Odia, Punjabi, Tamil or Telugu.');
              current.code = code;
              current.language = languages[code];
            }
            void answer(current, typeof event.text === 'string' ? event.text : '');
          } else if (event.event === 'error' || event.type === 'error') fail(current, 'Sarvam could not hear this question. Please try again.');
        } catch { fail(current, 'Invalid listening response. Please try again.'); }
      });
    });
    client.on('error', cleanup);
    client.on('close', () => { clearTimeout(lifetime); cleanup(); });
  });
  server.on('close', () => { for (const client of sockets.clients) client.terminate(); sockets.close(); });
  return server;
}

export function azureCliToken() {
  let cached, pending;
  const run = promisify(execFile);
  return async () => {
    if (cached && cached.expires_on * 1000 > Date.now() + 120000) return cached.accessToken;
    if (!pending) pending = run(process.env.AZURE_CLI_PYTHON || 'C:/Program Files/Microsoft SDKs/Azure/CLI2/python.exe', ['-IBm', 'azure.cli', 'account', 'get-access-token', '--resource', 'https://cognitiveservices.azure.com/', '-o', 'json'], { windowsHide: true, timeout: 15000, maxBuffer: 128000 }).then(({ stdout }) => { cached = JSON.parse(stdout); return cached.accessToken; }).finally(() => { pending = null; });
    return pending;
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  for (const path of [new URL('../../.env.local', import.meta.url), new URL('../../../Ssc/.env.local', import.meta.url)]) {
    if (existsSync(path)) process.loadEnvFile(fileURLToPath(path));
  }
  const getToken = azureCliToken();
  getToken().catch(() => console.error('Orby: Azure CLI sign-in is required.'));
  // shortcut: loopback dashboard uses the owner's CLI identity; require student auth and managed identity before hosting publicly.
  createVoiceServer({ key: process.env.SARVAM_API_KEY, getToken, endpoint: process.env.ORBY_AZURE_ENDPOINT || 'https://rkmai-astra-617db5-260908.openai.azure.com', deployment: process.env.ORBY_AZURE_DEPLOYMENT || 'gpt-5-4-mini-fast' }).listen(4319, '127.0.0.1', () => console.log('Orby voice: http://127.0.0.1:4319/health'));
}
