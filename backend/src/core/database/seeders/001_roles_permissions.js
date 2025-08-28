// backend/src/core/database/seeders/001_roles_permissions.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.seed = async function (knex) {
  // Clear existing entries
  await knex('role_permissions').del();
  await knex('user_roles').del();
  await knex('permissions').del();
  await knex('roles').del();

  // Insert roles
  const roles = [
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'super_admin',
      display_name: 'Super Administrator',
      description: 'System-wide administrator with full access',
      level: 1,
      is_system_role: true
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'school_admin',
      display_name: 'School Administrator',
      description: 'Administrator for a specific school',
      level: 2,
      is_system_role: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'teacher',
      display_name: 'Teacher',
      description: 'Teaching staff member',
      level: 3,
      is_system_role: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'parent',
      display_name: 'Parent/Guardian',
      description: 'Student parent or guardian',
      level: 4,
      is_system_role: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'student',
      display_name: 'Student',
      description: 'Enrolled student',
      level: 5,
      is_system_role: false
    }
  ];

  await knex('roles').insert(roles);

  // Insert permissions
 const permissions = [
  // User management
  { id: crypto.randomUUID(), name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
  { id: crypto.randomUUID(), name: 'users:read', resource: 'users', action: 'read', description: 'View user information' },
  { id: crypto.randomUUID(), name: 'users:update', resource: 'users', action: 'update', description: 'Update user information' },
  { id: crypto.randomUUID(), name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },

  // Student management
  { id: crypto.randomUUID(), name: 'students:create', resource: 'students', action: 'create', description: 'Add new students' },
  { id: crypto.randomUUID(), name: 'students:read', resource: 'students', action: 'read', description: 'View student information' },
  { id: crypto.randomUUID(), name: 'students:update', resource: 'students', action: 'update', description: 'Update student information' },
  { id: crypto.randomUUID(), name: 'students:delete', resource: 'students', action: 'delete', description: 'Remove students' },

  // Class management (only define once)
  { id: crypto.randomUUID(), name: 'classes:create', resource: 'classes', action: 'create', description: 'Create classes' },
  { id: crypto.randomUUID(), name: 'classes:read', resource: 'classes', action: 'read', description: 'View classes' },
  { id: crypto.randomUUID(), name: 'classes:update', resource: 'classes', action: 'update', description: 'Update classes' },
  { id: crypto.randomUUID(), name: 'classes:delete', resource: 'classes', action: 'delete', description: 'Delete classes' },

  // Subject management
  { id: crypto.randomUUID(), name: 'subjects:create', resource: 'subjects', action: 'create', description: 'Create subjects' },
  { id: crypto.randomUUID(), name: 'subjects:read', resource: 'subjects', action: 'read', description: 'View subjects' },
  { id: crypto.randomUUID(), name: 'subjects:update', resource: 'subjects', action: 'update', description: 'Update subjects' },
  { id: crypto.randomUUID(), name: 'subjects:delete', resource: 'subjects', action: 'delete', description: 'Delete subjects' },

  // Grades and assessments
  { id: crypto.randomUUID(), name: 'grades:create', resource: 'grades', action: 'create', description: 'Enter grades' },
  { id: crypto.randomUUID(), name: 'grades:read', resource: 'grades', action: 'read', description: 'View grades' },
  { id: crypto.randomUUID(), name: 'grades:update', resource: 'grades', action: 'update', description: 'Update grades' },
  { id: crypto.randomUUID(), name: 'grades:delete', resource: 'grades', action: 'delete', description: 'Delete grades' },

  // Reports
  { id: crypto.randomUUID(), name: 'reports:generate', resource: 'reports', action: 'generate', description: 'Generate reports' },
  { id: crypto.randomUUID(), name: 'reports:view', resource: 'reports', action: 'view', description: 'View reports' },

  // School management
  { id: crypto.randomUUID(), name: 'school:manage', resource: 'school', action: 'manage', description: 'Manage school settings' },
  { id: crypto.randomUUID(), name: 'school:view', resource: 'school', action: 'view', description: 'View school information' },

  // Finance
  { id: crypto.randomUUID(), name: 'finance:manage', resource: 'finance', action: 'manage', description: 'Manage financial records' },
  { id: crypto.randomUUID(), name: 'finance:view', resource: 'finance', action: 'view', description: 'View financial information' }
];

  await knex('permissions').insert(permissions);

  // Get inserted roles and permissions for mapping
  const insertedRoles = await knex('roles').select('id', 'name');
  const insertedPermissions = await knex('permissions').select('id', 'name');

  // Role-Permission mappings
  const rolePermissionMappings = [];

  // Super Admin - All permissions
  const superAdminRole = insertedRoles.find(r => r.name === 'super_admin');
  insertedPermissions.forEach(permission => {
    rolePermissionMappings.push({
      role_id: superAdminRole.id,
      permission_id: permission.id
    });
  });

  // School Admin - Most permissions except system-wide ones
  const schoolAdminRole = insertedRoles.find(r => r.name === 'school_admin');
  const schoolAdminPermissions = [
    'users:create', 'users:read', 'users:update', 'users:delete',
    'students:create', 'students:read', 'students:update', 'students:delete',
    'classes:create', 'classes:read', 'classes:update', 'classes:delete',
    'grades:read', 'grades:update',
    'reports:generate', 'reports:view',
    'school:manage', 'school:view',
    'finance:manage', 'finance:view'
  ];
  schoolAdminPermissions.forEach(permName => {
    const permission = insertedPermissions.find(p => p.name === permName);
    if (permission) {
      rolePermissionMappings.push({
        role_id: schoolAdminRole.id,
        permission_id: permission.id
      });
    }
  });

  // Teacher - Academic and student-related permissions
  const teacherRole = insertedRoles.find(r => r.name === 'teacher');
  const teacherPermissions = [
    'students:read',
    'classes:read',
    'grades:create', 'grades:read', 'grades:update',
    'reports:view',
    'school:view'
  ];
  teacherPermissions.forEach(permName => {
    const permission = insertedPermissions.find(p => p.name === permName);
    if (permission) {
      rolePermissionMappings.push({
        role_id: teacherRole.id,
        permission_id: permission.id
      });
    }
  });

  // Parent - Limited view permissions
  const parentRole = insertedRoles.find(r => r.name === 'parent');
  const parentPermissions = [
    'students:read',
    'grades:read',
    'reports:view',
    'school:view'
  ];
  parentPermissions.forEach(permName => {
    const permission = insertedPermissions.find(p => p.name === permName);
    if (permission) {
      rolePermissionMappings.push({
        role_id: parentRole.id,
        permission_id: permission.id
      });
    }
  });

  // Student - Very limited permissions
  const studentRole = insertedRoles.find(r => r.name === 'student');
  const studentPermissions = [
    'grades:read',
    'school:view'
  ];
  studentPermissions.forEach(permName => {
    const permission = insertedPermissions.find(p => p.name === permName);
    if (permission) {
      rolePermissionMappings.push({
        role_id: studentRole.id,
        permission_id: permission.id
      });
    }
  });

  await knex('role_permissions').insert(rolePermissionMappings);
};