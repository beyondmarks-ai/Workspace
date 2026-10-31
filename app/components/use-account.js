'use client';
import { useEffect, useState } from 'react';

export const accountChanged = () => window.dispatchEvent(new Event('beyondmarks-account-changed'));

export async function accountRequest(body, method = 'POST') {
  const response = await fetch('/api/auth', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not complete sign-in.');
  accountChanged();
  return data;
}

export function useAccount() {
  const [account, setAccount] = useState(undefined);
  useEffect(() => {
    let alive = true;
    async function refresh() {
      try {
        const response = await fetch('/api/auth', { cache: 'no-store' });
        const data = await response.json();
        if (alive) setAccount(response.ok ? data.user : null);
      } catch { if (alive) setAccount(null); }
    }
    refresh();
    const timer = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    window.addEventListener('beyondmarks-account-changed', refresh);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', refresh); window.removeEventListener('beyondmarks-account-changed', refresh); };
  }, []);
  return account;
}
