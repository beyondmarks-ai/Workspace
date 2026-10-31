import { plans } from '../dashboard/preview-data.mjs';

export const PREVIEW_SESSION_KEY = 'workspace-auth-preview';
export const PREVIEW_SESSION_DURATION = 30 * 24 * 60 * 60 * 1000;

// shortcut: this browser-local marker only drives design previews; never use it to authorize access.
export function createPreviewSession(plan, now = Date.now()) {
  return { version: 1, plan: Object.hasOwn(plans, plan) ? plan : null, expiresAt: now + PREVIEW_SESSION_DURATION };
}

export function parsePreviewSession(raw, now = Date.now()) {
  try {
    const session = JSON.parse(raw);
    if (session?.version !== 1 || !Number.isFinite(session.expiresAt) || session.expiresAt <= now || session.expiresAt > now + PREVIEW_SESSION_DURATION) return null;
    if (session.plan !== null && !Object.hasOwn(plans, session.plan)) return null;
    return { version: 1, plan: session.plan, expiresAt: session.expiresAt };
  } catch { return null; }
}

export function previewDashboardUrl(plan) {
  return Object.hasOwn(plans, plan) ? `/dashboard?plan=${plan}` : '/dashboard';
}
