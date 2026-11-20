import test from 'node:test';
import assert from 'node:assert/strict';
import { getOnlineObjectIds } from '../src/onlineUserIds.js';

test('online user IDs exclude usernames, the current user, and disconnected sockets', () => {
  const currentUserId = '6affea112eed9473b4f9ec2c';
  const otherUserId = '6afea23c8e670f4f3d4adb44';
  const sockets = new Map([
    [currentUserId, new Set(['caller-socket'])],
    [otherUserId, new Set(['recipient-socket'])],
    ['shital', new Set(['recipient-socket'])],
    ['shital@example.com', new Set(['recipient-socket'])],
    ['6af0ea112eed9473b4f9ec2d', new Set()],
  ]);

  assert.deepEqual(getOnlineObjectIds(sockets, currentUserId), [otherUserId]);
});
