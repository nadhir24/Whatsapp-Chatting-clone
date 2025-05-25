import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const ChatWindow = () => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const { activeChat, chats, sendMessage, users } = useSocket();
  
  const currentChat = chats.find(chat => chat.with === activeChat);
  const chatMessages = currentChat?.messages || [];
  const recipient = users.find(u => u.username === activeChat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    const success = sendMessage(activeChat, message);
    
    if (success) {
      setMessage('');
    }
  };

  return (
    <Container>
      <Header>
        <Avatar>{activeChat?.charAt(0).toUpperCase()}</Avatar>
        <UserInfo>
          <UserName>{activeChat}</UserName>
          <Status online={recipient?.online}>
            {recipient?.online ? 'Online' : 'Offline'}
          </Status>
        </UserInfo>
      </Header>

      <MessagesContainer>
        {chatMessages.length > 0 ? (
          chatMessages.map((msg, index) => (
            <MessageBubble 
              key={index} 
              sent={msg.from === user.username}
            >
              <MessageText>{msg.message}</MessageText>
              <MessageTime>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </MessageTime>
            </MessageBubble>
          ))
        ) : (
          <EmptyChat>
            <EmptyChatText>No messages yet</EmptyChatText>
            <EmptyChatSubtext>Send a message to start the conversation</EmptyChatSubtext>
          </EmptyChat>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer onSubmit={handleSendMessage}>
        <Input
          type="text"
          placeholder="Type a message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <SendButton type="submit" disabled={!message.trim()}>
          Send
        </SendButton>
      </InputContainer>
    </Container>
  );
};

const Container = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  padding: 15px;
  background-color: #f0f2f5;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #128C7E;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-weight: bold;
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 500;
`;

const Status = styled.div`
  font-size: 13px;
  color: ${props => props.online ? '#4CAF50' : '#9E9E9E'};
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #e5ddd5;
  display: flex;
  flex-direction: column;
`;

const MessageBubble = styled.div`
  max-width: 65%;
  padding: 10px 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  position: relative;
  align-self: ${props => props.sent ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.sent ? '#dcf8c6' : 'white'};
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.1);
`;

const MessageText = styled.div`
  word-wrap: break-word;
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #999;
  text-align: right;
  margin-top: 5px;
`;

const InputContainer = styled.form`
  display: flex;
  padding: 10px;
  background-color: #f0f2f5;
  border-top: 1px solid #e0e0e0;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 20px;
  outline: none;
  font-size: 15px;
  margin-right: 10px;
`;

const SendButton = styled.button`
  background-color: #128C7E;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 0 20px;
  font-weight: 500;
  cursor: pointer;
  
  &:disabled {
    background-color: #66a59e;
    cursor: not-allowed;
  }
`;

const EmptyChat = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #667781;
`;

const EmptyChatText = styled.div`
  font-size: 18px;
  margin-bottom: 10px;
`;

const EmptyChatSubtext = styled.div`
  font-size: 14px;
`;

export default ChatWindow; 