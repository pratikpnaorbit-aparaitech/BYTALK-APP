import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalCallUserId } from '../src/callIdentity.js';

test('call participant IDs prefer the registered MongoDB ID over a username', () => {
  const id = '6afea23c8e670f4f3d4adb44';
  assert.equal(canonicalCallUserId({ _id: id, name: 'shital' }, 'shital'), id);
});

test('call participant IDs accept a valid ID fallback and reject usernames', () => {
  assert.equal(canonicalCallUserId(null, '6afea23c8e670f4f3d4adb44'), '6afea23c8e670f4f3d4adb44');
  assert.equal(canonicalCallUserId(null, 'shital'), null);
});
