const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware - IMPORTANT: Order matters!
app.use(cors({
  origin: [
    'https://flat-expense-tracker-hdcaxfalq-sawan-pandeys-projects.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5500',
    /\.vercel\.app$/  // Allow all Vercel preview URLs
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'admin-password', 'Authorization']
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.log('❌ MongoDB Error:', err));

// Routes
app.use('/api/flatmates', require('./routes/flatmateRoutes'));
app.use('/api/turns', require('./routes/turnRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/settlements', require('./routes/settlementRoutes'));

// Test Route
app.get('/', (req, res) => {
  res.json({ message: 'Flat Expense Tracker API is running!' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Export for Vercel
module.exports = app;