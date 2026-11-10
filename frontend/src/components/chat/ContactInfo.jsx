import React from 'react';
import { useChat } from '../../context/ChatContext';
import {
  X,
  ChevronRight,
  Bell,
  Ban,
  Flag,
  Trash2,
} from 'lucide-react';

const ContactInfo = () => {
  const {
    activeConversation,
    getOtherParticipant,
    isRightSidebarOpen,
    toggleRightSidebar,
    sampleMedia,
    isUserOnline,
  } = useChat();

  if (!isRightSidebarOpen) return null;

  const contact = getOtherParticipant(activeConversation);
  if (!contact) return null;

  const name = contact?.name || 'Contact Info';
  const avatar =
    contact?.profilePicture ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
  const bio = contact?.bio || 'Hey there! I am using Chat & Play.';
  const isOnline = contact?._id ? isUserOnline(contact._id) : (contact?.isOnline ?? false);

  return (
    <aside className="h-full w-full sm:w-80 lg:w-[320px] bg-[#130f24] border-l border-purple-900/30 flex flex-col flex-shrink-0 animate-fadeIn select-none overflow-y-auto">
      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-purple-900/30">
        <h3 className="font-semibold text-white text-base">Contact Info</h3>
        <button
          onClick={toggleRightSidebar}
          className="p-1.5 rounded-lg text-purple-300/70 hover:text-white hover:bg-purple-900/40 transition-colors"
          title="Close panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 flex flex-col items-center border-b border-purple-900/30 text-center">
        {/* Large Profile Photo */}
        <div className="relative mb-3.5">
          <img
            src={avatar}
            alt={name}
            className="w-24 h-24 rounded-full object-cover bg-purple-950/80 ring-4 ring-purple-600/30 shadow-xl"
          />
          {isOnline && (
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-[#130f24]" />
          )}
        </div>

        <h4 className="font-bold text-white text-lg tracking-tight">{name}</h4>
        <p className="text-xs text-purple-400 font-medium mt-0.5 mb-2 hover:underline cursor-pointer">
          View Profile
        </p>
        <p className="text-xs text-purple-300/70 px-4 line-clamp-3 italic">
          "{bio}"
        </p>
        <span
          className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
            isOnline
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'bg-gray-900/40 text-gray-400 border border-gray-700/30'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
          {isOnline ? 'Online now' : 'Offline'}
        </span>
      </div>

      {/* Media, Links and Files */}
      <div className="p-4 border-b border-purple-900/30">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-purple-200/80 cursor-pointer group">
          <span>Media, Links and Files</span>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
        </div>

        <div className="grid grid-cols-4 gap-2">
          {sampleMedia.map((img, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl overflow-hidden border border-purple-900/40 hover:border-purple-500/60 transition-all cursor-pointer"
            >
              <img
                src={img}
                alt="Shared thumbnail"
                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Groups in Common */}
      <div className="p-4 border-b border-purple-900/30">
        <div className="flex items-center justify-between mb-3 text-xs font-semibold text-purple-200/80 cursor-pointer group">
          <span>Groups in common</span>
          <span className="text-[11px] text-purple-400 font-normal">5 &gt;</span>
        </div>

        <div className="flex items-center gap-2">
          {sampleMedia.map((img, i) => (
            <img
              key={i}
              src={img}
              alt="Group thumb"
              className="w-9 h-9 rounded-lg object-cover border border-purple-900/50"
            />
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="p-4 border-b border-purple-900/30">
        <div className="flex items-center justify-between text-xs cursor-pointer group">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-purple-400" />
            <div>
              <p className="font-semibold text-white leading-tight">Notifications</p>
              <p className="text-[11px] text-purple-300/60 leading-tight">All Messages & Reactions</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* Action Options */}
      <div className="p-3 space-y-1 mt-auto">
        <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-950/40 rounded-xl transition-colors text-left cursor-pointer">
          <Ban className="w-4 h-4 text-red-400/80" />
          <span>Block {name.split(' ')[0]}</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-950/40 rounded-xl transition-colors text-left cursor-pointer">
          <Flag className="w-4 h-4 text-amber-400/80" />
          <span>Report Contact</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition-colors text-left cursor-pointer">
          <Trash2 className="w-4 h-4" />
          <span>Delete Chat</span>
        </button>
      </div>
    </aside>
  );
};

export default ContactInfo;
