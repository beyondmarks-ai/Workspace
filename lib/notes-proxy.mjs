import { authOrigin, sessionHeader } from './auth-proxy.mjs';

export async function forwardNotes(request) {
  const json = (error, status) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    const host = request.headers.get('host') || new URL(request.url).host;
    const origin = new URL(request.headers.get('origin') || 'https://invalid.example');
    const local = ['127.0.0.1', 'localhost'].includes(origin.hostname);
    const type = request.headers.get('content-type')?.split(';')[0];
    if (origin.host !== host || (!local && origin.protocol !== 'https:') || !['application/pdf', 'application/json'].includes(type)) return json('Invalid PDF request.', 403);
    const cookie = sessionHeader(request.headers.get('cookie') || '');
    if (!cookie) return json('Sign in to ask about your PDF.', 401);
    const reader = request.body?.getReader();
    if (!reader) return json('Empty PDF request.', 400);
    const parts = []; let size = 0;
    const limit = type === 'application/pdf' ? 10 * 1024 * 1024 : 16000;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); return json(type === 'application/pdf' ? 'Maximum PDF size is 10 MB.' : 'Question is too large.', 413); }
      parts.push(value);
    }
    const upstream = authOrigin();
    const response = await fetch(`${upstream}/api/notes`, { method: 'POST', headers: { Origin: upstream, Cookie: cookie, 'Content-Type': type,
      ...(type === 'application/pdf' ? { 'X-PDF-Name': (request.headers.get('x-pdf-name') || 'notes.pdf').slice(0, 1800) } : {}) },
      body: Buffer.concat(parts), cache: 'no-store', redirect: 'error', signal: AbortSignal.any([request.signal, AbortSignal.timeout(65000)]) });
    if (!response.headers.get('content-type')?.includes('application/json')) return json('PDF service is temporarily unavailable.', 503);
    return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
  } catch (error) { return json(error.name === 'AbortError' ? 'Request cancelled.' : 'PDF service is temporarily unavailable. Please retry.', error.name === 'AbortError' ? 499 : 503); }
}
