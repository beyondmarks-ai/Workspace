import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createClassServer } from '../src/class-server.js';
import http from 'node:http';

test('local class API streams uploads, rejects foreign origins and never overwrites finished inputs', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'class-api-test-'));
  const id = '12345678-1234-1234-1234-123456789abc';
  const job = { id, input: path.join(dir, 'source.mp4'), size: 4, status: 'uploading' };
  const engine = { get: value => { assert.equal(value, id); return job; }, summary: () => ({ id, status: job.status }),
    save: async () => {}, uploaded: async () => { job.status = 'queued'; }, status: async () => ({ jobs: [] }) };
  const server = await createClassServer(engine);
  server.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(base + '/classes', { headers: { Origin: 'https://untrusted.test' } })).status, 403);
    const foreignHostStatus = await new Promise((resolve, reject) => {
      http.get(base + '/classes', { headers: { Host: 'evil.test' } }, response => { response.resume(); resolve(response.statusCode); }).on('error', reject);
    });
    assert.equal(foreignHostStatus, 403);
    const response = await fetch(`${base}/classes/${id}/upload`, { method: 'PUT', body: 'test', headers: { Origin: 'http://localhost:3002' } });
    assert.equal(response.status, 202);
    assert.equal(await readFile(job.input, 'utf8'), 'test');
    assert.equal((await fetch(`${base}/classes/${id}/upload`, { method: 'PUT', body: 'oops' })).status, 400);
    assert.equal(await readFile(job.input, 'utf8'), 'test');
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
});
