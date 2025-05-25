import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import * as nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const register = async (username, password) => {
    try {
      const response = await axios.post('/api/register', { username, password });
      const { token, publicKey, privateKey } = response.data;
      
      const userData = {
        username,
        publicKey,
        privateKey
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/login', { username, password });
      const { token, publicKey, privateKey } = response.data;
      
      const userData = {
        username,
        publicKey,
        privateKey
      };
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Encryption utilities using TweetNaCl
  const encryptMessage = (message, recipientPublicKey) => {
    const nonce = nacl.randomBytes(24);
    const privateKeyUint8 = decodeBase64(user.privateKey);
    const publicKeyUint8 = decodeBase64(recipientPublicKey);
    const messageUint8 = new TextEncoder().encode(message);
    
    const encrypted = nacl.box(
      messageUint8,
      nonce,
      publicKeyUint8,
      privateKeyUint8
    );
    
    return {
      encrypted: encodeBase64(encrypted),
      nonce: encodeBase64(nonce)
    };
  };

  const decryptMessage = (encryptedData, senderPublicKey) => {
    try {
      const { encrypted, nonce } = encryptedData;
      const privateKeyUint8 = decodeBase64(user.privateKey);
      const publicKeyUint8 = decodeBase64(senderPublicKey);
      const encryptedUint8 = decodeBase64(encrypted);
      const nonceUint8 = decodeBase64(nonce);
      
      const decrypted = nacl.box.open(
        encryptedUint8,
        nonceUint8,
        publicKeyUint8,
        privateKeyUint8
      );
      
      if (!decrypted) return null;
      
      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    encryptMessage,
    decryptMessage
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 