import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('health endpoint responds', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test('upload creates a downloadable DOCX', async () => {
  const form = new FormData();
  form.append('prompt', 'Create a report matching this reference.');
  form.append('reference', new Blob(['reference'], { type: 'application/pdf' }), 'reference.pdf');

  const createResponse = await fetch(`${baseUrl}/api/jobs`, { method: 'POST', body: form });
  assert.equal(createResponse.status, 201);
  const job = await createResponse.json();
  assert.equal(job.status, 'completed');

  const downloadResponse = await fetch(`${baseUrl}${job.downloadUrl}`);
  assert.equal(downloadResponse.status, 200);
  assert.match(downloadResponse.headers.get('content-type'), /officedocument/);
  assert.ok((await downloadResponse.arrayBuffer()).byteLength > 1000);
});
