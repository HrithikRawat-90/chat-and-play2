import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { sounds } from '../services/soundEffects';

const ChatContext = createContext(null);

const SAMPLE_MEDIA = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&q=80',
  'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=400&q=80',
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&q=80',
];

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const {
    socket,
    isConnected,
    isUserOnline,
    joinConversation,
    leaveConversation,
    sendRealtimeMessage,
    typingMap,
    startTyping,
    stopTyping,
  } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [activeTab, setActiveTab] = useState('chat');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch all conversations for logged-in user
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingConversations(true);
    try {
      const res = await api.get('/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when activeConversation changes
  const fetchMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/${conversationId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('Could not fetch messages:', err.message);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Handle conversation switching with socket room management
  const selectConversation = (conv) => {
    if (activeConversationRef.current && activeConversationRef.current._id !== conv._id) {
      leaveConversation(activeConversationRef.current._id);
    }
    setActiveConversation(conv);
    setMobileView('chat');
    joinConversation(conv._id);
    fetchMessages(conv._id);
  };

  // Socket event listener for real-time messages & conversation updates
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = (newMsg) => {
      // 1. Play incoming message chime if from opponent
      if (newMsg.senderId?._id !== user?._id && newMsg.senderId !== user?._id) {
        sounds.playMessageReceived();
      }

      // 2. If message belongs to active chat, add to feed
      if (activeConversationRef.current && activeConversationRef.current._id === newMsg.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
      }

      // 3. Update conversation list preview
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === newMsg.conversationId);
        if (index === -1) {
          fetchConversations();
          return prev;
        }

        const updatedConv = {
          ...prev[index],
          lastMessage: {
            text: newMsg.text || (newMsg.imageUrl ? '📷 Shared an image' : ''),
            sender: newMsg.senderId,
            createdAt: newMsg.createdAt,
          },
          updatedAt: newMsg.createdAt,
        };

        const remaining = prev.filter((c) => c._id !== newMsg.conversationId);
        return [updatedConv, ...remaining];
      });
    };

    const handleConversationUpdated = ({ conversationId, lastMessage, updatedAt }) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c._id === conversationId);
        if (index === -1) return prev;
        const updatedConv = {
          ...prev[index],
          lastMessage,
          updatedAt,
        };
        const remaining = prev.filter((c) => c._id !== conversationId);
        return [updatedConv, ...remaining];
      });
    };

    socket.on('message:receive', handleMessageReceive);
    socket.on('conversation:updated', handleConversationUpdated);

    return () => {
      socket.off('message:receive', handleMessageReceive);
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, fetchConversations, user?._id]);

  // Start or open conversation with another user
  const startConversationWithUser = async (recipientId) => {
    try {
      const res = await api.post('/conversations', { recipientId });
      if (res.data.success) {
        const conv = res.data.conversation;
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === conv._id);
          if (exists) return prev;
          return [conv, ...prev];
        });
        selectConversation(conv);
        setIsSearchModalOpen(false);
        return conv;
      }
    } catch (err) {
      console.error('Failed to start conversation:', err.message);
      throw err;
    }
  };

  // Send a message (Socket.IO with REST API fallback)
  const sendMessage = async (text, imageUrl = '', replyTo = null) => {
    if (!activeConversation) return;
    const conversationId = activeConversation._id;

    if (isConnected) {
      return new Promise((resolve, reject) => {
        sendRealtimeMessage(
          { conversationId, text, imageUrl, replyTo },
          (response) => {
            if (response && response.success) {
              resolve(response.message);
            } else {
              reject(new Error(response?.message || 'Socket message delivery failed'));
            }
          }
        );
      });
    } else {
      // Fallback to REST API
      const res = await api.post('/messages', {
        conversationId,
        text,
        imageUrl,
        replyTo,
      });
      if (res.data.success) {
        const newMsg = res.data.message;
        setMessages((prev) => [...prev, newMsg]);
        return newMsg;
      }
    }
  };

  // Helper to extract the contact (the other participant in a 1-on-1 conversation)
  const getOtherParticipant = (conv) => {
    if (!conv || !conv.participants) return null;
    return conv.participants.find((p) => p._id !== user?._id) || conv.participants[0];
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarOpen((prev) => !prev);
  };

  // Active typing state for current conversation
  const currentTypingUsers = activeConversation
    ? typingMap[activeConversation._id] || []
    : [];

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        isRightSidebarOpen,
        mobileView,
        activeTab,
        isSearchModalOpen,
        sampleMedia: SAMPLE_MEDIA,
        currentTypingUsers,
        isSocketConnected: isConnected,
        setMobileView,
        setActiveTab,
        setIsSearchModalOpen,
        toggleRightSidebar,
        selectConversation,
        startConversationWithUser,
        sendMessage,
        fetchConversations,
        getOtherParticipant,
        isUserOnline,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
