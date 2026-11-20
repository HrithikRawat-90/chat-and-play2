import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { KeyRound, X, Loader2, Users, ArrowRight, AlertCircle } from 'lucide-react';

const JoinGroupModal = () => {
  const { isJoinGroupOpen, setIsJoinGroupOpen, joinGroupWithCode } = useChat();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isJoinGroupOpen) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    let clean = code.trim().toUpperCase();
    if (!clean) return;

    // If user enters 6 chars without GRP- prefix, auto prepend it
    if (!clean.startsWith('GRP-') && clean.length === 6) {
      clean = `GRP-${clean}`;
    }

    setLoading(true);
    setErrorMsg('');

    const res = await joinGroupWithCode(clean);
    setLoading(false);

    if (res.success) {
      setIsJoinGroupOpen(false);
      setCode('');
    } else {
      setErrorMsg(res.message || 'Invalid group code. Please verify and try again.');
    }
  };

  const handleClose = () => {
    setIsJoinGroupOpen(false);
    setCode('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-sm bg-[#140e2b] border border-purple-900/50 rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-14 px-5 border-b border-purple-900/40 flex items-center justify-between bg-[#191136]">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-white text-base">Join with Group Code</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleJoin} className="p-5 space-y-4">
          <p className="text-xs text-purple-300/70 leading-relaxed">
            Enter the unique 6-character Group Code shared by your friend or group admin:
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5">
              Group Join Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={12}
              placeholder="e.g. GRP-9X4K2M"
              className="w-full px-4 py-3 bg-[#0b0717] border border-purple-800/60 rounded-xl text-white font-mono font-bold text-center text-lg tracking-widest placeholder-purple-300/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-600/30 transition-all uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-900/30">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-xl border border-purple-800/40 text-purple-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
              <span>Join Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinGroupModal;

