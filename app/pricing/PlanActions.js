"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthDialog from '../components/AuthDialog';
import { useAccount } from '../components/use-account';
import { previewDashboardUrl } from '../components/preview-session.mjs';

export default function PlanActions({ plan }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const session = useAccount();
  const router = useRouter();
  const planId = plan.name.toLowerCase().replaceAll(' ', '-');

  function choosePlan() {
    if (!session) { setOpen(true); return; }
    try {
      router.push(previewDashboardUrl(planId));
    } catch { setError('Allow site storage to continue with this preview.'); }
  }

  return <>
    <button className="plan-cta" type="button" disabled={session === undefined} onClick={choosePlan}>Choose {plan.name}</button>
    <button className="plan-preview" type="button" disabled={session === undefined} onClick={choosePlan}>Preview your dashboard &#8599;</button>
    {error && <p className="preview-session-error" role="alert">{error}</p>}
    {open && <AuthDialog plan={plan} onClose={() => setOpen(false)} onComplete={() => { setOpen(false); router.push(previewDashboardUrl(planId)); }} />}
  </>;
}
