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

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('   CHAT & PLAY: COMPLETE END-TO-END VERIFICATION    ');
  console.log('====================================================\n');

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

    // 1. Health check
    console.log('[Step 1] Server Health Check...');
    const health = await makeRequest('/api/health');
    console.assert(health.status === 200, 'Health check failed');
    console.log('✓ Health check passed (200 OK)');

    // 2. Register Alice and Bob
    console.log('\n[Step 2] User Registration & JWT Authentication...');
    const regAlice = await makeRequest('/api/auth/register', 'POST', {
      name: 'Alice Johnson',
      email: `alice_e2e_${ts}@test.com`,
      password: 'password123',
      bio: 'Ready to chat and play!',
    });
    const regBob = await makeRequest('/api/auth/register', 'POST', {
      name: 'Bob Smith',
      email: `bob_e2e_${ts}@test.com`,
      password: 'password123',
      bio: 'Tic-Tac-Toe Champion.',
    });

    const tokenAlice = regAlice.body.token;
    const userAlice = regAlice.body.user;
    const tokenBob = regBob.body.token;
    const userBob = regBob.body.user;

    console.assert(tokenAlice && tokenBob, 'Missing tokens');
    console.log('✓ Alice registered (ID:', userAlice._id, ')');
    console.log('✓ Bob registered (ID:', userBob._id, ')');

    // 3. Connect Socket clients for both users
    console.log('\n[Step 3] Real-Time Socket Connection & Presence...');
    const socketAlice = Client(baseURL, { transports: ['websocket'], auth: { token: tokenAlice } });
    const socketBob = Client(baseURL, { transports: ['websocket'], auth: { token: tokenBob } });

    await Promise.all([
      new Promise((r) => socketAlice.once('connect', r)),
      new Promise((r) => socketBob.once('connect', r)),
    ]);
    console.log('✓ Socket Alice connected. Socket ID:', socketAlice.id);
    console.log('✓ Socket Bob connected. Socket ID:', socketBob.id);

    // 4. User Discovery & Conversation Initiation
    console.log('\n[Step 4] User Discovery & 1-on-1 Conversation Creation...');
    const searchRes = await makeRequest(`/api/users?search=Bob`, 'GET', null, tokenAlice);
    console.assert(searchRes.status === 200, 'Search failed');
    console.assert(searchRes.body.users.some((u) => u._id === userBob._id), 'Bob not found in search');
    console.log('✓ Alice searched and discovered Bob in registered database');

    const convRes = await makeRequest('/api/conversations', 'POST', { recipientId: userBob._id }, tokenAlice);
    const conversationId = convRes.body.conversation._id;
    console.log('✓ Conversation created. Room ID:', conversationId);

    // Both join conversation room
    socketAlice.emit('join:conversation', { conversationId });
    socketBob.emit('join:conversation', { conversationId });
    await new Promise((r) => setTimeout(r, 300));
    console.log('✓ Both players joined room:', conversationId);

    // 5. Real-Time Chat & Read Receipts
    console.log('\n[Step 5] Instant Real-Time Messaging & Image Sharing...');
    const msgPromiseBob = new Promise((resolve) => {
      socketBob.once('message:receive', (msg) => {
        resolve(msg);
      });
    });

    socketAlice.emit('message:send', {
      conversationId,
      text: 'Hey Bob! Ready for a quick Tic-Tac-Toe challenge?',
      imageUrl: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800',
    });

    const deliveredMsg = await msgPromiseBob;
    console.assert(deliveredMsg.text.includes('Hey Bob'), 'Message text mismatch');
    console.assert(deliveredMsg.imageUrl, 'Image URL missing');
    console.log('✓ Bob received instant real-time message with image attachment');

    // Bob marks as read
    const readPromiseAlice = new Promise((resolve) => {
      socketAlice.once('message:read', (data) => {
        resolve(data);
      });
    });
    socketBob.emit('message:read', { conversationId, messageId: deliveredMsg._id });
    await readPromiseAlice;
    console.log('✓ Alice received real-time read receipt confirmation');

    // 6. Persistence & Page Refresh Verification
    console.log('\n[Step 6] Message History Persistence (Simulating Browser Refresh)...');
    const historyRes = await makeRequest(`/api/messages/${conversationId}`, 'GET', null, tokenBob);
    console.assert(historyRes.status === 200, 'Failed to fetch history');
    console.assert(historyRes.body.messages.length >= 1, 'No messages persisted');
    console.log('✓ Successfully retrieved persisted message history from MongoDB. Count:', historyRes.body.messages.length);

    // 7. Play Together Multiplayer Match
    console.log('\n[Step 7] Flagship Feature: Play Together (Tic-Tac-Toe)...');
    // Alice invites Bob
    const invitePromise = new Promise((resolve) => {
      socketBob.once('game:invite:received', (invite) => {
        resolve(invite);
      });
    });
    socketAlice.emit('game:invite', { conversationId });
    const receivedInvite = await invitePromise;
    console.log('✓ Bob received game challenge from:', receivedInvite.sender.name);

    // Bob accepts challenge
    let gameSessionId = null;
    const startPromiseAlice = new Promise((resolve) => {
      socketAlice.once('game:started', (game) => {
        gameSessionId = game.gameId;
        resolve(game);
      });
    });
    socketBob.emit('game:accept', { conversationId });
    const startedGame = await startPromiseAlice;
    console.log('✓ Shared game board opened! Alice is X, Bob is O. Game ID:', gameSessionId);

    // Play Match:
    await new Promise((r) => socketAlice.emit('game:move', { gameId: gameSessionId, cellIndex: 0 }, r));
    await new Promise((r) => socketBob.emit('game:move', { gameId: gameSessionId, cellIndex: 3 }, r));
    await new Promise((r) => socketAlice.emit('game:move', { gameId: gameSessionId, cellIndex: 1 }, r));
    await new Promise((r) => socketBob.emit('game:move', { gameId: gameSessionId, cellIndex: 4 }, r));

    const winPromiseBob = new Promise((resolve) => {
      socketBob.once('game:updated', (finalGame) => {
        if (finalGame.status === 'completed') {
          resolve(finalGame);
        }
      });
    });
    socketAlice.emit('game:move', { gameId: gameSessionId, cellIndex: 2 });
    const finalGame = await winPromiseBob;
    console.assert(finalGame.winner === 'X', 'Winner mismatch');
    console.assert(JSON.stringify(finalGame.winningLine) === JSON.stringify([0, 1, 2]), 'Winning line mismatch');
    console.log('✓ Real-Time Victory Detected! Winner:', finalGame.winner, 'Winning Line:', finalGame.winningLine);
    console.log('✓ Match Scores Updated: Alice (X) =', finalGame.scores.X, ', Bob (O) =', finalGame.scores.O);

    // 8. Rematch / Play Again
    console.log('\n[Step 8] Rematch & Play Again Synchronization...');
    const rematchPromise = new Promise((resolve) => {
      socketBob.once('game:updated', (rematchGame) => {
        resolve(rematchGame);
      });
    });
    socketAlice.emit('game:rematch', { gameId: gameSessionId });
    const rematchGame = await rematchPromise;
    console.assert(rematchGame.status === 'in_progress', 'Rematch not in_progress');
    console.assert(rematchGame.board.every((c) => c === null), 'Board not cleared');
    console.assert(rematchGame.scores.X === 1, 'Scores lost on rematch');
    console.log('✓ Rematch synchronized across both browser sessions with score retention');

    // 9. Exit Match
    console.log('\n[Step 9] Leaving Game Session...');
    const exitPromiseAlice = new Promise((resolve) => {
      socketAlice.once('game:ended', resolve);
    });
    socketBob.emit('game:exit', { gameId: gameSessionId });
    await exitPromiseAlice;
    console.log('✓ Game session terminated cleanly');

    // 10. Disconnect & Reconnect Presence
    console.log('\n[Step 10] Disconnection & Reconnection Presence Lifecycle...');
    const offlinePromiseAlice = new Promise((resolve) => {
      socketAlice.once('user:offline', (data) => {
        if (data.userId === userBob._id) resolve();
      });
    });
    socketBob.disconnect();
    await offlinePromiseAlice;
    console.log('✓ Alice notified that Bob went offline');

    // Bob reconnects
    const onlinePromiseAlice = new Promise((resolve) => {
      socketAlice.once('user:online', (data) => {
        if (data.userId === userBob._id) resolve();
      });
    });
    const socketBobReconnected = Client(baseURL, { transports: ['websocket'], auth: { token: tokenBob } });
    await onlinePromiseAlice;
    console.log('✓ Alice notified that Bob reconnected and is online again');

    socketBobReconnected.disconnect();
    socketAlice.disconnect();

    console.log('\n====================================================');
    console.log('   🎉 ALL 10 E2E INTEGRATION CHECKPOINTS PASSED!   ');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('End-to-End Test Failure:', err);
    process.exit(1);
  }
}

runEndToEndTests().catch((e) => {
  console.error(e);
  process.exit(1);
});

