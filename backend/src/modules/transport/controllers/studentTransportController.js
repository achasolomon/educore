// backend/src/modules/transport/controllers/studentTransportController.js
const StudentTransport = require('../models/StudentTransport');
const logger = require('../../../core/utils/logger');
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class StudentTransportController {
  // Enroll student in transport
  static async enrollStudent(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const {
        route_id,
        stop_id,
        academic_year_id,
        transport_fee,
        pickup_point,
        morning_pickup = true,
        evening_pickup = true,
        emergency_contacts,
        special_instructions
      } = req.body;

      // Validate student exists
      const student = await db('students')
        .where({ id: studentId, school_id: schoolId })
        .first();

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Validate route and stop
      const route = await db('transport_routes')
        .where({ id: route_id, school_id: schoolId, is_active: true })
        .first();

      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Transport route not found or inactive'
        });
      }

      const enrollment = await StudentTransport.enrollStudent(
        studentId,
        route_id,
        stop_id,
        schoolId,
        academic_year_id,
        parseFloat(transport_fee || 0)
      );

      // Update additional details
      await db('student_transport')
        .where('id', enrollment.id)
        .update({
          pickup_point,
          morning_pickup,
          evening_pickup,
          emergency_contacts: JSON.stringify(emergency_contacts || []),
          special_instructions,
          updated_at: new Date()
        });

      res.status(201).json({
        success: true,
        message: 'Student enrolled in transport successfully',
        data: enrollment
      });

    } catch (error) {
      logger.error('Enroll student in transport error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error enrolling student in transport'
      });
    }
  }

  // Get students by route
  static async getStudentsByRoute(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { routeId } = req.params;
      const { academic_year_id } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const students = await StudentTransport.getStudentsByRoute(
        routeId,
        schoolId,
        academic_year_id
      );

      // Enrich with transport fee information
      const enrichedStudents = await Promise.all(
        students.map(async (student) => {
          const feeInfo = await db('transport_fees')
            .select(['status', 'balance', 'due_date', 'is_overdue'])
            .where({
              student_transport_id: student.id,
              academic_year_id
            })
            .first();

          return {
            ...student,
            emergency_contacts: JSON.parse(student.emergency_contacts || '[]'),
            fee_status: feeInfo || { status: 'pending', balance: student.transport_fee }
          };
        })
      );

      res.json({
        success: true,
        data: enrichedStudents,
        count: enrichedStudents.length
      });

    } catch (error) {
      logger.error('Get students by route error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching students by route'
      });
    }
  }

  // Record boarding activity
  static async recordBoardingActivity(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const {
        vehicle_id,
        activity_type,
        location_latitude,
        location_longitude,
        notes
      } = req.body;

      const validActivities = ['boarded', 'alighted', 'absent', 'late'];
      if (!validActivities.includes(activity_type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid activity type'
        });
      }

      const location = location_latitude && location_longitude ? {
        latitude: parseFloat(location_latitude),
        longitude: parseFloat(location_longitude)
      } : null;

      const activity = await StudentTransport.recordBoardingActivity(
        studentId,
        vehicle_id,
        activity_type,
        schoolId,
        location
      );

      // Add additional details
      await db('transport_activities')
        .where('id', activity.id)
        .update({
          notes,
          recorded_by: req.user.id,
          updated_at: new Date()
        });

      res.status(201).json({
        success: true,
        message: `Student ${activity_type} activity recorded successfully`,
        data: activity
      });

    } catch (error) {
      logger.error('Record boarding activity error:', error);
      res.status(500).json({
        success: false,
        message: 'Error recording boarding activity'
      });
    }
  }

  // Get student transport history
  static async getStudentTransportHistory(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const { start_date, end_date, limit = 50 } = req.query;

      let query = db('transport_activities')
        .select([
          'transport_activities.*',
          'vehicles.vehicle_number',
          'transport_routes.route_name',
          'users.first_name as recorded_by_name'
        ])
        .join('vehicles', 'transport_activities.vehicle_id', 'vehicles.id')
        .join('transport_routes', 'transport_activities.route_id', 'transport_routes.id')
        .leftJoin('users', 'transport_activities.recorded_by', 'users.id')
        .where({
          'transport_activities.school_id': schoolId,
          'transport_activities.student_id': studentId
        })
        .orderBy('transport_activities.recorded_at', 'desc')
        .limit(parseInt(limit));

      if (start_date) {
        query = query.where('transport_activities.recorded_at', '>=', start_date);
      }

      if (end_date) {
        query = query.where('transport_activities.recorded_at', '<=', end_date);
      }

      const history = await query;

      res.json({
        success: true,
        data: history,
        count: history.length
      });

    } catch (error) {
      logger.error('Get student transport history error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching student transport history'
      });
    }
  }

  // Get transport statistics
  static async getTransportStatistics(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { academic_year_id, start_date, end_date } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const dateRange = start_date && end_date ? {
        start: start_date,
        end: end_date
      } : null;

      const statistics = await StudentTransport.getTransportStatistics(
        schoolId,
        academic_year_id,
        dateRange
      );

      // Additional route-wise statistics
      const routeStats = await db('student_transport')
        .select([
          'transport_routes.route_name',
          'transport_routes.id as route_id',
          db.raw('COUNT(student_transport.id) as enrolled_students'),
          db.raw('SUM(student_transport.transport_fee) as total_fees'),
          db.raw('AVG(student_transport.transport_fee) as avg_fee_per_student')
        ])
        .join('transport_routes', 'student_transport.route_id', 'transport_routes.id')
        .where({
          'student_transport.school_id': schoolId,
          'student_transport.academic_year_id': academic_year_id,
          'student_transport.status': 'active'
        })
        .groupBy(['transport_routes.id', 'transport_routes.route_name'])
        .orderBy('enrolled_students', 'desc');

      res.json({
        success: true,
        data: {
          ...statistics,
          route_statistics: routeStats.map(route => ({
            route_name: route.route_name,
            route_id: route.route_id,
            enrolled_students: parseInt(route.enrolled_students),
            total_fees: parseFloat(route.total_fees),
            avg_fee_per_student: parseFloat(route.avg_fee_per_student || 0)
          }))
        }
      });

    } catch (error) {
      logger.error('Get transport statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching transport statistics'
      });
    }
  }

  // Update student transport details
  static async updateStudentTransport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.school_id;
      delete updateData.student_id;
      delete updateData.created_at;
      delete updateData.enrolled_date;

      // Handle JSON fields
      if (updateData.emergency_contacts) {
        updateData.emergency_contacts = JSON.stringify(updateData.emergency_contacts);
      }

      updateData.updated_at = new Date();

      const [transport] = await db('student_transport')
        .where({
          student_id: studentId,
          school_id: schoolId,
          status: 'active'
        })
        .update(updateData)
        .returning('*');

      if (!transport) {
        return res.status(404).json({
          success: false,
          message: 'Active student transport enrollment not found'
        });
      }

      res.json({
        success: true,
        message: 'Student transport updated successfully',
        data: {
          ...transport,
          emergency_contacts: JSON.parse(transport.emergency_contacts || '[]')
        }
      });

    } catch (error) {
      logger.error('Update student transport error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating student transport'
      });
    }
  }

  // Suspend student transport
  static async suspendStudentTransport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const { reason, suspension_start_date, suspension_end_date } = req.body;

      const [updated] = await db('student_transport')
        .where({
          student_id: studentId,
          school_id: schoolId,
          status: 'active'
        })
        .update({
          status: 'suspended',
          metadata: db.raw(`
            COALESCE(metadata, '{}')::jsonb || ?::jsonb
          `, [JSON.stringify({
            suspension_reason: reason,
            suspension_start: suspension_start_date,
            suspension_end: suspension_end_date,
            suspended_by: req.user.id,
            suspended_at: new Date()
          })])
        })
        .returning('*');

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Active transport enrollment not found for student'
        });
      }

      res.json({
        success: true,
        message: 'Student transport suspended successfully',
        data: updated
      });

    } catch (error) {
      logger.error('Suspend student transport error:', error);
      res.status(500).json({
        success: false,
        message: 'Error suspending student transport'
      });
    }
  }

  // Terminate student transport
  static async terminateStudentTransport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const { termination_reason, termination_date } = req.body;

      const [transport] = await db('student_transport')
        .where({
          student_id: studentId,
          school_id: schoolId,
          status: 'active'
        })
        .update({
          status: 'terminated',
          end_date: termination_date || new Date(),
          metadata: db.raw(`
            COALESCE(metadata, '{}')::jsonb || ?::jsonb
          `, [JSON.stringify({
            termination_reason,
            terminated_by: req.user.id,
            terminated_at: new Date()
          })]),
          updated_at: new Date()
        })
        .returning('*');

      if (!transport) {
        return res.status(404).json({
          success: false,
          message: 'Active student transport enrollment not found'
        });
      }

      res.json({
        success: true,
        message: 'Student transport terminated successfully',
        data: transport
      });

    } catch (error) {
      logger.error('Terminate student transport error:', error);
      res.status(500).json({
        success: false,
        message: 'Error terminating student transport'
      });
    }
  }

  // Get student's current transport details
  static async getStudentTransportDetails(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const { academic_year_id } = req.query;

      if (!academic_year_id) {
        return res.status(400).json({
          success: false,
          message: 'Academic year ID is required'
        });
      }

      const transportDetails = await db('student_transport')
        .select([
          'student_transport.*',
          'transport_routes.route_name',
          'transport_routes.start_time',
          'transport_routes.end_time',
          'transport_routes.estimated_duration',
          'students.first_name',
          'students.last_name',
          'students.student_id as student_number'
        ])
        .join('transport_routes', 'student_transport.route_id', 'transport_routes.id')
        .join('students', 'student_transport.student_id', 'students.id')
        .where({
          'student_transport.student_id': studentId,
          'student_transport.school_id': schoolId,
          'student_transport.academic_year_id': academic_year_id
        })
        .first();

      if (!transportDetails) {
        return res.status(404).json({
          success: false,
          message: 'Student transport enrollment not found'
        });
      }

      // Get route stops to find student's stop details
      const route = await db('transport_routes')
        .select('stops')
        .where('id', transportDetails.route_id)
        .first();

      const stops = JSON.parse(route.stops || '[]');
      const studentStop = stops.find(stop => stop.id === transportDetails.stop_id);

      // Get recent activities
      const recentActivities = await db('transport_activities')
        .select([
          'activity_type',
          'recorded_at',
          'location_name'
        ])
        .where({
          student_id: studentId,
          school_id: schoolId
        })
        .orderBy('recorded_at', 'desc')
        .limit(10);

      // Get fee information
      const feeInfo = await db('transport_fees')
        .select('*')
        .where({
          student_transport_id: transportDetails.id,
          academic_year_id
        })
        .first();

      const enrichedDetails = {
        ...transportDetails,
        emergency_contacts: JSON.parse(transportDetails.emergency_contacts || '[]'),
        student_stop: studentStop,
        recent_activities: recentActivities,
        fee_information: feeInfo,
        student_name: `${transportDetails.first_name} ${transportDetails.last_name}`
      };

      res.json({
        success: true,
        data: enrichedDetails
      });

    } catch (error) {
      logger.error('Get student transport details error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching student transport details'
      });
    }
  }

  // Reactivate suspended transport
  static async reactivateStudentTransport(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { studentId } = req.params;
      const { reactivation_notes } = req.body;

      const [transport] = await db('student_transport')
        .where({
          student_id: studentId,
          school_id: schoolId,
          status: 'suspended'
        })
        .update({
          status: 'active',
          metadata: db.raw(`
            COALESCE(metadata, '{}')::jsonb || ?::jsonb
          `, [JSON.stringify({
            reactivated_by: req.user.id,
            reactivated_at: new Date(),
            reactivation_notes
          })]),
          updated_at: new Date()
        })
        .returning('*');

      if (!transport) {
        return res.status(404).json({
          success: false,
          message: 'Suspended student transport enrollment not found'
        });
      }

      res.json({
        success: true,
        message: 'Student transport reactivated successfully',
        data: transport
      });

    } catch (error) {
      logger.error('Reactivate student transport error:', error);
      res.status(500).json({
        success: false,
        message: 'Error reactivating student transport'
      });
    }
  }

  // Bulk enroll students in transport
  static async bulkEnrollStudents(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        student_ids,
        route_id,
        stop_id,
        academic_year_id,
        transport_fee = 0,
        pickup_point,
        morning_pickup = true,
        evening_pickup = true
      } = req.body;

      if (!Array.isArray(student_ids) || student_ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Student IDs array is required'
        });
      }

      // Validate route exists
      const route = await db('transport_routes')
        .where({ id: route_id, school_id: schoolId, is_active: true })
        .first();

      if (!route) {
        return res.status(404).json({
          success: false,
          message: 'Transport route not found or inactive'
        });
      }

      const enrollments = [];
      const errors = [];

      for (const studentId of student_ids) {
        try {
          // Check if student already enrolled
          const existing = await db('student_transport')
            .where({
              student_id: studentId,
              school_id: schoolId,
              academic_year_id,
              status: 'active'
            })
            .first();

          if (existing) {
            errors.push({
              student_id: studentId,
              error: 'Student already enrolled in transport'
            });
            continue;
          }

          const enrollment = await StudentTransport.enrollStudent(
            studentId,
            route_id,
            stop_id,
            schoolId,
            academic_year_id,
            parseFloat(transport_fee)
          );

          // Update additional details
          await db('student_transport')
            .where('id', enrollment.id)
            .update({
              pickup_point,
              morning_pickup,
              evening_pickup,
              updated_at: new Date()
            });

          enrollments.push(enrollment);

        } catch (error) {
          errors.push({
            student_id: studentId,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `Bulk enrollment completed: ${enrollments.length} successful, ${errors.length} failed`,
        data: {
          successful_enrollments: enrollments,
          failed_enrollments: errors,
          summary: {
            total_attempted: student_ids.length,
            successful: enrollments.length,
            failed: errors.length
          }
        }
      });

    } catch (error) {
      logger.error('Bulk enroll students error:', error);
      res.status(500).json({
        success: false,
        message: 'Error performing bulk enrollment'
      });
    }
  }
}

module.exports = StudentTransportController;