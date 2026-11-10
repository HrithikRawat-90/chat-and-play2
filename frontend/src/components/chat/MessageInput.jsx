import React, { useState, useRef, useEffect } from 'react';
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
  Trash2,
  Check,
} from 'lucide-react';

const COMMON_EMOJIS = ['😀', '😂', '🔥', '💙', '🎮', '👍', '🎉', '✨', '😎', '🚀'];

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

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        alert('Voice recording is not supported in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '');

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone access denied:', err);
      alert('Could not access microphone. Please enable microphone permission in your browser.');
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
      cancelRecording();
      return;
    }

    mediaRecorderRef.current.onstop = () => {
      const mime = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mime });

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      audioChunksRef.current = [];

      if (audioBlob.size > 0) {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          setSending(true);
          try {
            sounds.playMessageSent();
            await sendMessage('', '', null, base64Audio);
          } catch (err) {
            console.error('Failed to send voice message:', err);
          } finally {
            setSending(false);
          }
        };
        reader.readAsDataURL(audioBlob);
      }
      setIsRecording(false);
      setRecordingDuration(0);
    };

    try {
      mediaRecorderRef.current.stop();
    } catch (e) {
      cancelRecording();
    }
  };

  const formatAudioTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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
          setAiNotification('✨ AI polished your draft!');
          setTimeout(() => setAiNotification(''), 3500);
        } else if (res.data.suggestions && res.data.suggestions.length > 0) {
          setAiSuggestions(res.data.suggestions);
          setText(res.data.suggestions[0]);
          inputRef.current?.focus();
          setAiNotification('✨ AI suggested a reply!');
          setTimeout(() => setAiNotification(''), 3500);
        }
      }
    } catch (err) {
      console.warn('AI Suggest failed:', err.message);
      setAiNotification('Could not reach AI assistant');
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
    <div className="p-3 sm:p-4 bg-[#121214] border-t border-white/10 relative">
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
        <div className="absolute bottom-16 left-12 bg-[#1c1c1e] border border-white/15 rounded-2xl p-2.5 shadow-2xl z-40 flex items-center gap-2 animate-fadeIn">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#1c1c1e] border border-white/10 rounded-3xl p-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white text-sm">Add Image Attachment</h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Direct Local File Upload Button */}
            <div className="mb-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 px-4 border-2 border-dashed border-[#007aff]/40 hover:border-[#007aff] rounded-2xl bg-[#007aff]/10 hover:bg-[#007aff]/15 text-[#0a84ff] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload image from your device</span>
              </button>
            </div>

            <p className="text-xs text-zinc-400 mb-2 font-medium">Or choose from preset gallery:</p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {PRESET_ATTACHMENTS.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedImage(img.url);
                    setShowImageModal(false);
                  }}
                  className="group relative rounded-xl overflow-hidden border border-white/10 hover:border-[#007aff] transition-all text-left"
                >
                  <img src={img.url} alt={img.title} className="w-full h-20 object-cover" />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors p-1.5 flex items-end">
                    <span className="text-[11px] text-white font-medium truncate">{img.title}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400 font-medium">Or paste an Image URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 bg-[#2c2c2e] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#007aff]"
                />
                <button
                  onClick={() => {
                    if (customImageUrl.trim()) {
                      setSelectedImage(customImageUrl.trim());
                      setCustomImageUrl('');
                      setShowImageModal(false);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#007aff] hover:bg-[#006ee6] text-white text-xs font-semibold cursor-pointer"
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
        <div className="mb-2 inline-flex items-center gap-2 p-1.5 bg-[#1c1c1e] border border-white/10 rounded-xl">
          <img
            src={selectedImage}
            alt="Preview"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="text-xs text-zinc-300 truncate max-w-[200px]">Image attached</span>
          <button
            onClick={() => setSelectedImage('')}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* AI Suggestion Notification Banner */}
      {aiNotification && (
        <div className="mb-2 px-3 py-1.5 rounded-xl bg-[#1c1c1e] border border-[#007aff]/30 text-white text-xs flex items-center justify-between gap-2 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#0a84ff]" />
            <span>{aiNotification}</span>
          </div>
          <button
            type="button"
            onClick={() => setAiNotification('')}
            className="text-zinc-400 hover:text-white"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* AI Quick Reply Chips */}
      {aiSuggestions.length > 0 && (
        <div className="mb-2 p-2 rounded-2xl bg-[#1c1c1e] border border-white/10 flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 flex-shrink-0">
              <Sparkles className="w-3 h-3 text-[#0a84ff]" />
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
                className="px-2.5 py-1 rounded-xl bg-[#2c2c2e] hover:bg-[#3a3a3c] text-zinc-200 hover:text-white text-xs font-medium whitespace-nowrap border border-white/5 transition-all cursor-pointer active:scale-95"
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAiSuggestions([])}
            className="p-1 text-zinc-400 hover:text-white rounded-md flex-shrink-0"
            title="Dismiss suggestions"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice Recording Mode UI */}
      {isRecording ? (
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1c1c1e] border border-red-500/30 rounded-2xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm font-semibold text-white">Recording...</span>
            <span className="text-xs font-mono text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-full">
              {formatAudioTime(recordingDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="p-2 rounded-xl text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Discard recording"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#007aff] hover:bg-[#006ee6] text-white text-xs font-semibold shadow-md active:scale-95 transition-all cursor-pointer"
              title="Send voice message"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      ) : (
        /* Regular Message Input Pill Bar */
        <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Upload image from your device"
          >
            <Upload className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'text-[#0a84ff] bg-[#007aff]/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
            title="Add emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => setShowImageModal(true)}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Attach image"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* AI Auto-Write / Suggest Button */}
          <button
            type="button"
            onClick={handleAiSuggest}
            disabled={loadingAi}
            className={`p-2 rounded-xl transition-all cursor-pointer relative group ${
              loadingAi
                ? 'text-[#0a84ff] bg-[#007aff]/20 animate-pulse'
                : 'text-zinc-400 hover:text-[#0a84ff] hover:bg-zinc-800'
            }`}
            title={
              text.trim()
                ? 'AI: Polish & rewrite draft'
                : 'AI: Write or suggest a message'
            }
          >
            {loadingAi ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#0a84ff]" />
            ) : (
              <Sparkles className="w-5 h-5 transition-colors group-hover:scale-110" />
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
              className="w-full py-2.5 px-4 bg-[#1c1c1e] border border-white/10 rounded-2xl text-white placeholder-zinc-500 text-base sm:text-sm focus:outline-none focus:border-[#007aff] transition-all"
            />
          </div>

          {/* Send / Mic Icon */}
          <button
            type={text.trim() || selectedImage ? 'submit' : 'button'}
            onClick={text.trim() || selectedImage ? undefined : startRecording}
            disabled={sending}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer ${
              text.trim() || selectedImage
                ? 'bg-[#007aff] hover:bg-[#006ee6] text-white shadow-md shadow-blue-600/30 active:scale-95'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95'
            }`}
            title={text.trim() || selectedImage ? 'Send message' : 'Record voice message (Click to record)'}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : text.trim() || selectedImage ? (
              <Send className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4 text-[#0a84ff]" />
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default MessageInput;
