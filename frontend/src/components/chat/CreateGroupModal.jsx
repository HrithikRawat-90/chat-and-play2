import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  X,
  Users,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Upload,
  RotateCcw,
} from 'lucide-react';

const DEFAULT_GROUP_AVATAR =
  'https://api.dicebear.com/7.x/identicon/svg?seed=MainSquad&backgroundColor=7c3aed';

const CreateGroupModal = () => {
  const { isCreateGroupOpen, setIsCreateGroupOpen, createGroupConversation } = useChat();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupAvatar, setGroupAvatar] = useState(DEFAULT_GROUP_AVATAR);
  const [loading, setLoading] = useState(false);
  const [createdGroup, setCreatedGroup] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);

  if (!isCreateGroupOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setGroupAvatar(reader.result);
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setLoading(true);
    setErrorMsg('');

    const res = await createGroupConversation({
      groupName: groupName.trim(),
      groupDescription: description.trim(),
      groupAvatar,
    });

    setLoading(false);

    if (res.success && res.conversation) {
      setCreatedGroup(res.conversation);
    } else {
      setErrorMsg(res.message || 'Could not create group');
    }
  };

  const handleCopyCode = () => {
    if (createdGroup?.groupCode) {
      navigator.clipboard.writeText(createdGroup.groupCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleClose = () => {
    setIsCreateGroupOpen(false);
    setGroupName('');
    setDescription('');
    setGroupAvatar(DEFAULT_GROUP_AVATAR);
    setCreatedGroup(null);
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-md bg-[#140e2b] border border-purple-900/50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="h-14 px-5 border-b border-purple-900/40 flex items-center justify-between bg-[#191136]">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            <h3 className="font-semibold text-white text-base">Create New Group</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-purple-300 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {createdGroup ? (
            /* Success View with Join Code */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/50 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-lg">
                <Check className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-white">
                  Group Created Successfully!
                </h4>
                <p className="text-xs text-purple-300/70 mt-1 max-w-xs mx-auto">
                  Share this exclusive Group Join Code with your friends so they can join right away:
                </p>
              </div>

              {/* Group Code Display Box */}
              <div className="p-4 rounded-2xl bg-[#0b0717] border border-purple-800/50 flex items-center justify-between gap-3 max-w-xs mx-auto shadow-inner">
                <div>
                  <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider block">
                    Group Join Code
                  </span>
                  <span className="text-xl font-mono font-extrabold text-white tracking-widest">
                    {createdGroup.groupCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
                >
                  Open Group Chat
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleCreate} className="space-y-4">
              {errorMsg && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* Group Avatar & Upload */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-2">
                  Group Profile Picture
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={groupAvatar}
                      alt="Group Avatar Preview"
                      className="w-14 h-14 rounded-2xl bg-purple-950 border border-purple-700/50 object-cover shadow"
                    />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>

                      {groupAvatar !== DEFAULT_GROUP_AVATAR && (
                        <button
                          type="button"
                          onClick={() => setGroupAvatar(DEFAULT_GROUP_AVATAR)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-purple-800/50 text-purple-300 hover:text-white text-xs transition-colors cursor-pointer"
                          title="Reset to default icon"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-purple-300/60 leading-none">
                      JPG, PNG or SVG from your device
                    </p>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Group Name */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  maxLength={50}
                  placeholder="Group name"
                  className="w-full px-3.5 py-2.5 bg-[#0c0819] border border-purple-900/40 rounded-xl text-white text-sm placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Group Description */}
              <div>
                <label className="block text-xs font-semibold text-purple-200 mb-1.5">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                  placeholder="Description (optional)"
                  className="w-full px-3.5 py-2 bg-[#0c0819] border border-purple-900/40 rounded-xl text-white text-xs placeholder-purple-300/30 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Footer info */}
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/30 text-[11px] text-purple-300/70 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <span>
                  A unique 6-character Group Code will be generated automatically for joining.
                </span>
              </div>

              {/* Actions */}
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
                  disabled={loading || !groupName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Group</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;

