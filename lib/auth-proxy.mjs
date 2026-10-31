export const authCookie = 'beyondmarks_session';

export function authOrigin() {
  const value = process.env.AUTH_API_ORIGIN || 'https://dashboard.beyondmarks.ai';
  const url = new URL(value);
  if (url.origin !== value || (url.protocol !== 'https:' && !['127.0.0.1', 'localhost'].includes(url.hostname))) throw new Error('Invalid authentication origin.');
  return value;
}

export function sessionHeader(raw = '') {
  const token = raw.split(';').map(part => part.trim()).find(part => part.startsWith(`${authCookie}=`));
  return token && token.length <= 1200 ? token : '';
}

async function limitedBody(request) {
  const reader = request.body?.getReader();
  if (!reader) return '{}';
  const parts = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16000) { await reader.cancel(); throw new Error('Body too large.'); }
    parts.push(value);
  }
  return Buffer.concat(parts).toString('utf8');
}

export async function forwardAuth(request, suffix = '') {
  const fail = (error, status) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    const host = request.headers.get('host') || new URL(request.url).host;
    const local = ['127.0.0.1', 'localhost'].includes(new URL(`http://${host}`).hostname);
    const mutation = request.method !== 'GET';
    if (mutation) {
      const origin = new URL(request.headers.get('origin') || 'https://invalid.example');
      if (origin.host !== host || (!local && origin.protocol !== 'https:') || request.headers.get('content-type')?.split(';')[0] !== 'application/json') return fail('Invalid authentication request.', 403);
    }
    let body;
    try { body = mutation ? await limitedBody(request) : undefined; }
    catch { return fail('Authentication request is too large.', 413); }
    const origin = authOrigin();
    const response = await fetch(`${origin}/api/auth${suffix}`, {
      method: request.method, headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: sessionHeader(request.headers.get('cookie') || '') },
      body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    });
    const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    for (let cookie of response.headers.getSetCookie()) {
      if (!cookie.startsWith(`${authCookie}=`)) continue;
      if (local) cookie = cookie.replace(/;\s*Domain=[^;]+/ig, '').replace(/;\s*Secure\b/ig, '');
      headers.append('Set-Cookie', cookie);
    }
    return new Response(await response.text(), { status: response.status, headers });
  } catch { return fail('Account service is unavailable. Please try again shortly.', 503); }
}

export async function getAccount(token) {
  if (!token) return null;
  const response = await fetch(`${authOrigin()}/api/auth`, { headers: { Cookie: `${authCookie}=${token}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error('Account service unavailable.');
  return (await response.json()).user;
}
