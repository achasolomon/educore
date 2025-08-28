// backend/src/core/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../../modules/auth/models/User');
const School = require('../../modules/auth/models/School');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active.'
      });
    }

    // Get school details
    const school = await School.findById(decoded.schoolId);
    if (!school || school.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'School account is not active.'
      });
    }

    // Add user and school info to request
    req.user = {
      userId: decoded.userId,
      schoolId: decoded.schoolId,
      email: decoded.email,
      user: user,
      school: school
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.'
      });
    }
    
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = authMiddleware;