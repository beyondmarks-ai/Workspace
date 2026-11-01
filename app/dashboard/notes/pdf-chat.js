'use client';

import { useEffect, useRef, useState } from 'react';

const previewAnswer = 'Your answer will appear here, with an explanation drawn from your PDF and links to the pages that support it.';

export default function PdfChat({ document }) {
  const [question, setQuestion] = useState('');
  const [asked, setAsked] = useState('');
  const [phase, setPhase] = useState('idle');
  const timer = useRef(null);
  const busy = phase === 'searching';

  useEffect(() => () => clearTimeout(timer.current), []);

  function preview(event) {
    event.preventDefault();
    if (busy || !question.trim()) return;
    setAsked(question.trim());
    setPhase('searching');
    // shortcut: a labelled animation preview until authenticated PDF retrieval is connected.
    timer.current = setTimeout(() => setPhase('done'), 2400);
  }

  function cancel() {
    clearTimeout(timer.current);
    setPhase('idle');
    setAsked('');
  }

  return <aside className="pdf-chat" aria-label="Ask your PDF">
    <header className="pdf-chat-heading">
      <div><p className="notes-eyebrow">A LITTLE MORE UNDERSTANDING</p><h2>Ask your <em>notes.</em></h2></div>
      <span className="pdf-chat-badge">Preview</span>
    </header>
    <p className="pdf-chat-document" title={document?.name}><span aria-hidden="true">↳</span>{document?.name || 'Your next question starts here'}</p>
    <div className="pdf-chat-conversation">
      {asked ? <p className="pdf-chat-question">{asked}</p> : <div className="pdf-chat-intro"><svg className="pdf-chat-spark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></svg><h3>From reading<br/>to understanding.</h3><p>Explore an idea. Unpack a difficult passage. Find a little clarity.</p><button type="button" onClick={() => setQuestion('Explain the main idea in simple terms.')}>Explain the main idea <span aria-hidden="true">↗</span></button></div>}
      {phase !== 'idle' && <div className="pdf-answer" data-phase={phase} aria-busy={busy}>
        <div className="pdf-answer-label"><span className="pdf-answer-dot"/><span role="status">{busy ? 'Previewing the reveal' : 'Answer preview'}</span></div>
        {busy ? <div className="pdf-reveal-skeleton" aria-hidden="true"><div className="pdf-reveal-lines"><i/><i/><i/><i/><i/></div><div className="pdf-reveal-scan"/></div> : <div className="pdf-answer-reveal" key={asked}><p>{previewAnswer}</p><div className="pdf-answer-source">Page references will appear with supported answers.</div></div>}
      </div>}
    </div>
    <form className="pdf-chat-form" onSubmit={preview}>
      <label htmlFor="pdf-question">Your question</label>
      <textarea id="pdf-question" rows="2" value={question} onChange={event => setQuestion(event.target.value)} maxLength={2000} placeholder="What would you like to understand?" disabled={busy} aria-describedby="pdf-preview-disclosure"/>
      <div className="pdf-chat-actions"><span>PDF companion</span>{busy ? <button type="button" onClick={cancel}>Stop preview</button> : <button type="submit" disabled={!question.trim()}>Preview answer <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>}</div>
    </form>
    <p id="pdf-preview-disclosure" className="pdf-chat-disclosure">Animation preview only. PDF answers are not connected yet. Your file and questions stay on this device.</p>
  </aside>;
}
