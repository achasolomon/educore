// backend/src/modules/auth/controllers/authController.js
const User = require('../models/User');
const School = require('../models/School');
const authService = require('../services/authService');
const logger = require('../../../core/utils/logger');
const { validationResult } = require('express-validator');

class AuthController {
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { schoolCode, email, password, firstName, lastName, phone, role = 'school_admin' } = req.body;

      // Find school by code
      const school = await School.findByCode(schoolCode);
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmailAndSchool(email, school.id);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists in this school'
        });
      }

      // Create user
      const userData = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        phone
      };

      const user = await User.create(userData, school.id);

      // Assign role
      const roleData = await authService.getRoleByName(role);
      if (roleData) {
        await User.assignRole(user.id, roleData.id, school.id);
      }

      // Generate token
      const token = User.generateToken({ ...user, school_id: school.id });

      logger.info(`New user registered: ${email} for school: ${school.name}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            status: user.status
          },
          school: {
            id: school.id,
            name: school.name,
            code: school.code
          },
          token
        }
      });

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during registration'
      });
    }
  }

  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password, schoolCode } = req.body;

      // Find school
      const school = await School.findByCode(schoolCode);
      if (!school) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Find user
      const user = await User.findByEmailAndSchool(email, school.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check password
      const isValidPassword = await User.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check user status
      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Account is not active. Please contact administrator.'
        });
      }

      // Get user with roles and permissions
      const userWithRoles = await User.findWithRoles(user.id);
      const permissions = await User.getUserPermissions(user.id);

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate token
      const token = User.generateToken(user);

      logger.info(`User logged in: ${email} from school: ${school.name}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            status: user.status,
            roles: userWithRoles.roles || [],
            permissions: permissions.map(p => p.name)
          },
          school: {
            id: school.id,
            name: school.name,
            code: school.code,
            type: school.type
          },
          token
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during login'
      });
    }
  }

  static async me(req, res) {
    try {
      const user = await User.findWithRoles(req.user.userId);
      const permissions = await User.getUserPermissions(req.user.userId);
      const school = await School.findById(req.user.schoolId);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            avatar: user.avatar_url,
            status: user.status,
            roles: user.roles || [],
            permissions: permissions.map(p => p.name),
            lastLogin: user.last_login_at
          },
          school: {
            id: school.id,
            name: school.name,
            code: school.code,
            type: school.type
          }
        }
      });

    } catch (error) {
      logger.error('Get user profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user profile'
      });
    }
  }

  static async logout(req, res) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just send a success response
      logger.info(`User logged out: ${req.user.email}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Error during logout'
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;

      // Get current user with password
      const user = await User.findByEmailAndSchool(req.user.email, req.user.schoolId);
      
      // Verify current password
      const isValidCurrentPassword = await User.verifyPassword(currentPassword, user.password_hash);
      if (!isValidCurrentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      await User.updatePassword(userId, newPassword);

      logger.info(`Password changed for user: ${req.user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Error changing password'
      });
    }
  }
}

module.exports = AuthController;