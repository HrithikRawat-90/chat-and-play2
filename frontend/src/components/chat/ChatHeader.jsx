import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  ArrowLeft,
  Search,
  Info,
  Gamepad2,
  Copy,
  Check,
  Users,
} from 'lucide-react';

const ChatHeader = ({ onPlayTogetherClick }) => {
  const {
    activeConversation,
    getOtherParticipant,
    toggleRightSidebar,
    isRightSidebarOpen,
    setMobileView,
    isUserOnline,
  } = useChat();

  const [copiedCode, setCopiedCode] = useState(false);

  const contact = getOtherParticipant(activeConversation);
  const isGroup = Boolean(activeConversation?.isGroup);
  const name = isGroup ? activeConversation?.groupName : (contact?.name || 'Conversation');
  const isBot = Boolean(contact?.isBot || name === 'Chatbot');
  const avatar =
    (isGroup ? activeConversation?.groupAvatar : contact?.profilePicture) ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
  const isOnline = isBot ? true : (contact?._id ? isUserOnline(contact._id) : Boolean(contact?.isOnline));

  const handleCopyGroupCode = (e) => {
    e.stopPropagation();
    if (activeConversation?.groupCode) {
      navigator.clipboard.writeText(activeConversation.groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  return (
    <div className="h-16 px-3 sm:px-6 flex items-center justify-between border-b border-purple-900/30 bg-[#130f24] select-none flex-shrink-0 sticky top-0 z-30 w-full shadow-md">
      {/* Left Contact Details & Mobile Back */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          onClick={() => setMobileView('list')}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40 flex-shrink-0"
          title="Back to chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div
          onClick={toggleRightSidebar}
          className="flex items-center gap-2.5 sm:gap-3 min-w-0 cursor-pointer group"
          title="View profile info"
        >
          <div className="relative flex-shrink-0">
            <img
              src={avatar}
              alt={name}
              className="w-10 h-10 rounded-full object-cover bg-purple-950 border border-purple-800/40 group-hover:border-purple-500/60 transition-colors"
            />
            {isOnline && !isGroup && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#130f24]" />
            )}
            {isGroup && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-indigo-600 rounded-full ring-2 ring-[#130f24] flex items-center justify-center">
                <Users className="w-2 h-2 text-white" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="font-semibold text-white text-sm sm:text-base truncate leading-tight group-hover:text-purple-300 transition-colors">
                {name}
              </h2>
              {isGroup && (
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-600/30 border border-indigo-500/40 text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex-shrink-0">
                  Group
                </span>
              )}
            </div>

            {isGroup ? (
              <div className="flex items-center gap-2 mt-0.5 text-[11px] sm:text-xs text-purple-300/70 leading-none">
                <span>{activeConversation.participants?.length || 1} members</span>
                {activeConversation.groupCode && (
                  <button
                    onClick={handleCopyGroupCode}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-950/80 hover:bg-purple-900 border border-purple-800/50 text-purple-300 hover:text-white font-mono text-[10px] transition-colors cursor-pointer"
                    title="Click to copy group join code"
                  >
                    <span>{activeConversation.groupCode}</span>
                    {copiedCode ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-purple-400" />
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[11px] sm:text-xs text-purple-300/60 leading-none mt-0.5 flex items-center gap-1.5 truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isOnline ? 'bg-emerald-400' : 'bg-gray-500'
                  }`}
                />
                <span className="truncate">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Right Action Icons & Play Together Button */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Play Together Standout Button */}
        <button
          onClick={onPlayTogetherClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007aff] hover:bg-[#006ee6] text-white font-medium text-xs shadow-sm active:scale-95 transition-all cursor-pointer mr-1"
          title="Play Tic-Tac-Toe together!"
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold">Play Together</span>
        </button>

        <button
          className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Search in chat"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={toggleRightSidebar}
          className={`p-2 rounded-full transition-colors ${isRightSidebarOpen
            ? 'text-[#0a84ff] bg-[#007aff]/20'
            : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          title="Contact information"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
