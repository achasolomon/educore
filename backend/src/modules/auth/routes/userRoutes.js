
// backend/src/modules/auth/routes/userRoutes.js - Updated with validation
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');
const { handleValidationErrors } = require('../../../core/middleware/validation');
const { 
  createUserValidator, 
  updateUserValidator, 
  getUsersValidator, 
  userIdValidator 
} = require('../validators/userValidators');

// Apply authentication to all user routes
router.use(authMiddleware);

// User management routes with validation
router.get('/', 
  getUsersValidator, 
  handleValidationErrors,
  requirePermission('users:read'), 
  UserController.getUsers
);

router.get('/stats', 
  requirePermission('users:read'), 
  UserController.getUserStats
);

router.get('/:id', 
  userIdValidator,
  handleValidationErrors,
  requirePermission('users:read'), 
  UserController.getUser
);

router.post('/', 
  createUserValidator,
  handleValidationErrors,
  requirePermission('users:create'), 
  UserController.createUser
);

router.put('/:id', 
  updateUserValidator,
  handleValidationErrors,
  requirePermission('users:update'), 
  UserController.updateUser
);

router.delete('/:id', 
  userIdValidator,
  handleValidationErrors,
  requirePermission('users:delete'), 
  UserController.deleteUser
);

module.exports = router;