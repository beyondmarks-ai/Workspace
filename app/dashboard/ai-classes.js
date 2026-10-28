'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { course, teachingFormat } from './system-design.mjs';
import { createDragScroll } from './drag-scroll.mjs';

const numberLabel = number => String(number).padStart(2, '0');
const totalLessons = course.sessions.reduce((total, session) => total + session.lessons.length, 0);

export default function CourseLibrary() {
  const [session, setSession] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const row = useRef(null);
  const dragScroll = useMemo(createDragScroll, [session, expanded]);
  const section = useRef(null);
  const heading = useRef(null);
  const dialog = useRef(null);
  const navigated = useRef(false);

  useEffect(() => {
    if (!navigated.current) return;
    heading.current.focus({ preventScroll: true });
    section.current.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [session]);

  useEffect(() => {
    if (!row.current) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(row.current);
    return () => observer.disconnect();
  }, [session, expanded]);

  function updateEdges() {
    const element = row.current;
    if (!element) return;
    const start = element.scrollLeft <= 1;
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
    setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
  }
  function move(direction) {
    const card = row.current.firstElementChild;
    const gap = parseFloat(getComputedStyle(row.current).gap);
    row.current.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }

  function selectSession(next) { navigated.current = true; setExpanded(false); setSession(next); }
  function openLesson(next) { setLesson(next); dialog.current.showModal(); }
  function closeLesson() { dialog.current.close(); setLesson(null); }

  return <section className="course-library" data-expanded={expanded} ref={section} aria-labelledby="course-library-title">
    {session && <button className="course-back" onClick={() => selectSession(null)}><span aria-hidden="true">&larr;</span> All sessions</button>}
    <header className="course-heading">
      <div>
        <p className="course-eyebrow">{session ? `Session ${numberLabel(session.number)} / ${numberLabel(course.sessions.length)}` : 'Your learning path'}</p>
        <h2 id="course-library-title" ref={heading} tabIndex={-1}>{session ? session.title : course.title}</h2>
        <p className="course-subtitle">{session ? `Company examples: ${session.companies.join(', ')}` : course.subtitle}</p>
      </div>
      <div className="course-browse-controls"><p className="course-count">{session ? `${session.lessons.length} classes` : `${course.sessions.length} sessions`}<span aria-hidden="true"> / </span>{session ? '8-12 min per class' : `${totalLessons} classes`}</p>
      {!expanded && <nav className="course-carousel-nav" aria-label={session ? "Browse classes" : "Browse sessions"}><button onClick={() => move(-1)} disabled={edges.start} aria-label={session ? "Previous classes" : "Previous sessions"}>&#8249;</button><button onClick={() => move(1)} disabled={edges.end} aria-label={session ? "Next classes" : "Next sessions"}>&#8250;</button></nav>}</div>
    </header>

    {session ? <>
      <p className="course-availability">Recordings coming soon. Explore each class outline below.</p>
      <div ref={row} id="course-class-list" className="course-class-grid course-slider" data-start={edges.start} data-end={edges.end} role="group" aria-label={`${session.title} classes${expanded ? "" : ". Drag, swipe or use arrow keys to browse."}`} tabIndex={expanded ? undefined : 0} onScroll={updateEdges} {...(expanded ? {} : dragScroll)}>
        {session.lessons.map(item => <article className="course-class-card course-slide" key={item.id}>
          <button className="course-class-cover" style={{ '--session-color': session.color }} onClick={() => openLesson(item)} aria-label={`View outline for Lesson ${numberLabel(item.number)}: ${item.title}`}>
            <span className="course-class-preview">CLASS OUTLINE</span>
            <strong>{item.title}</strong>
            <span className="course-class-link">Explore class <span aria-hidden="true">&#8599;</span></span>
          </button>
          <h3 className="course-class-title"><button onClick={() => openLesson(item)}>Lesson {numberLabel(item.number)} &middot; {item.title}</button></h3>
        </article>)}
      </div>
    </> : <>
      <div ref={row} id="course-session-list" className="course-session-grid course-slider" data-start={edges.start} data-end={edges.end} role="group" aria-label={expanded ? "All course sessions" : "Course sessions. Drag, swipe or use arrow keys to browse."} tabIndex={expanded ? undefined : 0} onScroll={updateEdges} {...(expanded ? {} : dragScroll)}>
        {course.sessions.map(item => <article className="course-session-card course-slide" key={item.id}>
          <button className="course-session-button" onClick={() => selectSession(item)} style={{ '--session-color': item.color }} aria-label={`Open Session ${numberLabel(item.number)}: ${item.title}, ${item.lessons.length} classes`}>
            <span className="course-session-top"><span>SESSION {numberLabel(item.number)}</span><span aria-hidden="true">&#8599;</span></span>
            <span className="course-session-title">{item.title}</span>
            <span className="course-session-companies">{item.companies.join(' / ')}</span>
            <span className="course-session-bottom"><span>{item.lessons.length} classes</span><span>Lessons {numberLabel(item.lessons[0].number)}&ndash;{numberLabel(item.lessons.at(-1).number)}</span></span>
          </button>
        </article>)}
      </div>


    </>}
      <div className="course-session-footer"><button className="course-show-all" aria-expanded={expanded} aria-controls={session ? "course-class-list" : "course-session-list"} onClick={() => setExpanded(value => !value)}>{expanded ? 'Show less' : 'Show all'} <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
      {!session && <p className="course-footnote">Estimated learning time: 16-24 hours <span aria-hidden="true">&middot;</span> 8-12 minutes per micro lesson</p>}

    <dialog className="welcome-dialog course-outline" ref={dialog} aria-labelledby="course-outline-title" onCancel={() => setLesson(null)} onClick={event => { if (event.target === dialog.current) closeLesson(); }}>
      <button className="welcome-close" onClick={closeLesson} aria-label="Close class outline">&times;</button>
      <p className="welcome-eyebrow">SESSION {numberLabel(session?.number || 1)} &middot; LESSON {numberLabel(lesson?.number || 1)}</p>
      <h2 id="course-outline-title">{lesson?.title}</h2>
      <p className="course-outline-status">Recording coming soon <span aria-hidden="true">&middot;</span> Planned duration: 8-12 minutes</p>
      <p className="welcome-hint">Company examples for this session: {session?.companies.join(', ')}.</p>
      <h3>How this class will be taught</h3>
      <ol className="course-teaching-format">{teachingFormat.map(step => <li key={step}>{step}</li>)}</ol>
    </dialog>
  </section>;
}
