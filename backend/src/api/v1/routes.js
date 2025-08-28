// backend/src/api/v1/routes.js (Alternative organization)
const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'EduCore API v1',
    timestamp: new Date().toISOString() 
  });
});

// Import and mount module routes
const authRoutes = require('../../modules/auth/routes/authRoutes');
const userRoutes = require('../../modules/auth/routes/userRoutes'); // We'll create this next

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router; 