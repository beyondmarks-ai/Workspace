"use client";

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://beyondmarks-api.graydune-73875eb0.centralindia.azurecontainerapps.io';

export default function Home() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('Recreate this document while preserving its structure and visual style.');
  const [status, setStatus] = useState('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  async function submitJob(event) {
    event.preventDefault();
    if (!file) return;
    setStatus('uploading');
    setError('');
    setDownloadUrl('');

    const form = new FormData();
    form.append('reference', file);
    form.append('prompt', prompt);

    try {
      const response = await fetch(`${API_URL}/api/jobs`, { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Document generation failed.');
      setDownloadUrl(`${API_URL}${result.downloadUrl}`);
      setStatus('complete');
    } catch (requestError) {
      setError(requestError.message);
      setStatus('error');
    }
  }

  return (
    <main className="site-shell">
      <video className="video-bg" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className="center-text" aria-label="Beyond Marks Presents Workspace">
        <div className="title-line">BEYOND MARKS</div>
        <div className="present-line">PRESENTS</div>
        <div className="workspace-line">WORKSPACE</div>
        <button className="create-button" type="button" onClick={() => setOpen(true)}>
          Create a document
        </button>
      </div>

      {open && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section className="document-dialog" role="dialog" aria-modal="true" aria-labelledby="document-dialog-title" onMouseDown={event => event.stopPropagation()}>
            <button className="close-button" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
            <p className="dialog-kicker">Beyond Marks Workspace</p>
            <h1 id="document-dialog-title">Create from a reference</h1>
            <form onSubmit={submitJob}>
              <label className="upload-field">
                <span>Reference document</span>
                <input
                  type="file"
                  accept=".docx,.pdf,.png,.jpg,.jpeg"
                  onChange={event => setFile(event.target.files?.[0] || null)}
                  required
                />
                <strong>{file ? file.name : 'Choose DOCX, PDF or image'}</strong>
              </label>
              <label className="prompt-field">
                <span>Instructions</span>
                <textarea value={prompt} onChange={event => setPrompt(event.target.value)} rows="4" />
              </label>
              <button className="submit-button" type="submit" disabled={!file || status === 'uploading'}>
                {status === 'uploading' ? 'Creating…' : 'Create document'}
              </button>
              {error && <p className="form-message error">{error}</p>}
              {downloadUrl && <a className="download-link" href={downloadUrl}>Download document ↓</a>}
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
