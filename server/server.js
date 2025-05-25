const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nacl = require('tweetnacl');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// In-memory storage (for development without Redis)
const inMemoryDB = {
  users: {},
  chats: {}
};

// Store user connections
const userSockets = {};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user already exists
    if (inMemoryDB.users[username]) {
      return res.status(400).json({ message: 'Username already taken' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate keypair for end-to-end encryption
    const keyPair = nacl.box.keyPair();
    const publicKey = Buffer.from(keyPair.publicKey).toString('base64');
    const privateKey = Buffer.from(keyPair.secretKey).toString('base64');
    
    // Save user
    const user = {
      username,
      password: hashedPassword,
      publicKey,
      privateKey // In a real app, this should be returned to client, not stored server-side
    };
    
    inMemoryDB.users[username] = user;
    
    // Generate JWT
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      username,
      publicKey,
      privateKey
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Get user
    const user = inMemoryDB.users[username];
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      username,
      publicKey: user.publicKey,
      privateKey: user.privateKey
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = [];
    
    for (const username in inMemoryDB.users) {
      if (username !== req.user.username) {
        const user = inMemoryDB.users[username];
        users.push({
          username,
          publicKey: user.publicKey,
          online: !!userSockets[username]
        });
      }
    }
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Authenticate user
  socket.on('authenticate', async (data) => {
    try {
      const { token } = data;
      
      jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', async (err, decoded) => {
        if (err) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }
        
        const { username } = decoded;
        
        // Store user socket
        userSockets[username] = socket.id;
        socket.username = username;
        
        console.log(`User ${username} authenticated`);
        
        // Notify all users about online status
        io.emit('user_status', { username, status: 'online' });
        
        // Get user's chat history
        const chats = [];
        const userChats = inMemoryDB.chats[username] || {};
        
        for (const otherUser in userChats) {
          chats.push({
            with: otherUser,
            messages: userChats[otherUser] || []
          });
        }
        
        socket.emit('authenticated', { username, chats });
      });
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });
  
  // Handle private messages
  socket.on('private_message', async (data) => {
    try {
      const { to, message, encryptedMessage } = data;
      
      if (!socket.username) {
        socket.emit('error', { message: 'Not authenticated' });
        return;
      }
      
      // Create message object
      const messageObj = {
        from: socket.username,
        to,
        message, // For demo only - in a real app, only encrypted message would be stored
        encryptedMessage,
        timestamp: Date.now()
      };
      
      // Store message in both users' chat history
      if (!inMemoryDB.chats[socket.username]) {
        inMemoryDB.chats[socket.username] = {};
      }
      if (!inMemoryDB.chats[to]) {
        inMemoryDB.chats[to] = {};
      }
      
      if (!inMemoryDB.chats[socket.username][to]) {
        inMemoryDB.chats[socket.username][to] = [];
      }
      if (!inMemoryDB.chats[to][socket.username]) {
        inMemoryDB.chats[to][socket.username] = [];
      }
      
      inMemoryDB.chats[socket.username][to].unshift(messageObj);
      inMemoryDB.chats[to][socket.username].unshift(messageObj);
      
      // Send message to recipient if online
      const recipientSocketId = userSockets[to];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('private_message', messageObj);
      }
      
      // Send confirmation back to sender
      socket.emit('message_sent', { success: true, message: messageObj });
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    if (socket.username) {
      console.log(`User ${socket.username} disconnected`);
      delete userSockets[socket.username];
      
      // Notify all users about offline status
      io.emit('user_status', { username: socket.username, status: 'offline' });
    }
  });
});

// Start server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Using in-memory storage (Redis not connected)`);
}); 