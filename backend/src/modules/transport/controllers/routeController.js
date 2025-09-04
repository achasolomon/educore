
// backend/src/modules/transport/controllers/routeController.js
const VehicleRoutes = require('../models/Route');
const logger = require('../../../core/utils/logger');

class RouteController {
  // Create new route
  static async createRoute(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        route_name,
        start_location,
        end_location,
        estimated_duration,
        distance_km,
        route_coordinates,
        stops,
        operating_days,
        start_time,
        end_time
      } = req.body;

      const route = await VehicleRoutes.create({
        route_name,
        start_location,
        end_location,
        estimated_duration: parseInt(estimated_duration),
        distance_km: parseFloat(distance_km || 0),
        route_coordinates: route_coordinates || [],
        stops: stops || [],
        operating_days: JSON.stringify(operating_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
        start_time,
        end_time,
        is_active: true
      }, schoolId);

      res.status(201).json({
        success: true,
        message: 'Transport route created successfully',
        data: route
      });

    } catch (error) {
      logger.error('Create route error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating transport route'
      });
    }
  }

  // Get all routes
  static async getRoutes(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { include_inactive } = req.query;

      const routes = await VehicleRoutes.findBySchool(schoolId, include_inactive === 'true');

      const enrichedRoutes = routes.map(route => ({
        ...route,
        route_coordinates: JSON.parse(route.route_coordinates || '[]'),
        stops: JSON.parse(route.stops || '[]'),
        operating_days: JSON.parse(route.operating_days || '[]'),
        assigned_vehicles: parseInt(route.assigned_vehicles),
        enrolled_students: parseInt(route.enrolled_students),
        efficiency_rating: this.calculateRouteEfficiency(route)
      }));

      res.json({
        success: true,
        data: enrichedRoutes,
        count: enrichedRoutes.length
      });

    } catch (error) {
      logger.error('Get routes error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transport routes'
      });
    }
  }

  // Add stop to route
  static async addStopToRoute(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { routeId } = req.params;
      const {
        stop_name,
        latitude,
        longitude,
        estimated_arrival_time,
        pickup_time_morning,
        pickup_time_evening
      } = req.body;

      const route = await VehicleRoutes.addStop(routeId, schoolId, {
        stop_name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        estimated_arrival_time,
        pickup_time_morning,
        pickup_time_evening
      });

      res.json({
        success: true,
        message: 'Stop added to route successfully',
      }); 
    } catch (error) {
      logger.error('Add stop to route error:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding stop to route'
      });
    }
  }

 

  // Complete maintenance record
  static async completeMaintenance(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { maintenanceId } = req.params;
      const {
        work_performed,
        actual_cost,
        actual_hours,
        parts_used,
        materials_used,
        quality_rating,
        quality_notes,
        next_service_due,
        odometer_reading
      } = req.body;

      const [maintenance] = await db('vehicle_maintenance')
        .where({ id: maintenanceId, school_id: schoolId })
        .update({
          status: 'completed',
          completed_date: new Date(),
          completed_by: req.user.id,
          work_performed,
          actual_cost: parseFloat(actual_cost || 0),
          actual_hours: parseInt(actual_hours || 0),
          parts_used: JSON.stringify(parts_used || []),
          materials_used: JSON.stringify(materials_used || []),
          quality_rating: parseInt(quality_rating || 0),
          quality_notes,
          next_service_due,
          odometer_reading: parseInt(odometer_reading || 0),
          updated_at: new Date()
        })
        .returning('*');

      if (!maintenance) {
        return res.status(404).json({
          success: false,
          message: 'Maintenance record not found'
        });
      }

      // Update vehicle maintenance dates
      await db('vehicles')
        .where('id', maintenance.vehicle_id)
        .update({
          last_maintenance_date: new Date(),
          next_maintenance_due,
          odometer_reading,
          status: 'active', // Return to active if it was under maintenance
          updated_at: new Date()
        });

      res.json({
        success: true,
        message: 'Maintenance completed successfully',
        data: maintenance
      });

    } catch (error) {
      logger.error('Complete maintenance error:', error);
      res.status(500).json({
        success: false,
        message: 'Error completing maintenance record'
      });
    }
  }

// Complete missing methods in RouteController

  // Update route
  static async updateRoute(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { routeId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.school_id;
      delete updateData.created_at;

      // Handle JSON fields
      if (updateData.route_coordinates) {
        updateData.route_coordinates = JSON.stringify(updateData.route_coordinates);
      }
      if (updateData.stops) {
        updateData.stops = JSON.stringify(updateData.stops);
      }
      if (updateData.operating_days) {
        updateData.operating_days = JSON.stringify(updateData.operating_days);
      }

      updateData.updated_at = new Date();

      const [route] = await db('transport_routes')
        .where({ id: routeId, school_id: schoolId })
        .update(updateData)
        .returning('*');

      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      res.json({
        success: true,
        message: 'Route updated successfully',
        data: {
          ...route,
          route_coordinates: JSON.parse(route.route_coordinates || '[]'),
          stops: JSON.parse(route.stops || '[]'),
          operating_days: JSON.parse(route.operating_days || '[]')
        }
      });

    } catch (error) {
      logger.error('Update route error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating route'
      });
    }
  }

  // Delete/Deactivate route
  static async deleteRoute(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { routeId } = req.params;

      // Check if route has active student enrollments
      const activeEnrollments = await db('student_transport')
        .count('* as count')
        .where('route_id', routeId)
        .where('status', 'active')
        .first();

      if (parseInt(activeEnrollments.count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete route with active student enrollments'
        });
      }

      // Check if route has assigned vehicles
      const assignedVehicles = await db('vehicles')
        .count('* as count')
        .where('route_id', routeId)
        .where('status', 'active')
        .first();

      if (parseInt(assignedVehicles.count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete route with assigned vehicles'
        });
      }

      // Soft delete by deactivating
      const [route] = await db('transport_routes')
        .where({ id: routeId, school_id: schoolId })
        .update({
          is_active: false,
          updated_at: new Date()
        })
        .returning('*');

      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      res.json({
        success: true,
        message: 'Route deactivated successfully',
        data: route
      });

    } catch (error) {
      logger.error('Delete route error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting route'
      });
    }
  }

  // Remove stop from route
  static async removeStopFromRoute(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { routeId, stopId } = req.params;

      const route = await db('transport_routes')
        .where({ id: routeId, school_id: schoolId })
        .first();

      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Route not found'
        });
      }

      // Check if any students are using this stop
      const studentsAtStop = await db('student_transport')
        .count('* as count')
        .where('route_id', routeId)
        .where('stop_id', stopId)
        .where('status', 'active')
        .first();

      if (parseInt(studentsAtStop.count) > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot remove stop with active student assignments'
        });
      }

      const currentStops = JSON.parse(route.stops || '[]');
      const updatedStops = currentStops.filter(stop => stop.id !== stopId);

      // Reorder remaining stops
      const reorderedStops = updatedStops.map((stop, index) => ({
        ...stop,
        stop_order: index + 1
      }));

      const [updatedRoute] = await db('transport_routes')
        .where({ id: routeId })
        .update({
          stops: JSON.stringify(reorderedStops),
          updated_at: new Date()
        })
        .returning('*');

      res.json({
        success: true,
        message: 'Stop removed from route successfully',
        data: {
          ...updatedRoute,
          stops: reorderedStops
        }
      });

    } catch (error) {
      logger.error('Remove stop from route error:', error);
      res.status(500).json({
        success: false,
        message: 'Error removing stop from route'
      });
    }
  }
}
export default RouteController;