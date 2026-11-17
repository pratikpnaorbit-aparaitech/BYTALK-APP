import test from 'node:test';
import assert from 'node:assert/strict';
import { Friendship } from '../src/models/Friendship.js';

test('Friendship model schema supports pending and accepted statuses', () => {
  const pending = new Friendship({
    user1: 'userA',
    user2: 'userB',
    requesterId: 'userA',
    status: 'pending',
  });
  assert.equal(pending.status, 'pending');
  assert.equal(pending.user1, 'userA');
  assert.equal(pending.user2, 'userB');

  pending.status = 'accepted';
  assert.equal(pending.status, 'accepted');
});

test('Friend status check allows messaging between accepted friends', () => {
  const areFriends = (friendship) => friendship && friendship.status === 'accepted';

  const accepted = { user1: 'user1', user2: 'user2', status: 'accepted' };
  const pending = { user1: 'user1', user2: 'user2', status: 'pending' };

  assert.equal(areFriends(accepted), true, 'Accepted friends should be allowed to chat');
  assert.equal(areFriends(pending), false, 'Pending request should not yet be full friends');
});
