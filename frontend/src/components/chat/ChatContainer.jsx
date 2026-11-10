import React from 'react';
import { useChat } from '../../context/ChatContext';
import { useGame } from '../../games/GameContext';
import LeftSidebar from './LeftSidebar';
import ChatHeader from './ChatHeader';
import MessageFeed from './MessageFeed';
import MessageInput from './MessageInput';
import ContactInfo from './ContactInfo';
import EmptyChatState from './EmptyChatState';
import UserSearchModal from './UserSearchModal';
import TicTacToeModal from '../../games/TicTacToeModal';
import GameInviteBanner from '../../games/GameInviteBanner';

const ChatContainer = () => {
  const { activeConversation, mobileView } = useChat();
  const { sendInvite } = useGame();

  const handlePlayTogether = () => {
    if (activeConversation) {
      sendInvite(activeConversation._id);
    }
  };

  return (
    <div className="flex h-screen h-[100dvh] w-screen overflow-hidden bg-[#090614] text-[#e2e8f0]">
      {/* 1. Left Sidebar */}
      <LeftSidebar />

      {/* 2. Center Chat Panel */}
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
            <MessageInput />
          </>
        ) : (
          <EmptyChatState />
        )}
      </main>

      {/* 3. Right Sidebar (Collapsible Contact Information) */}
      {activeConversation && <ContactInfo />}

      {/* User Search & Discovery Modal */}
      <UserSearchModal />

      {/* Real-Time Multiplayer Tic-Tac-Toe Modal */}
      <TicTacToeModal />
    </div>
  );
};

export default ChatContainer;
