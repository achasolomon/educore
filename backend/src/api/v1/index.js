// backend/src/api/v1/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('../../modules/auth/routes/authRoutes');
const userRoutes = require('../../modules/auth/routes/userRoutes');
const schoolRoutes = require('../../modules/settings/routes/schoolRoutes');
const studentRoutes = require('../../modules/students/routes/studentRoutes');
const academicRoutes = require('../../modules/academics/routes/academicRoutes');
const assessmentRoutes = require('../../modules/academics/routes/assessmentRoutes');
const resultRoutes = require('../../modules/academics/routes/resultRoutes');
const scratchCardRoutes = require('../../modules/academics/routes/scratchCardRoutes');
const reportRoutes = require('../../modules/reports/routes/reportRoutes');
const analyticsRoutes = require('../../modules/analytics/routes/analyticsRoutes');
const communicationRoutes = require('../../modules/communication/routes/communicationRoutes');
const staffRoutes = require('../../modules/staff/routes/staffRoutes');
const financeRoutes = require('../../modules/finance/routes/financeRoutes');
const transportRoutes = require('../../modules/transport/routes/transportRoutes');
const libraryRoutes = require('../../modules/libray/routes');

// console.log('Type of authRoutes:', typeof authRoutes);
// console.log('authRoutes:', authRoutes);

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/school', schoolRoutes);
router.use('/students', studentRoutes);
router.use('/academics', academicRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/results', resultRoutes);
router.use('/scratch-cards', scratchCardRoutes);
router.use('/reports', reportRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/communication', communicationRoutes);
router.use('/staff', staffRoutes);
router.use('/finance', financeRoutes);
router.use('/transport', transportRoutes);
router.use('/library', libraryRoutes);

// API status endpoint
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'EduCore API v1 is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    modules: ['auth', 'users', 'school', 'students', 'academics']
  });
});

module.exports = router;