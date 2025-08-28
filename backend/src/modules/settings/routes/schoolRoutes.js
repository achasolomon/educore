const express = require('express');
const router = express.Router();
const SchoolController = require('../controllers/schoolController');
const authMiddleware = require('../../../core/middleware/auth');
const { requirePermission } = require('../../../core/middleware/rbac');
const { handleValidationErrors } = require('../../../core/middleware/validation');
const { updateSchoolValidator } = require('../validators/schoolValidators');

router.use(authMiddleware);

router.get('/', 
  requirePermission('school:view'), 
  SchoolController.getSchoolSettings
);

router.put('/', 
  updateSchoolValidator,
  handleValidationErrors,
  requirePermission('school:manage'), 
  SchoolController.updateSchoolSettings
);

router.get('/dashboard', 
  requirePermission('school:view'), 
  SchoolController.getSchoolDashboard
);

module.exports = router;