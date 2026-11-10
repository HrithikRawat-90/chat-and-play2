import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { sounds } from '../../services/soundEffects';
import api from '../../services/api';
import {
  ChevronRight,
  Smile,
  Image,
  Send,
  Mic,
  X,
  Loader2,
  Upload,
  Sparkles,
  Wand2,
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
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiNotification, setAiNotification] = useState('');

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const handleAiSuggest = async () => {
    if (loadingAi) return;
    setLoadingAi(true);
    setAiNotification('');

    try {
      const res = await api.post('/ai/suggest', {
        conversationId: activeConversation?._id,
        draft: text,
      });

      if (res.data?.success) {
        if (text.trim().length > 0 && res.data.suggestedText) {
          setText(res.data.suggestedText);
          setAiNotification('✨ Gemini polished your draft!');
          setTimeout(() => setAiNotification(''), 3500);
        } else if (res.data.suggestions && res.data.suggestions.length > 0) {
          setAiSuggestions(res.data.suggestions);
          setText(res.data.suggestions[0]);
          inputRef.current?.focus();
          setAiNotification('✨ Gemini suggested a reply!');
          setTimeout(() => setAiNotification(''), 3500);
        }
      }
    } catch (err) {
      console.warn('AI Suggest failed:', err.message);
      setAiNotification('Could not reach Gemini AI');
      setTimeout(() => setAiNotification(''), 3000);
    } finally {
      setLoadingAi(false);
    }
  };

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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, GIF).');
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Please choose an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      setShowImageModal(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !selectedImage) || sending) return;

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (activeConversation) stopTyping(activeConversation._id);

    setSending(true);
    try {
      sounds.playMessageSent();
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
      {/* Hidden File Input for Local Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

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
          <div className="w-full max-w-md bg-[#16102f] border border-purple-900/40 rounded-2xl p-5 shadow-2xl shadow-purple-950/80 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Add Image Attachment</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-purple-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Local File Upload Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-purple-600/50 hover:border-purple-400 rounded-xl bg-purple-950/30 hover:bg-purple-900/20 text-purple-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-purple-400" />
                <span>Upload image from your computer</span>
              </button>
            </div>

            <p className="text-xs text-purple-300/60 mb-2 font-medium">Or choose from preset gallery:</p>

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

            <div className="space-y-1.5">
              <label className="text-xs text-purple-300/80 font-medium">Or paste an Image URL</label>
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
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium cursor-pointer"
                >
                  Attach
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
            className="p-1 rounded-md text-purple-400 hover:text-white hover:bg-purple-800/40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI Suggestion Notification Banner */}
      {aiNotification && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{aiNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiNotification('')}
            className="text-purple-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* AI Quick Reply Chips */}
      {aiSuggestions.length > 0 && (
        <div className="mb-2 p-2 rounded-xl bg-[#160f2d] border border-purple-800/40 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <span className="text-[11px] font-semibold text-purple-300/80 flex items-center gap-1 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Suggestions:
            </span>
            {aiSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setText(suggestion);
                  setAiSuggestions([]);
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-purple-200 hover:text-white text-xs font-medium whitespace-nowrap border border-purple-700/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAiSuggestions([])}
            className="p-1 text-purple-400 hover:text-white rounded-md flex-shrink-0"
            title="Dismiss suggestions"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Message Input Pill Bar */}
      <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-purple-300/70 hover:text-white hover:bg-purple-900/40 rounded-xl transition-colors cursor-pointer"
          title="Upload image from computer"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
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
          className="p-2 text-purple-300/70 hover:text-white hover:bg-purple-900/40 rounded-xl transition-colors cursor-pointer"
          title="Attach image"
        >
          <Image className="w-5 h-5" />
        </button>

        {/* Gemini AI Auto-Write / Suggest Button (Directly Right of Image Icon) */}
        <button
          type="button"
          onClick={handleAiSuggest}
          disabled={loadingAi}
          className={`p-2 rounded-xl transition-all cursor-pointer relative group ${
            loadingAi
              ? 'text-purple-300 bg-purple-900/50 animate-pulse'
              : 'text-purple-400 hover:text-purple-200 hover:bg-purple-900/40'
          }`}
          title={
            text.trim()
              ? 'Gemini AI: Polish & rewrite draft'
              : 'Gemini AI: Write or suggest a message'
          }
        >
          {loadingAi ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-300" />
          ) : (
            <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-purple-200 transition-colors group-hover:scale-110" />
          )}
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (window.scrollY !== 0) {
                window.scrollTo(0, 0);
              }
              document.body.scrollTop = 0;
            }}
            placeholder="Type a message"
            className="w-full py-2.5 px-4 bg-[#0c0919] border border-purple-900/40 rounded-2xl text-white placeholder-purple-300/35 text-base sm:text-sm focus:outline-none focus:border-purple-500/70 transition-all"
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
