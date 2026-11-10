import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

const GameContext = createContext(null);

export const GameProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();

  const [activeGame, setActiveGame] = useState(null);
  const [incomingInvite, setIncomingInvite] = useState(null);
  const [outgoingInvite, setOutgoingInvite] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Register socket listeners for gameplay
  useEffect(() => {
    if (!socket) return;

    const handleInviteReceived = (invite) => {
      console.log('[Game] Invitation received:', invite);
      const currentUserId = (user?._id || user?.id)?.toString();
      const senderId = (invite.sender.id || invite.sender._id)?.toString();
      if (senderId !== currentUserId) {
        setIncomingInvite(invite);
      }
    };

    const handleGameStarted = (game) => {
      console.log('[Game] Match started:', game);
      setActiveGame(game);
      setIncomingInvite(null);
      setOutgoingInvite(null);
      setErrorMessage('');
    };

    const handleGameUpdated = (updatedGame) => {
      console.log('[Game] State updated:', updatedGame);
      setActiveGame(updatedGame);
      setErrorMessage('');
    };

    const handleGameRejected = ({ rejectedBy }) => {
      setOutgoingInvite(null);
      setIncomingInvite(null);
      setErrorMessage(`${rejectedBy || 'Opponent'} declined the game challenge.`);
      setTimeout(() => setErrorMessage(''), 5000);
    };

    const handleGameEnded = ({ exitedBy }) => {
      setActiveGame(null);
      setErrorMessage(`${exitedBy || 'Opponent'} left the game session.`);
      setTimeout(() => setErrorMessage(''), 5000);
    };

    socket.on('game:invite:received', handleInviteReceived);
    socket.on('game:started', handleGameStarted);
    socket.on('game:updated', handleGameUpdated);
    socket.on('game:rejected', handleGameRejected);
    socket.on('game:ended', handleGameEnded);

    return () => {
      socket.off('game:invite:received', handleInviteReceived);
      socket.off('game:started', handleGameStarted);
      socket.off('game:updated', handleGameUpdated);
      socket.off('game:rejected', handleGameRejected);
      socket.off('game:ended', handleGameEnded);
    };
  }, [socket, user?._id]);

  // Send an invitation to conversation partner
  const sendInvite = useCallback(
    (conversationId) => {
      if (!socket || !isConnected || !conversationId) return;
      setErrorMessage('');
      setOutgoingInvite({ conversationId, createdAt: new Date() });

      socket.emit('game:invite', { conversationId }, (res) => {
        if (!res?.success) {
          setOutgoingInvite(null);
          setErrorMessage(res?.message || 'Could not send invitation.');
        }
      });
    },
    [socket, isConnected]
  );

  // Accept incoming challenge
  const acceptInvite = useCallback(
    (conversationId) => {
      if (!socket || !conversationId) return;
      socket.emit('game:accept', { conversationId }, (res) => {
        if (res?.success && res?.game) {
          setActiveGame(res.game);
          setIncomingInvite(null);
          setOutgoingInvite(null);
          setErrorMessage('');
        } else if (!res?.success) {
          setErrorMessage(res?.message || 'Could not accept game.');
        }
      });
    },
    [socket]
  );

  // Decline challenge
  const rejectInvite = useCallback(
    (conversationId) => {
      if (!socket || !conversationId) return;
      socket.emit('game:reject', { conversationId });
      setIncomingInvite(null);
    },
    [socket]
  );

  // Make a move
  const makeMove = useCallback(
    (gameId, cellIndex) => {
      if (!socket || !gameId) return;
      socket.emit('game:move', { gameId, cellIndex }, (res) => {
        if (!res?.success) {
          setErrorMessage(res?.message || 'Illegal move');
          setTimeout(() => setErrorMessage(''), 3000);
        }
      });
    },
    [socket]
  );

  // Request Rematch / Play Again
  const rematch = useCallback(
    (gameId) => {
      if (!socket || !gameId) return;
      socket.emit('game:rematch', { gameId });
    },
    [socket]
  );

  // Exit match
  const exitGame = useCallback(
    (gameId) => {
      if (!socket || !gameId) return;
      socket.emit('game:exit', { gameId });
      setActiveGame(null);
    },
    [socket]
  );

  const cancelOutgoingInvite = useCallback(() => {
    setOutgoingInvite(null);
  }, []);

  return (
    <GameContext.Provider
      value={{
        activeGame,
        incomingInvite,
        outgoingInvite,
        errorMessage,
        sendInvite,
        acceptInvite,
        rejectInvite,
        makeMove,
        rematch,
        exitGame,
        cancelOutgoingInvite,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

