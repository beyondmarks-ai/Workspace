'use client';

import { useEffect, useRef, useState } from 'react';
import PricingBackdrop from '../../components/PricingBackdrop';
import { validatePdf } from './pdf-file.mjs';
import PdfChat from './pdf-chat';
import PdfReveal from './pdf-reveal';

function DocumentIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>;
}

export default function NotesReader() {
  const [document, setDocument] = useState(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [sourcePage, setSourcePage] = useState(null);
  const picker = useRef(null);
  const currentUrl = useRef('');
  const selection = useRef(0);

  useEffect(() => () => {
    selection.current++;
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
  }, []);

  async function openPdf(file) {
    if (!file) return;
    const request = ++selection.current;
    setError(''); setOpening(true);
    try {
      await validatePdf(file);
      if (request !== selection.current) return;
      const url = URL.createObjectURL(new Blob([file], { type: 'application/pdf' }));
      const previousUrl = currentUrl.current;
      currentUrl.current = url;
      setScanning(false);
      setSourcePage(null);
      setDocument({ name: file.name, url, file });
      if (previousUrl) URL.revokeObjectURL(previousUrl);
    } catch (cause) {
      if (request === selection.current) setError(cause.message || 'Could not open this PDF. Please try again.');
    } finally {
      if (request === selection.current) setOpening(false);
    }
  }

  return <main className="pricing-page notes-workspace" aria-label="Notes workspace">
    <PricingBackdrop />
    <div className="notes-content">
      <header className="notes-heading">
        <div><p className="notes-eyebrow">YOUR NOTES</p><h1>A little clarity. <em>On every page.</em></h1></div>
      </header>
      <div className="notes-reading-layout">
      <section className="notes-reader" aria-label="PDF reader">
        <div className="notes-reader-toolbar">
          <span className="notes-file-icon"><DocumentIcon /></span>
          <div className="notes-document-name"><strong title={document?.name}>{document?.name || 'Your reading desk'}</strong><span>{document ? 'PDF document' : 'Class notes, in one quiet space'}</span></div>
          <button className="notes-open-button" type="button" onClick={() => picker.current?.click()} disabled={opening}><span aria-hidden="true">+</span>{opening ? 'Opening…' : document ? 'Change PDF' : 'Open PDF'}</button>
          <input ref={picker} className="notes-file-input" type="file" accept="application/pdf,.pdf" aria-label="Choose a PDF" onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; openPdf(file); }} />
        </div>
        {error && <p className="notes-reader-error" role="alert">{error}</p>}
        <div className="notes-pdf-viewport" aria-busy={Boolean(scanning)}>
        {document ? <iframe className="notes-pdf-frame" key={document.url} src={`${document.url}#${sourcePage ? `page=${sourcePage}` : 'view=FitH'}&toolbar=1`} title={`Read ${document.name}`} /> : <div className="notes-reader-empty">
          <div className="notes-paper-art" aria-hidden="true"><span/><div><DocumentIcon/><i/><i/><i/></div></div>
          <p className="notes-empty-label">MAKE ROOM FOR WHAT MATTERS</p>
          <h2>Pick a page.<br/><em>Find your focus.</em></h2>
          <p>Open your class notes or any PDF<br/>and settle into reading.</p>
          <button className="notes-empty-open" type="button" disabled={opening} onClick={() => picker.current?.click()}>Choose a PDF <span aria-hidden="true">↗</span></button>
        </div>}
        {scanning && <PdfReveal label={scanning} />}
        </div>
        <footer className="notes-reader-footer"><span>{sourcePage ? `Source: page ${sourcePage}.` : 'PDF answers support up to 100 pages and 10 MB.'}</span>{document && <a href={`${document.url}${sourcePage ? `#page=${sourcePage}` : ''}`} target="_blank" rel="noopener noreferrer">{sourcePage ? `Open page ${sourcePage}` : 'Open in a new tab'} <span aria-hidden="true">↗</span></a>}</footer>
      </section>
      <PdfChat key={document?.url || 'empty'} document={document} onBusyChange={setScanning} onSourcePage={setSourcePage} />
      </div>
    </div>
  </main>;
}
