// backend/src/modules/health/models/HealthIncident.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class HealthIncident {
  static tableName = 'health_incidents';

  static async create(incidentData, schoolId, reportedBy) {
    const incidentReference = await this.generateIncidentReference(schoolId);
    
    const [incident] = await db(this.tableName)
      .insert({
        ...incidentData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        reported_by: reportedBy,
        incident_reference: incidentReference,
        incident_datetime: incidentData.incident_datetime || new Date()
      })
      .returning('*');

    return incident;
  }

  static async findBySchool(schoolId, filters = {}) {
    let query = db(this.tableName)
      .select([
        'health_incidents.*',
        'students.first_name as student_first_name',
        'students.last_name as student_last_name',
        'students.student_id as student_number',
        'classes.name as class_name',
        'reported_user.first_name as reported_by_name',
        'attended_user.first_name as attended_by_name'
      ])
      .join('students', 'health_incidents.student_id', 'students.id')
      .leftJoin('classes', 'students.class_id', 'classes.id')
      .leftJoin('users as reported_user', 'health_incidents.reported_by', 'reported_user.id')
      .leftJoin('users as attended_user', 'health_incidents.attended_by', 'attended_user.id')
      .where('health_incidents.school_id', schoolId);

    if (filters.status) {
      query = query.where('health_incidents.status', filters.status);
    }

    if (filters.severity_level) {
      query = query.where('health_incidents.severity_level', filters.severity_level);
    }

    if (filters.incident_type) {
      query = query.where('health_incidents.incident_type', filters.incident_type);
    }

    if (filters.date_from) {
      query = query.where('health_incidents.incident_datetime', '>=', filters.date_from);
    }

    if (filters.date_to) {
      query = query.where('health_incidents.incident_datetime', '<=', filters.date_to);
    }

    if (filters.requires_follow_up !== undefined) {
      query = query.where('health_incidents.requires_follow_up', filters.requires_follow_up);
    }

    return await query.orderBy('health_incidents.incident_datetime', 'desc');
  }

  static async findById(incidentId, schoolId) {
    return await db(this.tableName)
      .select([
        'health_incidents.*',
        'students.first_name as student_first_name',
        'students.last_name as student_last_name',
        'students.student_id as student_number',
        'students.date_of_birth',
        'classes.name as class_name',
        'reported_user.first_name as reported_by_name',
        'attended_user.first_name as attended_by_name',
        'resolved_user.first_name as resolved_by_name'
      ])
      .join('students', 'health_incidents.student_id', 'students.id')
      .leftJoin('classes', 'students.class_id', 'classes.id')
      .leftJoin('users as reported_user', 'health_incidents.reported_by', 'reported_user.id')
      .leftJoin('users as attended_user', 'health_incidents.attended_by', 'attended_user.id')
      .leftJoin('users as resolved_user', 'health_incidents.resolved_by', 'resolved_user.id')
      .where({
        'health_incidents.id': incidentId,
        'health_incidents.school_id': schoolId
      })
      .first();
  }

  static async updateIncident(incidentId, schoolId, updateData, updatedBy) {
    const [incident] = await db(this.tableName)
      .where({ id: incidentId, school_id: schoolId })
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .returning('*');

    return incident;
  }

  static async getIncidentStatistics(schoolId, dateRange) {
    const { startDate, endDate } = dateRange;
    
    let query = db(this.tableName)
      .where('school_id', schoolId);

    if (startDate && endDate) {
      query = query.whereBetween('incident_datetime', [startDate, endDate]);
    }

    const stats = await query
      .select([
        db.raw('COUNT(*) as total_incidents'),
        db.raw('COUNT(CASE WHEN severity_level = \'critical\' OR severity_level = \'life_threatening\' THEN 1 END) as critical_incidents'),
        db.raw('COUNT(CASE WHEN emergency_services_called = true THEN 1 END) as emergency_calls'),
        db.raw('COUNT(CASE WHEN status = \'open\' THEN 1 END) as open_incidents'),
        db.raw('COUNT(CASE WHEN requires_follow_up = true AND status != \'resolved\' THEN 1 END) as pending_follow_ups')
      ])
      .first();

    const incidentsByType = await query
      .select(['incident_type'])
      .count('* as count')
      .groupBy('incident_type');

    const incidentsBySeverity = await query
      .select(['severity_level'])
      .count('* as count')
      .groupBy('severity_level');

    return {
      ...stats,
      incidents_by_type: incidentsByType,
      incidents_by_severity: incidentsBySeverity
    };
  }

  static async generateIncidentReference(schoolId) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    const count = await db(this.tableName)
      .count('* as count')
      .where('school_id', schoolId)
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
      .whereRaw('EXTRACT(MONTH FROM created_at) = ?', [today.getMonth() + 1])
      .first();

    const sequenceNumber = String(parseInt(count.count) + 1).padStart(4, '0');
    return `HI-${year}${month}-${sequenceNumber}`;
  }

  static async getCriticalIncidents(schoolId) {
    return await db(this.tableName)
      .select([
        'health_incidents.*',
        'students.first_name as student_first_name',
        'students.last_name as student_last_name',
        'students.student_id as student_number'
      ])
      .join('students', 'health_incidents.student_id', 'students.id')
      .where('health_incidents.school_id', schoolId)
      .whereIn('health_incidents.severity_level', ['critical', 'life_threatening'])
      .where('health_incidents.status', '!=', 'resolved')
      .orderBy('health_incidents.incident_datetime', 'desc');
  }
}

module.exports = HealthIncident;