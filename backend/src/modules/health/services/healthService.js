
// backend/src/modules/health/services/healthService.js
const StudentHealthProfile = require('../models/StudentHealthProfile');
const HealthIncident = require('../models/HealthIncident');
const MedicalExamination = require('../models/MedicalExamination');
const NotificationService = require('../../communication/services/notificationService');
const { logger } = require('../../../core/utils/logger');

class HealthService {
  static async createStudentHealthProfile(profileData, schoolId, createdBy) {
    try {
      logger.info('Creating student health profile', { 
        studentId: profileData.student_id, 
        schoolId, 
        createdBy 
      });

      // Check if profile already exists
      const existingProfile = await StudentHealthProfile.findByStudent(
        profileData.student_id, 
        schoolId
      );

      if (existingProfile) {
        throw new Error('Health profile already exists for this student');
      }

      const profile = await StudentHealthProfile.create(profileData, schoolId, createdBy);

      // Send notifications if profile has critical alerts
      if (profileData.requires_special_attention) {
        await this.notifyHealthAlert(profile, 'special_attention_required');
      }

      if (profileData.vaccination_up_to_date === false) {
        await this.notifyHealthAlert(profile, 'vaccination_overdue');
      }

      logger.info('Student health profile created successfully', { profileId: profile.id });
      return profile;

    } catch (error) {
      logger.error('Error creating student health profile:', error);
      throw error;
    }
  }

  static async updateStudentHealthProfile(studentId, schoolId, updateData, updatedBy) {
    try {
      logger.info('Updating student health profile', { 
        studentId, 
        schoolId, 
        updatedBy 
      });

      const existingProfile = await StudentHealthProfile.findByStudent(studentId, schoolId);
      if (!existingProfile) {
        throw new Error('Health profile not found for this student');
      }

      const updatedProfile = await StudentHealthProfile.updateProfile(
        studentId, 
        schoolId, 
        updateData, 
        updatedBy
      );

      // Check for new health alerts
      await this.checkAndNotifyHealthChanges(existingProfile, updateData);

      logger.info('Student health profile updated successfully', { 
        profileId: updatedProfile.id 
      });

      return updatedProfile;

    } catch (error) {
      logger.error('Error updating student health profile:', error);
      throw error;
    }
  }

  static async recordHealthIncident(incidentData, schoolId, reportedBy) {
    try {
      logger.info('Recording health incident', { 
        studentId: incidentData.student_id, 
        incidentType: incidentData.incident_type,
        severityLevel: incidentData.severity_level,
        schoolId, 
        reportedBy 
      });

      const incident = await HealthIncident.create(incidentData, schoolId, reportedBy);

      // Immediate notifications for critical incidents
      if (['critical', 'life_threatening'].includes(incidentData.severity_level)) {
        await this.handleCriticalIncident(incident);
      }

      // Standard parent notification for all incidents
      if (incidentData.notify_parents !== false) {
        await this.notifyParentsOfIncident(incident);
      }

      // Create follow-up reminders if needed
      if (incidentData.requires_follow_up) {
        await this.scheduleFollowUpReminder(incident);
      }

      logger.info('Health incident recorded successfully', { 
        incidentId: incident.id,
        incidentReference: incident.incident_reference
      });

      return incident;

    } catch (error) {
      logger.error('Error recording health incident:', error);
      throw error;
    }
  }

  static async scheduleHealthScreening(screeningData, schoolId, conductedBy) {
    try {
      // Create screening records for students
      const results = [];
      
      if (screeningData.students && Array.isArray(screeningData.students)) {
        for (const studentId of screeningData.students) {
          const screening = await db('health_screenings').insert({
            id: crypto.randomUUID(),
            school_id: schoolId,
            student_id: studentId,
            conducted_by: conductedBy,
            screening_reference: await this.generateScreeningReference(schoolId),
            screening_date: screeningData.screening_date,
            screening_type: screeningData.screening_type,
            screening_program_name: screeningData.program_name
          }).returning('*');

          results.push(screening[0]);
        }
      }

      logger.info('Health screening scheduled', { 
        studentsCount: results.length,
        screeningType: screeningData.screening_type
      });

      return results;

    } catch (error) {
      logger.error('Error scheduling health screening:', error);
      throw error;
    }
  }

  static async getHealthDashboardData(schoolId) {
    try {
      const [
        healthStats,
        healthAlerts,
        criticalIncidents,
        dueExaminations,
        recentIncidents
      ] = await Promise.all([
        StudentHealthProfile.getHealthStatistics(schoolId),
        StudentHealthProfile.getHealthAlerts(schoolId),
        HealthIncident.getCriticalIncidents(schoolId),
        MedicalExamination.getDueExaminations(schoolId),
        HealthIncident.findBySchool(schoolId, { limit: 10 })
      ]);

      return {
        statistics: healthStats,
        health_alerts: healthAlerts,
        critical_incidents: criticalIncidents,
        due_examinations: dueExaminations,
        recent_incidents: recentIncidents.slice(0, 10)
      };

    } catch (error) {
      logger.error('Error getting health dashboard data:', error);
      throw error;
    }
  }

  static async generateHealthReport(schoolId, reportType, filters = {}) {
    try {
      logger.info('Generating health report', { schoolId, reportType, filters });

      let reportData = {};

      switch (reportType) {
        case 'student_health_summary':
          reportData = await this.generateStudentHealthSummary(schoolId, filters);
          break;

        case 'incident_analysis':
          reportData = await this.generateIncidentAnalysis(schoolId, filters);
          break;

        case 'vaccination_status':
          reportData = await this.generateVaccinationStatusReport(schoolId);
          break;

        case 'health_screening_results':
          reportData = await this.generateScreeningResultsReport(schoolId, filters);
          break;

        case 'medical_clearance_report':
          reportData = await this.generateMedicalClearanceReport(schoolId);
          break;

        default:
          throw new Error('Invalid report type');
      }

      logger.info('Health report generated successfully', { reportType });
      return reportData;

    } catch (error) {
      logger.error('Error generating health report:', error);
      throw error;
    }
  }

  // Private helper methods
  static async notifyHealthAlert(profile, alertType) {
    try {
      const alertMessages = {
        'special_attention_required': 'Student requires special health attention',
        'vaccination_overdue': 'Student vaccination records are overdue',
        'medical_clearance_expired': 'Student medical clearance has expired',
        'critical_health_condition': 'Student has critical health condition'
      };

      await NotificationService.sendNotification({
        type: 'health_alert',
        priority: 'high',
        title: 'Health Alert',
        message: alertMessages[alertType],
        data: {
          student_id: profile.student_id,
          profile_id: profile.id,
          alert_type: alertType
        },
        recipients: ['health_staff', 'school_admin']
      });

    } catch (error) {
      logger.error('Error sending health alert notification:', error);
    }
  }

  static async handleCriticalIncident(incident) {
    try {
      // Send immediate notifications to health staff and administration
      await NotificationService.sendNotification({
        type: 'critical_health_incident',
        priority: 'critical',
        title: 'Critical Health Incident',
        message: `Critical health incident reported: ${incident.incident_type}`,
        data: {
          incident_id: incident.id,
          incident_reference: incident.incident_reference,
          student_id: incident.student_id,
          severity_level: incident.severity_level
        },
        recipients: ['health_staff', 'school_admin', 'emergency_contacts']
      });

      // Auto-create follow-up task
      await this.scheduleFollowUpReminder(incident, 'immediate');

    } catch (error) {
      logger.error('Error handling critical incident:', error);
    }
  }

  static async notifyParentsOfIncident(incident) {
    try {
      // Get student and parent information
      const studentData = await db('students')
        .select(['students.*', 'users.phone', 'users.email'])
        .leftJoin('users', 'students.parent_id', 'users.id')
        .where('students.id', incident.student_id)
        .first();

      if (!studentData) return;

      const message = `Health incident reported for ${studentData.first_name} ${studentData.last_name}. ` +
                     `Incident type: ${incident.incident_type}. ` +
                     `Please contact the school for more information.`;

      await NotificationService.sendNotification({
        type: 'health_incident_parent_notification',
        priority: incident.severity_level === 'critical' ? 'high' : 'normal',
        title: 'Health Incident Notification',
        message,
        data: {
          incident_id: incident.id,
          incident_reference: incident.incident_reference,
          student_id: incident.student_id
        },
        recipients: [{
          type: 'parent',
          user_id: studentData.parent_id,
          phone: studentData.phone,
          email: studentData.email
        }]
      });

    } catch (error) {
      logger.error('Error notifying parents of incident:', error);
    }
  }

  static async scheduleFollowUpReminder(incident, urgency = 'normal') {
    try {
      const reminderDate = new Date();
      
      // Set reminder timing based on urgency
      switch (urgency) {
        case 'immediate':
          reminderDate.setHours(reminderDate.getHours() + 2);
          break;
        case 'urgent':
          reminderDate.setDate(reminderDate.getDate() + 1);
          break;
        case 'normal':
        default:
          reminderDate.setDate(reminderDate.getDate() + 3);
          break;
      }

      // Create follow-up task (this would integrate with a task/reminder system)
      logger.info('Follow-up reminder scheduled', {
        incidentId: incident.id,
        reminderDate: reminderDate.toISOString(),
        urgency
      });

    } catch (error) {
      logger.error('Error scheduling follow-up reminder:', error);
    }
  }

  static async checkAndNotifyHealthChanges(existingProfile, updateData) {
    try {
      // Check for changes that require notifications
      const criticalChanges = [];

      if (updateData.requires_special_attention && !existingProfile.requires_special_attention) {
        criticalChanges.push('special_attention_required');
      }

      if (updateData.vaccination_up_to_date === false && existingProfile.vaccination_up_to_date) {
        criticalChanges.push('vaccination_overdue');
      }

      if (updateData.medically_cleared_for_sports === false && existingProfile.medically_cleared_for_sports) {
        criticalChanges.push('medical_clearance_revoked');
      }

      // Send notifications for each critical change
      for (const change of criticalChanges) {
        await this.notifyHealthAlert(existingProfile, change);
      }

    } catch (error) {
      logger.error('Error checking and notifying health changes:', error);
    }
  }

  static async generateStudentHealthSummary(schoolId, filters) {
    // Implementation for student health summary report
    const profiles = await StudentHealthProfile.findBySchool(schoolId, filters);
    
    return {
      title: 'Student Health Summary Report',
      generated_at: new Date().toISOString(),
      total_students: profiles.length,
      profiles: profiles,
      summary_statistics: await StudentHealthProfile.getHealthStatistics(schoolId)
    };
  }

  static async generateIncidentAnalysis(schoolId, filters) {
    // Implementation for incident analysis report
    const incidents = await HealthIncident.findBySchool(schoolId, filters);
    const statistics = await HealthIncident.getIncidentStatistics(
      schoolId, 
      { startDate: filters.date_from, endDate: filters.date_to }
    );
    return {
      title: 'Health Incident Analysis Report',
      generated_at: new Date().toISOString(),
      total_incidents: incidents.length,
      incidents: incidents,
      summary_statistics: statistics
    };
  }

  static async generateVaccinationStatusReport(schoolId) {
    // Implementation for vaccination status report
    const profiles = await StudentHealthProfile.findBySchool(schoolId);
    const statistics = await StudentHealthProfile.getVaccinationStatistics(schoolId);
    return {
      title: 'Vaccination Status Report',
      generated_at: new Date().toISOString(),
      total_students: profiles.length,
      profiles: profiles,
      summary_statistics: statistics
    };
  }

  static async generateScreeningResultsReport(schoolId, filters) {
    // Implementation for screening results report
    const profiles = await StudentHealthProfile.findBySchool(schoolId, filters);
    const statistics = await StudentHealthProfile.getScreeningStatistics(schoolId, filters);
    return {
      title: 'Screening Results Report',
      generated_at: new Date().toISOString(),
      total_students: profiles.length,
      profiles: profiles,
      summary_statistics: statistics
    };
  }

  static async generateMedicalClearanceReport(schoolId) {
    // Implementation for medical clearance report
    const profiles = await StudentHealthProfile.findBySchool(schoolId);
    const statistics = await StudentHealthProfile.getMedicalClearanceStatistics(schoolId);
    return {
      title: 'Medical Clearance Report',
      generated_at: new Date().toISOString(),
      total_students: profiles.length,
      profiles: profiles,
      summary_statistics: statistics
    };
  }

  static async generateScreeningReference(schoolId) {
    // Implementation for screening reference report
    const profiles = await StudentHealthProfile.findBySchool(schoolId);
    const statistics = await StudentHealthProfile.getScreeningReferenceStatistics(schoolId);
    return {
      title: 'Screening Reference Report',
      generated_at: new Date().toISOString(),
      total_students: profiles.length,
      profiles: profiles,
      summary_statistics: statistics
    };
  }
}

module.exports = HealthService;