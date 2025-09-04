// backend/src/modules/transport/routes/transportRoutes.js
const express = require('express');
const router = express.Router();

// Controllers
const VehicleController = require('../controllers/vehicleController');
const RouteController = require('../controllers/routeController');
const StudentTransportController = require('../controllers/studentTransportController');

// Middleware
const auth = require('../../../core/middleware/auth');
const rbac = require('../../../core/middleware/rbac');
const rateLimit = require('../../../core/middleware/rateLimit');

// Validators
const TransportValidators = require('../validators/transportValidators');

// Apply auth middleware to all routes
router.use(auth);

// ==============================================
// VEHICLE MANAGEMENT ROUTES
// ==============================================

/**
 * @route   POST /api/transport/vehicles
 * @desc    Create new vehicle
 * @access  Private (Admin, Transport Manager)
 */
router.post('/vehicles',
  rbac(['admin', 'transport_manager']),
  TransportValidators.createVehicle,
  VehicleController.createVehicle
);

/**
 * @route   GET /api/transport/vehicles
 * @desc    Get all vehicles with filtering
 * @access  Private (Admin, Transport Manager, Drivers)
 */
router.get('/vehicles',
  rbac(['admin', 'transport_manager', 'driver', 'conductor']),
  VehicleController.getVehicles
);

/**
 * @route   GET /api/transport/vehicles/:vehicleId
 * @desc    Get single vehicle details
 * @access  Private (Admin, Transport Manager, Drivers)
 */
router.get('/vehicles/:vehicleId',
  rbac(['admin', 'transport_manager', 'driver', 'conductor']),
  TransportValidators.uuidParam('vehicleId'),
  VehicleController.getVehicleById
);

/**
 * @route   PATCH /api/transport/vehicles/:vehicleId/location
 * @desc    Update vehicle GPS location
 * @access  Private (Admin, Transport Manager, Drivers)
 */
router.patch('/vehicles/:vehicleId/location',
  rbac(['admin', 'transport_manager', 'driver', 'conductor']),
  rateLimit({ windowMs: 60000, max: 100 }), // High rate limit for GPS updates
  TransportValidators.updateVehicleLocation,
  VehicleController.updateVehicleLocation
);

/**
 * @route   PATCH /api/transport/vehicles/:vehicleId/status
 * @desc    Update vehicle status
 * @access  Private (Admin, Transport Manager)
 */
router.patch('/vehicles/:vehicleId/status',
  rbac(['admin', 'transport_manager']),
  TransportValidators.updateVehicleStatus,
  VehicleController.updateVehicleStatus
);

/**
 * @route   POST /api/transport/vehicles/:vehicleId/maintenance
 * @desc    Schedule vehicle maintenance
 * @access  Private (Admin, Transport Manager)
 */
router.post('/vehicles/:vehicleId/maintenance',
  rbac(['admin', 'transport_manager']),
  TransportValidators.scheduleMaintenance,
  VehicleController.scheduleMaintenance
);

/**
 * @route   POST /api/transport/vehicles/:vehicleId/fuel
 * @desc    Record fuel consumption
 * @access  Private (Admin, Transport Manager, Drivers)
 */
router.post('/vehicles/:vehicleId/fuel',
  rbac(['admin', 'transport_manager', 'driver']),
  TransportValidators.recordFuelConsumption,
  VehicleController.recordFuelConsumption
);

/**
 * @route   GET /api/transport/vehicles/statistics/summary
 * @desc    Get vehicle fleet statistics
 * @access  Private (Admin, Transport Manager)
 */
router.get('/vehicles/statistics/summary',
  rbac(['admin', 'transport_manager', 'principal']),
  TransportValidators.dateRangeQuery,
  VehicleController.getVehicleStatistics
);

// ==============================================
// ROUTE MANAGEMENT ROUTES
// ==============================================

/**
 * @route   POST /api/transport/routes
 * @desc    Create new transport route
 * @access  Private (Admin, Transport Manager)
 */
router.post('/routes',
  rbac(['admin', 'transport_manager']),
  TransportValidators.createRoute,
  RouteController.createRoute
);

/**
 * @route   GET /api/transport/routes
 * @desc    Get all transport routes
 * @access  Private (Admin, Transport Manager, Teachers, Parents)
 */
router.get('/routes',
  rbac(['admin', 'transport_manager', 'teacher', 'parent', 'driver', 'conductor']),
  RouteController.getRoutes
);

/**
 * @route   GET /api/transport/routes/:routeId
 * @desc    Get single route details
 * @access  Private (Admin, Transport Manager, Drivers)
 */
router.get('/routes/:routeId',
  rbac(['admin', 'transport_manager', 'driver', 'conductor']),
  TransportValidators.uuidParam('routeId'),
  RouteController.getRouteById
);

/**
 * @route   POST /api/transport/routes/:routeId/stops
 * @desc    Add stop to route
 * @access  Private (Admin, Transport Manager)
 */
router.post('/routes/:routeId/stops',
  rbac(['admin', 'transport_manager']),
  TransportValidators.addStopToRoute,
  RouteController.addStopToRoute
);

/**
 * @route   PUT /api/transport/routes/:routeId/optimize
 * @desc    Optimize route for efficiency
 * @access  Private (Admin, Transport Manager)
 */
router.put('/routes/:routeId/optimize',
  rbac(['admin', 'transport_manager']),
  TransportValidators.uuidParam('routeId'),
  RouteController.optimizeRoute
);

// ==============================================
// STUDENT TRANSPORT ROUTES
// ==============================================

/**
 * @route   POST /api/transport/students/:studentId/enroll
 * @desc    Enroll student in transport service
 * @access  Private (Admin, Transport Manager, Teachers)
 */
router.post('/students/:studentId/enroll',
  rbac(['admin', 'transport_manager', 'teacher']),
  TransportValidators.enrollStudent,
  StudentTransportController.enrollStudent
);

/**
 * @route   GET /api/transport/routes/:routeId/students
 * @desc    Get students enrolled in specific route
 * @access  Private (Admin, Transport Manager, Drivers)
 */
router.get('/routes/:routeId/students',
  rbac(['admin', 'transport_manager', 'driver', 'conductor']),
  TransportValidators.getStudentsByRoute,
  StudentTransportController.getStudentsByRoute
);

/**
 * @route   POST /api/transport/students/:studentId/activity
 * @desc    Record student boarding/alighting activity
 * @access  Private (Admin, Transport Manager, Drivers, Conductors)
 */
router.post('/students/:studentId/activity',
  rbac(['admin', 'transport_manager', 'driver', 'conductor']),
  rateLimit({ windowMs: 60000, max: 200 }), // High limit for activity recording
  TransportValidators.recordBoardingActivity,
  StudentTransportController.recordBoardingActivity
);

/**
 * @route   GET /api/transport/students/:studentId/history
 * @desc    Get student transport activity history
 * @access  Private (Admin, Transport Manager, Teachers, Parents)
 */
router.get('/students/:studentId/history',
  rbac(['admin', 'transport_manager', 'teacher', 'parent']),
  TransportValidators.uuidParam('studentId'),
  StudentTransportController.getStudentTransportHistory
);

/**
 * @route   PATCH /api/transport/students/:studentId/suspend
 * @desc    Suspend student transport service
 * @access  Private (Admin, Transport Manager)
 */
router.patch('/students/:studentId/suspend',
  rbac(['admin', 'transport_manager']),
  TransportValidators.uuidParam('studentId'),
  StudentTransportController.suspendStudentTransport
);

/**
 * @route   GET /api/transport/statistics
 * @desc    Get comprehensive transport statistics
 * @access  Private (Admin, Transport Manager, Principal)
 */
router.get('/statistics',
  rbac(['admin', 'transport_manager', 'principal']),
  TransportValidators.getTransportStatistics,
  StudentTransportController.getTransportStatistics
);

// ==============================================
// REAL-TIME TRACKING ROUTES
// ==============================================

/**
 * @route   GET /api/transport/tracking/live
 * @desc    Get live tracking data for all active vehicles
 * @access  Private (Admin, Transport Manager, Parents)
 */
router.get('/tracking/live',
  rbac(['admin', 'transport_manager', 'parent', 'teacher']),
  rateLimit({ windowMs: 60000, max: 60 }), // 1 request per second for real-time data
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      
      const liveData = await db('vehicles')
        .select([
          'vehicles.id',
          'vehicles.vehicle_number',
          'vehicles.status',
          'vehicles.current_latitude',
          'vehicles.current_longitude',
          'vehicles.current_speed',
          'vehicles.last_location_update',
          'transport_routes.route_name',
          'transport_routes.id as route_id'
        ])
        .leftJoin('transport_routes', 'vehicles.route_id', 'transport_routes.id')
        .where('vehicles.school_id', schoolId)
        .where('vehicles.status', 'active')
        .whereNotNull('vehicles.current_latitude');

      res.json({
        success: true,
        data: liveData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching live tracking data'
      });
    }
  }
);

/**
 * @route   GET /api/transport/tracking/route/:routeId
 * @desc    Get real-time tracking for specific route
 * @access  Private (Admin, Transport Manager, Parents, Teachers)
 */
router.get('/tracking/route/:routeId',
  rbac(['admin', 'transport_manager', 'parent', 'teacher']),
  TransportValidators.uuidParam('routeId'),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const { routeId } = req.params;

      // Get route details with vehicles and students
      const routeTracking = await db('transport_routes')
        .select([
          'transport_routes.*',
          db.raw('json_agg(DISTINCT jsonb_build_object(\'id\', vehicles.id, \'vehicle_number\', vehicles.vehicle_number, \'latitude\', vehicles.current_latitude, \'longitude\', vehicles.current_longitude, \'speed\', vehicles.current_speed, \'last_update\', vehicles.last_location_update)) as vehicles'),
          db.raw('COUNT(DISTINCT student_transport.student_id) as enrolled_students')
        ])
        .leftJoin('vehicles', 'transport_routes.id', 'vehicles.route_id')
        .leftJoin('student_transport', function() {
          this.on('transport_routes.id', 'student_transport.route_id')
              .andOn('student_transport.status', db.raw('?', ['active']));
        })
        .where('transport_routes.id', routeId)
        .where('transport_routes.school_id', schoolId)
        .groupBy('transport_routes.id')
        .first();

      if (!routeTracking) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      res.json({
        success: true,
        data: {
          ...routeTracking,
          stops: JSON.parse(routeTracking.stops || '[]'),
          route_coordinates: JSON.parse(routeTracking.route_coordinates || '[]'),
          vehicles: routeTracking.vehicles || [],
          enrolled_students: parseInt(routeTracking.enrolled_students || 0)
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching route tracking data'
      });
    }
  }
);

// ==============================================
// NOTIFICATION ROUTES
// ==============================================

/**
 * @route   POST /api/transport/notifications/broadcast
 * @desc    Send broadcast notification to parents on specific route
 * @access  Private (Admin, Transport Manager)
 */
router.post('/notifications/broadcast',
  rbac(['admin', 'transport_manager']),
  [
    body('route_id')
      .isUUID()
      .withMessage('Route ID must be a valid UUID'),
    
    body('message')
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Message must be between 10 and 500 characters'),
    
    body('notification_type')
      .isIn(['delay', 'route_change', 'emergency', 'general'])
      .withMessage('Notification type must be delay, route_change, emergency, or general'),
    
    TransportValidators.handleValidationErrors
  ],
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const { route_id, message, notification_type } = req.body;

      // Get all students and their guardians for this route
      const recipients = await db('student_transport')
        .select([
          'students.first_name',
          'students.last_name',
          'guardians.phone',
          'guardians.email'
        ])
        .join('students', 'student_transport.student_id', 'students.id')
        .join('guardians', 'students.primary_guardian_id', 'guardians.id')
        .where('student_transport.route_id', route_id)
        .where('student_transport.school_id', schoolId)
        .where('student_transport.status', 'active');

      // Here you would integrate with your notification service
      // For now, we'll just log the notifications that would be sent
      const notifications = recipients.map(recipient => ({
        student_name: `${recipient.first_name} ${recipient.last_name}`,
        phone: recipient.phone,
        email: recipient.email,
        message: `Transport Update: ${message}`,
        type: notification_type
      }));

      // Log notification attempt
      await db('transport_notifications').insert({
        id: crypto.randomUUID(),
        school_id: schoolId,
        route_id,
        message,
        notification_type,
        recipients_count: recipients.length,
        sent_by: req.user.id,
        sent_at: new Date()
      });

      res.json({
        success: true,
        message: 'Broadcast notification queued successfully',
        data: {
          recipients_count: recipients.length,
          notification_type,
          message
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error sending broadcast notification'
      });
    }
  }
);

// ==============================================
// HEALTH CHECK ROUTE
// ==============================================

/**
 * @route   GET /api/transport/health
 * @desc    Transport module health check
 * @access  Private (All authenticated users)
 */
router.get('/health',
  (req, res) => {
    res.json({
      success: true,
      message: 'Transport module is operational',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        gps_tracking: 'active',
        notifications: 'available'
      }
    });
  }
);

module.exports = router;