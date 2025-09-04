// backend/src/modules/transport/models/Route.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class VehicleRoutes {
  static tableName = 'transport_routes';

  static async create(routeData, schoolId) {
    const [route] = await db(this.tableName)
      .insert({
        ...routeData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        route_coordinates: JSON.stringify(routeData.route_coordinates || []),
        stops: JSON.stringify(routeData.stops || [])
      })
      .returning('*');
    return route;
  }

  static async findBySchool(schoolId, includeInactive = false) {
    let query = db(this.tableName)
      .select([
        'transport_routes.*',
        db.raw('COUNT(DISTINCT vehicles.id) as assigned_vehicles'),
        db.raw('COUNT(DISTINCT student_transport.student_id) as enrolled_students')
      ])
      .leftJoin('vehicles', 'transport_routes.id', 'vehicles.route_id')
      .leftJoin('student_transport', 'transport_routes.id', 'student_transport.route_id')
      .where('transport_routes.school_id', schoolId)
      .groupBy('transport_routes.id');

    if (!includeInactive) {
      query = query.where('transport_routes.is_active', true);
    }

    return await query.orderBy('transport_routes.route_name', 'asc');
  }

  static async addStop(routeId, schoolId, stopData) {
    const route = await db(this.tableName)
      .where({ id: routeId, school_id: schoolId })
      .first();

    if (!route) {
      throw new Error('Route not found');
    }

    const currentStops = JSON.parse(route.stops || '[]');
    const newStop = {
      id: crypto.randomUUID(),
      ...stopData,
      stop_order: currentStops.length + 1,
      created_at: new Date()
    };

    currentStops.push(newStop);

    const [updatedRoute] = await db(this.tableName)
      .where({ id: routeId })
      .update({
        stops: JSON.stringify(currentStops),
        updated_at: new Date()
      })
      .returning('*');

    return updatedRoute;
  }

  static async optimizeRoute(routeId, schoolId) {
    // Simple route optimization based on geographical proximity
    const route = await db(this.tableName)
      .where({ id: routeId, school_id: schoolId })
      .first();

    if (!route) {
      throw new Error('Route not found');
    }

    const stops = JSON.parse(route.stops || '[]');
    
    // Sort stops by geographical proximity (simple distance calculation)
    const optimizedStops = this.calculateOptimalStopOrder(stops);
    
    const [updatedRoute] = await db(this.tableName)
      .where({ id: routeId })
      .update({
        stops: JSON.stringify(optimizedStops),
        updated_at: new Date()
      })
      .returning('*');

    return updatedRoute;
  }

  static calculateOptimalStopOrder(stops) {
    if (stops.length <= 2) return stops;

    // Simple nearest neighbor algorithm for route optimization
    const optimized = [stops[0]]; // Start with first stop
    const remaining = stops.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = this.calculateDistance(current, remaining[0]);

      for (let i = 1; i < remaining.length; i++) {
        const distance = this.calculateDistance(current, remaining[i]);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    // Update stop orders
    return optimized.map((stop, index) => ({
      ...stop,
      stop_order: index + 1
    }));
  }

  static calculateDistance(point1, point2) {
    // Haversine formula for distance between two GPS coordinates
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

module.exports = VehicleRoutes;