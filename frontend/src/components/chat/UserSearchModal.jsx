import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';
import { Search, X, MessageSquare, User, Loader2, Sparkles } from 'lucide-react';

const UserSearchModal = () => {
  const { isSearchModalOpen, setIsSearchModalOpen, startConversationWithUser, isUserOnline } = useChat();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startingChatId, setStartingChatId] = useState(null);

  useEffect(() => {
    if (!isSearchModalOpen) return;

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users?search=${encodeURIComponent(searchTerm)}`);
        if (res.data.success) {
          setUsers(res.data.users);
        }
      } catch (err) {
        console.error('Error searching users:', err.message);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const handleStartChat = async (userId) => {
    setStartingChatId(userId);
    try {
      await startConversationWithUser(userId);
    } catch (err) {
      console.error(err);
    } finally {
      setStartingChatId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#130e26] border border-purple-900/40 rounded-2xl shadow-2xl shadow-purple-950/60 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h3 className="font-semibold text-white text-base">New Conversation</h3>
          </div>
          <button
            onClick={() => setIsSearchModalOpen(false)}
            className="p-1 rounded-lg text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-purple-900/20">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400/60" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search users by name or email..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-[#0b0818] border border-purple-900/40 rounded-xl text-white placeholder-purple-300/30 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* User Search Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 text-purple-400">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs text-purple-300/60">Searching registered users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-purple-300/50 text-xs">
              {searchTerm ? 'No users found matching your search.' : 'No other registered users yet.'}
            </div>
          ) : (
            users.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#171131] hover:bg-[#1d163d] border border-purple-900/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={u.profilePicture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.name)}`}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover bg-purple-950/60"
                    />
                    {Boolean(u.isBot || u.name === 'Chatbot' || (u._id && isUserOnline(u._id)) || u.isOnline) && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#171131]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-medium text-white truncate">{u.name}</h4>
                    </div>
                    <p className="text-xs text-purple-300/50 truncate">{u.bio || 'Chat & Play user'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartChat(u._id)}
                  disabled={startingChatId === u._id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 flex-shrink-0 ml-2"
                >
                  {startingChatId === u._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5" />
                  )}
                  <span>Chat</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;

