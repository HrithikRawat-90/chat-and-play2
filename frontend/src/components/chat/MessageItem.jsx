import React from 'react';
import { useAuth } from '../../context/AuthContext';

const formatMessageTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const MessageItem = ({ message, senderAvatar, senderName, showAvatar }) => {
  const { user } = useAuth();
  const isSender = message.senderId?._id === user?._id || message.senderId === user?._id;
  const time = formatMessageTime(message.createdAt);

  return (
    <div
      className={`flex items-end gap-2.5 my-2.5 group ${
        isSender ? 'justify-end' : 'justify-start'
      }`}
    >
      {/* Received message avatar */}
      {!isSender && (
        <div className="w-8 flex-shrink-0">
          {showAvatar ? (
            <img
              src={senderAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(senderName || 'user')}`}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover bg-purple-950/80 border border-purple-800/40"
            />
          ) : (
            <div className="w-8" />
          )}
        </div>
      )}

      {/* Bubble Container */}
      <div className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
        {/* Optional Image Attachment */}
        {message.imageUrl && (
          <div className="mb-1.5 overflow-hidden rounded-2xl border-2 border-purple-500/40 shadow-lg shadow-purple-950/50 max-w-sm sm:max-w-md">
            <img
              src={message.imageUrl}
              alt="Shared attachment"
              className="w-full h-auto max-h-72 object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Optional Reply Quote */}
        {message.replyTo && message.replyTo.text && (
          <div className="mb-1 p-2.5 rounded-xl bg-purple-950/60 border-l-4 border-purple-500 text-xs text-purple-200/90 max-w-full">
            <span className="font-semibold text-purple-300 block mb-0.5">
              {message.replyTo.senderName || 'Replied'}
            </span>
            <p className="line-clamp-2 text-purple-200/70">{message.replyTo.text}</p>
          </div>
        )}

        {/* Message Text Bubble */}
        {message.text && (
          <div
            className={`px-4 py-2.5 text-sm sm:text-[14.5px] leading-relaxed break-words shadow-md select-text ${
              isSender
                ? 'bg-purple-700 hover:bg-purple-600/90 text-white rounded-2xl rounded-br-sm shadow-purple-950/40 transition-colors'
                : 'bg-[#221c3b] hover:bg-[#282145] text-purple-100 rounded-2xl rounded-tl-sm border border-purple-900/30 transition-colors'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10.5px] text-purple-300/45 mt-1 px-1 select-none">
          {time}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;

