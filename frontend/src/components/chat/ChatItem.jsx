import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Pin } from 'lucide-react';

const formatChatTime = (dateInput) => {
  if (!dateInput) return 'Now';
  const date = new Date(dateInput);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const ChatItem = ({ conversation, isSelected, onClick }) => {
  const { getOtherParticipant, isUserOnline } = useChat();
  const contact = getOtherParticipant(conversation);

  const name = contact?.name || 'User';
  const isBot = Boolean(contact?.isBot || name === 'Chatbot');
  const avatar =
    contact?.profilePicture ||
    '/avatars/male.svg';
  // Live socket presence check with DB fallback (AI Chatbot is always online)
  const isOnline = isBot ? true : (contact?._id ? isUserOnline(contact._id) : Boolean(contact?.isOnline));
  const lastMessageText = conversation.lastMessage?.text || 'Start a conversation';
  const timestamp = formatChatTime(conversation.lastMessage?.createdAt || conversation.updatedAt);
  const unreadCount = conversation.unreadCount || 0;
  const isPinned = conversation.isPinned;

  return (
    <div
      onClick={onClick}
      className={`group px-3.5 py-3 mx-2 rounded-xl cursor-pointer transition-all flex items-center gap-3 select-none ${
        isSelected
          ? 'bg-[#231b45] border border-purple-600/40 shadow-md shadow-purple-950/50'
          : 'hover:bg-[#181233]/70 border border-transparent'
      }`}
    >
      {/* Contact Avatar with Online Dot */}
      <div className="relative flex-shrink-0">
        <img
          src={avatar}
          alt={name}
          className="w-11 h-11 rounded-full object-cover bg-purple-950/80 border border-purple-800/30 group-hover:border-purple-600/40 transition-colors"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-[#130f24]" />
        )}
      </div>

      {/* Middle Text Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5 truncate">
            <h3
              className={`text-sm font-semibold truncate ${
                isSelected ? 'text-white' : 'text-purple-100 group-hover:text-white'
              }`}
            >
              {name}
            </h3>
            {conversation.isGroup && (
              <span className="px-1.5 py-0.2 rounded bg-indigo-600/30 border border-indigo-500/40 text-[9px] font-bold text-indigo-300 uppercase tracking-wider flex-shrink-0">
                Group
              </span>
            )}
          </div>
          <span className="text-[11px] text-purple-300/50 flex-shrink-0 ml-2">
            {timestamp}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <p
            className={`text-xs truncate max-w-[170px] ${
              isSelected ? 'text-purple-200' : 'text-purple-300/60 group-hover:text-purple-200/80'
            }`}
          >
            {lastMessageText}
          </p>

          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            {isPinned && <Pin className="w-3 h-3 text-purple-400 rotate-45" />}
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 min-w-[20px] text-center text-[10px] font-extrabold bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full shadow-md shadow-purple-600/40 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatItem;
