// backend/src/modules/transport/models/Vehicle.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Vehicle {
  static tableName = 'vehicles';

  static async create(vehicleData, schoolId) {
    const [vehicle] = await db(this.tableName)
      .insert({
        ...vehicleData,
        id: crypto.randomUUID(),
        school_id: schoolId
      })
      .returning('*');
    return vehicle;
  }

  static async findBySchool(schoolId, filters = {}) {
    let query = db(this.tableName)
      .select([
        'vehicles.*',
        'users.first_name as driver_first_name',
        'users.last_name as driver_last_name',
        'conductor.first_name as conductor_first_name',
        'conductor.last_name as conductor_last_name'
      ])
      .leftJoin('users', 'vehicles.driver_id', 'users.id')
      .leftJoin('users as conductor', 'vehicles.conductor_id', 'conductor.id')
      .where('vehicles.school_id', schoolId);

    if (filters.status) {
      query = query.where('vehicles.status', filters.status);
    }

    if (filters.route_id) {
      query = query.where('vehicles.route_id', filters.route_id);
    }

    return await query.orderBy('vehicles.vehicle_number', 'asc');
  }

  static async updateLocation(vehicleId, schoolId, latitude, longitude, speed = 0) {
    const [vehicle] = await db(this.tableName)
      .where({ id: vehicleId, school_id: schoolId })
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        current_speed: speed,
        last_location_update: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    // Log location history
    await db('vehicle_location_history').insert({
      id: crypto.randomUUID(),
      vehicle_id: vehicleId,
      latitude,
      longitude,
      speed,
      recorded_at: new Date()
    });

    return vehicle;
  }

  static async updateStatus(vehicleId, schoolId, status, notes = null) {
    const [vehicle] = await db(this.tableName)
      .where({ id: vehicleId, school_id: schoolId })
      .update({
        status,
        status_notes: notes,
        updated_at: new Date()
      })
      .returning('*');

    return vehicle;
  }

  static async getMaintenanceSchedule(vehicleId, schoolId) {
    return await db('vehicle_maintenance')
      .select([
        'maintenance_type',
        'scheduled_date',
        'completed_date',
        'cost',
        'status',
        'notes'
      ])
      .where('vehicle_id', vehicleId)
      .where('school_id', schoolId)
      .orderBy('scheduled_date', 'desc');
  }

  static async scheduleMaintenance(vehicleId, schoolId, maintenanceData) {
    const [maintenance] = await db('vehicle_maintenance')
      .insert({
        id: crypto.randomUUID(),
        vehicle_id: vehicleId,
        school_id: schoolId,
        ...maintenanceData
      })
      .returning('*');

    return maintenance;
  }
}

module.exports = Vehicle;