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
    setIsCreateGroupOpen,
    setIsJoinGroupOpen,
    getOtherParticipant,
    activeTab,
  } = useChat();

  const [search, setSearch] = useState('');

  const filteredConversations = useMemo(() => {
    const tabFiltered = conversations.filter((conv) => {
      if (activeTab === 'groups') return Boolean(conv.isGroup);
      return !conv.isGroup;
    });

    if (!search.trim()) return tabFiltered;

    return tabFiltered.filter((conv) => {
      const other = getOtherParticipant(conv);
      const name = (conv.isGroup ? conv.groupName : other?.name)?.toLowerCase() || '';
      const lastMsg = conv.lastMessage?.text?.toLowerCase() || '';
      return (
        name.includes(search.toLowerCase()) ||
        lastMsg.includes(search.toLowerCase())
      );
    });
  }, [conversations, activeTab, search, getOtherParticipant]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#130f24]">
      <SearchBar search={search} setSearch={setSearch} />

      {activeTab === 'groups' && (
        <div className="px-3 pb-2 pt-1 flex items-center gap-2 border-b border-purple-900/20">
          <button
            onClick={() => setIsCreateGroupOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 transition-all cursor-pointer"
          >
            <span>+ Create Group</span>
          </button>
          <button
            onClick={() => setIsJoinGroupOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/40 text-purple-200 hover:text-white text-xs font-medium transition-all cursor-pointer"
          >
            <span>🔑 Join Code</span>
          </button>
        </div>
      )}

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
              {search
                ? 'No conversations match'
                : activeTab === 'groups'
                ? 'No groups yet'
                : 'No chats yet'}
            </p>
            <p className="text-xs text-purple-300/60 max-w-[220px] mb-4">
              {search
                ? 'Try searching for a different keyword or contact'
                : activeTab === 'groups'
                ? 'Create your own group or join one with a 6-character code'
                : 'Start a new conversation with registered members'}
            </p>
            {activeTab === 'groups' ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCreateGroupOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Create Group
                </button>
                <button
                  onClick={() => setIsJoinGroupOpen(true)}
                  className="px-3.5 py-2 rounded-xl border border-purple-800/40 text-purple-300 hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  Join with Code
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
              >
                Start New Chat
              </button>
            )}
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

