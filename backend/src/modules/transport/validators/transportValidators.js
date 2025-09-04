// backend/src/modules/transport/validators/transportValidators.js
const { body, query, param, validationResult } = require('express-validator');

class TransportValidators {
  static handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  };

  // Vehicle validators
  static createVehicle = [
    body('vehicle_number')
      .notEmpty()
      .withMessage('Vehicle number is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Vehicle number must be between 2 and 20 characters'),

    body('vehicle_type')
      .optional()
      .isIn(['bus', 'van', 'car', 'mini_bus'])
      .withMessage('Vehicle type must be bus, van, car, or mini_bus'),

    body('make')
      .notEmpty()
      .withMessage('Vehicle make is required')
      .isLength({ max: 50 })
      .withMessage('Make cannot exceed 50 characters'),

    body('model')
      .notEmpty()
      .withMessage('Vehicle model is required')
      .isLength({ max: 50 })
      .withMessage('Model cannot exceed 50 characters'),

    body('year')
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be between 1990 and current year'),

    body('capacity')
      .isInt({ min: 1, max: 100 })
      .withMessage('Capacity must be between 1 and 100'),

    body('registration_number')
      .notEmpty()
      .withMessage('Registration number is required')
      .isLength({ max: 20 })
      .withMessage('Registration number cannot exceed 20 characters'),

    body('insurance_expiry')
      .isISO8601()
      .withMessage('Insurance expiry must be a valid date')
      .custom(value => {
        if (new Date(value) <= new Date()) {
          throw new Error('Insurance expiry date must be in the future');
        }
        return true;
      }),

    body('driver_id')
      .optional()
      .isUUID()
      .withMessage('Driver ID must be a valid UUID'),

    body('conductor_id')
      .optional()
      .isUUID()
      .withMessage('Conductor ID must be a valid UUID'),

    body('fuel_type')
      .optional()
      .isIn(['petrol', 'diesel', 'cng', 'electric'])
      .withMessage('Fuel type must be petrol, diesel, cng, or electric'),

    this.handleValidationErrors
  ];

  static updateVehicleLocation = [
    param('vehicleId')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),

    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),

    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),

    body('speed')
      .optional()
      .isFloat({ min: 0, max: 200 })
      .withMessage('Speed must be between 0 and 200 km/h'),

    this.handleValidationErrors
  ];

  static updateVehicleStatus = [
    param('vehicleId')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),

    body('status')
      .isIn(['active', 'maintenance', 'out_of_service', 'inactive'])
      .withMessage('Status must be active, maintenance, out_of_service, or inactive'),

    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  static scheduleMaintenance = [
    param('vehicleId')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),

    body('maintenance_type')
      .notEmpty()
      .withMessage('Maintenance type is required')
      .isIn(['routine', 'repair', 'inspection', 'emergency'])
      .withMessage('Maintenance type must be routine, repair, inspection, or emergency'),

    body('scheduled_date')
      .isISO8601()
      .withMessage('Scheduled date must be a valid date')
      .custom(value => {
        if (new Date(value) < new Date()) {
          throw new Error('Scheduled date cannot be in the past');
        }
        return true;
      }),

    body('estimated_cost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Estimated cost must be a positive number'),

    body('description')
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),

    this.handleValidationErrors
  ];

  // Route validators
  static createRoute = [
    body('route_name')
      .notEmpty()
      .withMessage('Route name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Route name must be between 3 and 100 characters'),

    body('start_location')
      .notEmpty()
      .withMessage('Start location is required')
      .isLength({ max: 200 })
      .withMessage('Start location cannot exceed 200 characters'),

    body('end_location')
      .notEmpty()
      .withMessage('End location is required')
      .isLength({ max: 200 })
      .withMessage('End location cannot exceed 200 characters'),

    body('estimated_duration')
      .isInt({ min: 5, max: 480 })
      .withMessage('Estimated duration must be between 5 and 480 minutes'),

    body('distance_km')
      .optional()
      .isFloat({ min: 0.1, max: 200 })
      .withMessage('Distance must be between 0.1 and 200 km'),

    body('start_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Start time must be in HH:MM format'),

    body('end_time')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('End time must be in HH:MM format'),

    body('operating_days')
      .optional()
      .isArray()
      .withMessage('Operating days must be an array')
      .custom(days => {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!days.every(day => validDays.includes(day.toLowerCase()))) {
          throw new Error('All operating days must be valid weekday names');
        }
        return true;
      }),

    this.handleValidationErrors
  ];

  static addStopToRoute = [
    param('routeId')
      .isUUID()
      .withMessage('Route ID must be a valid UUID'),

    body('stop_name')
      .notEmpty()
      .withMessage('Stop name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Stop name must be between 3 and 100 characters'),

    body('latitude')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),

    body('longitude')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180'),

    body('pickup_time_morning')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Morning pickup time must be in HH:MM format'),

    body('pickup_time_evening')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Evening pickup time must be in HH:MM format'),

    this.handleValidationErrors
  ];

  // Student transport validators
  static enrollStudent = [
    param('studentId')
      .isUUID()
      .withMessage('Student ID must be a valid UUID'),

    body('route_id')
      .isUUID()
      .withMessage('Route ID must be a valid UUID'),

    body('stop_id')
      .notEmpty()
      .withMessage('Stop ID is required'),

    body('academic_year_id')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),

    body('transport_fee')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Transport fee must be a positive number'),

    body('pickup_point')
      .notEmpty()
      .withMessage('Pickup point is required')
      .isLength({ max: 200 })
      .withMessage('Pickup point cannot exceed 200 characters'),

    body('morning_pickup')
      .optional()
      .isBoolean()
      .withMessage('Morning pickup must be true or false'),

    body('evening_pickup')
      .optional()
      .isBoolean()
      .withMessage('Evening pickup must be true or false'),

    body('emergency_contacts')
      .optional()
      .isArray()
      .withMessage('Emergency contacts must be an array'),

    body('special_instructions')
      .optional()
      .isLength({ max: 1000 })
      .withMessage('Special instructions cannot exceed 1000 characters'),

    this.handleValidationErrors
  ];

  static recordBoardingActivity = [
    param('studentId')
      .isUUID()
      .withMessage('Student ID must be a valid UUID'),

    body('vehicle_id')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),

    body('activity_type')
      .isIn(['boarded', 'alighted', 'absent', 'late'])
      .withMessage('Activity type must be boarded, alighted, absent, or late'),

    body('location_latitude')
      .optional()
      .isFloat({ min: -90, max: 90 })
      .withMessage('Location latitude must be between -90 and 90'),

    body('location_longitude')
      .optional()
      .isFloat({ min: -180, max: 180 })
      .withMessage('Location longitude must be between -180 and 180'),

    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters'),

    this.handleValidationErrors
  ];

  // Query validators
  static getStudentsByRoute = [
    param('routeId')
      .isUUID()
      .withMessage('Route ID must be a valid UUID'),

    query('academic_year_id')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),

    this.handleValidationErrors
  ];

  static getTransportStatistics = [
    query('academic_year_id')
      .isUUID()
      .withMessage('Academic year ID must be a valid UUID'),

    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date'),

    this.handleValidationErrors
  ];

  static dateRangeQuery = [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom((endDate, { req }) => {
        if (endDate && req.query.start_date && new Date(endDate) <= new Date(req.query.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),

    this.handleValidationErrors
  ];

  static recordFuelConsumption = [
    param('vehicleId')
      .isUUID()
      .withMessage('Vehicle ID must be a valid UUID'),

    body('fuel_amount')
      .isFloat({ min: 0.1, max: 1000 })
      .withMessage('Fuel amount must be between 0.1 and 1000 liters'),

    body('cost')
      .isFloat({ min: 0.01 })
      .withMessage('Cost must be greater than 0'),

    body('odometer_reading')
      .isInt({ min: 0 })
      .withMessage('Odometer reading must be a positive integer'),

    body('refuel_date')
      .isISO8601()
      .withMessage('Refuel date must be a valid date')
      .custom(value => {
        if (new Date(value) > new Date()) {
          throw new Error('Refuel date cannot be in the future');
        }
        return true;
      }),

    body('fuel_station')
      .notEmpty()
      .withMessage('Fuel station is required')
      .isLength({ max: 100 })
      .withMessage('Fuel station name cannot exceed 100 characters'),

    this.handleValidationErrors
  ];

  static uuidParam = (paramName) => [
    param(paramName)
      .isUUID()
      .withMessage(`${paramName} must be a valid UUID`),

    this.handleValidationErrors
  ];
}

module.exports = TransportValidators;