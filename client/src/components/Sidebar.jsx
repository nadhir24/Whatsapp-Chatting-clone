import React, { useState } from 'react';
import styled from 'styled-components';
import { useSocket } from '../context/SocketContext';

const Sidebar = ({ users, chats, currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('chats');
  const { setActiveChat } = useSocket();

  const handleChatClick = (username) => {
    setActiveChat(username);
  };

  return (
    <Container>
      <Header>
        <UserInfo>
          <UserAvatar>{currentUser?.username?.charAt(0).toUpperCase()}</UserAvatar>
          <UserName>{currentUser?.username}</UserName>
        </UserInfo>
        <Actions>
          <LogoutButton onClick={onLogout}>Logout</LogoutButton>
        </Actions>
      </Header>

      <TabsContainer>
        <Tab 
          active={activeTab === 'chats'} 
          onClick={() => setActiveTab('chats')}
        >
          Chats
        </Tab>
        <Tab 
          active={activeTab === 'users'} 
          onClick={() => setActiveTab('users')}
        >
          Users
        </Tab>
      </TabsContainer>

      <Content>
        {activeTab === 'chats' ? (
          chats && chats.length > 0 ? (
            <List>
              {chats.map((chat) => (
                <ListItem key={chat.with} onClick={() => handleChatClick(chat.with)}>
                  <Avatar>{chat.with.charAt(0).toUpperCase()}</Avatar>
                  <Details>
                    <Name>{chat.with}</Name>
                    {chat.messages && chat.messages.length > 0 && (
                      <LastMessage>
                        {chat.messages[0].message}
                      </LastMessage>
                    )}
                  </Details>
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyList>No chats yet</EmptyList>
          )
        ) : (
          users && users.length > 0 ? (
            <List>
              {users.map((user) => (
                <ListItem key={user.username} onClick={() => handleChatClick(user.username)}>
                  <Avatar>{user.username.charAt(0).toUpperCase()}</Avatar>
                  <Details>
                    <Name>{user.username}</Name>
                    <Status online={user.online}>
                      {user.online ? 'Online' : 'Offline'}
                    </Status>
                  </Details>
                </ListItem>
              ))}
            </List>
          ) : (
            <EmptyList>No users available</EmptyList>
          )
        )}
      </Content>
    </Container>
  );
};

const Container = styled.div`
  width: 350px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  background-color: white;
`;

const Header = styled.div`
  padding: 15px;
  background-color: #128C7E;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #0C6B58;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  font-weight: bold;
`;

const UserName = styled.div`
  font-weight: 500;
`;

const Actions = styled.div``;

const LogoutButton = styled.button`
  background-color: transparent;
  border: 1px solid white;
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  border-bottom: 1px solid #e0e0e0;
`;

const Tab = styled.div`
  flex: 1;
  text-align: center;
  padding: 15px;
  cursor: pointer;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
  color: ${props => props.active ? '#128C7E' : '#666'};
  border-bottom: ${props => props.active ? '2px solid #128C7E' : 'none'};
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
`;

const ListItem = styled.div`
  display: flex;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const Avatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #128C7E;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
  font-size: 18px;
`;

const Details = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Name = styled.div`
  font-weight: 500;
  margin-bottom: 5px;
`;

const LastMessage = styled.div`
  color: #667781;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const Status = styled.div`
  color: ${props => props.online ? '#4CAF50' : '#9E9E9E'};
  font-size: 13px;
`;

const EmptyList = styled.div`
  padding: 20px;
  text-align: center;
  color: #667781;
`;

export default Sidebar; 