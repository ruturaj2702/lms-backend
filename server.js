require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

const app = express();

// Middleware
app.use(express.json());

// Support CORS & Production as instructed in Experiment 8
const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend-url.vercel.app",
  "https://lms-mern.vercel.app",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. Postman, mobile, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    // Permissive callback for testing across custom preview URLs
    return callback(null, true);
  },
  credentials: true
}));

// MongoDB Connection String Resolution & Sanitization
let rawURI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL || '';
rawURI = rawURI.trim();
// Strip accidental surrounding single or double quotes
if ((rawURI.startsWith('"') && rawURI.endsWith('"')) || (rawURI.startsWith("'") && rawURI.endsWith("'"))) {
  rawURI = rawURI.slice(1, -1).trim();
}

const mongoURI = rawURI || 'mongodb://127.0.0.1:27017/lms_db';

// Mask password for safe logging
const maskedURI = mongoURI.replace(/:([^@/]+)@/, ':****@');
console.log(`[Database] Connecting to: ${maskedURI}`);

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 15000,
})
  .then(() => {
    console.log(`[Database] Connected successfully to: ${mongoURI.includes('@') ? 'MongoDB Atlas Cloud' : 'Local MongoDB'}`);
  })
  .catch((err) => {
    console.error(`[Database Error] Code: ${err.code || 'N/A'}, Name: ${err.name}`);
    console.error(`[Database Error] Details: ${err.message}`);
    if (mongoURI.includes('127.0.0.1')) {
      console.error(`[Database Hint] MONGO_URI environment variable is missing on Render! Add MONGO_URI under the Environment tab.`);
    } else if (err.message.includes('bad auth') || err.message.includes('Authentication failed')) {
      console.error(`[Database Hint] Atlas username/password is incorrect. Check Atlas -> Database Access -> Edit user password.`);
    } else if (err.message.includes('Server selection timed out') || err.message.includes('ETIMEDOUT')) {
      console.error(`[Database Hint] Atlas IP whitelist blocked Render. Check Atlas -> Network Access -> Add IP Address 0.0.0.0/0.`);
    }
  });

// Root & Healthcheck endpoints for Render
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'LMS Backend API is running successfully on Render / Cloud',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
