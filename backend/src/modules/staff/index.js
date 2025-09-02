// backend/src/modules/staff/index.js
const staffRoutes = require('./routes/staffRoutes');
const StaffController = require('./controllers/staffController');
const DepartmentController = require('./controllers/departmentController');
const PositionController = require('./controllers/positionController');
const StaffInitializationService = require('./services/staffInitializationService');

// Models
const Staff = require('./models/Staff');
const StaffCategory = require('./models/StaffCategory');
const Department = require('./models/Department');
const Position = require('./models/Position');

module.exports = {
  routes: staffRoutes,
  controllers: {
    StaffController,
    DepartmentController,
    PositionController
  },
  services: {
    StaffInitializationService
  },
  models: {
    Staff,
    StaffCategory,
    Department,
    Position
  }
};
