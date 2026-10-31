'use client';
import { useEffect, useRef, useState } from 'react';
import { waitForPhoneChallenge } from '../../lib/phone-challenge.mjs';
import IndianPhoneInput from './IndianPhoneInput';

// Firebase tokens stay in memory; Azure's HttpOnly cookie owns the application session.
export default function PhoneVerification({ linking = false, onComplete }) {
  const captcha = useRef(null);
  const verifier = useRef(null);
  const confirmation = useRef(null);
  const verifiedToken = useRef(null);
  const firebaseAuth = useRef(null);
  const mounted = useRef(true);
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { mounted.current = false; clearInterval(timer); verifier.current?.clear(); verifier.current = null; };
  }, []);

  async function send() {
    if (Date.now() < retryAt) return;
    if (!/^\+91[6-9][0-9]{9}$/.test(phone)) { setMessage('Enter your 10-digit Indian mobile number.'); return; }
    setBusy(true); setMessage('');
    try {
      const [{ initializeApp, getApps }, authSdk] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
      if (!firebaseAuth.current) {
        const response = await fetch('/api/auth/config', { cache: 'no-store' });
        const config = await response.json();
        if (!response.ok) throw new Error(config.error || 'Phone sign-in is unavailable.');
        const app = getApps().find(app => app.name === 'beyondmarks-phone') || initializeApp(config, 'beyondmarks-phone');
        firebaseAuth.current = authSdk.getAuth(app);
        await authSdk.setPersistence(firebaseAuth.current, authSdk.inMemoryPersistence);
      }
      if (!mounted.current) return;
      verifier.current?.clear();
      verifier.current = new authSdk.RecaptchaVerifier(firebaseAuth.current, captcha.current, { size: 'invisible' });
      setMessage('Google is verifying this request. Complete a security challenge only if one appears.');
      await waitForPhoneChallenge(verifier.current).catch(error => { verifier.current = null; throw error; });
      if (!mounted.current) return;
      confirmation.current = await authSdk.signInWithPhoneNumber(firebaseAuth.current, phone, verifier.current);
      verifiedToken.current = null;
      if (mounted.current) { setSent(true); setRetryAt(Date.now() + 60000); setMessage('Code sent. Check your SMS messages.'); }
    } catch (error) {
      if (mounted.current) setMessage(error.code === 'auth/too-many-requests' ? 'Too many SMS requests. Wait and try again later.' : error.code ? 'Could not send the code. Check the number and complete the verification challenge.' : error.message);
    } finally { if (mounted.current) setBusy(false); }
  }

  async function submit(event) {
    event.preventDefault();
    if (!sent) { await send(); return; }
    const form = new FormData(event.currentTarget);
    setBusy(true); setMessage('');
    try {
      if (!verifiedToken.current) {
        const credential = await confirmation.current.confirm(form.get('otp'));
        verifiedToken.current = await credential.user.getIdToken();
      }
      const idToken = verifiedToken.current;
      const response = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: linking ? 'phone-link' : 'phone-login', idToken, currentPassword: form.get('currentPassword') }) });
      const result = await response.json();
      const { signOut } = await import('firebase/auth');
      await signOut(firebaseAuth.current);
      if (!response.ok) throw new Error(result.error || 'Could not verify your phone.');
      if (mounted.current) onComplete(result.user);
    } catch (error) {
      if (mounted.current) setMessage(error.code ? 'That code is invalid or expired. Check it or request a new code.' : error.message);
    } finally { if (mounted.current) setBusy(false); }
  }

  return <form className="phone-verification auth-form" onSubmit={submit}>
    <p>{linking ? 'Verify a phone for your existing account. Your courses and credits stay with you.' : 'Use a phone you have already linked to your account. First time? Sign in with email, then link your phone.'}</p>
    <label>Phone number<IndianPhoneInput onChange={setPhone} readOnly={sent || busy} /></label>
    {sent && <>
      <label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required /></label>
      {linking && <label>Current account password<input name="currentPassword" type="password" autoComplete="current-password" minLength={8} maxLength={128} required /></label>}
    </>}
    <p className="phone-consent">Google processes your phone number for verification and abuse prevention. Standard SMS rates may apply.</p>
    <div ref={captcha} className="phone-captcha" />
    {message && <p role="status">{message}</p>}
    <button className="auth-submit submit-button" disabled={busy} type="submit">{busy ? 'Please wait…' : sent ? linking ? 'Verify & link phone' : 'Verify & sign in' : 'Send verification code'}</button>
    {sent && <div className="auth-options">
      <button type="button" disabled={busy} onClick={() => { setSent(false); confirmation.current = null; setMessage(''); verifier.current?.clear(); }}>Change number</button>
      <button type="button" disabled={busy || now < retryAt} onClick={send}>{now < retryAt ? `Resend in ${Math.ceil((retryAt - now) / 1000)}s` : 'Resend code'}</button>
    </div>}
  </form>;
}
