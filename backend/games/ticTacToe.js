
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

export const checkWinner = (board) => {
  for (const combo of WINNING_COMBINATIONS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: combo };
    }
  }
  return null;
};

export const makeMove = (game, playerId, cellIndex) => {
  if (!game) {
    return { success: false, message: 'Game not found' };
  }

  if (game.status !== 'in_progress') {
    return { success: false, message: 'Game has already ended. Click Play Again.' };
  }

  if (cellIndex < 0 || cellIndex > 8 || !Number.isInteger(cellIndex)) {
    return { success: false, message: 'Invalid cell index' };
  }

  if (game.board[cellIndex] !== null) {
    return { success: false, message: 'Cell is already occupied' };
  }

  const currentSymbol = game.turn;
  const expectedPlayer = game.players[currentSymbol];

  if (!expectedPlayer || expectedPlayer.id !== playerId.toString()) {
    return { success: false, message: `It is not your turn. Waiting for ${expectedPlayer?.name || 'opponent'}.` };
  }

  game.board[cellIndex] = currentSymbol;
  game.movesCount += 1;
  game.updatedAt = new Date();

  const winResult = checkWinner(game.board);
  if (winResult) {
    game.winner = winResult.winner;
    game.winningLine = winResult.winningLine;
    game.status = 'completed';
    game.scores[winResult.winner] += 1;
    return { success: true, game };
  }

  if (game.movesCount === 9) {
    game.winner = 'draw';
    game.winningLine = null;
    game.status = 'completed';
    game.scores.draws += 1;
    return { success: true, game };
  }

  game.turn = currentSymbol === 'X' ? 'O' : 'X';
  return { success: true, game };
};

// Keep the scores when starting a rematch.
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

