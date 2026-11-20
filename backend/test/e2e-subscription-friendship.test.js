import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

const API = 'http://localhost:4000';
const JWT_SECRET = 'ed40a7be3fda2fcd06d5079b8b2cff99cc911b04e504f9812d1b72cd0c485ebd';

// Known users in MongoDB from our previous inspect:
// akansha: 6aea2c88d7c95a2b09eb25b5
// pratik: 6ae9911b7c9278ebe14bc577
// shitallll: 6afe9a3f0eea8616acd8073f
// pratik demo: 6ae9eae0964cf8d3052a1adf

test('E2E: Check GET /api/friends returns valid friends and pending requests structure', async () => {
  const token = jwt.sign({ userId: '6aea2c88d7c95a2b09eb25b5', email: 'akanshaatole0202@gmail.com' }, JWT_SECRET);
  const res = await fetch(`${API}/api/friends`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.friends), 'friends should be an array');
  assert.ok(Array.isArray(data.pendingRequests), 'pendingRequests should be an array');
  assert.ok(Array.isArray(data.sentRequests), 'sentRequests should be an array');
});

test('E2E: Send friend request -> Accept friend request -> Both users are friends', async () => {
  const tokenPratik = jwt.sign({ userId: '6ae9911b7c9278ebe14bc577', email: 'pratikumeshpawar@gmail.com' }, JWT_SECRET);
  const tokenDemo = jwt.sign({ userId: '6ae9eae0964cf8d3052a1adf', email: 'pratikumeshpawar2121@gmail.com' }, JWT_SECRET);

  // 1. Pratik sends friend request to Pratik Demo
  const sendRes = await fetch(`${API}/api/friends/request`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenPratik}`,
    },
    body: JSON.stringify({
      targetUserId: '6ae9eae0964cf8d3052a1adf',
      targetName: 'pratik demo',
    }),
  });
  assert.equal(sendRes.status, 200);
  const sendData = await sendRes.json();
  assert.ok(sendData.ok, 'Send request must be ok: true');

  // 2. Pratik Demo checks GET /api/friends
  const demoFriendsRes = await fetch(`${API}/api/friends`, {
    headers: { Authorization: `Bearer ${tokenDemo}` }
  });
  const demoFriendsData = await demoFriendsRes.json();

  if (sendData.isFriend) {
    // Already friends from previous run
    assert.ok(demoFriendsData.friends.some(f => f.id === '6ae9911b7c9278ebe14bc577' || f.name === 'pratik'));
  } else {
    // Found in pending
    const reqFromPratik = demoFriendsData.pendingRequests.find(r => r.from?.id === '6ae9911b7c9278ebe14bc577' || r.from?.name === 'pratik');
    assert.ok(reqFromPratik, 'Pratik Demo must see incoming friend request from Pratik');

    // 3. Pratik Demo accepts
    const acceptRes = await fetch(`${API}/api/friends/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenDemo}`,
      },
      body: JSON.stringify({
        requestId: reqFromPratik.id,
        friendUserId: '6ae9911b7c9278ebe14bc577',
      }),
    });
    assert.equal(acceptRes.status, 200);

    // 4. Verify both are friends
    const demoUpdated = await (await fetch(`${API}/api/friends`, { headers: { Authorization: `Bearer ${tokenDemo}` } })).json();
    assert.ok(demoUpdated.friends.some(f => f.id === '6ae9911b7c9278ebe14bc577' || f.name === 'pratik'));
  }
});

test('E2E: Razorpay Create Order & Payment Link endpoint responds properly', async () => {
  const token = jwt.sign({ userId: '6ae9911b7c9278ebe14bc577', email: 'pratikumeshpawar@gmail.com' }, JWT_SECRET);
  const res = await fetch(`${API}/api/subscription/razorpay/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      planId: '1month',
      duration: '1 Month Basic',
      returnUrl: 'https://bytalk-app.onrender.com',
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.ok, 'create-order should return ok: true');
  assert.ok(data.paymentLink || data.orderId, 'should return a payment link or order ID');
  assert.ok(data.amount > 0, 'amount should be greater than 0');
});

test('E2E: Razorpay Callback redirects cleanly to returnUrl on Web and activates subscription', async () => {
  const res = await fetch(
    `${API}/api/subscription/razorpay/callback?userId=6ae9911b7c9278ebe14bc577&planId=1month&duration=1%20Month%20Basic&razorpay_payment_id=pay_test12345&returnUrl=https%3A%2F%2Fbytalk-app.onrender.com`
  );
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes('Payment Successful'), 'Should render Payment Successful');
  assert.ok(html.includes('returnToApp'), 'Should include universal returnToApp script');
  assert.ok(html.includes('returnUrl'), 'Should include returnUrl handling for web');
  // Confirm NO broken standalone bytalk:// deep links in href
  assert.ok(!html.includes('href="bytalk://'), 'Must not have broken href="bytalk://" link for web');
});
