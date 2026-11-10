import dotenv from 'dotenv';
dotenv.config();

import { app } from './server.js';

async function waitForServer(baseURL, maxRetries = 20) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(`${baseURL}/api/health`);
      if (res.ok) return true;
    } catch (e) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  throw new Error('Server did not start in time');
}

async function runModule2Tests() {
  console.log('--- STARTING MODULE 2 USER & CHAT TESTS ---');
  const baseURL = 'http://localhost:5000';
  await waitForServer(baseURL);

  const makeRequest = async (path, method = 'GET', data = null, token = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${baseURL}${path}`, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
    const json = await res.json();
    return { status: res.status, body: json };
  };

  try {
    const ts = Date.now();
    // 1. Create User A and User B
    console.log('[Test 1] Registering User A (Alice) and User B (Bob)...');
    const userAData = {
      name: 'Talan Septimus',
      email: `talan_${ts}@test.com`,
      password: 'password123',
      bio: 'Loving the dark purple vibes!',
    };
    const userBData = {
      name: 'Aubrey Webb',
      email: `aubrey_${ts}@test.com`,
      password: 'password123',
      bio: 'Always ready to play Tic-Tac-Toe!',
    };

    const resA = await makeRequest('/api/auth/register', 'POST', userAData);
    const tokenA = resA.body.token;
    const userA = resA.body.user;

    const resB = await makeRequest('/api/auth/register', 'POST', userBData);
    const tokenB = resB.body.token;
    const userB = resB.body.user;

    console.assert(tokenA && tokenB, 'Failed to register test users');
    console.log('✓ Both users registered successfully');

    // 2. User A searches for User B
    console.log('[Test 2] User A searches for User B...');
    const searchRes = await makeRequest(`/api/users?search=Aubrey`, 'GET', null, tokenA);
    console.assert(searchRes.status === 200, `Search failed with ${searchRes.status}`);
    console.assert(searchRes.body.users.some((u) => u._id === userB._id), 'User B not found in search results');
    console.log('✓ User search working: found', searchRes.body.users.length, 'users');

    // 3. User A creates conversation with User B
    console.log('[Test 3] User A creates conversation with User B...');
    const createConvRes = await makeRequest('/api/conversations', 'POST', { recipientId: userB._id }, tokenA);
    console.assert(createConvRes.status === 200, `Create conversation failed: ${JSON.stringify(createConvRes.body)}`);
    const conversationId = createConvRes.body.conversation._id;
    console.assert(conversationId, 'Conversation ID missing');
    console.log('✓ Conversation created. ID:', conversationId);

    // 4. Duplicate create conversation returns existing conversation
    console.log('[Test 4] Re-creating conversation returns existing conversation...');
    const dupConvRes = await makeRequest('/api/conversations', 'POST', { recipientId: userB._id }, tokenA);
    console.assert(dupConvRes.body.conversation._id === conversationId, 'Should return same conversation ID');
    console.log('✓ Idempotent conversation lookup verified');

    // 5. User A lists conversations
    console.log('[Test 5] User A lists conversations...');
    const listConvRes = await makeRequest('/api/conversations', 'GET', null, tokenA);
    console.assert(listConvRes.status === 200, 'Failed to fetch conversations');
    console.assert(listConvRes.body.conversations.length >= 1, 'Conversation not listed');
    console.log('✓ User A has', listConvRes.body.conversations.length, 'conversation(s)');

    // 6. User A sends text message to User B
    console.log('[Test 6] User A sends text message...');
    const sendMsgRes = await makeRequest('/api/messages', 'POST', {
      conversationId,
      text: 'Love it! Great board!',
    }, tokenA);
    console.assert(sendMsgRes.status === 201, `Send message failed: ${JSON.stringify(sendMsgRes.body)}`);
    console.assert(sendMsgRes.body.message.text === 'Love it! Great board!', 'Message text mismatch');
    console.log('✓ Message sent successfully:', sendMsgRes.body.message.text);

    // 7. User B sends reply message with image
    console.log('[Test 7] User B sends reply message with image...');
    const sendImgRes = await makeRequest('/api/messages', 'POST', {
      conversationId,
      text: 'Check out this sunset preview!',
      imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    }, tokenB);
    console.assert(sendImgRes.status === 201, 'Send image message failed');
    console.log('✓ Message with image sent successfully');

    // 8. User A fetches messages for the conversation
    console.log('[Test 8] User A fetches message history...');
    const getMsgsRes = await makeRequest(`/api/messages/${conversationId}`, 'GET', null, tokenA);
    console.assert(getMsgsRes.status === 200, 'Fetch messages failed');
    console.assert(getMsgsRes.body.messages.length === 2, `Expected 2 messages, got ${getMsgsRes.body.messages.length}`);
    console.log('✓ Successfully retrieved message history:', getMsgsRes.body.messages.length, 'messages');

    // 9. Unauthorized third-party user cannot access messages
    console.log('[Test 9] Unauthorized third user blocked from conversation messages...');
    const userCData = {
      name: 'Intruder User',
      email: `intruder_${ts}@test.com`,
      password: 'password123',
    };
    const resC = await makeRequest('/api/auth/register', 'POST', userCData);
    const tokenC = resC.body.token;

    const unauthRes = await makeRequest(`/api/messages/${conversationId}`, 'GET', null, tokenC);
    console.assert(unauthRes.status === 403, `Expected 403 Forbidden, got ${unauthRes.status}`);
    console.log('✓ Unauthorized access successfully prevented (403)');

    console.log('\n--- ALL MODULE 2 USER & CHAT TESTS PASSED! ---');
    process.exit(0);
  } catch (err) {
    console.error('Module 2 Test error:', err);
    process.exit(1);
  }
}

runModule2Tests();

