import React from 'react';
import { useChat } from '../../context/ChatContext';
import SidebarHeader from './SidebarHeader';
import ChatList from './ChatList';
import SidebarNav from './SidebarNav';

const LeftSidebar = () => {
  const { mobileView } = useChat();

  return (
    <aside
      className={`h-full flex-col border-r border-purple-900/30 bg-[#130f24] w-full md:w-80 lg:w-[350px] flex-shrink-0 ${
        mobileView === 'list' ? 'flex' : 'hidden md:flex'
      }`}
    >
      <SidebarHeader />
      <ChatList />
      <SidebarNav />
    </aside>
  );
};

export default LeftSidebar;

