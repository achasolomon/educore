// backend/src/modules/scratch-cards/models/ScratchCard.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class ScratchCard {
  static tableName = 'scratch_cards';

  static generateCardNumber() {
    // Generate 12-digit card number
    return Math.random().toString().slice(2, 14);
  }

  static generatePin() {
    // Generate 6-digit PIN
    return Math.random().toString().slice(2, 8);
  }

  static async create(cardData, schoolId) {
    const cardNumber = this.generateCardNumber();
    const pin = this.generatePin();
    
    const [card] = await db(this.tableName)
      .insert({
        ...cardData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        card_number: cardNumber,
        pin: pin,
        expires_at: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year from now
        status: 'active'
      })
      .returning('*');
    return card;
  }

  static async bulkGenerate(count, cardType, amount, termId, schoolId) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const card = await this.create({
        card_type: cardType,
        amount: amount,
        term_id: termId
      }, schoolId);
      cards.push(card);
    }
    return cards;
  }

  static async validateCard(cardNumber, pin, schoolId) {
    const card = await db(this.tableName)
      .where({
        card_number: cardNumber,
        pin: pin,
        school_id: schoolId,
        status: 'active'
      })
      .where('expires_at', '>', new Date())
      .first();

    if (!card) return null;

    // Update last accessed
    await db(this.tableName)
      .where({ id: card.id })
      .update({
        last_accessed_at: new Date(),
        access_count: db.raw('access_count + 1')
      });

    return card;
  }

  static async useCard(cardNumber, pin, studentId, schoolId, clientIp) {
    const card = await this.validateCard(cardNumber, pin, schoolId);
    if (!card) return { success: false, message: 'Invalid card or PIN' };

    if (card.status === 'used') {
      return { success: false, message: 'Card already used' };
    }

    // Mark card as used
    const [usedCard] = await db(this.tableName)
      .where({ id: card.id })
      .update({
        status: 'used',
        student_id: studentId,
        used_at: new Date(),
        used_by_ip: clientIp
      })
      .returning('*');

    return { success: true, card: usedCard };
  }

  static async getStudentResults(cardNumber, pin, schoolId) {
    const card = await this.validateCard(cardNumber, pin, schoolId);
    if (!card || !card.student_id) {
      return { success: false, message: 'Invalid card or not assigned to student' };
    }

    // Get student and results based on card type
    const student = await db('students')
      .select(['id', 'student_id', 'first_name', 'last_name', 'class_id'])
      .where('id', card.student_id)
      .first();

    if (!student) {
      return { success: false, message: 'Student not found' };
    }

    let resultsQuery = db('student_results')
      .select([
        'student_results.*',
        'subjects.name as subject_name',
        'subjects.code as subject_code'
      ])
      .join('subjects', 'student_results.subject_id', 'subjects.id')
      .where('student_results.student_id', student.id)
      .where('student_results.term_id', card.term_id);

    // Limit data based on card type
    switch (card.card_type) {
      case 'basic':
        resultsQuery = resultsQuery.select([
          'subjects.name as subject_name',
          'student_results.total_score',
          'student_results.letter_grade'
        ]);
        break;
      case 'standard':
        resultsQuery = resultsQuery.select([
          'subjects.name as subject_name',
          'student_results.ca1_score',
          'student_results.ca2_score', 
          'student_results.exam_score',
          'student_results.total_score',
          'student_results.letter_grade',
          'student_results.class_position'
        ]);
        break;
      case 'premium':
        // Full access - no restrictions
        break;
    }

    const results = await resultsQuery;

    return {
      success: true,
      data: {
        student,
        results,
        cardType: card.card_type,
        accessLevel: this.getAccessLevel(card.card_type)
      }
    };
  }

  static getAccessLevel(cardType) {
    const levels = {
      basic: ['grades', 'attendance'],
      standard: ['grades', 'attendance', 'comments', 'position'],
      premium: ['grades', 'attendance', 'comments', 'position', 'analytics', 'recommendations']
    };
    return levels[cardType] || [];
  }

  static async getCardStats(schoolId, options = {}) {
    const { term_id } = options;
    
    let query = db(this.tableName)
      .where('school_id', schoolId);
    
    if (term_id) query = query.where('term_id', term_id);

    const stats = await query
      .select([
        'card_type',
        'status',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(amount) as total_amount')
      ])
      .groupBy('card_type', 'status');

    return stats;
  }
}

module.exports = ScratchCard;