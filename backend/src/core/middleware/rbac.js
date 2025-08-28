// backend/src/core/middleware/rbac.js
const authService = require('../../modules/auth/services/authService');
const logger = require('../utils/logger');

// Check if user has specific permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await authService.hasPermission(req.user.userId, permission);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          required: permission
        });
      }

      next();
    } catch (error) {
      logger.error('RBAC permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

// Check if user has any of the specified permissions
const requireAnyPermission = (permissions = []) => {
  return async (req, res, next) => {
    try {
      const hasPermission = await authService.hasAnyPermission(req.user.userId, permissions);
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          required: permissions
        });
      }

      next();
    } catch (error) {
      logger.error('RBAC any permission check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking permissions'
      });
    }
  };
};

// Check if user has specific role
const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      const hasRole = await authService.hasRole(req.user.userId, roleName, req.user.schoolId);
      
      if (!hasRole) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient role.',
          required: roleName
        });
      }

      next();
    } catch (error) {
      logger.error('RBAC role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking role'
      });
    }
  };
};

// Ensure user can only access their own school's data
const requireSchoolAccess = (req, res, next) => {
  const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;
  
  if (schoolId && schoolId !== req.user.schoolId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Cannot access other school\'s data.'
    });
  }

  next();
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireSchoolAccess
};