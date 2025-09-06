// backend/src/modules/health/models/MedicalExamination.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class MedicalExamination {
  static tableName = 'medical_examinations';

  static async create(examinationData, schoolId, conductedBy) {
    const examinationReference = await this.generateExaminationReference(schoolId, examinationData.examination_type);
    
    // Calculate BMI if height and weight provided
    let bmiData = {};
    if (examinationData.height_cm && examinationData.weight_kg) {
      const heightInMeters = examinationData.height_cm / 100;
      const bmi = examinationData.weight_kg / (heightInMeters * heightInMeters);
      
      let bmiStatus;
      if (bmi < 18.5) bmiStatus = 'underweight';
      else if (bmi < 25) bmiStatus = 'normal';
      else if (bmi < 30) bmiStatus = 'overweight';
      else bmiStatus = 'obese';

      bmiData = {
        bmi: Math.round(bmi * 100) / 100,
        bmi_status: bmiStatus
      };
    }

    const [examination] = await db(this.tableName)
      .insert({
        ...examinationData,
        ...bmiData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        conducted_by: conductedBy,
        examination_reference: examinationReference,
        examination_date: examinationData.examination_date || new Date()
      })
      .returning('*');

    return examination;
  }

  static async findByStudent(studentId, schoolId, limit = 10) {
    return await db(this.tableName)
      .select([
        'medical_examinations.*',
        'conducted_user.first_name as conducted_by_name',
        'academic_years.year_name'
      ])
      .leftJoin('users as conducted_user', 'medical_examinations.conducted_by', 'conducted_user.id')
      .leftJoin('academic_years', 'medical_examinations.academic_year_id', 'academic_years.id')
      .where({
        'medical_examinations.student_id': studentId,
        'medical_examinations.school_id': schoolId
      })
      .orderBy('medical_examinations.examination_date', 'desc')
      .limit(limit);
  }

  static async getLatestExamination(studentId, schoolId) {
    return await db(this.tableName)
      .select('*')
      .where({
        student_id: studentId,
        school_id: schoolId
      })
      .orderBy('examination_date', 'desc')
      .first();
  }

  static async getDueExaminations(schoolId) {
    // Get students who are due for examinations based on last examination date
    return await db('students')
      .select([
        'students.*',
        'classes.name as class_name',
        'latest_exam.examination_date as last_examination_date',
        'latest_exam.examination_type as last_examination_type'
      ])
      .leftJoin('classes', 'students.class_id', 'classes.id')
      .leftJoin(
        db.raw(`(
          SELECT DISTINCT ON (student_id) student_id, examination_date, examination_type
          FROM medical_examinations 
          WHERE school_id = ?
          ORDER BY student_id, examination_date DESC
        ) as latest_exam`, [schoolId]),
        'students.id', 'latest_exam.student_id'
      )
      .where('students.school_id', schoolId)
      .where(function() {
        this.whereNull('latest_exam.examination_date')
            .orWhere('latest_exam.examination_date', '<', db.raw('CURRENT_DATE - INTERVAL \'1 year\''));
      })
      .orderBy('latest_exam.examination_date', 'asc');
  }

  static async generateExaminationReference(schoolId, examinationType) {
    const today = new Date();
    const year = today.getFullYear();
    const typePrefix = {
      'annual_physical': 'AP',
      'sports_clearance': 'SC',
      'routine_checkup': 'RC',
      'follow_up': 'FU',
      'pre_admission': 'PA',
      'special_assessment': 'SA',
      'vision_screening': 'VS',
      'hearing_screening': 'HS',
      'dental_checkup': 'DC',
      'vaccination_review': 'VR'
    }[examinationType] || 'EX';

    const count = await db(this.tableName)
      .count('* as count')
      .where('school_id', schoolId)
      .where('examination_type', examinationType)
      .whereRaw('EXTRACT(YEAR FROM created_at) = ?', [year])
      .first();

    const sequenceNumber = String(parseInt(count.count) + 1).padStart(3, '0');
    return `${typePrefix}-${year}-${sequenceNumber}`;
  }
}

module.exports = MedicalExamination;