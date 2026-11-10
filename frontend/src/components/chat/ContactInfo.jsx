import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import api from '../../services/api';
import {
  X,
  ChevronRight,
  Bell,
  Ban,
  Flag,
  Trash2,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Copy,
  Users,
  KeyRound,
} from 'lucide-react';

const REPORT_REASONS = [
  'Spam or unwanted advertising',
  'Harassment or abusive behavior',
  'Inappropriate content or avatar',
  'Scam, fraud, or impersonation',
  'Other violation',
];

const ContactInfo = () => {
  const {
    activeConversation,
    getOtherParticipant,
    isRightSidebarOpen,
    toggleRightSidebar,
    messages,
    isUserOnline,
    deleteActiveConversation,
  } = useChat();

  const [isBlocked, setIsBlocked] = useState(false);
  const [loadingBlock, setLoadingBlock] = useState(false);

  // Modals state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const contact = getOtherParticipant(activeConversation);
  const contactId = (contact?._id || contact?.id)?.toString();

  // Check initial block status whenever contact changes
  useEffect(() => {
    if (!contactId) return;
    let isMounted = true;
    const checkBlocked = async () => {
      try {
        const res = await api.get('/users/me/blocked');
        if (res.data.success && isMounted) {
          const blockedIds = (res.data.blockedUsers || []).map((id) =>
            typeof id === 'object' ? (id._id || id.id || id).toString() : id.toString()
          );
          setIsBlocked(blockedIds.includes(contactId));
        }
      } catch (err) {
        console.warn('Could not retrieve blocked list:', err.message);
      }
    };
    checkBlocked();
    return () => {
      isMounted = false;
    };
  }, [contactId]);

  if (!isRightSidebarOpen || !contact) return null;

  const isGroup = Boolean(activeConversation?.isGroup);
  const name = isGroup ? activeConversation?.groupName : (contact?.name || 'Contact Info');
  const isBot = Boolean(contact?.isBot || name === 'Chatbot');
  const firstName = name.split(' ')[0];
  const avatar =
    (isGroup ? activeConversation?.groupAvatar : contact?.profilePicture) ||
    `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`;
  const bio = isGroup
    ? activeConversation?.groupDescription || `Group join code: ${activeConversation?.groupCode}`
    : contact?.bio || 'Hey there! I am using Chat & Play.';
  const isOnline = isBot ? true : (contactId ? isUserOnline(contactId) : Boolean(contact?.isOnline));
  const groupCode = activeConversation?.groupCode;

  // Extract real shared images from current conversation messages
  const sharedMedia = (messages || [])
    .filter((m) => m.imageUrl && m.imageUrl.trim() !== '')
    .map((m) => m.imageUrl);

  // Handle Block / Unblock Toggle
  const handleToggleBlock = async () => {
    if (!contactId || loadingBlock) return;
    setLoadingBlock(true);
    try {
      const res = await api.post(`/users/block/${contactId}`);
      if (res.data.success) {
        setIsBlocked(res.data.isBlocked);
        showToast(
          res.data.isBlocked
            ? `Blocked ${firstName}. They can no longer challenge you.`
            : `Unblocked ${firstName}.`
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update block status');
    } finally {
      setLoadingBlock(false);
    }
  };

  // Handle Report Submission
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!contactId || isSubmittingReport) return;
    setIsSubmittingReport(true);
    try {
      const res = await api.post('/users/report', {
        reportedUserId: contactId,
        reason: reportReason,
        details: reportDetails.trim(),
      });
      if (res.data.success) {
        setShowReportModal(false);
        setReportDetails('');
        showToast('Report submitted. Our moderation team has received it.');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Handle Chat Deletion
  const handleConfirmDelete = async () => {
    if (isDeletingChat) return;
    setIsDeletingChat(true);
    try {
      const res = await deleteActiveConversation();
      if (res.success) {
        setShowDeleteModal(false);
        showToast('Chat history deleted.');
      } else {
        showToast(res.message || 'Could not delete chat');
      }
    } catch (err) {
      showToast('Error deleting conversation');
    } finally {
      setIsDeletingChat(false);
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay to close bio */}
      <div
        onClick={toggleRightSidebar}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden cursor-pointer"
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-80 lg:static lg:w-[320px] lg:h-full bg-[#130f24] border-l border-purple-900/30 flex flex-col flex-shrink-0 animate-fadeIn select-none overflow-y-auto shadow-2xl lg:shadow-none">
        {/* Toast Feedback */}
      {toastMessage && (
        <div className="absolute top-3 left-3 right-3 z-50 p-2.5 rounded-xl bg-purple-900/95 border border-purple-400 text-white text-xs text-center shadow-lg animate-fadeIn flex items-center justify-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-purple-900/30">
        <h3 className="font-semibold text-white text-base">
          {isGroup ? 'Group Details' : 'Contact Info'}
        </h3>
        <button
          onClick={toggleRightSidebar}
          className="p-1.5 rounded-lg text-purple-300/70 hover:text-white hover:bg-purple-900/40 transition-colors cursor-pointer"
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
          {isOnline && !isGroup && (
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full ring-4 ring-[#130f24]" />
          )}
        </div>

        <h4 className="font-bold text-white text-lg tracking-tight mb-1">{name}</h4>
        <p className="text-xs text-purple-300/70 px-4 line-clamp-3 italic">
          "{bio}"
        </p>
        <span
          className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
            isGroup || isOnline
              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30'
              : 'bg-gray-900/40 text-gray-400 border border-gray-700/30'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isGroup || isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`} />
          {isGroup ? `${activeConversation.participants?.length || 1} Members Active` : isOnline ? 'Online now' : 'Offline'}
        </span>
      </div>

      {/* If group, show Group Join Code box */}
      {isGroup && groupCode && (
        <div className="p-4 border-b border-purple-900/30 bg-[#0e0a1f]">
          <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                Group Join Code
              </span>
              <span className="font-mono text-base font-extrabold text-white tracking-widest">
                {groupCode}
              </span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(groupCode);
                showToast('Group Code copied to clipboard!');
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
        </div>
      )}

      {/* Group Members Section */}
      {isGroup && (
        <div className="p-4 border-b border-purple-900/30">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Group Members ({activeConversation.participants?.length || 0})</span>
            </span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(activeConversation.participants || []).map((p) => {
              const pId = (p._id || p.id || p)?.toString();
              const pName = p.name || 'Member';
              const pAvatar =
                p.profilePicture ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(pName)}`;
              const isAdmin =
                activeConversation.groupAdmin &&
                (activeConversation.groupAdmin._id || activeConversation.groupAdmin)?.toString() ===
                  pId;

              return (
                <div key={pId} className="flex items-center justify-between py-1 px-1 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={pAvatar}
                      alt={pName}
                      className="w-7 h-7 rounded-full object-cover bg-purple-950 border border-purple-800/40"
                    />
                    <span className="text-xs text-white font-medium truncate">{pName}</span>
                  </div>
                  {isAdmin && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40">
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Media, Links and Files: ONLY rendered if actual media has been shared in this chat */}
      {sharedMedia.length > 0 && (
        <div className="p-4 border-b border-purple-900/30">
          <div className="flex items-center justify-between mb-3 text-xs font-semibold text-purple-200/80">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>Shared Media ({sharedMedia.length})</span>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {sharedMedia.slice(0, 8).map((img, i) => (
              <a
                key={i}
                href={img}
                target="_blank"
                rel="noopener noreferrer"
                className="aspect-square rounded-xl overflow-hidden border border-purple-900/40 hover:border-purple-500/60 transition-all cursor-pointer block"
                title="View full image"
              >
                <img
                  src={img}
                  alt="Shared media"
                  className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                />
              </a>
            ))}
          </div>
        </div>
      )}

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
        {/* 1. Block / Unblock Contact Button */}
        <button
          onClick={handleToggleBlock}
          disabled={loadingBlock}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded-xl transition-all text-left cursor-pointer ${
            isBlocked
              ? 'text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 hover:bg-emerald-950/50'
              : 'text-purple-300 hover:text-white hover:bg-purple-950/40'
          }`}
        >
          {loadingBlock ? (
            <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          ) : isBlocked ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Ban className="w-4 h-4 text-red-400/80" />
          )}
          <span>{isBlocked ? `Unblock ${firstName}` : `Block ${firstName}`}</span>
        </button>

        {/* 2. Report Contact Button */}
        <button
          onClick={() => setShowReportModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-950/40 rounded-xl transition-colors text-left cursor-pointer"
        >
          <Flag className="w-4 h-4 text-amber-400/80" />
          <span>Report Contact</span>
        </button>

        {/* 3. Delete Chat Button */}
        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl transition-colors text-left cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Chat</span>
        </button>
      </div>

      {/* Modal: Report Contact */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#16102e] border border-purple-800/50 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-purple-900/40">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-semibold text-white text-sm">Report {name}</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-lg text-purple-400 hover:text-white hover:bg-purple-900/30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4 text-xs">
              <div>
                <label className="block text-purple-200/80 mb-2 font-medium">
                  Select a reason for reporting:
                </label>
                <div className="space-y-1.5">
                  {REPORT_REASONS.map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-950/50 cursor-pointer border border-purple-900/30"
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={reason}
                        checked={reportReason === reason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-purple-200">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-purple-200/80 mb-1 font-medium">
                  Additional Details (Optional):
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide any additional context or details..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-[#0e0a1f] border border-purple-900/50 text-white placeholder-purple-400/40 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-purple-900/30">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 rounded-xl border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-900/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-900/30"
                >
                  {isSubmittingReport && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Submit Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete Chat */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#16102e] border border-red-900/40 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-950/60 border border-red-800/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <h3 className="font-semibold text-white text-sm">Delete Chat with {firstName}?</h3>
            </div>

            <p className="text-xs text-purple-300/80 mb-5 leading-relaxed">
              Are you sure? This will permanently delete the conversation and all messages exchanged with{' '}
              <strong className="text-white">{name}</strong>. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-3.5 py-1.5 rounded-xl border border-purple-800/40 text-purple-300 hover:text-white hover:bg-purple-900/30 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingChat}
                className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-md shadow-red-950/50"
              >
                {isDeletingChat && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Chat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
    </>
  );
};

export default ContactInfo;
