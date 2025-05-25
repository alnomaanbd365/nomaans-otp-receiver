const express = require('express');
const axios = require('axios');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter);

// Premiumy API Configuration
const API_KEY = process.env.PREMIUMY_API_KEY;
const BASE_URL = 'https://client.premiumy.net/api/v2';

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('New client connected');
  
  socket.on('disconnect', () => {
    logger.info('Client disconnected');
  });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

// Fetch All Rented Numbers
app.get('/api/numbers', async (req, res, next) => {
  try {
    const response = await axios.get(`${BASE_URL}/numbers`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    });
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Fetch Messages for a Number
app.get('/api/messages', async (req, res, next) => {
  const { number_id, limit, service } = req.query;
  try {
    const response = await axios.get(`${BASE_URL}/messages`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      params: { number_id, limit, service }
    });
    
    // Emit new messages to connected clients
    io.emit('newMessage', response.data);
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Fetch Messages for a Specific Number
app.get('/api/messages/specific', async (req, res, next) => {
  const { phone_number, service } = req.query;
  try {
    const response = await axios.get(`${BASE_URL}/messages/specific`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
      params: { phone_number, service }
    });
    
    // Emit new messages to connected clients
    io.emit('newMessage', response.data);
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Rent a New Number
app.post('/api/rent', async (req, res, next) => {
  try {
    const { service, country, quantity } = req.body;
    
    // Validate service
    if (!['facebook', 'telegram'].includes(service)) {
      return res.status(400).json({ error: 'Invalid service. Must be facebook or telegram' });
    }
    
    const response = await axios.post(`${BASE_URL}/rent`, {
      service,
      country,
      quantity
    }, {
      headers: { 
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Notify all clients about new number
    io.emit('newNumber', response.data);
    
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

// Get Available Services
app.get('/api/services', (req, res) => {
  res.json([
    { id: 'facebook', name: 'Facebook' },
    { id: 'telegram', name: 'Telegram' }
  ]);
});

// Apply error handling middleware
app.use(errorHandler);

// Start Server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
}); 