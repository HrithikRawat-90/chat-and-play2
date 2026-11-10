import React from 'react';
import { useChat } from '../../context/ChatContext';
import {
  ArrowLeft,
  Search,
  Video,
  Phone,
  Info,
  Gamepad2,
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

  const contact = getOtherParticipant(activeConversation);
  const name = contact?.name || 'Conversation';
  const avatar =
    contact?.profilePicture ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
  const isOnline = contact?._id ? isUserOnline(contact._id) : (contact?.isOnline ?? false);

  return (
    <div className="h-16 px-4 sm:px-6 flex items-center justify-between border-b border-purple-900/30 bg-[#130f24] select-none flex-shrink-0">
      {/* Left Contact Details & Mobile Back */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => setMobileView('list')}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40"
          title="Back to chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative flex-shrink-0">
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover bg-purple-950 border border-purple-800/40"
          />
          {isOnline && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#130f24]" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-white text-sm sm:text-base truncate leading-tight">
              {name}
            </h2>
            {(contact?.isBot || name === 'Chatbot') && (
              <span className="px-1.5 py-0.5 rounded-md bg-purple-600/30 border border-purple-500/40 text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                Gemini AI
              </span>
            )}
          </div>
          <p className="text-xs text-purple-300/60 leading-none mt-0.5 flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-400' : 'bg-gray-500'
              }`}
            />
            <span>
              {isOnline
                ? contact?.isBot || name === 'Chatbot'
                  ? 'Gemini 3.8 Flash Online'
                  : 'Online'
                : 'Offline'}
            </span>
          </p>
        </div>
      </div>

      {/* Right Action Icons & Play Together Button */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Play Together Standout Button */}
        <button
          onClick={onPlayTogetherClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-purple-600/30 active:scale-95 transition-all cursor-pointer mr-1"
          title="Play Tic-Tac-Toe together!"
        >
          <Gamepad2 className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold">Play Together</span>
        </button>

        <button
          className="p-2 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-900/40 transition-colors"
          title="Search in chat"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          className="hidden sm:inline-flex p-2 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-900/40 transition-colors"
          title="Video call"
        >
          <Video className="w-4 h-4" />
        </button>

        <button
          className="hidden sm:inline-flex p-2 rounded-xl text-purple-300/70 hover:text-white hover:bg-purple-900/40 transition-colors"
          title="Voice call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          onClick={toggleRightSidebar}
          className={`p-2 rounded-xl transition-colors ${
            isRightSidebarOpen
              ? 'text-purple-300 bg-purple-900/50'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-900/40'
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
