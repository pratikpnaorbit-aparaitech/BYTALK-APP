import test from 'node:test';
import assert from 'node:assert/strict';
import { User } from '../src/models/User.js';

test('profile gender is limited to male and female for matchmaking', async () => {
  for (const gender of ['male', 'female']) {
    const user = new User({
      name: 'Test User',
      email: `${gender}@example.com`,
      passwordHash: 'test-hash',
      gender,
    });
    await assert.doesNotReject(user.validate());
  }

  const invalidUser = new User({
    name: 'Test User',
    email: 'invalid@example.com',
    passwordHash: 'test-hash',
    gender: 'unknown',
  });
  await assert.rejects(invalidUser.validate(), /gender/);
});
