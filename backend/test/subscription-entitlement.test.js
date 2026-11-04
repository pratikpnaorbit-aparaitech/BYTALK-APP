import test from 'node:test';
import assert from 'node:assert/strict';
import { canUseAudio, canUseVideo, entitlementPayload, activeSubscription } from '../src/subscriptions.js';

test('Basic, Plus and Pro subscriptions can use audio calling; Free cannot', () => {
  const activeBasic = {
    subscriptionPlan: 'basic',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 86400000),
    voiceMinutesUsed: 0,
    videoCallsUsed: 0,
  };
  const activePlus = { ...activeBasic, subscriptionPlan: 'plus' };
  const activePro = { ...activeBasic, subscriptionPlan: 'pro' };
  const freeUser = { subscriptionPlan: 'free', subscriptionStatus: 'inactive' };
  const expiredBasic = { ...activeBasic, subscriptionExpiresAt: new Date(Date.now() - 1) };

  // Audio calling checks
  assert.equal(canUseAudio(activeBasic), true, 'Basic plan should allow audio calls');
  assert.equal(canUseAudio(activePlus), true, 'Plus plan should allow audio calls');
  assert.equal(canUseAudio(activePro), true, 'Pro plan should allow audio calls');
  assert.equal(canUseAudio(freeUser), false, 'Free user should not be able to make normal calls');
  assert.equal(canUseAudio(expiredBasic), false, 'Expired basic plan cannot make audio calls');

  // Video calling checks (Basic is audio-only, Plus/Pro can use video)
  assert.equal(canUseVideo(activeBasic), false, 'Basic plan is audio-only, cannot use video');
  assert.equal(canUseVideo(activePlus), true, 'Plus plan can use video');
  assert.equal(canUseVideo(activePro), true, 'Pro plan can use video');
  assert.equal(canUseVideo(freeUser), false, 'Free user cannot use video');
});

test('only active Plus and Pro subscriptions can use video', () => {
  const activePlus = {
    subscriptionPlan: 'plus',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: new Date(Date.now() + 86400000),
    videoCallsUsed: 0,
  };
  const activePro = { ...activePlus, subscriptionPlan: 'pro' };
  const expiredPlus = { ...activePlus, subscriptionExpiresAt: new Date(Date.now() - 1) };
  const cancelledPaidThrough = { ...activePlus, subscriptionStatus: 'cancelled' };
  const pendingPlus = { ...activePlus, subscriptionStatus: 'pending' };

  assert.equal(canUseVideo(activePlus), true);
  assert.equal(canUseVideo(activePro), true);
  assert.equal(canUseVideo(cancelledPaidThrough), true);
  assert.equal(canUseVideo(expiredPlus), false);
  assert.equal(canUseVideo(pendingPlus), false);
  assert.equal(canUseVideo({ subscriptionPlan: 'free', subscriptionStatus: 'inactive' }), false);
  assert.equal(entitlementPayload({ subscriptionPlan: 'free' }).plan.id, 'free');
});

test('entitlementPayload accurately reflects admin PRO grant and expiry', () => {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const adminGrantedUser = {
    subscriptionPlan: 'pro',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: expiresAt,
    subscriptionProvider: 'admin_grant',
    subscriptionDuration: '3 Months',
    usageMonth: '2026-11',
    voiceMinutesUsed: 15,
    videoCallsUsed: 2,
  };

  const payload = entitlementPayload(adminGrantedUser);
  assert.equal(payload.plan.id, 'pro');
  assert.equal(payload.status, 'active');
  assert.equal(payload.provider, 'admin_grant');
  assert.equal(canUseAudio(adminGrantedUser), true);
  assert.equal(canUseVideo(adminGrantedUser), true);
});

test('entitlementPayload reverts to free when revoked or expired', () => {
  const revokedUser = {
    subscriptionPlan: 'free',
    subscriptionStatus: 'inactive',
    subscriptionExpiresAt: null,
  };

  const payload = entitlementPayload(revokedUser);
  assert.equal(payload.plan.id, 'free');
  assert.equal(payload.status, 'inactive');
  assert.equal(canUseAudio(revokedUser), false);
  assert.equal(canUseVideo(revokedUser), false);
});
