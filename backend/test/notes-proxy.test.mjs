import test from 'node:test';
import assert from 'node:assert/strict';
import { forwardNotes } from '../../lib/notes-proxy.mjs';

test('PDF proxy rejects cross-origin, missing sessions and excessive bodies before forwarding', async () => {
  const original = global.fetch; let calls = 0;
  global.fetch = async () => { calls++; throw new Error('Unexpected request'); };
  try {
    const request = (headers, body = '{}') => new Request('https://beyondmarks.ai/api/notes', { method: 'POST', headers, body });
    assert.equal((await forwardNotes(request({ origin: 'https://evil.example', 'content-type': 'application/json' }))).status, 403);
    assert.equal((await forwardNotes(request({ origin: 'https://beyondmarks.ai', 'content-type': 'application/json' }))).status, 401);
    assert.equal((await forwardNotes(request({ origin: 'https://beyondmarks.ai', 'content-type': 'application/json', cookie: 'beyondmarks_session=test' }, 'a'.repeat(16001)))).status, 413);
    assert.equal(calls, 0);
  } finally { global.fetch = original; }
});

test('proxy forwards only the account cookie and fixed Notes destination', async () => {
  const original = global.fetch; const origin = process.env.AUTH_API_ORIGIN;
  process.env.AUTH_API_ORIGIN = 'https://dashboard.beyondmarks.ai';
  global.fetch = async (url, options) => {
    assert.equal(url, 'https://dashboard.beyondmarks.ai/api/notes');
    assert.equal(options.headers.Cookie, 'beyondmarks_session=test');
    assert.equal(options.headers.Origin, 'https://dashboard.beyondmarks.ai');
    assert.equal(options.redirect, 'error');
    return Response.json({ answer: 'Grounded answer', citations: [] });
  };
  try {
    const result = await forwardNotes(new Request('https://beyondmarks.ai/api/notes', { method: 'POST', headers: { origin: 'https://beyondmarks.ai', 'content-type': 'application/json', cookie: 'other=secret; beyondmarks_session=test' }, body: '{}' }));
    assert.equal(result.status, 200); assert.equal(result.headers.get('cache-control'), 'no-store');
  } finally { global.fetch = original; if (origin === undefined) delete process.env.AUTH_API_ORIGIN; else process.env.AUTH_API_ORIGIN = origin; }
});
