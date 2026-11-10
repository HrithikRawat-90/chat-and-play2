import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  ChevronRight,
  Smile,
  Image,
  Send,
  Mic,
  X,
  Loader2,
} from 'lucide-react';

const COMMON_EMOJIS = ['😀', '😂', '🔥', '💜', '🎮', '👍', '🎉', '✨', '😎', '🚀'];

const PRESET_ATTACHMENTS = [
  {
    title: 'Golden Sunset Fields',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
  },
  {
    title: 'Neon Cyber City',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
  },
  {
    title: 'Purple Nebula Starfield',
    url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&q=80',
  },
  {
    title: 'Sports Car Night Drive',
    url: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80',
  },
];

const MessageInput = () => {
  const { sendMessage, activeConversation, startTyping, stopTyping } = useChat();

  const [text, setText] = useState('');
  const [selectedImage, setSelectedImage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [sending, setSending] = useState(false);

  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);

    if (activeConversation) {
      startTyping(activeConversation._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeConversation._id);
      }, 1500);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !selectedImage) || sending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (activeConversation) stopTyping(activeConversation._id);

    setSending(true);
    try {
      await sendMessage(text.trim(), selectedImage);
      setText('');
      setSelectedImage('');
      setShowEmojiPicker(false);
      setShowImageModal(false);
    } catch (err) {
      console.error('Failed to send:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const addEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
    if (activeConversation) startTyping(activeConversation._id);
  };

  return (
    <div className="p-3 sm:p-4 bg-[#130f24] border-t border-purple-900/30 relative">
      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-12 bg-[#1b1538] border border-purple-900/50 rounded-2xl p-2.5 shadow-2xl shadow-purple-950/80 z-40 flex items-center gap-2 animate-fadeIn">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => addEmoji(emoji)}
              className="text-lg hover:scale-125 transition-transform p-1 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Image Attachment Modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#16102f] border border-purple-900/40 rounded-2xl p-5 shadow-2xl shadow-purple-950/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Select Image Attachment</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-purple-300/60 mb-3">Choose a preset photo or paste any image URL:</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRESET_ATTACHMENTS.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img.url);
                    setShowImageModal(false);
                  }}
                  className="group relative rounded-xl overflow-hidden border border-purple-900/50 hover:border-purple-500 transition-all text-left"
                >
                  <img src={img.url} alt={img.title} className="w-full h-20 object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors p-1.5 flex items-end">
                    <span className="text-[11px] text-white font-medium truncate">{img.title}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs text-purple-300/80">Custom Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-1.5 bg-[#0b0818] border border-purple-900/40 rounded-xl text-xs text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => {
                    if (customImageUrl.trim()) {
                      setSelectedImage(customImageUrl.trim());
                      setCustomImageUrl('');
                      setShowImageModal(false);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium"
                >
                  Use URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Image Preview Thumbnail */}
      {selectedImage && (
        <div className="mb-2 inline-flex items-center gap-2 p-1.5 bg-[#1e173e] border border-purple-700/50 rounded-xl">
          <img
            src={selectedImage}
            alt="Preview"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="text-xs text-purple-200 truncate max-w-[200px]">Image attached</span>
          <button
            onClick={() => setSelectedImage('')}
            className="p-1 rounded-md text-purple-400 hover:text-white hover:bg-purple-800/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Message Input Pill Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          className="p-2 text-purple-300/70 hover:text-white hover:bg-purple-900/40 rounded-xl transition-colors"
          title="Tools"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`p-2 rounded-xl transition-colors ${
            showEmojiPicker
              ? 'text-purple-300 bg-purple-900/50'
              : 'text-purple-300/70 hover:text-white hover:bg-purple-900/40'
          }`}
          title="Add emoji"
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setShowImageModal(true)}
          className="p-2 text-purple-300/70 hover:text-white hover:bg-purple-900/40 rounded-xl transition-colors"
          title="Attach image"
        >
          <Image className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            className="w-full py-2.5 px-4 bg-[#0c0919] border border-purple-900/40 rounded-2xl text-white placeholder-purple-300/35 text-sm focus:outline-none focus:border-purple-500/70 transition-all"
          />
        </div>

        {/* Send / Mic Icon */}
        <button
          type="submit"
          disabled={(!text.trim() && !selectedImage) || sending}
          className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
            text.trim() || selectedImage
              ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30'
              : 'text-purple-300/50 hover:text-white hover:bg-purple-900/30'
          }`}
          title={text.trim() || selectedImage ? 'Send message' : 'Voice message'}
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : text.trim() || selectedImage ? (
            <Send className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
