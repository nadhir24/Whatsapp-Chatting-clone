import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const { user, isAuthenticated, decryptMessage } = useAuth();

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      const newSocket = io('/', { autoConnect: true });
      
      newSocket.on('connect', () => {
        console.log('Connected to socket server');
        setConnected(true);
        
        // Authenticate with the server
        newSocket.emit('authenticate', { token });
      });
      
      newSocket.on('authenticated', (data) => {
        console.log('Socket authenticated:', data.username);
        setChats(data.chats || []);
      });
      
      newSocket.on('user_status', (data) => {
        setUsers(prevUsers => {
          const updatedUsers = [...prevUsers];
          const userIndex = updatedUsers.findIndex(u => u.username === data.username);
          
          if (userIndex !== -1) {
            updatedUsers[userIndex].online = data.status === 'online';
          }
          
          return updatedUsers;
        });
      });
      
      newSocket.on('private_message', (data) => {
        // Handle incoming messages, decrypt if necessary
        if (data.encryptedMessage) {
          const decrypted = decryptMessage(
            data.encryptedMessage, 
            users.find(u => u.username === data.from)?.publicKey
          );
          
          if (decrypted) {
            data.decryptedMessage = decrypted;
          }
        }
        
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(c => c.with === data.from);
          
          if (chatIndex !== -1) {
            const updatedChats = [...prevChats];
            updatedChats[chatIndex].messages = [
              data,
              ...updatedChats[chatIndex].messages
            ];
            return updatedChats;
          } else {
            return [
              ...prevChats,
              {
                with: data.from,
                messages: [data]
              }
            ];
          }
        });
      });
      
      newSocket.on('disconnect', () => {
        console.log('Disconnected from socket server');
        setConnected(false);
      });
      
      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      setSocket(newSocket);
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated, user, decryptMessage]);

  // Load user list when connected
  useEffect(() => {
    const fetchUsers = async () => {
      if (isAuthenticated && connected) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUsers(data);
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }
    };
    
    fetchUsers();
  }, [isAuthenticated, connected]);

  // Send message function
  const sendMessage = (to, message) => {
    if (!socket || !connected) return false;
    
    try {
      // Find recipient's public key
      const recipient = users.find(u => u.username === to);
      if (!recipient) return false;
      
      // Encrypt message
      const encryptedMessage = decryptMessage ? {
        message: message // Plain text for debugging
      } : null;
      
      socket.emit('private_message', {
        to,
        message, // Plain text for demo purposes
        encryptedMessage
      });
      
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  };

  const value = {
    socket,
    connected,
    users,
    chats,
    activeChat,
    setActiveChat,
    sendMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 