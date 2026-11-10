import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import {
  Plus,
  MoreVertical,
  LogOut,
  Sliders,
  Users,
  KeyRound,
  MessageSquarePlus,
} from 'lucide-react';

const SidebarHeader = () => {
  const { user, logout } = useAuth();
  const {
    setIsSearchModalOpen,
    setIsSettingsOpen,
    setIsCreateGroupOpen,
    setIsJoinGroupOpen,
  } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="h-16 px-4 flex items-center justify-between border-b border-purple-900/30 bg-[#130f24]">
      {/* Current User Info - Clickable to open Profile & Settings */}
      <div
        onClick={() => setIsSettingsOpen(true)}
        className="flex items-center gap-3 cursor-pointer group select-none"
        title="Click to view & edit Profile / Settings"
      >
        <div className="relative">
          <img
            src={
              user?.profilePicture ||
              `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                user?.name || 'User'
              )}`
            }
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover bg-purple-950 border border-purple-800/40 group-hover:border-purple-500/70 transition-all group-hover:scale-105"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-[#130f24]" />
        </div>
        <div>
          <h2 className="font-bold text-base text-white tracking-tight group-hover:text-purple-300 transition-colors leading-tight">
            {user?.name || 'Chats'}
          </h2>
          <p className="text-[11px] text-purple-300/60 leading-none truncate max-w-[120px]">
            {user?.bio || 'Click for Settings'}
          </p>
        </div>
      </div>

      {/* Top Action Icons (+, ...) */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="p-2 rounded-xl text-purple-300/80 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
          title="Start new conversation"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* More options menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-purple-300/80 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
            title="Options & Settings"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#181233] border border-purple-900/40 rounded-2xl shadow-2xl shadow-purple-950/80 py-1.5 z-50 animate-fadeIn divide-y divide-purple-900/30">
              <div
                onClick={() => {
                  setMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="px-3.5 py-2.5 cursor-pointer hover:bg-purple-900/20 transition-colors"
              >
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-purple-400 font-medium">Profile & Theme Settings</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsSearchModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-purple-200 hover:text-white hover:bg-purple-800/30 transition-colors cursor-pointer"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5 text-purple-400" />
                  <span>New 1-on-1 Chat</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsCreateGroupOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-purple-200 hover:text-white hover:bg-purple-800/30 transition-colors cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>Create New Group</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsJoinGroupOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-purple-200 hover:text-white hover:bg-purple-800/30 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                  <span>Join with Group Code</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-purple-200 hover:text-white hover:bg-purple-800/30 transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-purple-400" />
                  <span>Settings (Theme, Bio, Pic)</span>
                </button>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarHeader;

