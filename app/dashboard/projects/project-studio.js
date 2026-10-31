'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { createDragScroll } from '../drag-scroll.mjs';
import { projectIdeas } from './project-ideas.mjs';

const number = value => String(value).padStart(2, '0');
const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';

function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6"/></svg>;
}

export default function ProjectStudio() {
  const [selected, setSelected] = useState(null);
  const row = useRef(null);
  const dialog = useRef(null);
  const drag = useMemo(createDragScroll, []);

  function move(direction) {
    const element = row.current;
    const step = element.firstElementChild.getBoundingClientRect().width + parseFloat(getComputedStyle(element).gap);
    element.scrollBy({ left: direction * step, behavior: motion() });
  }

  function keyboard(event) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      row.current.scrollTo({ left: event.key === 'Home' ? 0 : row.current.scrollWidth, behavior: motion() });
    }
  }

  function openProject(project) { setSelected(project); dialog.current.showModal(); }
  function closeProject() { dialog.current.close(); setSelected(null); }

  return <main className="project-studio" aria-label="Project studio">
    <img className="project-room" src="/projects/studio-wall.webp" alt="" fetchPriority="high"/>
    <section className="studio-wall" aria-label="Course project ideas">
      <div className="studio-carousel" ref={row} role="group" aria-label="Project ideas. Drag, swipe or use arrow keys to browse." tabIndex={0} onKeyDown={keyboard} {...drag}>
        {projectIdeas.map(project => <button key={project.id} className={`project-folder${project.dark ? ' project-folder-dark' : ''}`} onClick={() => openProject(project)} aria-label={`Open Project ${number(project.number)}: ${project.title}`}>
          <svg className="folder-shape" viewBox="0 0 280 376" preserveAspectRatio="none" aria-hidden="true"><path d="M14 1H118Q127 1 132 9L139 19Q143 25 153 25H266Q279 25 279 39V361Q279 375 265 375H15Q1 375 1 361V16Q1 1 14 1Z"/></svg>
          <span className="folder-number">{number(project.number)}<span>SESSION {number(project.session.number)}</span></span>
          <img src={project.image} alt="" width="236" height="220" loading={project.number > 4 ? 'lazy' : 'eager'} draggable="false"/>
          <span className="folder-bottom"><span><span className="folder-caption">PROJECT {number(project.number)}</span><strong>{project.title}</strong></span><span className="folder-arrow"><Arrow/></span></span>
        </button>)}
      </div>
    </section>

    <dialog ref={dialog} className="project-brief" aria-labelledby="project-brief-title" onCancel={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) closeProject(); }}>
      <button className="brief-close" onClick={closeProject} aria-label="Close project brief">×</button>
      {selected && <>
        <p className="studio-eyebrow">PROJECT {number(selected.number)} / SESSION {number(selected.session.number)}</p>
        <h2 id="project-brief-title">{selected.title}</h2>
        <p className="brief-summary">{selected.summary}</p>
        <div className="brief-session"><span>BUILDING ON</span><strong>{selected.session.title}</strong><p>Lessons {selected.session.lessons[0].number}–{selected.session.lessons.at(-1).number} · {selected.session.companies.join(' / ')}</p></div>
        <h3>Your starting point</h3>
        <ol className="brief-steps">{selected.steps.map(step => <li key={step}>{step}</li>)}</ol>
        <div className="brief-goal"><span>YOU’VE BUILT IT WHEN…</span><p>{selected.goal}</p></div>
        <details className="brief-lessons"><summary>Explore the related classes <span aria-hidden="true">+</span></summary><ol>{selected.session.lessons.map(lesson => <li key={lesson.id}><span>{number(lesson.number)}</span>{lesson.title}</li>)}</ol></details>
        <Link href="/dashboard#course-library-title" className="brief-classes">Back to your classes<Arrow/></Link>
      </>}
    </dialog>
  </main>;
}
