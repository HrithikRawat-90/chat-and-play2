import React from 'react';
import { useChat } from '../../context/ChatContext';
import { MessageSquare, Users } from 'lucide-react';

const SidebarNav = () => {
  const { activeTab, setActiveTab, conversations } = useChat();

  const chatUnreads = conversations
    .filter((c) => !c.isGroup)
    .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  const groupUnreads = conversations
    .filter((c) => c.isGroup)
    .reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="h-14 border-t border-purple-900/30 bg-[#100c20] px-4 flex items-center justify-around select-none">
      <button
        onClick={() => setActiveTab('chat')}
        className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors cursor-pointer ${
          activeTab === 'chat'
            ? 'text-purple-400 font-semibold'
            : 'text-purple-300/50 hover:text-purple-200'
        }`}
      >
        <div className="relative">
          <MessageSquare className="w-4 h-4" />
          {chatUnreads > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center ring-1 ring-[#100c20] shadow-sm animate-pulse">
              {chatUnreads > 9 ? '9+' : chatUnreads}
            </span>
          )}
        </div>
        <span>Direct Chats</span>
      </button>

      <button
        onClick={() => setActiveTab('groups')}
        className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors cursor-pointer ${
          activeTab === 'groups'
            ? 'text-purple-400 font-semibold'
            : 'text-purple-300/50 hover:text-purple-200'
        }`}
      >
        <div className="relative">
          <Users className="w-4 h-4" />
          {groupUnreads > 0 && (
            <span className="absolute -top-1.5 -right-2 px-1 min-w-[15px] h-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-[9px] font-extrabold flex items-center justify-center ring-1 ring-[#100c20] shadow-sm animate-pulse">
              {groupUnreads > 9 ? '9+' : groupUnreads}
            </span>
          )}
        </div>
        <span>Groups</span>
      </button>
    </div>
  );
};

export default SidebarNav;

