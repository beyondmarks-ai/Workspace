'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { lessons } from './preview-data.mjs';
import { quotes, quoteAt, nextQuoteDelay } from './quotes.mjs';
import CourseLibrary from './ai-classes';
import DashboardSidebar from './sidebar';

import { accountRequest, useAccount } from '../components/use-account';

const languages = ['English', 'Hindi', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Marathi', 'Odia', 'Punjabi', 'Tamil', 'Telugu', 'Assamese'];
const tabs = ['Lessons', 'Notes', 'Ask Doubts'];
const defaultProfile = { name: 'Student', language: 'English', photo: '', orbyIntroduced: false };
const Orby = dynamic(() => import('./orby'), { ssr: false });

function Avatar({ photo }) {
  return photo ? <img src={photo} alt="Your profile"/> : <svg viewBox="0 0 160 160" fill="none" aria-hidden="true"><circle cx="80" cy="80" r="68" stroke="currentColor" strokeOpacity=".2"/><circle cx="80" cy="63" r="23" fill="currentColor" fillOpacity=".8"/><path d="M37 128c2-27 18-39 43-39s41 12 43 39" fill="currentColor" fillOpacity=".8"/></svg>;
}

export default function StudentWelcome({ planName, hasCourse, account }) {
  const profileKey = `flowcus-student-profile:${account.id}`;
  const noteKey = `flowcus-student-note:${account.id}`;
  const questionKey = `flowcus-student-question:${account.id}`;
  const activeAccount = useAccount();
  useEffect(() => {
    if (activeAccount === null) window.location.replace('/?signin=1');
    else if (activeAccount && activeAccount.id !== account.id) window.location.reload();
  }, [activeAccount, account.id]);
  const [profile, setProfile] = useState(defaultProfile);
  const [draft, setDraft] = useState(defaultProfile);
  const [selected, setSelected] = useState(0);
  const [panel, setPanel] = useState('');
  const [lesson, setLesson] = useState(lessons[0]);
  const [note, setNote] = useState('');
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);
  const [orbyOpen, setOrbyOpen] = useState(false);
  const dialog = useRef(null);
  const tabButtons = useRef([]);
  const uploadVersion = useRef(0);

  useEffect(() => {
    let timer;
    function refreshQuote() {
      clearTimeout(timer);
      const now = Date.now();
      setQuote(quoteAt(now));
      timer = setTimeout(refreshQuote, nextQuoteDelay(now));
    }
    refreshQuote();
    window.addEventListener('focus', refreshQuote);
    document.addEventListener('visibilitychange', refreshQuote);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('focus', refreshQuote);
      document.removeEventListener('visibilitychange', refreshQuote);
    };
  }, []);

  // Photos and drafts are scoped to the authenticated account on this browser.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(profileKey) || '{}');
      setProfile({ name: typeof saved?.name === 'string' && saved.name.trim() ? saved.name.trim().slice(0, 40) : account.name, language: languages.includes(saved?.language) ? saved.language : 'English', photo: typeof saved?.photo === 'string' && saved.photo.length < 2800000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(saved.photo) ? saved.photo : '', orbyIntroduced: saved?.orbyIntroduced === true });
      setNote((localStorage.getItem(noteKey) || '').slice(0, 10000));
      setQuestion((localStorage.getItem(questionKey) || '').slice(0, 2000));
    } catch { /* Defaults keep the preview usable when browser storage is unavailable. */ }
  }, []);

  function openPanel(next) {
    setStatus(''); setPanel(next);
    if (next === 'Your profile' || next === 'Settings') setDraft(profile);
    dialog.current.showModal();
  }
  function closePanel() {
    uploadVersion.current += 1; setLoadingPhoto(false); dialog.current.close();
  }
  function onTabKey(event, index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); setSelected(next); tabButtons.current[next].focus();
  }
  async function choosePhoto(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    const version = ++uploadVersion.current;
    setStatus(''); setLoadingPhoto(false);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setStatus('Choose a JPG, PNG or WebP image under 2 MB.'); return;
    }
    setLoadingPhoto(true);
    try {
      const photo = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
      });
      const image = new Image(); image.src = photo; await image.decode();
      if (version === uploadVersion.current) setDraft(previous => ({ ...previous, photo }));
    } catch { if (version === uploadVersion.current) setStatus('This image could not be opened. Choose another photo.'); }
    finally { if (version === uploadVersion.current) setLoadingPhoto(false); }
  }
  async function saveProfile(event) {
    event.preventDefault();
    const updated = { ...draft, name: draft.name.trim() || 'Student', orbyIntroduced: profile.orbyIntroduced };
    try { await accountRequest({ name: updated.name, preferredLanguage: updated.language }, 'PATCH'); localStorage.setItem(profileKey, JSON.stringify(updated)); setProfile(updated); closePanel(); }
    catch { setStatus('Could not save your profile. Try a smaller photo or enable browser storage.'); }
  }
  function saveText(key, value) {
    try { localStorage.setItem(key, value); setStatus('Saved on this browser.'); }
    catch { setStatus('Could not save. Copy your text before leaving.'); }
  }

  function completeIntroduction() {
    const updated = { ...profile, orbyIntroduced: true };
    setProfile(updated);
    try { localStorage.setItem(profileKey, JSON.stringify(updated)); }
    catch { /* Keep completion for this visit if browser storage is unavailable. */ }
  }

  return <>
    <DashboardSidebar hasCourse={hasCourse} profile={profile} onPanel={openPanel} onAgent={() => setOrbyOpen(open => !open)} agentOpen={orbyOpen}/>
    <header className="model-header">
    <article className="model-card" aria-labelledby="student-welcome">
      <button className="profile-picture" onClick={() => openPanel('Your profile')} aria-label="Edit your profile and photo"><Avatar photo={profile.photo}/></button>
      <div className="model-content">
        <div className="welcome-identity">
        <div className="welcome-identity-top"><h1 id="student-welcome">Welcome, {profile.name}</h1><button className="orby-introduce" onClick={() => setOrbyOpen(open => !open)} aria-pressed={orbyOpen}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true"><path d="m10 2 2.2 5.8L18 10l-5.8 2.2L10 18l-2.2-5.8L2 10l5.8-2.2Z"/></svg>{profile.orbyIntroduced ? 'Orby' : 'Introduce Orby'}</button></div>
        <div className="model-meta"><span>{planName}</span><i aria-hidden="true"/><span>{profile.language}</span></div>
        </div>
        <blockquote className="welcome-quote" aria-label="Learning inspiration"><span aria-hidden="true">“</span><p>{quote}</p></blockquote>
        <div className="welcome-progress"><span>Course progress <strong>0%</strong></span><progress max="100" value="0" aria-label="Course progress"/></div>
        <div className="model-launcher">
          <div className="model-tabs" role="tablist" aria-label="Learning tools">{tabs.map((tab, index) => <button key={tab} ref={element => { tabButtons.current[index] = element; }} id={`learning-tab-${index}`} role="tab" aria-selected={selected === index} aria-controls="learning-action" tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)} onKeyDown={event => onTabKey(event, index)}>{tab}</button>)}</div>
          <div className="model-command" role="tabpanel" id="learning-action" aria-labelledby={`learning-tab-${selected}`}>
            <span>{selected === 0 ? <><small>CONTINUE WITH</small>{lessons[0].title}</> : selected === 1 ? 'Keep your key takeaways together.' : 'A question is a good place to start.'}</span>
            <button onClick={() => { if (selected === 0) setLesson(lessons[0]); openPanel(selected === 0 ? 'Lesson preview' : tabs[selected]); }}>{['Resume Learning', 'Open Notes', 'Write a Doubt'][selected]}<span aria-hidden="true">↗</span></button>
          </div>
        </div>
      </div>
    </article>
    </header>
    <CourseLibrary/>
    {orbyOpen && <Orby studentName={profile.name} introduce={!profile.orbyIntroduced} onIntroduced={completeIntroduction} onClose={() => setOrbyOpen(false)}/>}
    <dialog ref={dialog} className="welcome-dialog" aria-labelledby="welcome-dialog-title" onCancel={() => { uploadVersion.current += 1; setLoadingPhoto(false); }} onClick={event => { if (event.target === dialog.current) closePanel(); }}>
      <button className="welcome-close" onClick={closePanel} aria-label="Close panel">×</button>
      <p className="welcome-eyebrow">YOUR LEARNING SPACE</p><h2 id="welcome-dialog-title">{panel}</h2>
      {panel === 'Your profile' || panel === 'Settings' ? <form onSubmit={saveProfile}>
        <div className="profile-editor"><div className="profile-preview"><Avatar photo={draft.photo}/></div><div><label className="photo-upload">Upload your photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} disabled={loadingPhoto}/></label><small>JPG, PNG or WebP · up to 2 MB</small>{draft.photo && <button type="button" className="welcome-text-button" onClick={() => setDraft(previous => ({ ...previous, photo: '' }))}>Use default profile</button>}</div></div>
        <div className="avatar-coming"><strong>Choose an avatar <span>Coming soon</span></strong><p>Your avatar collection will be available here.</p></div>
        <label className="welcome-field">Your name<input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })} maxLength={40} required autoComplete="given-name"/></label>
        <label className="welcome-field">Learning language<select value={draft.language} onChange={event => setDraft({ ...draft, language: event.target.value })}>{languages.map(language => <option key={language}>{language}</option>)}</select></label>
        <p className="welcome-hint">Your photo and preferences stay on this browser.</p><button className="welcome-primary" disabled={loadingPhoto}>{loadingPhoto ? 'Reading photo…' : 'Save profile'}</button>
      </form> : panel === 'Lesson preview' ? <>
        <p className="welcome-hint">Sample course · recordings will appear once your course is connected.</p>
        <nav className="welcome-lessons" aria-label="Preview lessons">{lessons.map(item => <button key={item.id} aria-pressed={lesson.id === item.id} onClick={() => setLesson(item)}><span>{item.number} · {item.title}</span><small>{item.duration}</small></button>)}</nav>
        <h3>{lesson.title}</h3><p>{lesson.summary}</p><p className="welcome-hint">This is a lesson preview. No recording is playing and your progress has not changed.</p>
      </> : panel === 'Notes' ? <><label className="welcome-field">Your study notes<textarea rows={6} maxLength={10000} value={note} onChange={event => { setNote(event.target.value); setStatus(''); }} placeholder="Write something you want to remember…"/></label><p className="welcome-hint">Saved on this browser.</p><button className="welcome-primary" onClick={() => saveText(noteKey, note)}>Save notes</button></> : panel === 'Ask Doubts' ? <><label className="welcome-field">Your question<textarea rows={5} maxLength={2000} value={question} onChange={event => { setQuestion(event.target.value); setStatus(''); }} placeholder="What would you like explained?"/></label><p className="welcome-hint">Save a draft for later. Course answers and voice responses will be available when your classroom is connected.</p><button className="welcome-primary" onClick={() => saveText(questionKey, question)}>Save draft</button></> : null}
      <p className="welcome-status" role="status">{status}</p>
      {panel === 'Settings' && <><hr /><a className="welcome-primary" href="/phone-signin?link=1">Link phone for OTP login</a></>}
    </dialog>
  </>;
}
