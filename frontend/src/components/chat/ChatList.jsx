import React, { useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import ChatItem from './ChatItem';
import SearchBar from './SearchBar';
import { MessageSquarePlus, Loader2 } from 'lucide-react';

const ChatList = () => {
  const {
    conversations,
    activeConversation,
    selectConversation,
    loadingConversations,
    setIsSearchModalOpen,
    getOtherParticipant,
    activeTab,
  } = useChat();

  const [search, setSearch] = useState('');

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter((conv) => {
      const other = getOtherParticipant(conv);
      const name = other?.name?.toLowerCase() || '';
      const lastMsg = conv.lastMessage?.text?.toLowerCase() || '';
      return (
        name.includes(search.toLowerCase()) ||
        lastMsg.includes(search.toLowerCase())
      );
    });
  }, [conversations, search, getOtherParticipant]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#130f24]">
      {/* Search Bar */}
      <SearchBar search={search} setSearch={setSearch} />

      {/* Conversation Items List */}
      <div className="flex-1 overflow-y-auto space-y-1 py-1">
        {loadingConversations ? (
          <div className="flex flex-col items-center justify-center py-12 text-purple-400">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-xs text-purple-300/60">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-purple-400 mb-3">
              <MessageSquarePlus className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {search ? 'No conversations match' : 'No chats yet'}
            </p>
            <p className="text-xs text-purple-300/60 max-w-[200px] mb-4">
              {search
                ? 'Try searching for a different keyword or contact'
                : 'Start a new conversation with registered members'}
            </p>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <ChatItem
              key={conv._id}
              conversation={conv}
              isSelected={activeConversation?._id === conv._id}
              onClick={() => selectConversation(conv)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;

