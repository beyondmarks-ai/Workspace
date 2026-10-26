'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import './pipeline.css';

const API = 'http://127.0.0.1:4318';
const languages = [['hi-IN','Hindi'],['bn-IN','Bengali'],['gu-IN','Gujarati'],['kn-IN','Kannada'],['ml-IN','Malayalam'],['mr-IN','Marathi'],['or-IN','Odia'],['pa-IN','Punjabi'],['ta-IN','Tamil'],['te-IN','Telugu'],['as-IN','Assamese'],['en-IN','English']];
const names = Object.fromEntries(languages);

export default function ClassAdmin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState(languages.map(([code]) => code));
  const [upload, setUpload] = useState(null);
  async function refresh() {
    try {
      const response = await fetch(`${API}/classes`);
      if (!response.ok) throw new Error();
      setData(await response.json()); setConnectionError('');
    } catch { setConnectionError('Class worker is offline. Start the class pipeline to continue.'); }
  }
  useEffect(() => { refresh(); const timer = setInterval(refresh, 5000); return () => clearInterval(timer); }, []);
  async function submit(event) {
    event.preventDefault();
    if (!file || !selected.length) return;
    setError(''); setUpload(0);
    try {
      const response = await fetch(`${API}/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: title || file.name, filename: file.name, size: file.size, languages: selected }) });
      const job = await response.json();
      if (!response.ok) throw new Error(job.error);
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', `${API}/classes/${job.id}/upload`);
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.upload.onprogress = event => { if (event.lengthComputable) setUpload(Math.round(event.loaded / event.total * 100)); };
        xhr.onerror = () => reject(new Error('Upload connection was interrupted. Please upload the file again.'));
        xhr.onload = () => {
          let result;
          try { result = JSON.parse(xhr.responseText); } catch { reject(new Error('Upload returned an invalid response.')); return; }
          if (xhr.status >= 400) reject(new Error(result.error)); else resolve();
        };
        xhr.send(file);
      });
      setFile(null); setTitle(''); event.target.reset(); await refresh();
    } catch (reason) { setError(reason.message); }
    finally { setUpload(null); }
  }
  async function retry(id) {
    setError('');
    try {
      const response = await fetch(`${API}/classes/${id}/retry`, { method: 'POST' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await refresh();
    } catch (reason) { setError(reason.message); }
  }
  return <main className="class-admin">
    <header className="class-top"><Link href="/">BEYOND MARKS <span>WORKSPACE</span></Link><nav aria-label="Connected apps"><a href="http://localhost:3003" target="_blank" rel="noreferrer">Dubbing studio ↗</a><a href="http://localhost:3000" target="_blank" rel="noreferrer">Study classroom ↗</a></nav></header>
    <div className="class-heading"><div><p className="class-eyebrow">ADMIN / CLASS PIPELINE</p><h1>One class. Many languages.</h1><p>Upload once. Translate in the teacher’s voice. Bring every lesson into your smart classroom.</p></div><span className="class-connection">{connectionError ? 'Worker offline' : data ? 'Worker connected' : 'Connecting…'}</span></div>
    <ol className="class-flow"><li><b>01</b> Upload class</li><li><b>02</b> Split & translate</li><li><b>03</b> Join & timestamp</li><li><b>04</b> Study & ask</li></ol>
    {connectionError && <p className="class-error" role="alert">{connectionError}</p>}
    <div className="class-grid"><section className="class-panel"><p className="class-eyebrow">NEW CLASS</p><h2>Prepare a lesson</h2>
      <form onSubmit={submit}>
        <label className="class-label" htmlFor="class-title">Class title</label><input id="class-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="e.g. Indian Polity — Fundamental Rights" maxLength={180} disabled={upload !== null}/>
        <label className="class-file"><strong>{file?.name || 'Choose your class recording'}</strong><span>MP4, MKV, WebM, MOV, AVI or M4V</span><input aria-label="Class recording" type="file" accept=".mp4,.mkv,.webm,.mov,.avi,.m4v" required disabled={upload !== null} onChange={event => setFile(event.target.files?.[0] || null)}/></label>
        <p className="class-hint">Long or large recordings are split automatically below 2 GB and 1 hour per part, then joined into a full lesson.</p>
        <fieldset disabled={upload !== null}><legend>Translation languages</legend><div className="class-language-actions"><button type="button" onClick={() => setSelected(languages.map(([code]) => code))}>Select all</button><button type="button" onClick={() => setSelected([])}>Clear</button></div><div className="class-languages">{languages.map(([code,name]) => <label key={code}><input type="checkbox" checked={selected.includes(code)} onChange={event => setSelected(event.target.checked ? [...selected,code] : selected.filter(item => item !== code))}/>{name}</label>)}</div></fieldset>
        <p className="class-hint">11 Indian languages + English. The original language is skipped. Voice cloning is applied to each part; listen to joins before sharing.</p>
        <p className="class-hint">Assamese lessons support text study; spoken answers need Sarvam beta access.</p>
        <button className="class-primary" disabled={upload !== null || !file || !selected.length || Boolean(connectionError)}>{upload !== null ? `Uploading ${upload}%` : 'Start class pipeline'}</button>
        {upload !== null && <progress aria-label="Upload progress" max="100" value={upload}/>}
        {error && <p className="class-error" role="alert">{error}</p>}
      </form>
    </section><section className="class-panel class-jobs"><div className="class-section-heading"><div><p className="class-eyebrow">YOUR LIBRARY</p><h2>Classes in progress</h2></div><span>{data?.jobs.length || 0} classes</span></div>
      {data?.jobs.length ? data.jobs.map(job => <article className="class-job" key={job.id}>
        <div className="class-job-heading"><h3>{job.title}</h3><span className={`class-badge ${job.status}`}>{job.status}</span></div>
        <p>{job.stage}</p><p className="class-hint">{job.source ? `Original: ${names[job.source] || job.source} · ` : ''}{job.partCount ? `${job.partCount} video parts · ${job.completedParts}/${job.totalParts} translations ready` : 'Preparing your recording'}</p>
        {job.totalParts > 0 && <progress aria-label={`${job.title} translation progress`} value={job.completedParts} max={job.totalParts}/>}
        {job.error && <p className="class-error">{job.error}</p>}
        {job.status === 'failed' && !job.needsUpload && !job.reviewRequired && <button className="class-retry" onClick={() => retry(job.id)}>Retry unfinished work</button>}
        <div className="class-outputs">{job.outputs.map(output => <a key={output.language} href={`http://localhost:3000/?lesson=${encodeURIComponent(output.name)}`} target="_blank" rel="noreferrer">Study in {names[output.language]} ↗</a>)}</div>
      </article>) : <div className="class-empty"><span aria-hidden="true">01 → 04</span><h3>Your next class starts here.</h3><p>Upload a recording to see translation progress and ready-to-study lessons.</p></div>}
    </section></div>
    <footer className="class-footer"><span>{data ? `${(data.freeBytes / 1e9).toFixed(1)} GB free on the processing drive` : 'Checking storage…'}</span><span>Local admin · Classes stay available after restarting the worker</span></footer>
  </main>;
}
