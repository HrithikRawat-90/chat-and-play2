import { createGameState, makeMove, restartGame } from './ticTacToe.js';

const activeGames = new Map(); // gameId -> game
const conversationGames = new Map(); // conversationId -> gameId
const pendingInvites = new Map(); // conversationId -> { sender, recipient, timestamp }

export const gameManager = {
  createInvite(conversationId, sender, recipient) {
    const invite = {
      conversationId,
      sender: {
        id: sender._id.toString(),
        name: sender.name,
        profilePicture: sender.profilePicture,
      },
      recipient: {
        id: recipient._id.toString(),
        name: recipient.name,
        profilePicture: recipient.profilePicture,
      },
      createdAt: new Date(),
    };
    pendingInvites.set(conversationId, invite);
    return invite;
  },

  getInvite(conversationId) {
    return pendingInvites.get(conversationId) || null;
  },

  clearInvite(conversationId) {
    pendingInvites.delete(conversationId);
  },

  startNewGame(conversationId, playerX, playerO) {
    const gameId = `ttt_${conversationId}_${Date.now()}`;
    const newGame = createGameState(gameId, conversationId, playerX, playerO);

    activeGames.set(gameId, newGame);
    conversationGames.set(conversationId, gameId);
    pendingInvites.delete(conversationId);

    return newGame;
  },

  getGame(gameId) {
    return activeGames.get(gameId) || null;
  },

  getGameByConversation(conversationId) {
    const gameId = conversationGames.get(conversationId);
    if (!gameId) return null;
    return activeGames.get(gameId) || null;
  },

  playMove(gameId, playerId, cellIndex) {
    const game = activeGames.get(gameId);
    if (!game) {
      return { success: false, message: 'Game session not found' };
    }
    return makeMove(game, playerId, cellIndex);
  },

  rematch(gameId) {
    const game = activeGames.get(gameId);
    if (!game) return null;
    return restartGame(game);
  },

  endGame(gameId) {
    const game = activeGames.get(gameId);
    if (game) {
      conversationGames.delete(game.conversationId);
      activeGames.delete(gameId);
      return game;
    }
    return null;
  },

  endGameByConversation(conversationId) {
    const gameId = conversationGames.get(conversationId);
    if (gameId) {
      return this.endGame(gameId);
    }
    return null;
  },
};

