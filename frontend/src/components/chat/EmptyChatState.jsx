import React from 'react';
import { useChat } from '../../context/ChatContext';
import { Gamepad2, MessageSquarePlus, Sparkles, Shield } from 'lucide-react';

const EmptyChatState = () => {
  const { setIsSearchModalOpen } = useChat();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#0d091d] bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(109,40,217,0.15),rgba(255,255,255,0))] select-none">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-2xl shadow-purple-600/30 mb-5 ring-1 ring-purple-400/40">
        <Gamepad2 className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
        Chat <span className="text-purple-400">&</span> Play
      </h2>
      <p className="text-sm text-purple-300/70 max-w-sm mb-6 leading-relaxed">
        Select a conversation from the left sidebar to start messaging, or search for registered members to chat and play Tic-Tac-Toe in real time!
      </p>

      <button
        onClick={() => setIsSearchModalOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer active:scale-95"
      >
        <MessageSquarePlus className="w-4 h-4" />
        <span>Find & Chat With Users</span>
      </button>

      <div className="flex items-center gap-6 mt-12 text-xs text-purple-300/50">
        <span className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-purple-400" /> End-to-End Sessions
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-purple-400" /> Multiplayer Ready
        </span>
      </div>
    </div>
  );
};

export default EmptyChatState;

