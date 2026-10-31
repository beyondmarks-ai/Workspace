'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import DashboardSidebar from '../dashboard/sidebar';
import { useAccount } from './use-account';
import './workspace-navigation.css';

export default function WorkspaceNavigation({ workspaceOrigin = '' }) {
  const pathname = usePathname();
  // The classroom already owns the sidebar and its in-page tools.
  if (!workspaceOrigin && pathname === '/dashboard') return null;
  return <AccountNavigation key={pathname} pathname={pathname} workspaceOrigin={workspaceOrigin}/>;
}

function AccountNavigation({ pathname, workspaceOrigin }) {
  const account = useAccount();
  const router = useRouter();
  const [photo, setPhoto] = useState('');
  useEffect(() => {
    setPhoto('');
    if (!account) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`flowcus-student-profile:${account.id}`) || '{}');
      if (typeof saved?.photo === 'string' && saved.photo.length < 2800000 && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(saved.photo)) setPhoto(saved.photo);
    } catch { /* A missing local photo falls back to the account initial. */ }
  }, [account?.id]);
  if (!account) return null;

  function openTool(panel) {
    const path = `/dashboard?panel=${encodeURIComponent(panel)}`;
    if (workspaceOrigin) window.location.assign(`${workspaceOrigin}${path}`);
    else router.push(path);
  }
  const activePage = workspaceOrigin ? 'shop' : pathname.startsWith('/dashboard/projects') ? 'projects' : pathname === '/pricing' ? 'purchase' : '';
  return <div className="beyondmarks-navigation">
    <DashboardSidebar workspaceOrigin={workspaceOrigin} activePage={activePage} hasCourse={false}
      profile={{ name: account.name || 'Student', language: account.preferredLanguage || 'English', photo }}
      onPanel={openTool} onAgent={() => openTool('AI Agent')} agentOpen={false}/>
  </div>;
}
