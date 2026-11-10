// Pure Tic-Tac-Toe Game Engine

export const WINNING_COMBINATIONS = [
  [0, 1, 2], // Row 1
  [3, 4, 5], // Row 2
  [6, 7, 8], // Row 3
  [0, 3, 6], // Col 1
  [1, 4, 7], // Col 2
  [2, 5, 8], // Col 3
  [0, 4, 8], // Diagonal top-left to bottom-right
  [2, 4, 6], // Diagonal top-right to bottom-left
];

// Create new initial game state
export const createGameState = (gameId, conversationId, playerX, playerO) => {
  return {
    gameId,
    conversationId,
    players: {
      X: {
        id: playerX.id.toString(),
        name: playerX.name,
        profilePicture: playerX.profilePicture,
      },
      O: {
        id: playerO.id.toString(),
        name: playerO.name,
        profilePicture: playerO.profilePicture,
      },
    },
    scores: {
      X: 0,
      O: 0,
      draws: 0,
    },
    board: Array(9).fill(null),
    turn: 'X', // 'X' always makes first move
    status: 'in_progress', // 'in_progress' | 'completed'
    winner: null, // null | 'X' | 'O' | 'draw'
    winningLine: null, // null | [index1, index2, index3]
    movesCount: 0,
    updatedAt: new Date(),
  };
};

// Check if current board has a winner
export const checkWinner = (board) => {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: combo };
    }
  }
  return null;
};

// Process player move with full backend validation
export const makeMove = (game, playerId, cellIndex) => {
  if (!game) {
    return { success: false, message: 'Game not found' };
  }

  // 1. Verify game is in progress
  if (game.status !== 'in_progress') {
    return { success: false, message: 'Game has already ended. Click Play Again.' };
  }

  // 2. Verify cell bounds
  if (cellIndex < 0 || cellIndex > 8 || !Number.isInteger(cellIndex)) {
    return { success: false, message: 'Invalid cell index' };
  }

  // 3. Verify cell is empty
  if (game.board[cellIndex] !== null) {
    return { success: false, message: 'Cell is already occupied' };
  }

  // 4. Verify player whose turn it is
  const currentSymbol = game.turn;
  const expectedPlayer = game.players[currentSymbol];

  if (!expectedPlayer || expectedPlayer.id !== playerId.toString()) {
    return { success: false, message: `It is not your turn. Waiting for ${expectedPlayer?.name || 'opponent'}.` };
  }

  // 5. Place marker
  game.board[cellIndex] = currentSymbol;
  game.movesCount += 1;
  game.updatedAt = new Date();

  // 6. Check for victory
  const winResult = checkWinner(game.board);
  if (winResult) {
    game.winner = winResult.winner;
    game.winningLine = winResult.winningLine;
    game.status = 'completed';
    game.scores[winResult.winner] += 1;
    return { success: true, game };
  }

  // 7. Check for draw
  if (game.movesCount === 9) {
    game.winner = 'draw';
    game.winningLine = null;
    game.status = 'completed';
    game.scores.draws += 1;
    return { success: true, game };
  }

  // 8. Toggle turn
  game.turn = currentSymbol === 'X' ? 'O' : 'X';
  return { success: true, game };
};

// Reset board for a rematch (retaining scores)
export const restartGame = (game) => {
  if (!game) return null;

  game.board = Array(9).fill(null);
  game.movesCount = 0;
  game.winner = null;
  game.winningLine = null;
  game.status = 'in_progress';
  game.turn = 'X'; // Reset to X
  game.updatedAt = new Date();

  return game;
};

