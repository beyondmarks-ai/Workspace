'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { accountRequest } from '../components/use-account';
import './sidebar.css';

function Icon({ name }) {
  const paths = {
    courses: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
    purchase: <><path d="m3 9 9-5 9 5-9 5-9-5Zm4 3v5c3 3 7 3 10 0v-5M21 9v8"/></>,
    shop: <><path d="M4 9v11h16V9M3 9l2-6h14l2 6M3 9c0 4 5 4 5 0 0 4 8 4 8 0 0 4 5 4 5 0M9 20v-6h6v6"/></>,
    projects: <><path d="M3 7a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 11h18"/></>,
    notes: <><rect x="5" y="4" width="15" height="17" rx="2"/><path d="M9 2v4M16 2v4M3 10h4M3 15h4M10 11h6M10 15h4"/></>,
    agent: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3ZM20 2v4M18 4h4"/></>,
    settings: <><path d="M4 6h3m4 0h9M4 12h9m4 0h3M4 18h5m4 0h7"/><circle cx="9" cy="6" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="11" cy="18" r="2"/></>,
    notifications: <><path d="M5 10a7 7 0 0 1 14 0c0 6 2 6 2 7H3c0-1 2-1 2-7ZM9 21h6"/></>,
    profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    logout: <><path d="M10 4H5v16h5M14 8l4 4-4 4M9 12h12"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function DashboardSidebar({ hasCourse, profile, onPanel, onAgent, agentOpen }) {
  const [active, setActive] = useState('courses');
  const [profileOpen, setProfileOpen] = useState(false);
  const [seenUpdates, setSeenUpdates] = useState(false);
  const [panel, setPanel] = useState('');
  const [error, setError] = useState('');
  const menu = useRef(null);
  const profileButton = useRef(null);
  const dialog = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (!profileOpen) return;
    menu.current.querySelector('button')?.focus();
    function outside(event) { if (!menu.current?.contains(event.target) && !profileButton.current?.contains(event.target)) setProfileOpen(false); }
    function escape(event) { if (event.key === 'Escape') { setProfileOpen(false); profileButton.current?.focus(); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [profileOpen]);

  function select(name) {
    setProfileOpen(false);
    setActive(name);
    if (name === 'courses') {
      const heading = document.getElementById('course-library-title');
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    } else if (name === 'projects') router.push('/dashboard/projects');
    else if (name === 'notes') onPanel('Notes');
    else if (name === 'agent') onAgent();
    else if (name === 'settings') onPanel('Settings');
    else {
      if (name === 'notifications') setSeenUpdates(true);
      setPanel(name);
      dialog.current.showModal();
    }
  }

  async function logout() {
    try { await accountRequest({}, 'DELETE'); router.replace('/'); router.refresh(); }
    catch (error) { setError(error.message); }
  }

  const items = [['projects', 'Projects'], ['notes', 'Notes'], ['agent', 'AI Agent']];
  return <>
    <aside className="workspace-rail" aria-label="Workspace sidebar">
      <span className="rail-glow" aria-hidden="true"/>
      <Link href="/" className="rail-brand" aria-label="Beyond Marks home">b<span>.</span></Link>
      <nav className="rail-main" aria-label="Workspace navigation">
        {hasCourse ? <button className="rail-item" data-label="Courses" aria-label="Courses" aria-current={active === 'courses' ? 'page' : undefined} onClick={() => select('courses')}><Icon name="courses"/></button>
          : <Link href="/pricing" className="rail-item" data-label="Purchase a course" aria-label="Purchase a course"><Icon name="purchase"/></Link>}
        <a href="https://dashboard.beyondmarks.ai" className="rail-item" style={{ '--item-order': 1 }} data-label="Shop" aria-label="Shop"><Icon name="shop"/></a>
        {items.map(([name, label], index) => <button key={name} className="rail-item" style={{ '--item-order': index + 2 }} data-label={label} aria-label={label} aria-current={name !== 'agent' && active === name ? 'page' : undefined} aria-pressed={name === 'agent' ? agentOpen : undefined} onClick={() => select(name)}><Icon name={name}/></button>)}
      </nav>
      <nav className="rail-footer" aria-label="Account tools">
        <button className="rail-item" data-label="Settings" aria-label="Settings" onClick={() => select('settings')}><Icon name="settings"/></button>
        <button className="rail-item" data-label="Notifications" aria-label="Notifications" onClick={() => select('notifications')}><Icon name="notifications"/>{!seenUpdates && <span className="rail-notification-dot"/>}</button>
        <button ref={profileButton} className="rail-item rail-avatar" data-label="Your profile" aria-label="Your profile" aria-expanded={profileOpen} aria-controls="sidebar-profile-menu" onClick={() => { setProfileOpen(!profileOpen); setError(''); }}>{profile.photo ? <img src={profile.photo} alt=""/> : <span>{profile.name.slice(0, 1).toUpperCase()}</span>}</button>
      </nav>
    </aside>
    {profileOpen && <section ref={menu} id="sidebar-profile-menu" className="rail-profile-menu" aria-label="Profile menu">
      <div className="rail-profile-summary"><span className="rail-profile-initial">{profile.name.slice(0, 1).toUpperCase()}</span><div><strong>{profile.name}</strong><span>{profile.language} · Your workspace</span></div></div>
      <button onClick={() => { setProfileOpen(false); onPanel('Your profile'); }}><Icon name="profile"/>Edit profile<span aria-hidden="true">↗</span></button>
      <button className="rail-logout" onClick={logout}><Icon name="logout"/>Log out<span aria-hidden="true">↗</span></button>
      {error && <p role="alert">{error}</p>}
    </section>}
    <dialog ref={dialog} className="rail-dialog" aria-labelledby="rail-dialog-title" onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <button className="rail-dialog-close" aria-label="Close sidebar panel" onClick={() => dialog.current.close()}>×</button>
      <span className="rail-panel-icon"><Icon name={panel || 'notifications'}/></span>
      <p className="rail-eyebrow">BEYOND MARKS WORKSPACE</p>
      <h2 id="rail-dialog-title">Your workspace updates</h2>
      <div className="rail-updates"><article><span className="rail-update-symbol"><Icon name="courses"/></span><div><h3>Your learning path is ready</h3><p>Explore 12 system design sessions and 120 class outlines. Recordings are coming soon.</p></div></article><article><span className="rail-update-symbol"><Icon name="agent"/></span><div><h3>Meet your learning companion</h3><p>Open AI Agent to bring Orby into your workspace.</p></div></article></div>
    </dialog>
  </>;
}
