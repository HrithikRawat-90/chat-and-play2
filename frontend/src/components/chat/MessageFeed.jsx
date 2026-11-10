import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import MessageItem from './MessageItem';
import { Loader2 } from 'lucide-react';

const MessageFeed = () => {
  const {
    messages,
    loadingMessages,
    activeConversation,
    getOtherParticipant,
    currentTypingUsers,
  } = useChat();

  const feedRef = useRef(null);

  const contact = getOtherParticipant(activeConversation);
  const contactName = contact?.name || 'Partner';
  const contactAvatar = contact?.profilePicture;

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, currentTypingUsers]);

  if (loadingMessages) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-purple-400">
        <Loader2 className="w-7 h-7 animate-spin mb-2" />
        <p className="text-xs text-purple-300/60">Loading conversation history...</p>
      </div>
    );
  }

  const isSomeoneTyping = currentTypingUsers.length > 0;
  const typerName = currentTypingUsers[0]?.userName || contactName;

  return (
    <div
      ref={feedRef}
      className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col space-y-1 overscroll-contain"
    >
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-purple-300/50">
          <div className="w-16 h-16 rounded-full bg-purple-950/40 border border-purple-800/30 flex items-center justify-center mb-3">
            <img
              src={contactAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(contactName)}`}
              alt={contactName}
              className="w-14 h-14 rounded-full object-cover"
            />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">
            Say hello to {contactName}!
          </h3>
          <p className="text-xs text-purple-300/60 max-w-xs">
            This is the start of your encrypted conversation. Send a message or challenge them to Tic-Tac-Toe!
          </p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const showAvatar = !prevMsg || prevMsg.senderId?._id !== msg.senderId?._id;

          return (
            <MessageItem
              key={msg._id || index}
              message={msg}
              senderAvatar={contactAvatar}
              senderName={contactName}
              showAvatar={showAvatar}
            />
          );
        })
      )}

      {/* Real-time Typing Indicator Bubble */}
      {isSomeoneTyping && (
        <div className="flex items-center gap-2 text-xs text-purple-300/70 py-2 animate-pulse">
          <div className="flex items-center gap-1 bg-[#221c3b] px-3.5 py-2 rounded-2xl rounded-tl-sm border border-purple-900/30">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
          </div>
          <span className="text-[11px] text-purple-300/60">{typerName} is typing...</span>
        </div>
      )}
    </div>
  );
};

export default MessageFeed;
