import test from 'node:test';
import assert from 'node:assert/strict';
import { forwardAuth, sessionHeader } from '../../lib/auth-proxy.mjs';

test('proxy rejects cross-site mutations and forwards only the account cookie', async () => {
  assert.equal(sessionHeader('unrelated=private; beyondmarks_session=signed-token; other=value'), 'beyondmarks_session=signed-token');
  assert.equal(sessionHeader('workspace-auth-preview=fake'), '');
  const response = await forwardAuth(new Request('https://beyondmarks.ai/api/auth', { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: '{}' }));
  assert.equal(response.status, 403);
  const large = await forwardAuth(new Request('https://beyondmarks.ai/api/auth', { method: 'POST', headers: { origin: 'https://beyondmarks.ai', 'content-type': 'application/json' }, body: 'x'.repeat(16001) }));
  assert.equal(large.status, 413);
});

test('proxy handles the public Host behind Next and preserves secure shared cookies', async t => {
  const previous = process.env.AUTH_API_ORIGIN;
  process.env.AUTH_API_ORIGIN = 'https://dashboard.beyondmarks.ai';
  t.after(() => { if (previous === undefined) delete process.env.AUTH_API_ORIGIN; else process.env.AUTH_API_ORIGIN = previous; });
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://dashboard.beyondmarks.ai/api/auth');
    assert.equal(options.headers.Origin, 'https://dashboard.beyondmarks.ai');
    assert.equal(options.headers.Cookie, 'beyondmarks_session=signed');
    return new Response('{"user":{"id":"student"}}', { headers: { 'set-cookie': 'beyondmarks_session=next; Domain=beyondmarks.ai; Path=/; HttpOnly; Secure; SameSite=Lax' } });
  });
  const request = new Request('http://localhost:3002/api/auth', { method: 'POST', headers: { host: 'beyondmarks.ai', origin: 'https://beyondmarks.ai', cookie: 'private=unrelated; beyondmarks_session=signed', 'content-type': 'application/json' }, body: '{}' });
  const response = await forwardAuth(request);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('set-cookie'), /Domain=beyondmarks.ai/);
  assert.match(response.headers.get('set-cookie'), /Secure/);
});
