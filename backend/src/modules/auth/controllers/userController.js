// backend/src/modules/auth/controllers/userController.js
const User = require('../models/User');
const db = require('../../../core/database/connection');

class UserController {
  // Get all users in school with pagination and filtering
  static async getUsers(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        page = 1, 
        limit = 20, 
        role, 
        status = 'active',
        search 
      } = req.query;

      const offset = (page - 1) * limit;

      let query = db('users')
        .select([
          'users.id',
          'users.email',
          'users.first_name',
          'users.last_name',
          'users.phone',
          'users.status',
          'users.created_at',
          'users.last_login_at',
          db.raw('array_agg(DISTINCT roles.name) as roles')
        ])
        .leftJoin('user_roles', function() {
          this.on('users.id', '=', 'user_roles.user_id')
              .andOn('user_roles.school_id', '=', db.raw('?', [schoolId]));
        })
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .where('users.school_id', schoolId)
        .groupBy('users.id');

      if (status) {
        query = query.where('users.status', status);
      }

      if (search) {
        query = query.where(function() {
          this.where('users.first_name', 'ilike', `%${search}%`)
            .orWhere('users.last_name', 'ilike', `%${search}%`)
            .orWhere('users.email', 'ilike', `%${search}%`);
        });
      }

      if (role) {
        query = query.havingRaw('? = ANY(array_agg(roles.name))', [role]);
      }

      const users = await query
        .limit(limit)
        .offset(offset)
        .orderBy('users.created_at', 'desc');

      // Get total count
      let countQuery = db('users').count('* as count').where('school_id', schoolId);
      if (status) countQuery = countQuery.where('status', status);
      
      const [{ count }] = await countQuery;

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(count),
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users'
      });
    }
  }

  // Get single user by ID
  static async getUser(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      const user = await db('users')
        .select([
          'users.*',
          db.raw('array_agg(DISTINCT roles.name) as roles')
        ])
        .leftJoin('user_roles', function() {
          this.on('users.id', '=', 'user_roles.user_id')
              .andOn('user_roles.school_id', '=', db.raw('?', [schoolId]));
        })
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .where('users.id', id)
        .where('users.school_id', schoolId)
        .groupBy('users.id')
        .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      delete user.password_hash;

      res.json({
        success: true,
        data: { user }
      });

    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user'
      });
    }
  }

  // Create new user
  static async createUser(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        phone, 
        role = 'teacher',
        status = 'active'
      } = req.body;

      // Validation
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, first name, and last name are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findByEmailAndSchool(email, schoolId);
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
        phone,
        status
      };

      const user = await User.create(userData, schoolId);

      // Assign role
      const roleRecord = await db('roles').where('name', role).first();
      if (roleRecord) {
        await db('user_roles').insert({
          user_id: user.id,
          role_id: roleRecord.id,
          school_id: schoolId
        });
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
              status: user.status,
              role
            }
          }
        });

      } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
          success: false,
          message: 'Error creating user'
        });
      }
    }

  // Update user
  static async updateUser(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;
      const { 
        firstName, 
        lastName, 
        phone, 
        status,
        role
      } = req.body;

      // Check if user exists
      const existingUser = await db('users')
        .where({ id, school_id: schoolId })
        .first();

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update user data
      const updateData = {};
      if (firstName !== undefined) updateData.first_name = firstName;
      if (lastName !== undefined) updateData.last_name = lastName;
      if (phone !== undefined) updateData.phone = phone;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length > 0) {
        await db('users')
          .where({ id, school_id: schoolId })
          .update({
            ...updateData,
            updated_at: new Date()
          });
      }

      // Update role if provided
      if (role) {
        const roleRecord = await db('roles').where('name', role).first();
        if (roleRecord) {
          // Remove existing roles
          await db('user_roles')
            .where({ user_id: id, school_id: schoolId })
            .del();
          
          // Add new role
          await db('user_roles').insert({
            user_id: id,
            role_id: roleRecord.id,
            school_id: schoolId
          });
        }
      }

      // Get updated user
      const updatedUser = await db('users')
        .select([
          'users.*',
          db.raw('array_agg(DISTINCT roles.name) as roles')
        ])
        .leftJoin('user_roles', function() {
          this.on('users.id', '=', 'user_roles.user_id')
              .andOn('user_roles.school_id', '=', schoolId);
        })
        .leftJoin('roles', 'user_roles.role_id', 'roles.id')
        .where('users.id', id)
        .groupBy('users.id')
        .first();

      delete updatedUser.password_hash;

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser }
      });

    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating user'
      });
    }
  }

  // Delete user (soft delete)
  static async deleteUser(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      // Check if user exists
      const user = await db('users')
        .where({ id, school_id: schoolId })
        .first();

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent deleting yourself
      if (id === req.user.userId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      // Soft delete - set status to inactive
      await db('users')
        .where({ id, school_id: schoolId })
        .update({
          status: 'inactive',
          updated_at: new Date()
        });

      // Deactivate user roles
      await db('user_roles')
        .where({ user_id: id, school_id: schoolId })
        .update({ is_active: false });

      res.json({
        success: true,
        message: 'User deleted successfully'
      });

    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting user'
      });
    }
  }

  // Get user statistics
  static async getUserStats(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const stats = await db('users')
        .select([
          db.raw('COUNT(*) as total_users'),
          db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_users'),
          db.raw('COUNT(CASE WHEN status = \'inactive\' THEN 1 END) as inactive_users'),
          db.raw('COUNT(CASE WHEN created_at > NOW() - INTERVAL \'30 days\' THEN 1 END) as new_users_month')
        ])
        .where('school_id', schoolId)
        .first();

      // Get role distribution
      const roleStats = await db('user_roles')
        .select(['roles.name', db.raw('COUNT(*) as count')])
        .join('roles', 'user_roles.role_id', 'roles.id')
        .join('users', 'user_roles.user_id', 'users.id')
        .where('user_roles.school_id', schoolId)
        .where('users.status', 'active')
        .where('user_roles.is_active', true)
        .groupBy('roles.name')
        .orderBy('count', 'desc');

      res.json({
        success: true,
        data: {
          overview: stats,
          roleDistribution: roleStats
        }
      });

    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching user statistics'
      });
    }
  }
}

module.exports = UserController;