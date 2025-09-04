// backend/src/modules/transport/controllers/vehicleController.js
const Vehicle = require('../models/Vehicle');
const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/connection');

class VehicleController {
  // Create new vehicle
  static async createVehicle(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        vehicle_number,
        vehicle_type,
        make,
        model,
        year,
        capacity,
        registration_number,
        insurance_expiry,
        driver_id,
        conductor_id,
        route_id,
        fuel_type,
        maintenance_schedule
      } = req.body;

      // Check if vehicle number already exists
      const existingVehicle = await Vehicle.findBySchool(schoolId);
      const duplicate = existingVehicle.find(v => 
        v.vehicle_number.toLowerCase() === vehicle_number.toLowerCase()
      );

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Vehicle number already exists'
        });
      }

      const vehicle = await Vehicle.create({
        vehicle_number,
        vehicle_type: vehicle_type || 'bus',
        make,
        model,
        year: parseInt(year),
        capacity: parseInt(capacity),
        registration_number,
        insurance_expiry,
        driver_id: driver_id || null,
        conductor_id: conductor_id || null,
        route_id: route_id || null,
        fuel_type: fuel_type || 'diesel',
        maintenance_schedule: maintenance_schedule || 'monthly',
        status: 'active',
        current_latitude: null,
        current_longitude: null,
        current_speed: 0,
        fuel_level: 100
      }, schoolId);

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: vehicle
      });

    } catch (error) {
      logger.error('Create vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating vehicle'
      });
    }
  }

  // Get all vehicles
  static async getVehicles(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const filters = req.query;

      const vehicles = await Vehicle.findBySchool(schoolId, filters);

      // Enrich vehicles with additional data
      const enrichedVehicles = await Promise.all(
        vehicles.map(async (vehicle) => {
          // Get current route info if assigned
          let routeInfo = null;
          if (vehicle.route_id) {
            routeInfo = await db('transport_routes')
              .select(['route_name', 'estimated_duration'])
              .where('id', vehicle.route_id)
              .first();
          }

          // Get student count if assigned to route
          let studentCount = 0;
          if (vehicle.route_id) {
            const count = await db('student_transport')
              .count('* as count')
              .where('route_id', vehicle.route_id)
              .where('status', 'active')
              .first();
            studentCount = parseInt(count.count);
          }

          return {
            ...vehicle,
            route_info: routeInfo,
            assigned_students: studentCount,
            driver_name: vehicle.driver_first_name ? 
              `${vehicle.driver_first_name} ${vehicle.driver_last_name}` : null,
            conductor_name: vehicle.conductor_first_name ? 
              `${vehicle.conductor_first_name} ${vehicle.conductor_last_name}` : null
          };
        })
      );

      res.json({
        success: true,
        data: enrichedVehicles,
        count: enrichedVehicles.length
      });

    } catch (error) {
      logger.error('Get vehicles error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vehicles'
      });
    }
  }

  // Get single vehicle by ID
  static async getVehicleById(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { vehicleId } = req.params;

      const vehicles = await Vehicle.findBySchool(schoolId);
      const vehicle = vehicles.find(v => v.id === vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      // Get maintenance history
      const maintenanceHistory = await Vehicle.getMaintenanceSchedule(vehicleId, schoolId);

      // Get recent location history
      const locationHistory = await db('vehicle_location_history')
        .select(['latitude', 'longitude', 'speed', 'recorded_at'])
        .where('vehicle_id', vehicleId)
        .orderBy('recorded_at', 'desc')
        .limit(50);

      // Get fuel consumption data
      const fuelHistory = await db('vehicle_fuel_logs')
        .select(['fuel_amount', 'cost', 'odometer_reading', 'refuel_date'])
        .where('vehicle_id', vehicleId)
        .orderBy('refuel_date', 'desc')
        .limit(20);

      res.json({
        success: true,
        data: {
          ...vehicle,
          maintenance_history: maintenanceHistory,
          recent_locations: locationHistory,
          fuel_history: fuelHistory
        }
      });

    } catch (error) {
      logger.error('Get vehicle by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vehicle details'
      });
    }
  }

  // Update vehicle location (for GPS tracking)
  static async updateVehicleLocation(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { vehicleId } = req.params;
      const { latitude, longitude, speed = 0 } = req.body;

      const vehicle = await Vehicle.updateLocation(vehicleId, schoolId, latitude, longitude, speed);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      res.json({
        success: true,
        message: 'Vehicle location updated successfully',
        data: {
          vehicle_id: vehicle.id,
          latitude: vehicle.current_latitude,
          longitude: vehicle.current_longitude,
          speed: vehicle.current_speed,
          updated_at: vehicle.last_location_update
        }
      });

    } catch (error) {
      logger.error('Update vehicle location error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating vehicle location'
      });
    }
  }

  // Update vehicle status
  static async updateVehicleStatus(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { vehicleId } = req.params;
      const { status, notes } = req.body;

      const validStatuses = ['active', 'maintenance', 'out_of_service', 'inactive'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid vehicle status'
        });
      }

      const vehicle = await Vehicle.updateStatus(vehicleId, schoolId, status, notes);

      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      res.json({
        success: true,
        message: 'Vehicle status updated successfully',
        data: vehicle
      });

    } catch (error) {
      logger.error('Update vehicle status error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating vehicle status'
      });
    }
  }
 // Delete vehicle
  static async deleteVehicle(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { vehicleId } = req.params;

      // Check if vehicle is assigned to active routes or has recent activities
      const activeAssignment = await db('student_transport')
        .join('vehicles', 'student_transport.route_id', 'vehicles.route_id')
        .where('vehicles.id', vehicleId)
        .where('student_transport.status', 'active')
        .first();

      if (activeAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete vehicle with active student assignments'
        });
      }

      // Check for recent activities (last 30 days)
      const recentActivity = await db('transport_activities')
        .where('vehicle_id', vehicleId)
        .where('recorded_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .first();

      if (recentActivity) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete vehicle with recent transport activities'
        });
      }

      // Soft delete by updating status
      const [deletedVehicle] = await db('vehicles')
        .where({ id: vehicleId, school_id: schoolId })
        .update({
          status: 'inactive',
          route_id: null,
          updated_at: new Date()
        })
        .returning('*');

      if (!deletedVehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found'
        });
      }

      res.json({
        success: true,
        message: 'Vehicle deleted successfully',
        data: deletedVehicle
      });

    } catch (error) {
      logger.error('Delete vehicle error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting vehicle'
      });
    }
  }
  // Schedule maintenance
  static async scheduleMaintenance(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { vehicleId } = req.params;
      const {
        maintenance_type,
        scheduled_date,
        estimated_cost,
        description,
        service_provider
      } = req.body;

      const maintenance = await Vehicle.scheduleMaintenance(vehicleId, schoolId, {
        maintenance_type,
        scheduled_date,
        estimated_cost: parseFloat(estimated_cost || 0),
        description,
        service_provider,
        status: 'scheduled'
      });

      res.status(201).json({
        success: true,
        message: 'Maintenance scheduled successfully',
        data: maintenance
      });

    } catch (error) {
      logger.error('Schedule maintenance error:', error);
      res.status(500).json({
        success: false,
        message: 'Error scheduling maintenance'
      });
    }
  }

  // Record fuel consumption
  static async recordFuelConsumption(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { vehicleId } = req.params;
      const {
        fuel_amount,
        cost,
        odometer_reading,
        refuel_date,
        fuel_station,
        receipt_number
      } = req.body;

      const [fuelLog] = await db('vehicle_fuel_logs')
        .insert({
          id: crypto.randomUUID(),
          vehicle_id: vehicleId,
          school_id: schoolId,
          fuel_amount: parseFloat(fuel_amount),
          cost: parseFloat(cost),
          odometer_reading: parseInt(odometer_reading),
          refuel_date,
          fuel_station,
          receipt_number,
          cost_per_liter: parseFloat(cost) / parseFloat(fuel_amount),
          created_at: new Date()
        })
        .returning('*');

      // Update vehicle fuel level (simplified calculation)
      await db('vehicles')
        .where({ id: vehicleId, school_id: schoolId })
        .update({ fuel_level: Math.min(100, parseFloat(fuel_amount)) });

      res.status(201).json({
        success: true,
        message: 'Fuel consumption recorded successfully',
        data: fuelLog
      });

    } catch (error) {
      logger.error('Record fuel consumption error:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording fuel consumption'
      });
    }
  }

  // Get vehicle statistics
  static async getVehicleStatistics(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { start_date, end_date } = req.query;

      const statistics = await db('vehicles')
        .select([
          db.raw('COUNT(*) as total_vehicles'),
          db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_vehicles'),
          db.raw('COUNT(CASE WHEN status = \'maintenance\' THEN 1 END) as maintenance_vehicles'),
          db.raw('COUNT(CASE WHEN route_id IS NOT NULL THEN 1 END) as assigned_vehicles'),
          db.raw('AVG(capacity) as avg_capacity')
        ])
        .where('school_id', schoolId)
        .first();

      // Fuel consumption statistics
      let fuelStats = null;
      if (start_date && end_date) {
        fuelStats = await db('vehicle_fuel_logs')
          .select([
            db.raw('SUM(fuel_amount) as total_fuel_consumed'),
            db.raw('SUM(cost) as total_fuel_cost'),
            db.raw('AVG(cost_per_liter) as avg_cost_per_liter'),
            db.raw('COUNT(*) as refuel_count')
          ])
          .where('school_id', schoolId)
          .where('refuel_date', '>=', start_date)
          .where('refuel_date', '<=', end_date)
          .first();
      }

      res.json({
        success: true,
        data: {
          fleet_overview: {
            total_vehicles: parseInt(statistics.total_vehicles),
            active_vehicles: parseInt(statistics.active_vehicles),
            maintenance_vehicles: parseInt(statistics.maintenance_vehicles),
            assigned_vehicles: parseInt(statistics.assigned_vehicles),
            avg_capacity: parseFloat(statistics.avg_capacity || 0).toFixed(1),
            utilization_rate: statistics.total_vehicles > 0 ? 
              ((statistics.assigned_vehicles / statistics.total_vehicles) * 100).toFixed(2) : 0
          },
          fuel_statistics: fuelStats ? {
            total_fuel_consumed: parseFloat(fuelStats.total_fuel_consumed || 0),
            total_fuel_cost: parseFloat(fuelStats.total_fuel_cost || 0),
            avg_cost_per_liter: parseFloat(fuelStats.avg_cost_per_liter || 0).toFixed(2),
            refuel_count: parseInt(fuelStats.refuel_count || 0)
          } : null,
          period: start_date && end_date ? { start_date, end_date } : null
        }
      });

    } catch (error) {
      logger.error('Get vehicle statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching vehicle statistics'
      });
    }
  }
}

module.exports = VehicleController;