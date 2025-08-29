// backend/src/modules/results/models/StudentResult.js
const db = require('../../../core/database/connection');
const Grade = require('./Grade');
const crypto = require('crypto');

class StudentResult {
  static tableName = 'student_results';

  static async calculateAndSaveResults(studentId, subjectId, classId, termId, schoolId) {
    // Get all assessments for this student/subject/term
    const assessments = await db('assessments')
      .join('grades', 'assessments.id', 'grades.assessment_id')
      .select([
        'assessments.type',
        'assessments.weight_percentage',
        'grades.score',
        'grades.percentage'
      ])
      .where('grades.student_id', studentId)
      .where('assessments.subject_id', subjectId)
      .where('assessments.term_id', termId)
      .where('assessments.school_id', schoolId);

    if (assessments.length === 0) return null;

    // Calculate weighted scores
    let totalWeightedScore = 0;
    let totalWeight = 0;
    const scoreBreakdown = {};

    assessments.forEach(assessment => {
      const weightedScore = (assessment.percentage * assessment.weight_percentage) / 100;
      totalWeightedScore += weightedScore;
      totalWeight += assessment.weight_percentage;

      // Track individual CA scores
      if (assessment.type === 'ca') {
        if (!scoreBreakdown.ca_scores) scoreBreakdown.ca_scores = [];
        scoreBreakdown.ca_scores.push(assessment.score);
      } else if (assessment.type === 'exam') {
        scoreBreakdown.exam_score = assessment.score;
      }
    });

    const finalPercentage = totalWeight > 0 ? totalWeightedScore : 0;
    const letterGrade = Grade.calculateLetterGrade(finalPercentage);
    const remark = Grade.getRemarkFromGrade(letterGrade);

    // Calculate CA total
    const totalCA = scoreBreakdown.ca_scores ? 
      scoreBreakdown.ca_scores.reduce((sum, score) => sum + score, 0) : 0;

    const resultData = {
      student_id: studentId,
      subject_id: subjectId,
      class_id: classId,
      term_id: termId,
      school_id: schoolId,
      ca1_score: scoreBreakdown.ca_scores?.[0] || null,
      ca2_score: scoreBreakdown.ca_scores?.[1] || null,
      ca3_score: scoreBreakdown.ca_scores?.[2] || null,
      ca4_score: scoreBreakdown.ca_scores?.[3] || null,
      exam_score: scoreBreakdown.exam_score || null,
      total_ca: totalCA,
      total_score: finalPercentage,
      percentage: finalPercentage,
      letter_grade: letterGrade,
      remark: remark,
      status: 'published'
    };

    // Upsert result
    const existing = await db(this.tableName)
      .where({ student_id: studentId, subject_id: subjectId, term_id: termId })
      .first();

    if (existing) {
      const [updated] = await db(this.tableName)
        .where({ id: existing.id })
        .update({ ...resultData, updated_at: new Date() })
        .returning('*');
      return updated;
    } else {
      const [created] = await db(this.tableName)
        .insert({ ...resultData, id: crypto.randomUUID() })
        .returning('*');
      return created;
    }
  }

  static async getStudentResults(studentId, termId, schoolId) {
    return await db(this.tableName)
      .select([
        'student_results.*',
        'subjects.name as subject_name',
        'subjects.code as subject_code'
      ])
      .join('subjects', 'student_results.subject_id', 'subjects.id')
      .where('student_results.student_id', studentId)
      .where('student_results.term_id', termId)
      .where('student_results.school_id', schoolId)
      .where('student_results.status', 'published')
      .orderBy('subjects.name');
  }

  static async calculateClassPositions(classId, termId, schoolId) {
    // Calculate total scores for all students in class for the term
    const studentTotals = await db(this.tableName)
      .select([
        'student_id',
        db.raw('AVG(percentage) as average_percentage')
      ])
      .where('class_id', classId)
      .where('term_id', termId)
      .where('school_id', schoolId)
      .groupBy('student_id')
      .orderBy('average_percentage', 'desc');

    // Assign positions
    for (let i = 0; i < studentTotals.length; i++) {
      const position = i + 1;
      await db(this.tableName)
        .where('student_id', studentTotals[i].student_id)
        .where('term_id', termId)
        .where('class_id', classId)
        .update({ class_position: position });
    }

    return studentTotals.map((student, index) => ({
      ...student,
      position: index + 1
    }));
  }
}

module.exports = StudentResult;