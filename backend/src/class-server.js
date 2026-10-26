import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createWriteStream } from 'node:fs';
import { rename, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const liveRoot = path.resolve(workspace, '../Live Class');
const studyRoot = path.resolve(workspace, '../Ssc/.local-uploads');
const { createClassPipeline } = await import(pathToFileURL(path.join(liveRoot, 'lib/class-pipeline.js')));
const { RESERVE_BYTES, freeBytes } = await import(pathToFileURL(path.join(liveRoot, 'lib/pipeline-media.js')));

export async function createClassServer(engine) {
  const activeUploads = new Set();
  return http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
    const origin = req.headers.origin;
    // The admin is local-only; block browser cross-site requests and DNS rebinding.
    if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(req.headers.host || '') || (origin && !['http://localhost:3002', 'http://127.0.0.1:3002'].includes(origin))) return send(403, { error: 'Use the local Workspace admin dashboard.' });
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    const url = new URL(req.url, 'http://localhost');
    let uploading;
    try {
      if (req.method === 'GET' && url.pathname === '/classes') return send(200, await engine.status());
      if (req.method === 'POST' && url.pathname === '/classes') {
        let json = '';
        for await (const chunk of req) { json += chunk; if (json.length > 8192) throw new Error('Request is too large.'); }
        return send(201, await engine.create(JSON.parse(json)));
      }
      const match = url.pathname.match(/^\/classes\/([a-f0-9-]{36})\/(upload|retry)$/);
      if (!match) return send(404, { error: 'Not found.' });
      const job = engine.get(match[1]);
      if (match[2] === 'retry' && req.method === 'POST') { await engine.retry(job.id); return send(202, engine.summary(job)); }
      if (match[2] !== 'upload' || req.method !== 'PUT') return send(405, { error: 'Method not allowed.' });
      if (job.status !== 'uploading' || activeUploads.has(job.id)) throw new Error('This upload is already running or finished.');
      activeUploads.add(job.id); uploading = job;
      let total = 0; let sinceCheck = 0;
      const partial = job.input + '.partial';
      await pipeline(req, async function* (chunks) {
        for await (const chunk of chunks) {
          total += chunk.length; sinceCheck += chunk.length;
          if (total > job.size) throw new Error('Upload is larger than declared.');
          if (sinceCheck >= 64 * 1024 * 1024) {
            if (await freeBytes(path.dirname(partial)) < RESERVE_BYTES) throw new Error('Upload stopped before filling the disk.');
            sinceCheck = 0;
          }
          yield chunk;
        }
      }, createWriteStream(partial, { flags: 'wx' }));
      if (total !== job.size) throw new Error('Upload was incomplete. Upload the original file again.');
      await rename(partial, job.input);
      await engine.uploaded(job.id);
      return send(202, engine.summary(job));
    } catch (error) {
      if (uploading) {
        uploading.status = 'failed'; uploading.error = error.message;
        await engine.save(uploading);
        await unlink(uploading.input + '.partial').catch(() => {});
      }
      if (!res.destroyed) send(400, { error: error.message });
    } finally { if (uploading) activeUploads.delete(uploading.id); }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.loadEnvFile(path.join(liveRoot, '.env.local'));
  if (!process.env.SARVAM_API_KEY?.trim()) throw new Error('Configure the existing Live Class Sarvam key first.');
  const engine = await createClassPipeline({ root: path.join(liveRoot, 'pipeline'), studyRoot });
  const server = await createClassServer(engine);
  server.requestTimeout = 0; // Large local uploads are streamed; validate bytes and free space instead of a fixed duration.
  server.listen(4318, '127.0.0.1', () => console.log('Class pipeline listening at http://127.0.0.1:4318'));
}
