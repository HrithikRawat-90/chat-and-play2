import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useGame } from '../../games/GameContext';
import LeftSidebar from './LeftSidebar';
import ChatHeader from './ChatHeader';
import MessageFeed from './MessageFeed';
import MessageInput from './MessageInput';
import ContactInfo from './ContactInfo';
import EmptyChatState from './EmptyChatState';
import UserSearchModal from './UserSearchModal';
import SettingsModal from './SettingsModal';
import CreateGroupModal from './CreateGroupModal';
import JoinGroupModal from './JoinGroupModal';
import TicTacToeModal from '../../games/TicTacToeModal';
import GameInviteBanner from '../../games/GameInviteBanner';

const ChatContainer = () => {
  const chat = useChat();
  const { activeConversation, mobileView } = chat;
  const { sendInvite, activeGame, exitGame } = useGame();
  const backAction = useRef(() => {});

  backAction.current = () => {
    if (activeGame) exitGame(activeGame.gameId);
    else if (chat.isSettingsOpen) chat.setIsSettingsOpen(false);
    else if (chat.isCreateGroupOpen) chat.setIsCreateGroupOpen(false);
    else if (chat.isJoinGroupOpen) chat.setIsJoinGroupOpen(false);
    else if (chat.isSearchModalOpen) chat.setIsSearchModalOpen(false);
    else if (chat.isOptionsMenuOpen) chat.setIsOptionsMenuOpen(false);
    else if (chat.isRightSidebarOpen && mobileView === 'chat') chat.toggleRightSidebar();
    else if (mobileView === 'chat') chat.setMobileView('list');
    else if (chat.activeTab !== 'chat') chat.setActiveTab('chat');
  };

  // Keep one same-URL history entry available for the device Back button.
  useEffect(() => {
    const isMobile = () => window.matchMedia('(max-width: 767px)').matches;
    const addBackEntry = () => {
      if (isMobile() && !window.history.state?.chatPlayBack) {
        window.history.pushState({ ...window.history.state, chatPlayBack: true }, '', window.location.href);
      }
    };
    const handleBack = () => {
      if (!isMobile()) return;
      backAction.current();
      addBackEntry();
    };
    addBackEntry();
    window.addEventListener('popstate', handleBack);
    window.addEventListener('resize', addBackEntry);
    return () => {
      window.removeEventListener('popstate', handleBack);
      window.removeEventListener('resize', addBackEntry);
    };
  }, []);

  // Prevent mobile keyboard from scrolling the window / displacing the header
  useEffect(() => {
    const lockScroll = () => {
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener('scroll', lockScroll, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', lockScroll, { passive: true });
    }
    return () => {
      window.removeEventListener('scroll', lockScroll);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('scroll', lockScroll);
      }
    };
  }, []);

  const handlePlayTogether = () => {
    if (activeConversation) {
      sendInvite(activeConversation._id);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full flex overflow-hidden bg-[#090614] text-[#e2e8f0]">
      <LeftSidebar />

      <main
        className={`flex-1 flex flex-col h-full min-w-0 bg-[#0d091d] relative overflow-hidden ${
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeConversation ? (
          <>
            <ChatHeader onPlayTogetherClick={handlePlayTogether} />
            <GameInviteBanner />
            <MessageFeed />
            {activeConversation.isModerationInbox ? (
              <div className="px-4 py-3 text-center text-xs text-zinc-400 bg-[#121214]">Reports are delivered here by Chatbot.</div>
            ) : <MessageInput />}
          </>
        ) : (
          <EmptyChatState />
        )}
      </main>

      {activeConversation && <ContactInfo />}

      <UserSearchModal />

      <SettingsModal />

      <CreateGroupModal />
      <JoinGroupModal />

      <TicTacToeModal />
    </div>
  );
};

export default ChatContainer;
