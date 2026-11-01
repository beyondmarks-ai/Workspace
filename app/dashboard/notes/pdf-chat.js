'use client';

import { useEffect, useRef, useState } from 'react';

function pause(signal) {
  return new Promise((resolve, reject) => {
    const cancelled = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancelled); resolve(); }, 1500);
    signal.addEventListener('abort', cancelled, { once: true });
    if (signal.aborted) cancelled();
  });
}

export default function PdfChat({ document, onBusyChange, onSourcePage }) {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const [phase, setPhase] = useState('idle');
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState('');
  const active = useRef(null);
  const prepared = useRef(null);
  const busy = ['uploading', 'reading', 'indexing', 'answering'].includes(phase);

  useEffect(() => () => { active.current?.abort(); active.current = null; }, []);

  async function ask(event) {
    event.preventDefault();
    if (active.current || !document?.file || !question.trim()) return;
    const controller = new AbortController();
    active.current = controller;
    const { signal } = controller;
    const current = () => active.current === controller && !signal.aborted;
    function stage(value, label) { if (current()) { setPhase(value); onBusyChange(label); } }
    async function request(body, headers = { 'Content-Type': 'application/json' }) {
      const response = await fetch('/api/notes', { method: 'POST', headers, body, signal });
      const result = await response.json();
      if (!response.ok) { if ([404, 409].includes(response.status)) prepared.current = null; throw new Error(result.error || 'Could not complete your PDF request.'); }
      return result;
    }
    setAsked(question.trim()); setAnswer(null); setError('');
    try {
      if (!prepared.current || prepared.current.expiresAt <= Date.now()) {
        stage('uploading', 'Opening your notes');
        const result = await request(document.file, { 'Content-Type': 'application/pdf', 'X-PDF-Name': encodeURIComponent(document.name) });
        if (!current()) return;
        prepared.current = result.document;
      }
      const deadline = Date.now() + 10 * 60 * 1000;
      while (prepared.current.status !== 'ready') {
        if (Date.now() > deadline) throw new Error('This PDF is taking longer to prepare. Press Ask again to resume.');
        const doc = prepared.current;
        stage(doc.status, doc.status === 'indexing' ? 'Connecting ideas · ' + (doc.indexed || 0) + '/' + (doc.total || 0) + ' passages' : 'Reading your pages');
        await pause(signal);
        const result = await request(JSON.stringify({ action: 'prepare', documentId: doc.id }));
        if (!current()) return;
        prepared.current = result.document;
      }
      stage('answering', 'Finding the right passage');
      const result = await request(JSON.stringify({ action: 'answer', documentId: prepared.current.id, question: question.trim() }));
      if (current()) { setAnswer(result); setPhase('done'); }
    } catch (cause) {
      if (current()) { setError(cause.message || 'Could not answer. Please try again.'); setPhase('error'); }
    } finally {
      if (active.current === controller) { active.current = null; onBusyChange(false); }
    }
  }

  function cancel() {
    active.current?.abort(); active.current = null;
    setPhase('idle'); onBusyChange(false);
  }

  return <aside className="pdf-chat" aria-label="Ask your PDF">
    <header className="pdf-chat-heading">
      <div><p className="notes-eyebrow">A LITTLE MORE UNDERSTANDING</p><h2>Ask your <em>notes.</em></h2></div>
      <span className="pdf-chat-badge">PDF grounded</span>
    </header>
    <p className="pdf-chat-document" title={document?.name}><span aria-hidden="true">↳</span>{document?.name || 'Open a PDF to begin'}</p>
    <div className="pdf-chat-conversation">
      {asked ? <p className="pdf-chat-question">{asked}</p> : <div className="pdf-chat-intro"><svg className="pdf-chat-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></svg><h3>From reading<br/>to understanding.</h3><p>Explore an idea. Unpack a difficult passage. Follow the answer back to its source.</p><button type="button" disabled={!document} onClick={() => setQuestion('Explain the main idea in simple terms.')}>Explain the main idea <span aria-hidden="true">↗</span></button></div>}
      {(busy || answer) && <div className="pdf-answer" data-phase={phase} aria-busy={busy}>
        <div className="pdf-answer-label"><span className="pdf-answer-dot"/><span role="status">{busy ? phase === 'answering' ? 'Checking your PDF' : 'Preparing your PDF' : 'From your PDF'}</span></div>
        {answer && <div className="pdf-answer-content"><p>{answer.answer}</p><div className="pdf-answer-source">{answer.citations.map(source => <div key={source.id}><a href={document.url + '#page=' + source.page} target="_blank" rel="noopener noreferrer" onClick={event => { if (!event.ctrlKey && !event.metaKey && onSourcePage) { event.preventDefault(); onSourcePage(source.page); } }}>Page {source.page} ↗</a><blockquote>{source.quote}</blockquote></div>)}</div></div>}
      </div>}
      {error && <p className="pdf-chat-error" role="alert">{error}</p>}
    </div>
    <form className="pdf-chat-form" onSubmit={ask}>
      <label htmlFor="pdf-question">Your question</label>
      <textarea id="pdf-question" rows="2" value={question} onChange={event => setQuestion(event.target.value)} maxLength={2000} placeholder={document ? 'What would you like to understand?' : 'Open a PDF first'} disabled={busy || !document} aria-describedby="pdf-data-disclosure"/>
      <div className="pdf-chat-actions"><span>PDF companion</span>{busy ? <button type="button" onClick={cancel}>Stop</button> : <button type="submit" disabled={!document || !question.trim()}>Ask your PDF <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>}</div>
    </form>
    <p id="pdf-data-disclosure" className="pdf-chat-disclosure">Asking sends this PDF to Azure for text extraction and search. Its search copy expires after 24 hours and is private to your account. Check the cited pages; AI can make mistakes.</p>
  </aside>;
}