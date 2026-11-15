import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Play, Pause } from 'lucide-react';

const formatMessageTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Apple-style Voice Memo Player
const VoiceMessagePlayer = ({ audioUrl, isSender }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackError, setPlaybackError] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setPlaybackError(false);
      audioRef.current.play().catch(() => setPlaybackError(true));
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && Number.isFinite(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatSec = (sec) => {
    if (!sec || !Number.isFinite(sec)) return '0:00';
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const waveformHeights = [30, 55, 85, 40, 70, 95, 50, 75, 35, 65, 90, 55, 35, 80, 45, 65];

  return (
    <div
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[20px] min-w-[210px] sm:min-w-[250px] shadow-sm select-none ${
        isSender
          ? 'bg-[#007aff] text-white rounded-br-[4px]'
          : 'bg-[#26262a] text-[#f2f2f7] rounded-tl-[4px] border border-white/5'
      }`}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setPlaybackError(true)}
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-90 ${
          isSender
            ? 'bg-white text-[#007aff] hover:bg-white/90'
            : 'bg-[#007aff] text-white hover:bg-[#0a84ff]'
        }`}
        title={isPlaying ? 'Pause' : 'Play voice message'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        {/* Apple style waveform visualization */}
        <div className="flex items-center gap-[3px] h-4">
          {waveformHeights.map((h, i) => {
            const barProgress = (i / waveformHeights.length) * 100;
            const isFilled = progress >= barProgress;
            return (
              <span
                key={i}
                className={`w-[3px] rounded-full transition-all duration-150 ${
                  isFilled
                    ? isSender ? 'bg-white' : 'bg-[#007aff]'
                    : isSender ? 'bg-white/40' : 'bg-zinc-600'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
        <div className="flex justify-between items-center text-[10.5px] font-medium opacity-80">
          <span>{formatSec(currentTime)}</span>
          <span>{formatSec(duration || 0)}</span>
        </div>
        {playbackError && <span role="alert" className="text-xs">Unable to play this recording.</span>}
      </div>
    </div>
  );
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
              src={senderAvatar || '/avatars/male.svg'}
              alt={senderName}
              className="w-8 h-8 rounded-full object-cover bg-zinc-800 border border-white/10"
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
          <div className="mb-1.5 overflow-hidden rounded-[18px] border border-white/10 shadow-lg max-w-sm sm:max-w-md">
            <img
              src={message.imageUrl}
              alt="Shared attachment"
              className="w-full h-auto max-h-72 object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          </div>
        )}

        {/* Optional Voice Message Player */}
        {message.audioUrl && (
          <div className="mb-1">
            <VoiceMessagePlayer audioUrl={message.audioUrl} isSender={isSender} />
          </div>
        )}

        {/* Optional Reply Quote */}
        {message.replyTo && message.replyTo.text && (
          <div className="mb-1 p-2.5 rounded-xl bg-zinc-800/80 border-l-4 border-[#007aff] text-xs text-zinc-300 max-w-full">
            <span className="font-semibold text-white block mb-0.5">
              {message.replyTo.senderName || 'Replied'}
            </span>
            <p className="line-clamp-2 text-zinc-400">{message.replyTo.text}</p>
          </div>
        )}

        {/* Message Text Bubble */}
        {message.text && (
          <div
            className={`px-4 py-2 text-sm sm:text-[14.5px] leading-relaxed whitespace-pre-wrap break-words shadow-sm select-text ${
              isSender
                ? 'bg-[#007aff] text-white rounded-[18px] rounded-br-[4px]'
                : 'bg-[#26262a] text-[#f2f2f7] rounded-[18px] rounded-tl-[4px] border border-white/5'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-zinc-500 mt-1 px-1 select-none font-medium">
          {time}
        </span>
      </div>
    </div>
  );
};

export default MessageItem;
