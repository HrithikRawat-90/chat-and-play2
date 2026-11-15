import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { createSocketConnection } from '../socket/socket';
import { sendMessageWithAck } from '../socket/sendMessage';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  // Map of conversationId -> Set of userNames currently typing
  const [typingMap, setTypingMap] = useState({});

  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && token) {
      const newSocket = createSocketConnection(token);
      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('[Socket] Connected to server as:', user?.name, newSocket.id);
        setIsConnected(true);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
        setIsConnected(false);
      });

      // Presence: Initial list of online users
      newSocket.on('users:online:list', (userIds) => {
        setOnlineUsers(new Set(userIds));
      });

      // Presence: Individual user came online
      newSocket.on('user:online', ({ userId }) => {
        setOnlineUsers((prev) => new Set([...prev, userId]));
      });

      // Presence: Individual user went offline
      newSocket.on('user:offline', ({ userId }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      });

      // Typing indicators
      newSocket.on('typing:start', ({ conversationId, userId, userName }) => {
        setTypingMap((prev) => {
          const currentTypers = prev[conversationId] || [];
          if (!currentTypers.some((t) => t.userId === userId)) {
            return {
              ...prev,
              [conversationId]: [...currentTypers, { userId, userName }],
            };
          }
          return prev;
        });
      });

      newSocket.on('typing:stop', ({ conversationId, userId }) => {
        setTypingMap((prev) => {
          const currentTypers = prev[conversationId] || [];
          return {
            ...prev,
            [conversationId]: currentTypers.filter((t) => t.userId !== userId),
          };
        });
      });

      newSocket.connect();
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        socketRef.current = null;
      };
    } else {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
        setOnlineUsers(new Set());
      }
    }
  }, [isAuthenticated, token, user?.name]);

  const joinConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('join:conversation', { conversationId });
    }
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('leave:conversation', { conversationId });
    }
  }, []);

  const sendRealtimeMessage = useCallback((payload, callback) => {
    sendMessageWithAck(socketRef.current, payload, callback);
  }, []);

  const startTyping = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:start', { conversationId });
    }
  }, []);

  const stopTyping = useCallback((conversationId) => {
    if (socketRef.current && conversationId) {
      socketRef.current.emit('typing:stop', { conversationId });
    }
  }, []);

  const markMessageRead = useCallback((conversationId, messageId) => {
    if (socketRef.current && conversationId && messageId) {
      socketRef.current.emit('message:read', { conversationId, messageId });
    }
  }, []);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      return onlineUsers.has(userId.toString());
    },
    [onlineUsers]
  );

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        typingMap,
        isUserOnline,
        joinConversation,
        leaveConversation,
        sendRealtimeMessage,
        startTyping,
        stopTyping,
        markMessageRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

