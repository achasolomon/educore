// src/lib/types/auth.ts
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // School relationship
  schoolId: string;
  school?: School;
  
  // Role and permissions
  roleId: string;
  role?: Role;
  permissions?: Permission[];
}

export interface School {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  subscription: 'standard' | 'premium';
  subscriptionExpiry: Date;
  isActive: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number; // Higher number = more authority
  permissions: Permission[];
  isSystem: boolean; // Cannot be deleted
  schoolId?: string; // null for system roles
}

export interface Permission {
  id: string;
  name: string;
  resource: string; // e.g., 'students', 'academics', 'finance'
  action: string;   // e.g., 'view', 'create', 'edit', 'delete'
  conditions?: Record<string, any>; // Additional conditions
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Permission constants
export const PERMISSIONS = {
  // Student Management
  'students.view': { resource: 'students', action: 'view' },
  'students.create': { resource: 'students', action: 'create' },
  'students.edit': { resource: 'students', action: 'edit' },
  'students.delete': { resource: 'students', action: 'delete' },
  'students.export': { resource: 'students', action: 'export' },
  'students.import': { resource: 'students', action: 'import' },
  
  // Academic Management
  'academics.grades.view': { resource: 'academics', action: 'grades.view' },
  'academics.grades.edit': { resource: 'academics', action: 'grades.edit' },
  'academics.results.generate': { resource: 'academics', action: 'results.generate' },
  'academics.scratchcards.manage': { resource: 'academics', action: 'scratchcards.manage' },
  'academics.lessons.view': { resource: 'academics', action: 'lessons.view' },
  'academics.lessons.create': { resource: 'academics', action: 'lessons.create' },
  
  // Financial Management
  'finance.fees.view': { resource: 'finance', action: 'fees.view' },
  'finance.fees.edit': { resource: 'finance', action: 'fees.edit' },
  'finance.payments.process': { resource: 'finance', action: 'payments.process' },
  'finance.payments.view': { resource: 'finance', action: 'payments.view' },
  'finance.reports.generate': { resource: 'finance', action: 'reports.generate' },
  
  // Staff Management
  'staff.view': { resource: 'staff', action: 'view' },
  'staff.create': { resource: 'staff', action: 'create' },
  'staff.edit': { resource: 'staff', action: 'edit' },
  'staff.delete': { resource: 'staff', action: 'delete' },
  
  // Communication
  'communication.send': { resource: 'communication', action: 'send' },
  'communication.broadcast': { resource: 'communication', action: 'broadcast' },
  
  // System Administration
  'system.schools.manage': { resource: 'system', action: 'schools.manage' },
  'system.users.manage': { resource: 'system', action: 'users.manage' },
  'system.roles.manage': { resource: 'system', action: 'roles.manage' },
} as const;

// Default roles with permissions
export const DEFAULT_ROLES = {
  SUPER_ADMIN: {
    name: 'Super Administrator',
    description: 'Full system access across all schools',
    level: 100,
    permissions: Object.keys(PERMISSIONS),
    isSystem: true,
  },
  
  SCHOOL_ADMIN: {
    name: 'School Administrator', 
    description: 'Full access within school',
    level: 90,
    permissions: [
      'students.view', 'students.create', 'students.edit', 'students.delete', 'students.export', 'students.import',
      'academics.grades.view', 'academics.grades.edit', 'academics.results.generate', 'academics.scratchcards.manage',
      'academics.lessons.view', 'academics.lessons.create',
      'finance.fees.view', 'finance.fees.edit', 'finance.payments.process', 'finance.payments.view', 'finance.reports.generate',
      'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
      'communication.send', 'communication.broadcast',
    ],
    isSystem: true,
  },
  
  PRINCIPAL: {
    name: 'Principal',
    description: 'Academic and operational oversight',
    level: 80,
    permissions: [
      'students.view', 'students.create', 'students.edit',
      'academics.grades.view', 'academics.results.generate', 'academics.lessons.view', 'academics.lessons.create',
      'finance.fees.view', 'finance.payments.view', 'finance.reports.generate',
      'staff.view', 'staff.create', 'staff.edit',
      'communication.send', 'communication.broadcast',
    ],
    isSystem: true,
  },
  
  TEACHER: {
    name: 'Teacher',
    description: 'Classroom and student management',
    level: 60,
    permissions: [
      'students.view', 'students.edit',
      'academics.grades.view', 'academics.grades.edit', 'academics.lessons.view', 'academics.lessons.create',
      'communication.send',
    ],
    isSystem: true,
  },
  
  PARENT: {
    name: 'Parent/Guardian',
    description: 'Access to own children\'s information',
    level: 20,
    permissions: [
      'students.view.own',
      'academics.grades.view.own',
    ],
    isSystem: true,
  },
  
  STUDENT: {
    name: 'Student',
    description: 'Access to personal information',
    level: 10,
    permissions: [
      'students.view.own',
      'academics.grades.view.own',
    ],
    isSystem: true,
  },
};