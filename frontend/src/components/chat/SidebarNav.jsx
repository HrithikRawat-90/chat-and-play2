import React from 'react';
import { useChat } from '../../context/ChatContext';
import { MessageSquare, Users } from 'lucide-react';

const SidebarNav = () => {
  const { activeTab, setActiveTab } = useChat();

  return (
    <div className="h-14 border-t border-purple-900/30 bg-[#100c20] px-4 flex items-center justify-around">
      <button
        onClick={() => setActiveTab('chat')}
        className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
          activeTab === 'chat'
            ? 'text-purple-400'
            : 'text-purple-300/50 hover:text-purple-200'
        }`}
      >
        <MessageSquare className="w-4 h-4" />
        <span>Chat</span>
      </button>

      <button
        onClick={() => setActiveTab('groups')}
        className={`flex flex-col items-center gap-1 text-xs font-medium transition-colors ${
          activeTab === 'groups'
            ? 'text-purple-400'
            : 'text-purple-300/50 hover:text-purple-200'
        }`}
      >
        <Users className="w-4 h-4" />
        <span>Groups</span>
      </button>
    </div>
  );
};

export default SidebarNav;

