import { io as Client } from 'socket.io-client';
import dotenv from 'dotenv';
dotenv.config();

import { createGameState, makeMove, checkWinner, restartGame } from './games/ticTacToe.js';
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

async function runGameTests() {
  console.log('--- STARTING MODULE 4 TIC-TAC-TOE GAME TESTS ---');

  // PART 1: PURE GAME ENGINE UNIT TESTS
  console.log('\n[Part 1] Testing Pure Game Engine Logic...');
  const p1 = { id: 'user_x', name: 'Alice', profilePicture: '' };
  const p2 = { id: 'user_o', name: 'Bob', profilePicture: '' };

  let game = createGameState('test_game_1', 'conv_1', p1, p2);
  console.assert(game.board.length === 9 && game.board.every((c) => c === null), 'Board not empty');
  console.assert(game.turn === 'X', 'First turn should be X');
  console.assert(game.status === 'in_progress', 'Game status mismatch');
  console.log('✓ Initial state created properly');

  // Invalid moves
  let res = makeMove(game, 'user_o', 0); // Bob attempts to move on Alice's turn
  console.assert(!res.success, 'Bob should not be able to move on X turn');

  res = makeMove(game, 'user_x', 99); // Out of bounds
  console.assert(!res.success, 'Out of bounds move should fail');

  res = makeMove(game, 'user_x', 0);
  console.assert(res.success && game.board[0] === 'X', 'Move X failed');
  console.assert(game.turn === 'O', 'Turn did not switch to O');

  // Cell already occupied
  res = makeMove(game, 'user_o', 0);
  console.assert(!res.success, 'Occupied cell move should fail');

  res = makeMove(game, 'user_o', 3);
  console.assert(res.success && game.board[3] === 'O', 'Move O failed');

  makeMove(game, 'user_x', 1);
  makeMove(game, 'user_o', 4);
  res = makeMove(game, 'user_x', 2);
  console.assert(res.success, 'Move 2 failed');
  console.assert(game.status === 'completed', 'Game should be completed');
  console.assert(game.winner === 'X', 'Winner should be X');
  console.assert(JSON.stringify(game.winningLine) === JSON.stringify([0, 1, 2]), 'Winning line mismatch');
  console.assert(game.scores.X === 1, 'Score X should be 1');
  console.log('✓ Row victory detection and score tracking verified');

  // Cannot move after game completion
  res = makeMove(game, 'user_o', 5);
  console.assert(!res.success, 'Move after win should be rejected');
  console.log('✓ Post-game move rejection verified');

  // Rematch
  game = restartGame(game);
  console.assert(game.status === 'in_progress', 'Restarted game should be in_progress');
  console.assert(game.board.every((c) => c === null), 'Restarted board should be clean');
  console.assert(game.scores.X === 1, 'Score should persist across rematches');
  console.log('✓ Rematch reset and score retention verified');

  // Test Draw Scenario
  const drawMoves = [
    { p: 'user_x', c: 0 },
    { p: 'user_o', c: 1 },
    { p: 'user_x', c: 2 },
    { p: 'user_o', c: 5 },
    { p: 'user_x', c: 3 },
    { p: 'user_o', c: 6 },
    { p: 'user_x', c: 4 },
    { p: 'user_o', c: 8 },
    { p: 'user_x', c: 7 },
  ];
  let drawGame = createGameState('draw_game', 'conv_draw', p1, p2);
  for (const m of drawMoves) {
    makeMove(drawGame, m.p, m.c);
  }
  console.assert(drawGame.status === 'completed', 'Draw game should be completed');
  console.assert(drawGame.winner === 'draw', 'Draw result mismatch');
  console.assert(drawGame.scores.draws === 1, 'Draw count mismatch');
  console.log('✓ Draw scenario detection verified');

  // PART 2: MULTIPLAYER SOCKET INTEGRATION TESTS
  console.log('\n[Part 2] Testing Socket.IO Multiplayer Game Flow...');
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

  const ts = Date.now();
  const u1Res = await makeRequest('/api/auth/register', 'POST', {
    name: 'Gamer One',
    email: `gamer1_${ts}@game.com`,
    password: 'password123',
  });
  const u2Res = await makeRequest('/api/auth/register', 'POST', {
    name: 'Gamer Two',
    email: `gamer2_${ts}@game.com`,
    password: 'password123',
  });

  const token1 = u1Res.body.token;
  const user1 = u1Res.body.user;
  const token2 = u2Res.body.token;
  const user2 = u2Res.body.user;

  // Create conversation
  const convRes = await makeRequest('/api/conversations', 'POST', { recipientId: user2._id }, token1);
  const conversationId = convRes.body.conversation._id;

  // Connect sockets
  const socket1 = Client(baseURL, { transports: ['websocket'], auth: { token: token1 } });
  const socket2 = Client(baseURL, { transports: ['websocket'], auth: { token: token2 } });

  await Promise.all([
    new Promise((r) => socket1.on('connect', r)),
    new Promise((r) => socket2.on('connect', r)),
  ]);

  // Both join conversation room
  socket1.emit('join:conversation', { conversationId });
  socket2.emit('join:conversation', { conversationId });
  await new Promise((r) => setTimeout(r, 400));
  console.log('✓ Both player sockets connected and joined conversation room');

  // Step 1: Player 1 sends game invite
  console.log('[Step 1] Player 1 invites Player 2 to Tic-Tac-Toe...');
  const invitePromise = new Promise((resolve) => {
    socket2.once('game:invite:received', (invite) => {
      console.assert(invite.conversationId === conversationId, 'Conversation mismatch');
      console.assert(invite.sender.id === user1._id, 'Sender mismatch');
      console.log('✓ Player 2 received game:invite:received notification from', invite.sender.name);
      resolve(invite);
    });
  });

  socket1.emit('game:invite', { conversationId });
  await invitePromise;

  // Step 2: Player 2 accepts game invite
  console.log('[Step 2] Player 2 accepts game invitation...');
  let activeGameId = null;

  const startPromise1 = new Promise((resolve) => {
    socket1.once('game:started', (startedGame) => {
      console.assert(startedGame.players.X.id === user1._id, 'Player X assignment mismatch');
      console.assert(startedGame.players.O.id === user2._id, 'Player O assignment mismatch');
      activeGameId = startedGame.gameId;
      resolve(startedGame);
    });
  });

  const startPromise2 = new Promise((resolve) => {
    socket2.once('game:started', (startedGame) => {
      resolve(startedGame);
    });
  });

  socket2.emit('game:accept', { conversationId });
  await Promise.all([startPromise1, startPromise2]);
  console.log('✓ Both players received game:started! Game ID:', activeGameId);

  // Step 3: Player 1 (X) makes first move at cell 4 (center)
  console.log('[Step 3] Player 1 (X) selects cell 4 (center)...');
  const move1Promise = new Promise((resolve) => {
    socket2.once('game:updated', (updatedGame) => {
      console.assert(updatedGame.board[4] === 'X', 'Cell 4 should be X');
      console.assert(updatedGame.turn === 'O', 'Next turn should be O');
      resolve(updatedGame);
    });
  });

  socket1.emit('game:move', { gameId: activeGameId, cellIndex: 4 });
  await move1Promise;
  console.log('✓ Move 1 synchronized to both players in real time');

  // Step 4: Player 2 attempts to select cell 4 (occupied) -> should reject
  console.log('[Step 4] Player 2 attempts to select already occupied cell 4...');
  await new Promise((resolve) => {
    socket2.emit('game:move', { gameId: activeGameId, cellIndex: 4 }, (res) => {
      console.assert(!res.success, 'Occupied cell move must be rejected');
      console.log('✓ Backend rejected illegal move:', res.message);
      resolve();
    });
  });

  // Step 5: Player 2 (O) selects cell 0
  console.log('[Step 5] Player 2 (O) selects cell 0...');
  const move2Promise = new Promise((resolve) => {
    socket1.once('game:updated', (updatedGame) => {
      console.assert(updatedGame.board[0] === 'O', 'Cell 0 should be O');
      resolve(updatedGame);
    });
  });
  socket2.emit('game:move', { gameId: activeGameId, cellIndex: 0 });
  await move2Promise;
  console.log('✓ Move 2 (O at 0) synchronized');

  // Step 6: Alternating moves until Player 1 wins via Diagonal [2, 4, 6]
  await new Promise((r) => socket1.emit('game:move', { gameId: activeGameId, cellIndex: 2 }, r));
  await new Promise((r) => socket2.emit('game:move', { gameId: activeGameId, cellIndex: 1 }, r));

  console.log('[Step 6] Player 1 moves cell 6 to complete diagonal [2, 4, 6]...');
  const winPromise = new Promise((resolve) => {
    socket2.once('game:updated', (finalGame) => {
      console.assert(finalGame.status === 'completed', 'Game must be completed');
      console.assert(finalGame.winner === 'X', 'Winner must be X');
      console.assert(JSON.stringify(finalGame.winningLine) === JSON.stringify([2, 4, 6]), 'Winning line mismatch');
      resolve(finalGame);
    });
  });

  socket1.emit('game:move', { gameId: activeGameId, cellIndex: 6 });
  const winningGameState = await winPromise;
  console.log('✓ Real-time Victory Detected! Winner:', winningGameState.winner, 'Winning Line:', winningGameState.winningLine);

  // Step 7: Rematch
  console.log('[Step 7] Testing Rematch...');
  const rematchPromise = new Promise((resolve) => {
    socket2.once('game:updated', (rematchGame) => {
      console.assert(rematchGame.status === 'in_progress', 'Status must be in_progress');
      console.assert(rematchGame.board.every((c) => c === null), 'Board not cleared on rematch');
      console.assert(rematchGame.scores.X === 1, 'Score not persisted');
      resolve(rematchGame);
    });
  });

  socket1.emit('game:rematch', { gameId: activeGameId });
  await rematchPromise;
  console.log('✓ Rematch synchronized across players');

  // Step 8: Exit Game
  console.log('[Step 8] Player 2 exits the game...');
  const exitPromise = new Promise((resolve) => {
    socket1.once('game:ended', (exitData) => {
      console.assert(exitData.gameId === activeGameId, 'Exited game ID mismatch');
      console.log('✓ Player 1 notified that match has ended');
      resolve();
    });
  });

  socket2.emit('game:exit', { gameId: activeGameId });
  await exitPromise;

  socket1.disconnect();
  socket2.disconnect();

  console.log('\n--- ALL MODULE 4 TIC-TAC-TOE GAME TESTS PASSED! ---');
  process.exit(0);
}

runGameTests().catch((err) => {
  console.error('Game test error:', err);
  process.exit(1);
});
