import test from 'node:test';
import assert from 'node:assert/strict';
import { nationalPhoneNumber } from '../../lib/indian-phone.mjs';

test('accepts national numbers and pasted Indian country codes without duplicating +91', () => {
  for (const value of ['9876543210', '+91 98765 43210', '919876543210', '0091 (98765) 43210']) {
    assert.equal(nationalPhoneNumber(value), '9876543210');
  }
  assert.equal(nationalPhoneNumber('9123456789'), '9123456789');
  assert.equal(nationalPhoneNumber(''), '');
  for (const value of ['+44 9876543210', '98765abc10', '98765432101']) {
    assert.equal(/^[6-9][0-9]{9}$/.test(nationalPhoneNumber(value)), false);
  }
});
