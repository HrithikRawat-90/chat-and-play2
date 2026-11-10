import { io as Client } from 'socket.io-client';
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

async function runSocketTests() {
  console.log('--- STARTING MODULE 3 REAL-TIME SOCKET TESTS ---');
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
    // 1. Register 2 users via REST to get JWTs
    console.log('[Test 1] Registering User 1 and User 2...');
    const user1Res = await makeRequest('/api/auth/register', 'POST', {
      name: 'Socket Tester Alpha',
      email: `alpha_${ts}@socket.com`,
      password: 'password123',
    });
    const user2Res = await makeRequest('/api/auth/register', 'POST', {
      name: 'Socket Tester Beta',
      email: `beta_${ts}@socket.com`,
      password: 'password123',
    });

    const token1 = user1Res.body.token;
    const user1 = user1Res.body.user;
    const token2 = user2Res.body.token;
    const user2 = user2Res.body.user;

    console.log('✓ Users registered. Alpha:', user1._id, 'Beta:', user2._id);

    // 2. Create conversation between User 1 and User 2
    console.log('[Test 2] Creating conversation...');
    const convRes = await makeRequest('/api/conversations', 'POST', { recipientId: user2._id }, token1);
    const conversationId = convRes.body.conversation._id;
    console.log('✓ Conversation created. ID:', conversationId);

    // 3. Connect unauthenticated socket client -> expect connect_error
    console.log('[Test 3] Testing unauthenticated socket connection rejection...');
    const badSocket = Client(baseURL, {
      transports: ['websocket'],
      auth: {},
    });

    await new Promise((resolve) => {
      badSocket.on('connect_error', (err) => {
        console.log('✓ Bad socket rejected as expected:', err.message);
        badSocket.disconnect();
        resolve();
      });
      badSocket.on('connect', () => {
        throw new Error('Unauthenticated socket should NOT connect');
      });
    });

    // 4. Connect Authenticated Socket A (Alpha)
    console.log('[Test 4] Connecting Authenticated Socket A...');
    const socketA = Client(baseURL, {
      transports: ['websocket'],
      auth: { token: token1 },
    });

    await new Promise((resolve, reject) => {
      socketA.on('connect', resolve);
      socketA.on('connect_error', reject);
    });
    console.log('✓ Socket A connected successfully. ID:', socketA.id);

    // 5. Connect Authenticated Socket B (Beta) & Verify Presence
    console.log('[Test 5] Connecting Authenticated Socket B & verifying presence...');
    const socketB = Client(baseURL, {
      transports: ['websocket'],
      auth: { token: token2 },
    });

    const presencePromise = new Promise((resolve) => {
      socketA.on('user:online', (data) => {
        if (data.userId === user2._id) {
          console.log('✓ Socket A received presence notification for Socket B (online)');
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      socketB.on('connect', resolve);
      socketB.on('connect_error', reject);
    });
    console.log('✓ Socket B connected successfully. ID:', socketB.id);

    await presencePromise;

    // 6. Both sockets join conversation room
    console.log('[Test 6] Joining private conversation room...');
    socketA.emit('join:conversation', { conversationId });
    socketB.emit('join:conversation', { conversationId });
    await new Promise((r) => setTimeout(r, 500));
    console.log('✓ Both sockets joined room:', conversationId);

    // 7. Test typing indicator
    console.log('[Test 7] Testing typing indicator synchronization...');
    const typingPromise = new Promise((resolve) => {
      socketB.on('typing:start', (data) => {
        console.assert(data.conversationId === conversationId, 'Conversation ID mismatch in typing');
        console.assert(data.userId === user1._id, 'Typing user ID mismatch');
        console.log('✓ Socket B received typing:start from Alpha:', data.userName);
        resolve();
      });
    });

    socketA.emit('typing:start', { conversationId });
    await typingPromise;

    // 8. Test real-time message sending and receiving
    console.log('[Test 8] Testing real-time message delivery...');
    const messageText = 'Hello Socket World! This is real-time messaging!';

    const receivePromiseB = new Promise((resolve) => {
      socketB.on('message:receive', (msg) => {
        console.assert(msg.text === messageText, 'Message text mismatch on Socket B');
        console.assert(msg.conversationId === conversationId, 'Conversation ID mismatch');
        console.log('✓ Socket B received real-time message:', msg.text);
        resolve(msg);
      });
    });

    socketA.emit('message:send', {
      conversationId,
      text: messageText,
    });

    const receivedMsg = await receivePromiseB;

    // 9. Verify message was persisted in MongoDB
    console.log('[Test 9] Verifying message persistence via REST API...');
    const msgsRes = await makeRequest(`/api/messages/${conversationId}`, 'GET', null, token1);
    const foundMsg = msgsRes.body.messages.find((m) => m._id === receivedMsg._id);
    console.assert(foundMsg, 'Message not found in DB history');
    console.log('✓ Message verified in MongoDB message collection. Count:', msgsRes.body.messages.length);

    // 10. Test Read Receipt
    console.log('[Test 10] Testing read receipt delivery...');
    const readPromise = new Promise((resolve) => {
      socketA.on('message:read', (data) => {
        console.assert(data.messageId === receivedMsg._id, 'Message ID mismatch in read receipt');
        console.log('✓ Socket A received message:read confirmation for message:', data.messageId);
        resolve();
      });
    });

    socketB.emit('message:read', {
      conversationId,
      messageId: receivedMsg._id,
    });
    await readPromise;

    // 11. Test Disconnect and user:offline presence broadcast
    console.log('[Test 11] Testing disconnect and offline presence broadcast...');
    const offlinePromise = new Promise((resolve) => {
      socketA.on('user:offline', (data) => {
        if (data.userId === user2._id) {
          console.log('✓ Socket A received user:offline notification for Beta');
          resolve();
        }
      });
    });

    socketB.disconnect();
    await offlinePromise;

    socketA.disconnect();
    console.log('\n--- ALL MODULE 3 REAL-TIME SOCKET TESTS PASSED! ---');
    process.exit(0);
  } catch (err) {
    console.error('Socket Test Error:', err);
    process.exit(1);
  }
}

runSocketTests();

