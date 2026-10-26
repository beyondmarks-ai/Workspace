'use client';

import { useEffect, useRef, useState } from 'react';
import Shdr02 from './orbkit/shdr-02';

export default function Orby({ onClose, studentName, introduce, onIntroduced }) {
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const active = useRef(null);
  const connection = useRef(null);
  const context = useRef(null);
  const workletReady = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const introduced = useRef(onIntroduced);
  introduced.current = onIntroduced;

  function releaseMicrophone(turn) {
    clearTimeout(turn.limit);
    turn.stream?.getTracks().forEach(track => track.stop());
    turn.input?.disconnect();
    turn.worklet?.disconnect();
  }
  function cancel() {
    const turn = active.current;
    active.current = null;
    if (turn) {
      clearTimeout(turn.flushTimeout);
      releaseMicrophone(turn);
      turn.sources.forEach(source => { try { source.stop(); } catch {} });
      const socket = connection.current;
      connection.current = null;
      socket?.close();
    }
    if (connection.current?.readyState === WebSocket.OPEN) connection.current.send(JSON.stringify({ type: 'cancel' }));
  }
  function fail(message) { cancel(); setPhase('idle'); setError(message); }

  useEffect(() => {
    function dismiss(event) {
      if (event.key === 'Escape') close.current();
    }
    document.addEventListener('keydown', dismiss);
    // Defer until mount settles so React's development effect check cannot greet twice.
    const introduction = introduce ? setTimeout(() => greet(), 0) : null;
    return () => {
      clearTimeout(introduction);
      document.removeEventListener('keydown', dismiss);
      cancel();
      const socket = connection.current;
      connection.current = null;
      socket?.close();
      context.current?.close().catch(() => {});
    };
  }, []);

  function finishPlayback(turn) {
    if (active.current !== turn || !turn.done || turn.sources.size) return;
    active.current = null;
    setPhase('idle');
    if (turn.greeting) introduced.current();
  }

  function resumeAudio() {
    if (!context.current || context.current.state === 'closed') {
      context.current = new AudioContext({ sampleRate: 16000 });
      workletReady.current = null;
    }
    return context.current.resume();
  }

  async function greet() {
    if (active.current) return;
    const turn = { phase: 'connecting', sources: new Set(), greeting: true };
    active.current = turn; setPhase('connecting');
    try {
      await resumeAudio();
      if (active.current !== turn) return;
      const socket = await connect();
      if (active.current === turn) socket.send(JSON.stringify({ type: 'greet', name: studentName }));
    } catch (cause) {
      if (active.current === turn) fail(cause.message || 'Could not play the welcome. Please try introducing Orby again.');
    }
  }

  function connect() {
    if (connection.current?.readyState === WebSocket.OPEN) return Promise.resolve(connection.current);
    return new Promise((resolve, reject) => {
      const socket = new WebSocket('ws://127.0.0.1:4319/voice');
      connection.current = socket;
      socket.binaryType = 'arraybuffer';
      const timeout = setTimeout(() => { socket.close(); reject(new Error('Orby voice service is unavailable. Start the class workspace and retry.')); }, 8000);
      socket.onopen = () => { clearTimeout(timeout); resolve(socket); };
      socket.onerror = () => { clearTimeout(timeout); reject(new Error('Orby voice service is unavailable. Start the class workspace and retry.')); };
      socket.onclose = () => {
        clearTimeout(timeout);
        reject(new Error('Voice connection closed. Click Orby to reconnect.'));
        if (connection.current !== socket) return;
        connection.current = null;
        if (active.current) fail('Voice connection closed. Click Orby to reconnect.');
      };
      socket.onmessage = ({ data }) => {
        const turn = active.current;
        if (!turn || connection.current !== socket) return;
        if (data instanceof ArrayBuffer) {
          if (turn.phase !== 'speaking' || data.byteLength % 2) return fail('Unexpected audio response. Please try again.');
          const pcm = new DataView(data);
          const audio = context.current.createBuffer(1, data.byteLength / 2, 24000);
          const channel = audio.getChannelData(0);
          for (let i = 0; i < channel.length; i++) channel[i] = pcm.getInt16(i * 2, true) / 32768;
          const source = context.current.createBufferSource();
          source.buffer = audio;
          source.connect(context.current.destination);
          turn.sources.add(source);
          source.onended = () => { turn.sources.delete(source); source.disconnect(); finishPlayback(turn); };
          const start = Math.max(context.current.currentTime + 0.025, turn.nextAudio || 0);
          source.start(start);
          turn.nextAudio = start + audio.duration;
          return;
        }
        let message;
        try { message = JSON.parse(data); } catch { return fail('Invalid voice response. Please try again.'); }
        if (message.type === 'error') return fail(message.message);
        if (message.type === 'listening') {
          turn.phase = 'listening'; setPhase('listening');
          turn.limit = setTimeout(() => stopListening(turn), 60000);
        }
        if (message.type === 'speaking') { turn.phase = 'speaking'; setPhase('speaking'); }
        if (message.type === 'done') {
          turn.done = true;
          finishPlayback(turn);
        }
      };
    });
  }

  function stopListening(turn) {
    if (active.current !== turn || turn.phase !== 'listening') return;
    turn.phase = 'finalizing'; setPhase('thinking');
    clearTimeout(turn.limit);
    turn.worklet.port.postMessage('stop');
    turn.flushTimeout = setTimeout(() => { if (active.current === turn) fail('The microphone stopped responding. Please try again.'); }, 2000);
  }

  async function click() {
    const previous = active.current;
    if (previous?.phase === 'listening') { stopListening(previous); return; }
    if (previous?.phase === 'connecting' || previous?.phase === 'finalizing') { cancel(); setPhase('idle'); return; }
    cancel(); setError('');
    const turn = { phase: 'connecting', sources: new Set() };
    active.current = turn; setPhase('connecting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Microphone access requires localhost or a secure connection.');
      await resumeAudio();
      if (active.current !== turn) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (active.current !== turn) { stream.getTracks().forEach(track => track.stop()); return; }
      turn.stream = stream;
      if (!workletReady.current) workletReady.current = context.current.audioWorklet.addModule('/orby-mic-worklet.js');
      await workletReady.current;
      if (active.current !== turn) return;
      const socket = await connect();
      if (active.current !== turn) return;
      turn.input = context.current.createMediaStreamSource(stream);
      turn.worklet = new AudioWorkletNode(context.current, 'orby-microphone');
      turn.worklet.port.onmessage = ({ data }) => {
        if (active.current !== turn || socket.readyState !== WebSocket.OPEN) return;
        if (data === 'stopped') {
          clearTimeout(turn.flushTimeout); releaseMicrophone(turn);
          socket.send(JSON.stringify({ type: 'stop' }));
        } else if (turn.phase === 'listening' || turn.phase === 'finalizing') {
          if (socket.bufferedAmount > 256000) return fail('The microphone connection is too slow. Please try again.');
          socket.send(data);
        }
      };
      stream.getAudioTracks()[0].onended = () => { if (active.current === turn && turn.phase === 'listening') fail('Microphone disconnected. Reconnect it and try again.'); };
      turn.input.connect(turn.worklet);
      // The processor outputs silence; connecting it keeps capture running without microphone feedback.
      turn.worklet.connect(context.current.destination);
      socket.send(JSON.stringify({ type: 'start' }));
    } catch (cause) {
      if (active.current === turn) fail(cause.name === 'NotAllowedError' ? 'Allow microphone access, then click Orby again.' : cause.name === 'NotFoundError' ? 'Connect a microphone, then click Orby again.' : cause.message || 'Could not start the microphone. Please try again.');
    }
  }

  const labels = { idle: 'Click to ask Orby', connecting: 'Connecting. Click to cancel', listening: 'Listening. Click to finish and get your answer', thinking: 'Thinking. Click to cancel', speaking: 'Speaking. Click to interrupt and ask another question' };
  return <>
    <button className={`orby-orb orby-${phase}`} type="button" aria-label={`${labels[phase]}. Escape to hide.`} aria-pressed={phase === 'listening'} title={`${labels[phase]} · Orb art: XorDev`} onClick={click}>
      {unavailable ? <span className="orby-fallback" aria-hidden="true"/> : <Shdr02 size={208} state={phase === 'speaking' ? 'speaking' : phase === 'thinking' || phase === 'connecting' ? 'thinking' : 'idle'} volumes={{ input: phase === 'listening' ? 0.7 : 0, output: phase === 'speaking' ? 0.7 : 0 }} maxDpr={1.5} onUnavailable={setUnavailable}/>}
    </button>
    <span className="orby-sr-only" role="status">{labels[phase]}</span>
    {error && <p className="orby-error" role="alert">{error}</p>}
  </>;
}
