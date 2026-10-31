"use client";

import { useEffect, useState } from 'react';
import { createPreviewSession, parsePreviewSession, PREVIEW_SESSION_KEY } from './preview-session.mjs';

const SESSION_CHANGED = 'workspace-preview-session-changed';

export function rememberPreviewSession(plan) {
  localStorage.setItem(PREVIEW_SESSION_KEY, JSON.stringify(createPreviewSession(plan)));
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function endPreviewSession() {
  localStorage.removeItem(PREVIEW_SESSION_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function usePreviewSession() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    function refresh() {
      try { setSession(parsePreviewSession(localStorage.getItem(PREVIEW_SESSION_KEY))); }
      catch { setSession(null); }
    }
    refresh();
    window.addEventListener(SESSION_CHANGED, refresh);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    const timer = setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener(SESSION_CHANGED, refresh);
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
      clearInterval(timer);
    };
  }, []);
  return session;
}
