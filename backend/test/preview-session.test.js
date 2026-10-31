import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewSession, parsePreviewSession, previewDashboardUrl, PREVIEW_SESSION_DURATION } from '../../app/components/preview-session.mjs';

test('a preview survives reload for 30 days and retains only the selected plan', () => {
  const now = 1_800_000_000_000;
  const stored = JSON.stringify(createPreviewSession('all-access', now));
  assert.deepEqual(parsePreviewSession(stored, now + 1000), { version: 1, plan: 'all-access', expiresAt: now + PREVIEW_SESSION_DURATION });
  assert.equal(parsePreviewSession(stored, now + PREVIEW_SESSION_DURATION), null);
  assert.equal(previewDashboardUrl(parsePreviewSession(stored, now).plan), '/dashboard?plan=all-access');
});

test('missing, corrupt, expired, or unrecognized preview data cannot restore a session', () => {
  const now = 1_800_000_000_000;
  for (const raw of [null, '', '{broken', '{}', JSON.stringify({ ...createPreviewSession('classes', now), plan: 'admin' }), JSON.stringify({ ...createPreviewSession(null, now), expiresAt: now - 1 })]) {
    assert.equal(parsePreviewSession(raw, now), null);
  }
  assert.equal(createPreviewSession('https://example.com', now).plan, null);
  assert.equal(previewDashboardUrl('//example.com'), '/dashboard');
  assert.equal(parsePreviewSession(JSON.stringify(createPreviewSession(null, now)), now).plan, null);
});
