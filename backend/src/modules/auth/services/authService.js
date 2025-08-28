
// backend/src/modules/auth/services/authService.js
const db = require('../../../core/database/connection');
const jwt = require('jsonwebtoken');
const logger = require('../../../core/utils/logger');

class AuthService {
  static async getRoleByName(roleName) {
    return await db('roles')
      .where({ name: roleName })
      .first();
  }

  static async getRoleById(roleId) {
    return await db('roles')
      .where({ id: roleId })
      .first();
  }

  static async getUserRoles(userId, schoolId) {
    return await db('roles')
      .select(['roles.*'])
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .where('user_roles.school_id', schoolId)
      .where('user_roles.is_active', true);
  }

  static async hasPermission(userId, permission) {
    const result = await db('permissions')
      .select('permissions.name')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('user_roles', 'role_permissions.role_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .where('user_roles.is_active', true)
      .where('permissions.name', permission)
      .first();

    return !!result;
  }

  static async hasAnyPermission(userId, permissions = []) {
    if (!permissions.length) return false;

    const result = await db('permissions')
      .select('permissions.name')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('user_roles', 'role_permissions.role_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .where('user_roles.is_active', true)
      .whereIn('permissions.name', permissions)
      .first();

    return !!result;
  }

  static async hasRole(userId, roleName, schoolId) {
    const result = await db('roles')
      .select('roles.name')
      .join('user_roles', 'roles.id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .where('user_roles.school_id', schoolId)
      .where('user_roles.is_active', true)
      .where('roles.name', roleName)
      .first();

    return !!result;
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      logger.warn('Invalid token:', error.message);
      return null;
    }
  }

  static generatePasswordResetToken() {
    return jwt.sign(
      { type: 'password_reset', timestamp: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
}

module.exports = AuthService;