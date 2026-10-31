"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import AuthDialog from './components/AuthDialog';
import { useAccount, accountRequest } from './components/use-account';
import { previewDashboardUrl } from './components/preview-session.mjs';

export default function Home() {
  const [open, setOpen] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const session = useAccount();
  useEffect(() => { if (new URLSearchParams(window.location.search).has('signin')) setOpen(true); }, []);

  return (
    <main className="site-shell">
      <video className="video-bg" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
        <source src="/bg.mp4" type="video/mp4" />
      </video>
      <div className="center-text" aria-label="Beyond Marks Presents Workspace">
        <div className="title-line">BEYOND MARKS</div>
        <div className="present-line">PRESENTS</div>
        <div className="workspace-line">WORKSPACE</div>
        <div className={`hero-actions${session ? ' hero-actions--returning' : ''}`}>
          {session ? <Link className="hero-button join-button continue-button" href={previewDashboardUrl(session.plan)}>
            <span className="button-label">Continue to dashboard</span>
            <svg aria-hidden="true" viewBox="0 0 16 16"><path d="M2 14 14 2M6 2h8v8" /></svg>
          </Link> : <button className="hero-button join-button" type="button" disabled={session === undefined} onClick={() => setOpen(true)}>
            <span className="button-label">Join</span>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M2 14 14 2M6 2h8v8" />
            </svg>
          </button>}
          <Link className="hero-button pricing-button" href="/pricing">
            <span className="button-label">Pricing</span>
            <svg aria-hidden="true" viewBox="0 0 16 16">
              <path d="M2 14 14 2M6 2h8v8" />
            </svg>
          </Link>
        </div>
        {session && <button className="preview-signout" type="button" onClick={async () => {
          try { await accountRequest({}, 'DELETE'); setSessionError(''); }
          catch (error) { setSessionError(error.message); }
        }}>Sign out</button>}
        {sessionError && <p className="preview-session-error" role="alert">{sessionError}</p>}
        {session === null && <aside className="online-notice" aria-label="Workspace update">
          <span className="online-notice-label">COMING SOON</span>
          <h2>Workspace is moving online.</h2>
          <p>Your classroom, wherever you are. Get ready for a new way to learn.</p>
        </aside>}
      </div>

      {open && <AuthDialog onClose={() => setOpen(false)} />}
    </main>
  );
}
