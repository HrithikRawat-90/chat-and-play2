import React from 'react';
import { SocketProvider } from '../context/SocketContext';
import { ChatProvider } from '../context/ChatContext';
import { GameProvider } from '../games/GameContext';
import ChatContainer from '../components/chat/ChatContainer';

const ChatDashboard = () => {
  return (
    <SocketProvider>
      <ChatProvider>
        <GameProvider>
          <ChatContainer />
        </GameProvider>
      </ChatProvider>
    </SocketProvider>
  );
};

export default ChatDashboard;
