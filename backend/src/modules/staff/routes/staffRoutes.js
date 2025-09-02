// backend/src/modules/staff/routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const StaffController = require('../controllers/staffController');
const DepartmentController = require('../controllers/departmentController');
const PositionController = require('../controllers/positionController');
const StaffValidators = require('../validators/staffValidators');
const StaffCategoryController = require('../controllers/staffCategoryController');
const authMiddleware = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/rbac');

// Apply auth middleware to all routes
router.use(authMiddleware);
// ===== STAFF MANAGEMENT ROUTES =====

/**
 * @route   GET /api/staff
 * @desc    Get all staff members with filters and pagination
 * @access  Private (Admin, HR, Principal)
 */
router.get('/',
  rbac.requirePermission('staff:read'),
  StaffValidators.validateGetAllStaff,
  StaffController.getAllStaff
);

/**
 * @route   POST /api/staff
 * @desc    Create new staff member
 * @access  Private (Admin, HR)
 */
router.post('/',
  rbac.requirePermission('staff:create'),
  StaffValidators.validateCreateStaff,
  StaffController.createStaff
);

/**
 * @route   GET /api/staff/statistics
 * @desc    Get staff statistics overview
 * @access  Private (Admin, HR, Principal)
 */
router.get('/statistics',
  rbac.requireRole(['admin', 'hr', 'principal']),
  StaffController.getStaffStatistics
);

/**
 * @route   POST /api/staff/bulk-import
 * @desc    Bulk import staff members
 * @access  Private (Admin, HR)
 */
router.post('/bulk-import',
  rbac.requireRole(['admin', 'hr']),
  StaffValidators.validateBulkImport,
  StaffController.bulkImportStaff
);

/**
 * @route   GET /api/staff/:staffId
 * @desc    Get staff member by ID
 * @access  Private (Admin, HR, Principal, Self)
 */
router.get('/:staffId',
  rbac.requirePermission('staff:read'),
  StaffValidators.validateStaffId,
  StaffController.getStaffById
);

/**
 * @route   PUT /api/staff/:staffId
 * @desc    Update staff member
 * @access  Private (Admin, HR)
 */
router.put('/:staffId',
  rbac.requirePermission('staff:update'),
  StaffValidators.validateStaffId,
  StaffValidators.validateUpdateStaff,
  StaffController.updateStaff
);

/**
 * @route   PUT /api/staff/:staffId/status
 * @desc    Update staff employment status
 * @access  Private (Admin, HR, Principal)
 */
router.put('/:staffId/status',
  rbac.requireRole(['admin', 'hr', 'principal']),
  StaffValidators.validateStaffId,
  StaffValidators.validateUpdateStatus,
  StaffController.updateEmploymentStatus
);

/**
 * @route   DELETE /api/staff/:staffId
 * @desc    Deactivate staff member
 * @access  Private (Admin, HR)
 */
router.delete('/:staffId',
  rbac.requireRole(['admin', 'hr']),
  StaffValidators.validateStaffId,
  StaffValidators.validateDeactivateStaff,
  StaffController.deactivateStaff
);

// ===== DEPARTMENT ROUTES =====

/**
 * @route   GET /api/staff/departments
 * @desc    Get all departments
 * @access  Private (All authenticated users)
 */
router.get('/departments',
  rbac.requirePermission('staff:read'),
  DepartmentController.getAllDepartments
);

/**
 * @route   POST /api/staff/departments
 * @desc    Create new department
 * @access  Private (Admin, Principal)
 */
router.post('/departments',
  rbac.requireRole(['admin', 'principal']),
  StaffValidators.validateCreateDepartment,
  DepartmentController.createDepartment
);

/**
 * @route   POST /api/staff/departments/initialize
 * @desc    Initialize default departments
 * @access  Private (Admin)
 */
router.post('/departments/initialize',
  rbac.requireRole(['admin']),
  DepartmentController.initializeDefaults
);

/**
 * @route   GET /api/staff/departments/:departmentId/staff
 * @desc    Get staff by department
 * @access  Private (Admin, HR, Principal, HOD)
 */
router.get('/departments/:departmentId/staff',
  rbac.requirePermission('staff:read'),
  StaffController.getStaffByDepartment
);

// ===== POSITION ROUTES =====

/**
 * @route   GET /api/staff/positions
 * @desc    Get all positions
 * @access  Private (All authenticated users)
 */
router.get('/positions',
  rbac.requirePermission('staff:read'),
  PositionController.getAllPositions
);

/**
 * @route   POST /api/staff/positions
 * @desc    Create new position
 * @access  Private (Admin, Principal)
 */
router.post('/positions',
  rbac.requireRole(['admin', 'principal']),
  StaffValidators.validateCreatePosition,
  PositionController.createPosition
);

/**
 * @route   GET /api/staff/positions/department/:departmentId
 * @desc    Get positions by department
 * @access  Private (All authenticated users)
 */
router.get('/positions/department/:departmentId',
  rbac.requirePermission('staff:read'),
  PositionController.getPositionsByDepartment
);

// ===== CATEGORY ROUTES =====

/**
 * @route   GET /api/staff/categories
 * @desc    Get all staff categories
 * @access  Private (All authenticated users)
 */
router.get('/categories',
  rbac.requirePermission('staff:read'),
  StaffCategoryController.getAllCategories
);

/**
 * @route   POST /api/staff/categories
 * @desc    Create staff category
 * @access  Private (Admin)
 */
router.post('/categories',
  rbac.requireRole(['admin']),
  StaffValidators.validateCreateCategory,
  StaffCategoryController.createCategory
);

/**
 * @route   POST /api/staff/categories/initialize
 * @desc    Initialize default categories
 * @access  Private (Admin)
 */
router.post('/categories/initialize',
  rbac.requireRole(['admin']),
  StaffCategoryController.initializeDefaults
);

module.exports = router;