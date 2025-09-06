// backend/src/modules/health/models/StudentHealthProfile.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class StudentHealthProfile {
  static tableName = 'student_health_profiles';

  static async create(profileData, schoolId, createdBy) {
    const profileCompletion = this.calculateProfileCompletionPercentage(profileData);
    
    const [profile] = await db(this.tableName)
      .insert({
        ...profileData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        created_by: createdBy,
        profile_completion_percentage: profileCompletion.percentage,
        profile_complete: profileCompletion.isComplete,
        profile_last_reviewed: new Date()
      })
      .returning('*');

    return profile;
  }

  static async findByStudent(studentId, schoolId) {
    const profile = await db(this.tableName)
      .select([
        'student_health_profiles.*',
        'students.first_name',
        'students.last_name',
        'students.student_id as student_number',
        'created_user.first_name as created_by_name',
        'updated_user.first_name as updated_by_name'
      ])
      .leftJoin('students', 'student_health_profiles.student_id', 'students.id')
      .leftJoin('users as created_user', 'student_health_profiles.created_by', 'created_user.id')
      .leftJoin('users as updated_user', 'student_health_profiles.updated_by', 'updated_user.id')
      .where({
        'student_health_profiles.student_id': studentId,
        'student_health_profiles.school_id': schoolId
      })
      .first();

    if (!profile) return null;

    // Parse JSON fields
    return {
      ...profile,
      known_allergies: JSON.parse(profile.known_allergies || '[]'),
      chronic_conditions: JSON.parse(profile.chronic_conditions || '[]'),
      current_medications: JSON.parse(profile.current_medications || '[]'),
      previous_surgeries: JSON.parse(profile.previous_surgeries || '[]'),
      family_medical_history: JSON.parse(profile.family_medical_history || '[]'),
      vaccination_records: JSON.parse(profile.vaccination_records || '[]'),
      emergency_procedures: JSON.parse(profile.emergency_procedures || '[]'),
      sports_restrictions: JSON.parse(profile.sports_restrictions || '[]'),
      counseling_sessions: JSON.parse(profile.counseling_sessions || '[]'),
      parent_health_preferences: JSON.parse(profile.parent_health_preferences || '{}')
    };
  }

  static async updateProfile(studentId, schoolId, updateData, updatedBy) {
    const profileCompletion = this.calculateProfileCompletionPercentage(updateData);
    
    const [profile] = await db(this.tableName)
      .where({ student_id: studentId, school_id: schoolId })
      .update({
        ...updateData,
        updated_by: updatedBy,
        profile_completion_percentage: profileCompletion.percentage,
        profile_complete: profileCompletion.isComplete,
        profile_last_reviewed: new Date(),
        updated_at: new Date()
      })
      .returning('*');

    return profile;
  }

  static async getHealthAlerts(schoolId) {
    // Get students with critical health alerts
    return await db(this.tableName)
      .select([
        'student_health_profiles.*',
        'students.first_name',
        'students.last_name',
        'students.student_id as student_number',
        'classes.name as class_name'
      ])
      .join('students', 'student_health_profiles.student_id', 'students.id')
      .leftJoin('classes', 'students.class_id', 'classes.id')
      .where('student_health_profiles.school_id', schoolId)
      .where(function() {
        this.where('requires_special_attention', true)
            .orWhere('vaccination_up_to_date', false)
            .orWhere('medically_cleared_for_sports', false)
            .orWhere('requires_counseling_support', true)
            .orWhere('profile_complete', false);
      })
      .orderBy('requires_special_attention', 'desc')
      .orderBy('students.first_name', 'asc');
  }

  static async getHealthStatistics(schoolId) {
    const totalStudents = await db('students')
      .count('* as count')
      .where('school_id', schoolId)
      .first();

    const profileStats = await db(this.tableName)
      .select([
        db.raw('COUNT(*) as profiles_created'),
        db.raw('COUNT(CASE WHEN profile_complete = true THEN 1 END) as complete_profiles'),
        db.raw('COUNT(CASE WHEN requires_special_attention = true THEN 1 END) as special_attention_students'),
        db.raw('COUNT(CASE WHEN vaccination_up_to_date = false THEN 1 END) as vaccination_overdue'),
        db.raw('COUNT(CASE WHEN medically_cleared_for_sports = false THEN 1 END) as sports_restricted'),
        db.raw('AVG(profile_completion_percentage) as avg_completion_percentage')
      ])
      .where('school_id', schoolId)
      .first();

    const bloodGroupStats = await db(this.tableName)
      .select(['blood_group'])
      .count('* as count')
      .where('school_id', schoolId)
      .whereNotNull('blood_group')
      .groupBy('blood_group');

    const bmiStats = await db(this.tableName)
      .select(['bmi_category'])
      .count('* as count')
      .where('school_id', schoolId)
      .whereNotNull('bmi_category')
      .groupBy('bmi_category');

    return {
      total_students: parseInt(totalStudents.count),
      profiles_created: parseInt(profileStats.profiles_created || 0),
      complete_profiles: parseInt(profileStats.complete_profiles || 0),
      special_attention_students: parseInt(profileStats.special_attention_students || 0),
      vaccination_overdue: parseInt(profileStats.vaccination_overdue || 0),
      sports_restricted: parseInt(profileStats.sports_restricted || 0),
      avg_completion_percentage: parseFloat(profileStats.avg_completion_percentage || 0).toFixed(1),
      blood_group_distribution: bloodGroupStats,
      bmi_distribution: bmiStats
    };
  }

  static calculateProfileCompletionPercentage(profileData) {
    const requiredFields = [
      'blood_group', 'genotype', 'height_cm', 'weight_kg',
      'known_allergies', 'vaccination_records', 'emergency_medical_notes'
    ];

    const optionalFields = [
      'chronic_conditions', 'current_medications', 'family_medical_history',
      'vision_left_eye', 'vision_right_eye', 'dental_health_status',
      'health_insurance_provider', 'primary_healthcare_provider'
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    requiredFields.forEach(field => {
      if (profileData[field] && profileData[field] !== '' && profileData[field] !== '[]') {
        completedRequired++;
      }
    });

    optionalFields.forEach(field => {
      if (profileData[field] && profileData[field] !== '' && profileData[field] !== '[]') {
        completedOptional++;
      }
    });

    const requiredPercentage = (completedRequired / requiredFields.length) * 70; // 70% weight for required
    const optionalPercentage = (completedOptional / optionalFields.length) * 30; // 30% weight for optional

    const totalPercentage = Math.round(requiredPercentage + optionalPercentage);
    const isComplete = completedRequired === requiredFields.length && totalPercentage >= 80;

    return {
      percentage: totalPercentage,
      isComplete,
      completedRequired,
      totalRequired: requiredFields.length,
      completedOptional,
      totalOptional: optionalFields.length
    };
  }

  static async bulkUpdateBMI(schoolId) {
    // Update BMI calculations for all students with height and weight data
    const profiles = await db(this.tableName)
      .select(['id', 'height_cm', 'weight_kg'])
      .where('school_id', schoolId)
      .whereNotNull('height_cm')
      .whereNotNull('weight_kg');

    const updates = profiles.map(profile => {
      const heightInMeters = profile.height_cm / 100;
      const bmi = profile.weight_kg / (heightInMeters * heightInMeters);
      
      let bmiCategory;
      if (bmi < 18.5) bmiCategory = 'underweight';
      else if (bmi < 25) bmiCategory = 'normal';
      else if (bmi < 30) bmiCategory = 'overweight';
      else bmiCategory = 'obese';

      return db(this.tableName)
        .where('id', profile.id)
        .update({
          bmi: Math.round(bmi * 100) / 100,
          bmi_category: bmiCategory,
          updated_at: new Date()
        });
    });

    await Promise.all(updates);
    return updates.length;
  }
}

module.exports = StudentHealthProfile;