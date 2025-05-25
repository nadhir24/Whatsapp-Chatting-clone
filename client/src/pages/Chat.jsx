import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

const Chat = () => {
  const { user, logout } = useAuth();
  const { activeChat, users, chats } = useSocket();

  return (
    <Container>
      <Sidebar users={users} chats={chats} currentUser={user} onLogout={logout} />
      
      {activeChat ? (
        <ChatWindow />
      ) : (
        <EmptyState>
          <EmptyStateContent>
            <EmptyStateIcon>💬</EmptyStateIcon>
            <EmptyStateTitle>WhatsApp Clone</EmptyStateTitle>
            <EmptyStateText>
              Select a chat to start messaging
            </EmptyStateText>
          </EmptyStateContent>
        </EmptyState>
      )}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f0f2f5;
`;

const EmptyStateContent = styled.div`
  text-align: center;
  padding: 20px;
`;

const EmptyStateIcon = styled.div`
  font-size: 50px;
  margin-bottom: 20px;
`;

const EmptyStateTitle = styled.h2`
  color: #128C7E;
  margin-bottom: 10px;
`;

const EmptyStateText = styled.p`
  color: #667781;
  font-size: 14px;
`;

export default Chat; 