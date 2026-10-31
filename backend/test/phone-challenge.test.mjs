import test from 'node:test';
import assert from 'node:assert/strict';
import { waitForPhoneChallenge } from '../../lib/phone-challenge.mjs';

test('a stalled challenge resets and late completion cannot send an SMS', async () => {
  let resolve, cleared = false, sent = false;
  const verifier = { verify: () => new Promise(done => { resolve = done; }), clear: () => { cleared = true; } };
  const request = waitForPhoneChallenge(verifier, 5).then(() => { sent = true; });
  await assert.rejects(request, /Google verification did not finish/);
  resolve('late-google-proof');
  await Promise.resolve();
  assert.equal(cleared, true);
  assert.equal(sent, false);
});

test('a completed challenge keeps the verifier available for Firebase', async () => {
  let cleared = false;
  await waitForPhoneChallenge({ verify: async () => 'google-proof', clear: () => { cleared = true; } }, 50);
  assert.equal(cleared, false);
});
