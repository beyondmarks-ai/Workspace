'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { aiLessons } from './ai-lessons.mjs';
import { createDragScroll } from './drag-scroll.mjs';

export default function AiClasses() {
  const [active, setActive] = useState(null);
  const dialog = useRef(null);
  const video = useRef(null);
  const row = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const dragScroll = useMemo(createDragScroll, []);
  useEffect(() => {
    const observer = new ResizeObserver(updateEdges);
    observer.observe(row.current);
    return () => observer.disconnect();
  }, []);
  function open(lesson) { setActive(lesson); dialog.current.showModal(); }
  function close() { video.current?.pause(); dialog.current.close(); setActive(null); }
  function move(direction) {
    const card = row.current.querySelector('.ai-lesson-card');
    const gap = parseFloat(getComputedStyle(row.current).gap);
    row.current.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function updateEdges() {
    const element = row.current;
    if (!element) return;
    const start = element.scrollLeft <= 1;
    const end = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
    setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
  }

  return <section className="ai-library" aria-labelledby="ai-library-title">
    <div className="ai-library-heading"><div><h2 id="ai-library-title">Your next big idea starts here.</h2><span>Explore your AI classroom, one lesson at a time.</span></div><div className="ai-carousel-nav"><span>10 classes</span><button onClick={() => move(-1)} disabled={edges.start} aria-label="Previous classes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><button onClick={() => move(1)} disabled={edges.end} aria-label="Next classes"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div></div>
    <div ref={row} className="ai-lesson-grid" role="group" aria-label="AI classes. Drag, swipe or use arrow keys to browse." tabIndex={0} onScroll={updateEdges} {...dragScroll}>
      {aiLessons.map((lesson, index) => <article className="ai-lesson-card" key={lesson.id} style={{ '--lesson-color': lesson.color }} aria-labelledby={`title-${lesson.id}`}>
        <button className="ai-lesson-cover" onClick={() => open(lesson)} aria-label={`Preview ${lesson.title}`}>
          <strong className="ai-cover-title">{lesson.coverTitle}</strong>
          <span className="ai-duration" aria-label="18 seconds">{lesson.duration}</span>
        </button>
        <div className="ai-video-details"><h3 id={`title-${lesson.id}`}><button onClick={() => open(lesson)}>Lesson {String(index + 1).padStart(2, '0')} · {lesson.title}</button></h3></div>
      </article>)}
    </div>
    <div className="ai-library-footer"><p className="ai-drag-hint">Drag or swipe to explore <span aria-hidden="true">↔</span></p></div>
    <dialog className="welcome-dialog ai-lesson-dialog" ref={dialog} aria-labelledby="ai-preview-title" onCancel={() => { video.current?.pause(); setActive(null); }} onClick={event => { if (event.target === dialog.current) close(); }}>
      <button className="welcome-close" onClick={close} aria-label="Close lesson preview">×</button>
      <p className="welcome-eyebrow">DEMO CLASS · 18 SEC</p>
      <h2 id="ai-preview-title">{active?.title}</h2>
      {active && <><video key={active.id} ref={video} controls autoPlay playsInline preload="metadata" src={`/ai-demos/${active.id}.mp4`} aria-label={`${active.title} demo video`}/><p className="welcome-hint">A short, silent demo preview. Full class recordings will appear here.</p></>}
    </dialog>
  </section>;
}
