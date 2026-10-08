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

// MongoDB Connection
const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lms_db';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected successfully to:', mongoURI.includes('@') ? 'MongoDB Atlas Cloud' : 'Local MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

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
