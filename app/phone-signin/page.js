'use client';
import { useEffect, useState } from 'react';
import PhoneVerification from '../components/PhoneVerification';
import '../components/auth-dialog.css';
import { previewDashboardUrl } from '../components/preview-session.mjs';

export default function PhoneSignIn() {
  const [linking, setLinking] = useState(null);
  useEffect(() => setLinking(new URLSearchParams(window.location.search).get('link') === '1'), []);
  return <main className="phone-signin-page"><section className="auth-card">
    <div className="auth-card-content"><p className="auth-eyebrow">BEYOND MARKS · WORKSPACE</p>
      <h1>{linking ? 'Link your phone.' : 'Welcome back.'}</h1>
      {linking !== null && <PhoneVerification linking={linking} onComplete={() => { window.location.href = previewDashboardUrl(new URLSearchParams(window.location.search).get('plan')); }} />}
      <a className="auth-alternative" href="/?signin=1">Back to email sign-in</a>
    </div>
  </section></main>;
}
