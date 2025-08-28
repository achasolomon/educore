// backend/src/modules/auth/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const authMiddleware = require('../../../core/middleware/auth');
const { registerValidator, loginValidator, changePasswordValidator } = require('../validators/authValidators');

// Public routes
router.post('/register', registerValidator, AuthController.register);
router.post('/login', loginValidator, AuthController.login);

// Protected routes
router.use(authMiddleware); // Apply auth middleware to all routes below
router.get('/me', AuthController.me);
router.post('/logout', AuthController.logout);
router.post('/change-password', changePasswordValidator, AuthController.changePassword);

module.exports = router;
