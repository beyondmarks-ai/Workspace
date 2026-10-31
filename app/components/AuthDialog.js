"use client";

import { useEffect, useRef, useState } from 'react';
import { accountRequest, accountChanged } from './use-account';

import './auth-dialog.css';

function PasswordField({ name, label, signup, error }) {
  const [visible, setVisible] = useState(false);
  return <div className="auth-field">
    <label htmlFor={`auth-${name}`}>{label}</label>
    <div className="auth-password">
      <input id={`auth-${name}`} name={name} type={visible ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} placeholder={name === 'confirmPassword' ? 'Repeat password' : signup ? 'At least 8 characters' : 'Enter your password'} minLength={signup ? 8 : undefined} aria-invalid={error ? true : undefined} aria-describedby={error ? 'auth-password-error' : undefined} required />
      <button type="button" aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
      </button>
    </div>
  </div>;
}

export default function AuthDialog({ onClose, onComplete, plan }) {
  const dialog = useRef(null);
  const [signup, setSignup] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(null);
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const phoneUrl = `/phone-signin${plan ? `?plan=${encodeURIComponent(plan.name.toLowerCase().replaceAll(' ', '-'))}` : ''}`;

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  function changeMode() {
    setSignup(!signup);
    setMessage('');
    setPasswordError('');
  }

  async function submit(event) {
    event.preventDefault();
    const fields = event.currentTarget.elements;
    if (signup && fields.password.value !== fields.confirmPassword.value) {
      setPasswordError('Passwords do not match. Please try again.');
      fields.confirmPassword.setCustomValidity('Passwords do not match.');
      fields.confirmPassword.reportValidity();
      return;
    }
    setBusy(true); setMessage('');
    try {
      const { user } = await accountRequest(signup ? { action: 'signup', name: fields.name.value, email: fields.email.value, contactNumber: fields.whatsapp.value, referral: fields.referral.value, password: fields.password.value } : { action: 'signin', contact: fields.identifier.value, password: fields.password.value });
      setSignedIn(user);
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  function complete() { accountChanged(); (onComplete || onClose)(); }

  return (
    <dialog ref={dialog} className="auth-dialog" aria-labelledby="auth-title" onClose={onClose}
      onClick={event => { if (event.target === event.currentTarget) dialog.current.close(); }}>
      <div className="auth-scene">
        <button type="button" className="auth-close" aria-label="Close login" onClick={() => dialog.current.close()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6" /></svg>
        </button>
        <div className="auth-story">
          <p>YOUR NEXT CHAPTER</p>
          <h2>A little curiosity.<br /><em>Endless possibility.</em></h2>
          <span>A space to learn, create, and go beyond.</span>
        </div>
        <div className="auth-panel">
          <div className="auth-brand"><span>BEYOND MARKS</span><span>AI ACADEMY</span></div>
          <section className="auth-card">
            <div className="auth-card-content">
              <p className="auth-eyebrow">WORKSPACE</p>
              <h1 id="auth-title">{signup ? <>Begin your <em>story.</em></> : <>Welcome <em>back.</em></>}</h1>
              <p className="auth-subtitle">{signup ? 'Curiosity brought you here. Let\u2019s make it count.' : 'Good to see you. Your next chapter awaits.'}</p>
              {plan && <div className="auth-selected-plan" aria-label="Selected plan">
                <span>Continue with <strong>{plan.name}</strong></span>
                <span>&#8377;{plan.price} / {plan.period}</span>
              </div>}
              {!signup && !signedIn && <div className="auth-methods" role="group" aria-label="Login with">
                {['email', 'phone'].map(method => <button type="button" key={method} aria-pressed={loginMethod === method} onClick={() => { setLoginMethod(method); setMessage(''); }}>{method === 'email' ? 'Email address' : 'Phone number'}</button>)}
              </div>}
              {signedIn ? <div className="auth-signed-in"><p>Welcome, {signedIn.name}.</p>{linking ? <a className="auth-submit" href={`${phoneUrl}${plan ? '&' : '?'}link=1`}>Continue to phone verification</a> : <><button type="button" className="auth-submit" onClick={complete}>Continue to Workspace</button>{!signedIn.verifiedPhone && <button type="button" className="auth-alternative" onClick={() => setLinking(true)}>Link phone for OTP login</button>}</>}</div> : !signup && loginMethod === 'phone' ? <div className="phone-verification"><p>Sign in securely with a phone already linked to your account.</p><a className="auth-submit" href={phoneUrl}>Continue with phone OTP</a></div> : <form key={signup ? 'signup' : 'email'} onSubmit={submit} onInput={event => {
                if (signup) { event.currentTarget.elements.confirmPassword.setCustomValidity(''); setPasswordError(''); }
                setMessage('');
              }}>
                {signup ? <div className="auth-signup-fields">
                  <label className="auth-field auth-wide">Full name<input name="name" autoComplete="name" placeholder="Your full name" maxLength={80} required /></label>
                  <label className="auth-field auth-wide">Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
                  <label className="auth-field">WhatsApp number<input name="whatsapp" type="tel" autoComplete="tel" placeholder="+919876543210" pattern="[+]?[1-9][0-9]{7,14}" title="Enter 8-15 digits with country code, without spaces. For example: +919876543210" maxLength={16} required /></label>
                  <label className="auth-field">Referral code <span className="auth-optional">Optional</span><input name="referral" placeholder="Have a code?" maxLength={40} /></label>
                  <PasswordField name="password" label="Create password" signup />
                  <PasswordField name="confirmPassword" label="Confirm password" signup error={passwordError} />
                  {passwordError && <p id="auth-password-error" className="auth-field-error auth-wide" role="alert">{passwordError}</p>}
                </div> : <>
                  <label className="auth-field">{loginMethod === 'email' ? 'Email address' : 'Phone number'}
                    <input name="identifier" type={loginMethod === 'email' ? 'email' : 'tel'} autoComplete={loginMethod === 'email' ? 'email' : 'tel'} placeholder={loginMethod === 'email' ? 'you@example.com' : '+919876543210'} pattern={loginMethod === 'phone' ? '[+]?[1-9][0-9]{7,14}' : undefined} title={loginMethod === 'phone' ? 'Include country code, without spaces. For example: +919876543210' : undefined} required />
                  </label>
                  <PasswordField name="password" label="Password" />
                </>}
                <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}<span aria-hidden="true">&#8599;</span></button>
                {message && <p className="auth-message" role="status">{message}</p>}
              </form>}
              {!signedIn && <p className="auth-switch">{signup ? 'Already have an account?' : 'New to Workspace?'}{' '}<button type="button" onClick={changeMode}>{signup ? 'Log in' : 'Create account'}</button></p>}
              <div className="auth-footer">A new way to learn. A new place to begin.</div>
            </div>
          </section>
        </div>
      </div>
    </dialog>
  );
}
