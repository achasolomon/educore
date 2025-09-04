// backend/src/modules/library/models/LibraryMember.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class LibraryMember {
  static tableName = 'library_members';

  static async create(memberData, schoolId) {
    // Generate member ID if not provided
    if (!memberData.member_id) {
      memberData.member_id = await this.generateMemberId(schoolId, memberData.member_type);
    }
    if (!memberData.library_card_number) {
      memberData.library_card_number = await this.generateCardNumber(schoolId);
    }

    const [member] = await db(this.tableName)
      .insert({
        ...memberData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        membership_start_date: memberData.membership_start_date || new Date(),
        status: 'active'
      })
      .returning('*');

    return member;
  }

  static async findBySchool(schoolId, filters = {}) {
    let query = db(this.tableName)
      .select([
        'library_members.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'classes.name as class_name'
      ])
      .join('users', 'library_members.user_id', 'users.id')
      .leftJoin('classes', 'library_members.class_id', 'classes.id')
      .where('library_members.school_id', schoolId);

    if (filters.status) {
      query = query.where('library_members.status', filters.status);
    }

    if (filters.member_type) {
      query = query.where('library_members.member_type', filters.member_type);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('users.first_name', 'ilike', `%${filters.search}%`)
            .orWhere('users.last_name', 'ilike', `%${filters.search}%`)
            .orWhere('library_members.member_id', 'ilike', `%${filters.search}%`)
            .orWhere('library_members.library_card_number', 'ilike', `%${filters.search}%`);
      });
    }

    return await query.orderBy('users.first_name', 'asc');
  }

  static async findById(memberId, schoolId) {
    const member = await db(this.tableName)
      .select([
        'library_members.*',
        'users.first_name',
        'users.last_name',
        'users.email',
        'users.phone',
        'classes.name as class_name'
      ])
      .join('users', 'library_members.user_id', 'users.id')
      .leftJoin('classes', 'library_members.class_id', 'classes.id')
      .where({
        'library_members.id': memberId,
        'library_members.school_id': schoolId
      })
      .first();

    if (!member) return null;

    // Get current borrowing status
    const borrowingStats = await db('book_transactions')
      .select([
        db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_loans'),
        db.raw('COUNT(CASE WHEN status = \'overdue\' THEN 1 END) as overdue_books'),
        db.raw('COUNT(*) as total_transactions')
      ])
      .where('member_id', memberId)
      .first();

    const outstandingFines = await db('library_fines')
      .sum('balance as total_balance')
      .where('member_id', memberId)
      .where('status', 'pending')
      .first();

    return {
      ...member,
      current_stats: {
        active_loans: parseInt(borrowingStats.active_loans || 0),
        overdue_books: parseInt(borrowingStats.overdue_books || 0),
        total_transactions: parseInt(borrowingStats.total_transactions || 0),
        outstanding_fines: parseFloat(outstandingFines.total_balance || 0)
      },
      favorite_genres: JSON.parse(member.favorite_genres || '[]'),
      preferred_authors: JSON.parse(member.preferred_authors || '[]'),
      restricted_categories: JSON.parse(member.restricted_categories || '[]')
    };
  }

  static async updateBorrowingPrivileges(memberId, schoolId, privileges) {
    const [member] = await db(this.tableName)
      .where({ id: memberId, school_id: schoolId })
      .update({
        max_books_allowed: privileges.max_books_allowed,
        max_digital_books_allowed: privileges.max_digital_books_allowed,
        loan_period_days: privileges.loan_period_days,
        max_renewals_allowed: privileges.max_renewals_allowed,
        can_reserve_books: privileges.can_reserve_books,
        restricted_categories: JSON.stringify(privileges.restricted_categories || []),
        updated_at: new Date()
      })
      .returning('*');

    return member;
  }

  static async generateMemberId(schoolId, memberType) {
    const year = new Date().getFullYear().toString().slice(-2);
    const typePrefix = {
      'student': 'STU',
      'teacher': 'TCH',
      'staff': 'STF',
      'parent': 'PAR',
      'external': 'EXT'
    }[memberType] || 'MEM';

    // Get the next sequence number for this type
    const lastMember = await db(this.tableName)
      .where('school_id', schoolId)
      .where('member_type', memberType)
      .orderBy('created_at', 'desc')
      .first();

    let sequence = 1;
    if (lastMember && lastMember.member_id.includes(typePrefix + year)) {
      const lastSequence = parseInt(lastMember.member_id.split(typePrefix + year)[1]) || 0;
      sequence = lastSequence + 1;
    }

    return `${typePrefix}${year}${sequence.toString().padStart(4, '0')}`;
  }

  static async generateCardNumber(schoolId) {
    const prefix = 'LC';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix}${timestamp}${random}`;
  }
}

module.exports = LibraryMember;