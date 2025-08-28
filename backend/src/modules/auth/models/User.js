// backend/src/modules/auth/models/User.js
const db = require('../../../core/database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  static tableName = 'users';

  static async create(userData, schoolId) {
    const { password, ...otherData } = userData;
    const password_hash = await bcrypt.hash(password, 12);

    const [user] = await db(this.tableName)
      .insert({
        ...otherData,
        school_id: schoolId,
        password_hash,
        status: 'pending'
      })
      .returning('*');

    delete user.password_hash;
    return user;
  }

  static async findById(id) {
    const user = await db(this.tableName)
      .where({ id })
      .first();

    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async findByEmailAndSchool(email, schoolId) {
    const user = await db(this.tableName)
      .where({ email, school_id: schoolId })
      .first();
    
    return user;
  }

  static async findWithRoles(id) {
    const user = await db(this.tableName)
      .select([
        'users.*',
        db.raw('ARRAY_AGG(roles.name) as roles')
      ])
      .leftJoin('user_roles', 'users.id', 'user_roles.user_id')
      .leftJoin('roles', 'user_roles.role_id', 'roles.id')
      .where('users.id', id)
      .groupBy('users.id')
      .first();

    if (user) {
      delete user.password_hash;
    }
    return user;
  }

  static async updateLastLogin(id) {
    await db(this.tableName)
      .where({ id })
      .update({ last_login_at: new Date() });
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 12);
    await db(this.tableName)
      .where({ id })
      .update({ password_hash, password_reset_token: null, password_reset_expires: null });
  }

  static generateToken(user) {
    return jwt.sign(
      { 
        userId: user.id, 
        schoolId: user.school_id,
        email: user.email 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
  }

  static async assignRole(userId, roleId, schoolId) {
    await db('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
        school_id: schoolId
      })
      .onConflict(['user_id', 'role_id', 'school_id'])
      .merge();
  }

  static async getUserPermissions(userId) {
    const permissions = await db('permissions')
      .select('permissions.name', 'permissions.resource', 'permissions.action')
      .join('role_permissions', 'permissions.id', 'role_permissions.permission_id')
      .join('user_roles', 'role_permissions.role_id', 'user_roles.role_id')
      .where('user_roles.user_id', userId)
      .where('user_roles.is_active', true);

    return permissions;
  }
}

module.exports = User;