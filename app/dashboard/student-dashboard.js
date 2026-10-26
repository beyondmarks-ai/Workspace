'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { getPreviewPlan, lessons } from './preview-data.mjs';

function Icon({ name, ...props }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    book: <><path d="M12 5C8 2 4 3 2 4v15c3-1 6-1 10 1 4-2 7-2 10-1V4c-2-1-6-2-10 1Z"/><path d="M12 5v15"/></>,
    note: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6"/></>,
    play: <path d="m9 5 11 7-11 7Z"/>,
    voice: <><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    help: <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M12 16h.01"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

const storageKey = 'flowcus-dashboard-preview';
const languageNames = ['English', 'Hindi', 'Bengali', 'Gujarati', 'Kannada', 'Malayalam', 'Marathi', 'Odia', 'Punjabi', 'Tamil', 'Telugu', 'Assamese'];

export default function StudentDashboard({ requestedPlan }) {
  const plan = getPreviewPlan(requestedPlan);
  const [language, setLanguage] = useState('English');
  const [completed, setCompleted] = useState([]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState('');
  const [lesson, setLesson] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [help, setHelp] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const dialog = useRef(null);
  const [activeNav, setActiveNav] = useState('overview');
  const nextLesson = lessons.find(item => !completed.includes(item.id)) || lessons[0];
  const progress = Math.round(completed.length / lessons.length * 100);

  useEffect(() => {
    try {
      const state = JSON.parse(localStorage.getItem(storageKey) || '{}');
      if (Array.isArray(state.completed)) setCompleted([...new Set(state.completed.filter(id => lessons.some(item => item.id === id)))]);
      if (typeof state.note === 'string') setNote(state.note.slice(0, 10000));
      if (languageNames.includes(state.language)) setLanguage(state.language);
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify({ completed, note, language })); }
    catch { setSaved('Browser storage is unavailable; changes will last for this visit.'); }
  }, [completed, note, language, loaded]);

  function openLesson(item) { setLesson(item); setHelp(false); setShowAnswer(false); dialog.current.showModal(); }
  function openHelp() { setHelp(true); setLesson(null); dialog.current.showModal(); }
  function finishLesson() {
    setCompleted(previous => previous.includes(lesson.id) ? previous : [...previous, lesson.id]);
    dialog.current.close();
  }

  return <div className="student-frame">
    <aside className="student-sidebar">
      <Link href="/" className="student-logo">flowcus<span>BY BEYOND MARKS</span></Link>
      <p className="student-nav-label">YOUR WORKSPACE</p>
      <nav aria-label="Student navigation">
        {[['overview','grid','Overview'],['my-course','book','My course'],['study-notes','note','My notes']].map(([id,icon,label]) => <a key={id} href={`#${id}`} className={activeNav === id ? 'selected' : ''} aria-current={activeNav === id ? 'location' : undefined} onClick={() => setActiveNav(id)}><Icon name={icon}/>{label}{activeNav === id && <span className="student-nav-dot"/>}</a>)}
      </nav>
      <div className="student-sidebar-bottom"><div className="student-plan-mini"><span className="student-kicker">YOUR PLAN PREVIEW</span><strong>{plan.name}</strong><span>{plan.duration} of learning</span><Link href="/pricing">Explore plans <Icon name="arrow"/></Link></div><button className="student-help" onClick={openHelp}><Icon name="help"/>How your classroom works</button></div>
    </aside>
    <div className="student-main">
      <header className="student-topbar"><span className="student-breadcrumb">My workspace <span>/</span> Overview</span><div><span className="student-preview-tag">DESIGN PREVIEW</span><span className="student-avatar" aria-label="Learner profile">L</span></div></header>
      <section className="student-welcome" id="overview"><div><p className="student-kicker">A LITTLE PROGRESS, EVERY DAY.</p><h1>Make room for your next chapter.</h1><p>Your classes, your language, your pace. Let’s make today count.</p></div><label className="student-language">Learning language<select value={language} onChange={event => setLanguage(event.target.value)}>{languageNames.map(name => <option key={name}>{name}</option>)}</select></label></section>
      <div className="student-content-grid">
        <div className="student-primary-column">
          <section className="student-course" id="my-course" aria-labelledby="my-course-title">
            <div className="student-course-top"><span className="student-dark-tag">YOUR COURSE · SAMPLE</span><span className="student-course-code">SSC / FOUNDATION</span></div>
            <div className="student-course-body"><div><p>Build the foundation. Go beyond.</p><h2 id="my-course-title">SSC Complete<br/>Foundation</h2><div className="student-course-meta"><span><Icon name="book"/>3 preview lessons</span><span><Icon name="clock"/>Learn at your pace</span></div></div><div className="student-course-art" aria-hidden="true"><svg viewBox="0 0 200 180"><path d="M20 158V84a80 80 0 0 1 160 0v74M42 158V84a58 58 0 0 1 116 0v74M64 158V84a36 36 0 0 1 72 0v74M86 158V84a14 14 0 0 1 28 0v74"/><path d="M0 158h200M15 170h170"/></svg><span>ONE STEP<br/>CLOSER.</span></div></div>
            <div className="student-course-bottom"><div><div className="student-progress-label"><span>Your course progress</span><strong>{progress}%</strong></div><progress max="100" value={progress} aria-label="Preview course progress"/><small>{completed.length} of {lessons.length} preview lessons completed</small></div><button onClick={() => openLesson(nextLesson)}>{completed.length ? 'Continue learning' : 'Start learning'}<Icon name="arrow"/></button></div>
          </section>
          <section className="student-lessons" aria-labelledby="lesson-heading"><div className="student-section-heading"><h2 id="lesson-heading">Your learning path</h2><span>ONE LESSON AT A TIME</span></div>{lessons.map(item => <button className="student-lesson" key={item.id} onClick={() => openLesson(item)}><span className={`student-lesson-number ${completed.includes(item.id) ? 'done' : ''}`}>{completed.includes(item.id) ? <Icon name="check"/> : item.number}</span><span className="student-lesson-text"><small>{item.subject}</small><strong>{item.title}</strong></span><span className="student-lesson-duration">{item.duration}</span><span className="student-lesson-play"><Icon name="play"/></span></button>)}</section>
          <section className="student-notes" id="study-notes"><div className="student-section-heading"><h2>Keep a thought. Make it stick.</h2><Icon name="note"/></div><label htmlFor="student-note">Your study notes</label><textarea id="student-note" value={note} onChange={event => { setNote(event.target.value); setSaved(''); }} maxLength={10000} rows={3} placeholder="A useful shortcut, a question for later, or something you want to remember…"/><div><span>Private to this browser · preview workspace</span><button onClick={() => { try { localStorage.setItem(storageKey, JSON.stringify({completed,note,language})); setSaved('Note saved on this browser.'); } catch { setSaved('Could not save. Please copy your note before leaving.'); } }}>Save note <Icon name="check"/></button></div><p role="status">{saved}</p></section>
        </div>
        <aside className="student-right-column" aria-label="Learning tools">
          <section className="student-tutor"><span className="student-tool-icon"><Icon name="voice"/></span><p className="student-kicker">A DOUBT SHOULDN’T STOP YOU.</p><h2>Ask. Understand.<br/>Keep going.</h2><p>Jump to the explanation with timestamped answers and voice support.</p>{plan.interactive ? <button onClick={openHelp}>Explore your study tools <Icon name="arrow"/></button> : <Link href="/pricing">Explore Interactive <Icon name="arrow"/></Link>}<span className="student-included">{plan.interactive ? `Included in ${plan.name}` : 'Available with Interactive & All Access'}</span></section>
          <section className="student-plan-details"><div className="student-section-heading"><h2>Your learning pass</h2><Icon name="book"/></div><dl><div><dt>Plan preview</dt><dd>{plan.name}</dd></div><div><dt>Access period</dt><dd>{plan.duration}</dd></div><div><dt>Language preference</dt><dd>{language}</dd></div>{plan.credits && <div><dt>Plan allowance</dt><dd>{plan.credits}</dd></div>}</dl><Link href="/pricing">View plan details <Icon name="arrow"/></Link></section>
          <div className="student-daily-note"><span>THE FLOWCUS WAY</span><p>“You don’t have to learn everything today. Just one thing a little better.”</p><div aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 1v22M1 12h22M4 4l16 16M4 20 16 4"/></svg></div></div>
        </aside>
      </div>
      <footer className="student-footer"><span>Less noise. More understanding.</span><span>Sample course · no purchase made</span></footer>
    </div>
    <dialog ref={dialog} className="student-dialog" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }} aria-labelledby="student-dialog-title">
      <button className="student-dialog-close" aria-label="Close lesson preview" onClick={() => dialog.current.close()}><Icon name="close"/></button>
      <p className="student-kicker">{help ? 'YOUR CLASSROOM, EXPLAINED' : 'SAMPLE LESSON · ENGLISH PREVIEW'}</p><h2 id="student-dialog-title">{help ? 'A clearer way to learn.' : lesson?.title}</h2>
      {help ? <><p>Follow your course at your own pace, revisit explanations, and keep the notes that matter to you.</p><ul><li><strong>My course:</strong> open a lesson and track your progress.</li><li><strong>My notes:</strong> save a thought or a question for later.</li><li><strong>Interactive plans:</strong> timestamped Q&A and spoken answers accompany your classes.</li></ul><p className="student-dialog-hint">This design preview contains sample lessons. Your language preference is saved; preview lesson text is in English.</p><button className="student-dialog-primary" onClick={() => { dialog.current.close(); document.getElementById('my-course').scrollIntoView({behavior:'auto'}); }}>Explore the sample course<Icon name="arrow"/></button></> : lesson && <><p>{lesson.summary}</p><ul>{lesson.points.map(point => <li key={point}>{point}</li>)}</ul><div className="student-practice"><strong>Quick check</strong><p>{lesson.question}</p><button aria-expanded={showAnswer} onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? 'Hide answer' : 'Reveal answer'}</button>{showAnswer && <p role="status">{lesson.answer}</p>}</div><button className="student-dialog-primary" onClick={finishLesson}>{completed.includes(lesson.id) ? 'Lesson completed' : 'Mark preview lesson complete'}<Icon name="check"/></button></>}
    </dialog>
  </div>;
}
