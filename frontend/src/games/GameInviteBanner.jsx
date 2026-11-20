import React from 'react';
import { useGame } from './GameContext';
import { useChat } from '../context/ChatContext';
import { Gamepad2, Check, X, Loader2 } from 'lucide-react';

const GameInviteBanner = () => {
  const {
    incomingInvite,
    outgoingInvite,
    acceptInvite,
    rejectInvite,
    cancelOutgoingInvite,
  } = useGame();
  const { activeConversation, getOtherParticipant } = useChat();

  const contact = getOtherParticipant(activeConversation);
  const convId = (activeConversation?._id || activeConversation?.id)?.toString();
  const incomingConvId = (incomingInvite?.conversationId?._id || incomingInvite?.conversationId)?.toString();
  const outgoingConvId = (outgoingInvite?.conversationId?._id || outgoingInvite?.conversationId)?.toString();

  if (incomingInvite && (!convId || incomingConvId === convId)) {
    return (
      <div className="mx-4 my-2 p-3.5 rounded-2xl bg-gradient-to-r from-purple-900/90 via-[#231846] to-indigo-900/90 border border-purple-500/40 shadow-xl shadow-purple-950/60 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 flex-shrink-0">
            <Gamepad2 className="w-5 h-5 text-purple-200" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-xs sm:text-sm">
              Game Challenge Received!
            </h4>
            <p className="text-[11px] text-purple-200/70">
              <span className="font-medium text-purple-200">{incomingInvite.sender.name}</span> challenged you to a real-time game of Tic-Tac-Toe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => rejectInvite(incomingConvId)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-700/50 hover:bg-purple-900/40 text-purple-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Decline</span>
          </button>

          <button
            onClick={() => acceptInvite(incomingConvId)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Accept & Play</span>
          </button>
        </div>
      </div>
    );
  }

  if (outgoingInvite && (!convId || outgoingConvId === convId)) {
    return (
      <div className="mx-4 my-2 p-3 rounded-2xl bg-[#1a1236]/90 border border-purple-800/40 shadow-lg flex items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin flex-shrink-0" />
          <p className="text-xs text-purple-200">
            Waiting for <strong className="text-white">{contact?.name || 'Partner'}</strong> to accept your Tic-Tac-Toe challenge...
          </p>
        </div>

        <button
          onClick={cancelOutgoingInvite}
          className="text-xs text-purple-400 hover:text-white px-2 py-1 rounded-lg hover:bg-purple-900/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return null;
};

export default GameInviteBanner;

