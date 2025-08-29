// backend/src/modules/assessments/models/Grade.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Grade {
  static tableName = 'grades';

  static async create(gradeData) {
    const [grade] = await db(this.tableName)
      .insert({
        ...gradeData,
        id: crypto.randomUUID(),
        graded_at: new Date()
      })
      .returning('*');
    return grade;
  }

  static async upsert(gradeData) {
    const existing = await db(this.tableName)
      .where({
        assessment_id: gradeData.assessment_id,
        student_id: gradeData.student_id
      })
      .first();

    if (existing) {
      const [updated] = await db(this.tableName)
        .where({ id: existing.id })
        .update({
          ...gradeData,
          updated_at: new Date(),
          graded_at: new Date()
        })
        .returning('*');
      return updated;
    } else {
      return await this.create(gradeData);
    }
  }

  static async bulkUpsert(gradesData) {
    const results = [];
    for (const gradeData of gradesData) {
      const grade = await this.upsert(gradeData);
      results.push(grade);
    }
    return results;
  }

  static calculateLetterGrade(percentage, gradeBoundaries = null) {
    const defaultBoundaries = {
      'A': { min: 70, max: 100 },
      'B': { min: 60, max: 69 },
      'C': { min: 50, max: 59 },
      'D': { min: 40, max: 49 },
      'F': { min: 0, max: 39 }
    };

    const boundaries = gradeBoundaries || defaultBoundaries;

    for (const [grade, range] of Object.entries(boundaries)) {
      if (percentage >= range.min && percentage <= range.max) {
        return grade;
      }
    }
    return 'F';
  }

  static getRemarkFromGrade(letterGrade) {
    const remarks = {
      'A': 'Excellent',
      'B': 'Very Good',
      'C': 'Good',
      'D': 'Fair',
      'F': 'Fail'
    };
    return remarks[letterGrade] || 'No Remark';
  }
}

module.exports = Grade;