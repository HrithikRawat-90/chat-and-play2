import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { sounds } from '../services/soundEffects';

const ChatContext = createContext(null);

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
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [activeTab, setActiveTab] = useState('chat');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);

  // Total unread messages across all conversations
  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title =
        totalUnreadCount > 0 ? `(${totalUnreadCount}) New Message • Chat & Play` : 'Chat & Play';
    }
  }, [totalUnreadCount]);

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

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

  // Fetch all conversations for logged-in user
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingConversations(true);
    try {
      const res = await api.get('/conversations');
      if (res.data.success) {
        setConversations(res.data.conversations);
        // Auto-select first conversation on desktop if none selected
        if (!activeConversationRef.current && res.data.conversations.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768) {
          const first = res.data.conversations[0];
          setActiveConversation(first);
          fetchMessages(first._id);
          joinConversation(first._id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch conversations:', err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated, fetchMessages, joinConversation]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Ensure active conversation room is joined whenever socket connects
  useEffect(() => {
    if (isConnected && activeConversationRef.current) {
      const convId = (activeConversationRef.current._id || activeConversationRef.current.id)?.toString();
      if (convId) {
        joinConversation(convId);
      }
    }
  }, [isConnected, joinConversation]);

  // Handle conversation switching with socket room management
  const selectConversation = (conv) => {
    if (!conv) return;
    const currentActiveId = (activeConversationRef.current?._id || activeConversationRef.current?.id)?.toString();
    const newConvId = (conv._id || conv.id)?.toString();

    if (currentActiveId && currentActiveId !== newConvId) {
      leaveConversation(currentActiveId);
    }
    setActiveConversation(conv);
    setMobileView('chat');
    // Ensure contact bio is always closed on mobile so user immediately sees chat messages
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsRightSidebarOpen(false);
    }
    // Mark this conversation unreadCount as cleared
    setConversations((prev) =>
      prev.map((c) =>
        (c._id || c.id)?.toString() === newConvId ? { ...c, unreadCount: 0 } : c
      )
    );
    joinConversation(newConvId);
    fetchMessages(newConvId);
  };

  // Socket event listener for real-time messages & conversation updates
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceive = (newMsg) => {
      const msgSenderId = (newMsg.senderId?._id || newMsg.senderId)?.toString();
      const currentUserId = (user?._id || user?.id)?.toString();
      const msgConvId = (newMsg.conversationId?._id || newMsg.conversationId)?.toString();
      const activeConvId = (activeConversationRef.current?._id || activeConversationRef.current?.id)?.toString();

      // 1. Play Apple-like incoming message chime if from another user / bot
      if (msgSenderId && msgSenderId !== currentUserId) {
        sounds.playMessageReceived();
      }

      // 2. If message belongs to active chat, add to feed
      if (activeConvId && activeConvId === msgConvId) {
        setMessages((prev) => {
          const newId = (newMsg._id || newMsg.id)?.toString();
          if (prev.some((m) => (m._id || m.id)?.toString() === newId)) return prev;
          return [...prev, newMsg];
        });
      }

      // 3. Update conversation list preview & increment unread badge if not active
      setConversations((prev) => {
        const index = prev.findIndex((c) => (c._id || c.id)?.toString() === msgConvId);
        if (index === -1) {
          // New conversation created by partner! Re-fetch immediately
          fetchConversations();
          return prev;
        }

        const isCurrentlyActive = activeConvId === msgConvId;
        const currentUnread = prev[index].unreadCount || 0;

        const updatedConv = {
          ...prev[index],
          lastMessage: {
            text: newMsg.text || (newMsg.imageUrl ? '📷 Shared an image' : ''),
            sender: newMsg.senderId,
            createdAt: newMsg.createdAt,
          },
          updatedAt: newMsg.createdAt,
          unreadCount: isCurrentlyActive ? 0 : currentUnread + 1,
        };

        const remaining = prev.filter((c) => (c._id || c.id)?.toString() !== msgConvId);
        return [updatedConv, ...remaining];
      });
    };

    const handleConversationUpdated = ({ conversationId, lastMessage, updatedAt }) => {
      const targetId = (conversationId?._id || conversationId)?.toString();
      setConversations((prev) => {
        const index = prev.findIndex((c) => (c._id || c.id)?.toString() === targetId);
        if (index === -1) {
          fetchConversations();
          return prev;
        }
        const updatedConv = {
          ...prev[index],
          lastMessage,
          updatedAt,
        };
        const remaining = prev.filter((c) => (c._id || c.id)?.toString() !== targetId);
        return [updatedConv, ...remaining];
      });
    };

    socket.on('message:receive', handleMessageReceive);
    socket.on('conversation:updated', handleConversationUpdated);

    return () => {
      socket.off('message:receive', handleMessageReceive);
      socket.off('conversation:updated', handleConversationUpdated);
    };
  }, [socket, fetchConversations, user?._id, user?.id]);

  // Start or open conversation with another user
  const startConversationWithUser = async (recipientId) => {
    try {
      const res = await api.post('/conversations', { recipientId });
      if (res.data.success) {
        const conv = res.data.conversation;
        setConversations((prev) => {
          const exists = prev.find((c) => (c._id || c.id) === (conv._id || conv.id));
          if (exists) return prev;
          return [conv, ...prev];
        });
        setActiveTab('chat');
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
  const sendMessage = async (text, imageUrl = '', replyTo = null, audioUrl = '') => {
    if (!activeConversation) return;
    const conversationId = activeConversation._id;

    if (isConnected) {
      return new Promise((resolve, reject) => {
        sendRealtimeMessage(
          { conversationId, text, imageUrl, audioUrl, replyTo },
          (response) => {
            if (response && response.success) {
              setMessages((prev) => {
                const newId = (response.message._id || response.message.id)?.toString();
                if (prev.some((m) => (m._id || m.id)?.toString() === newId)) return prev;
                return [...prev, response.message];
              });
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
        audioUrl,
        replyTo,
      });
      if (res.data.success) {
        const newMsg = res.data.message;
        setMessages((prev) => [...prev, newMsg]);
        return newMsg;
      }
    }
  };

  // Delete conversation and messages
  const deleteActiveConversation = async (conversationId) => {
    const targetId = (conversationId || activeConversation?._id || activeConversation?.id)?.toString();
    if (!targetId) return { success: false, message: 'No conversation selected' };

    try {
      const res = await api.delete(`/conversations/${targetId}`);
      if (res.data.success) {
        setConversations((prev) =>
          prev.filter((c) => (c._id || c.id)?.toString() !== targetId)
        );
        const activeId = (activeConversationRef.current?._id || activeConversationRef.current?.id)?.toString();
        if (activeId === targetId) {
          setActiveConversation(null);
          setMessages([]);
        }
        return { success: true };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      console.error('Failed to delete conversation:', err.message);
      return { success: false, message: err.response?.data?.message || err.message };
    }
  };

  // Create a new group conversation
  const createGroupConversation = async ({ groupName, groupDescription, groupAvatar }) => {
    try {
      const res = await api.post('/conversations/group', {
        groupName,
        groupDescription,
        groupAvatar,
      });
      if (res.data.success && res.data.conversation) {
        setConversations((prev) => [res.data.conversation, ...prev]);
        selectConversation(res.data.conversation);
        return { success: true, conversation: res.data.conversation };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to create group',
      };
    }
  };

  // Join group using Group Join Code
  const joinGroupWithCode = async (code) => {
    try {
      const res = await api.post('/conversations/join-group', { code });
      if (res.data.success && res.data.conversation) {
        setConversations((prev) => {
          const exists = prev.some(
            (c) => (c._id || c.id) === (res.data.conversation._id || res.data.conversation.id)
          );
          if (exists) return prev;
          return [res.data.conversation, ...prev];
        });
        selectConversation(res.data.conversation);
        return {
          success: true,
          alreadyMember: res.data.alreadyMember,
          message: res.data.message,
          conversation: res.data.conversation,
        };
      }
      return { success: false, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid group join code',
      };
    }
  };

  // Helper to extract contact or group details
  const getOtherParticipant = (conv) => {
    if (!conv) return null;
    if (conv.isGroup) {
      return {
        _id: conv._id,
        name: conv.groupName || 'Group Chat',
        profilePicture:
          conv.groupAvatar ||
          `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(
            conv.groupName || 'Group'
          )}`,
        bio: conv.groupDescription || `Group join code: ${conv.groupCode}`,
        isGroup: true,
        groupCode: conv.groupCode,
        groupAdmin: conv.groupAdmin,
        participants: conv.participants || [],
      };
    }
    if (!conv.participants) return null;
    const currentUserId = (user?._id || user?.id)?.toString();
    const participant = conv.participants.find(
        (p) => (p._id || p.id)?.toString() !== currentUserId
      ) || conv.participants[0];
    return conv.isModerationInbox && participant
      ? { ...participant, name: 'Reports from Chatbot' }
      : participant;
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
        isSettingsOpen,
        isCreateGroupOpen,
        isJoinGroupOpen,
        isOptionsMenuOpen,
        totalUnreadCount,
        currentTypingUsers,
        isSocketConnected: isConnected,
        setMobileView,
        setActiveTab,
        setIsSearchModalOpen,
        setIsSettingsOpen,
        setIsCreateGroupOpen,
        setIsJoinGroupOpen,
        setIsOptionsMenuOpen,
        toggleRightSidebar,
        selectConversation,
        startConversationWithUser,
        createGroupConversation,
        joinGroupWithCode,
        sendMessage,
        deleteActiveConversation,
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
