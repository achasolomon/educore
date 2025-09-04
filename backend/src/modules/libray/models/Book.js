// backend/src/modules/library/models/Book.js
const db = require('../../../core/database/connection');
const crypto = require('crypto');

class Book {
  static tableName = 'library_books';

  static async create(bookData, schoolId) {
    // Generate unique identifiers if not provided
    if (!bookData.barcode) {
      bookData.barcode = await this.generateBarcode(schoolId);
    }
    if (!bookData.library_code) {
      bookData.library_code = await this.generateLibraryCode(schoolId, bookData.category);
    }
    if (!bookData.accession_number) {
      bookData.accession_number = await this.generateAccessionNumber(schoolId);
    }

    const [book] = await db(this.tableName)
      .insert({
        ...bookData,
        id: crypto.randomUUID(),
        school_id: schoolId,
        acquisition_date: bookData.acquisition_date || new Date(),
        status: 'available'
      })
      .returning('*');

    return book;
  }

  static async findBySchool(schoolId, filters = {}) {
    let query = db(this.tableName)
      .select([
        'library_books.*',
        'users.first_name as created_by_name',
        'users.last_name as created_by_surname'
      ])
      .leftJoin('users', 'library_books.created_by', 'users.id')
      .where('library_books.school_id', schoolId);

    // Apply filters
    if (filters.status) {
      query = query.where('library_books.status', filters.status);
    }

    if (filters.category) {
      query = query.where('library_books.category', filters.category);
    }

    if (filters.search) {
      query = query.where(function() {
        this.where('library_books.title', 'ilike', `%${filters.search}%`)
            .orWhere('library_books.author', 'ilike', `%${filters.search}%`)
            .orWhere('library_books.isbn', 'ilike', `%${filters.search}%`)
            .orWhere('library_books.barcode', 'ilike', `%${filters.search}%`);
      });
    }

    if (filters.is_digital !== undefined) {
      if (filters.is_digital) {
        query = query.whereNotNull('library_books.digital_file_path');
      } else {
        query = query.whereNull('library_books.digital_file_path');
      }
    }

    return await query.orderBy('library_books.title', 'asc');
  }

  static async findById(bookId, schoolId) {
    const book = await db(this.tableName)
      .select([
        'library_books.*',
        'users.first_name as created_by_name',
        'users.last_name as created_by_surname'
      ])
      .leftJoin('users', 'library_books.created_by', 'users.id')
      .where({
        'library_books.id': bookId,
        'library_books.school_id': schoolId
      })
      .first();

    if (!book) return null;

    // Get additional statistics
    const stats = await db('book_transactions')
      .select([
        db.raw('COUNT(*) as total_checkouts'),
        db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as current_checkouts'),
        db.raw('AVG(CASE WHEN returned_at IS NOT NULL THEN EXTRACT(epoch FROM (returned_at - issued_at))/86400 END) as avg_loan_duration')
      ])
      .where('book_id', bookId)
      .first();

    const reviews = await db('book_reviews')
      .select([
        db.raw('AVG(rating) as average_rating'),
        db.raw('COUNT(*) as total_reviews')
      ])
      .where('book_id', bookId)
      .where('status', 'approved')
      .first();

    return {
      ...book,
      statistics: {
        total_checkouts: parseInt(stats.total_checkouts || 0),
        current_checkouts: parseInt(stats.current_checkouts || 0),
        avg_loan_duration: parseFloat(stats.avg_loan_duration || 0).toFixed(1),
        average_rating: parseFloat(reviews.average_rating || 0).toFixed(1),
        total_reviews: parseInt(reviews.total_reviews || 0)
      },
      restricted_to_classes: JSON.parse(book.restricted_to_classes || '[]')
    };
  }

  static async updateAvailabilityStatus(bookId, schoolId, status) {
    const [book] = await db(this.tableName)
      .where({ id: bookId, school_id: schoolId })
      .update({
        status,
        updated_at: new Date()
      })
      .returning('*');

    return book;
  }

  static async updatePopularityScore(bookId) {
    // Calculate popularity based on recent checkouts and ratings
    const recentCheckouts = await db('book_transactions')
      .count('* as count')
      .where('book_id', bookId)
      .where('issued_at', '>=', db.raw('NOW() - INTERVAL \'30 days\''))
      .first();

    const avgRating = await db('book_reviews')
      .avg('rating as avg_rating')
      .where('book_id', bookId)
      .where('status', 'approved')
      .first();

    // Simple popularity formula: (recent_checkouts * 10) + (avg_rating * 20)
    const popularityScore = Math.round(
      (parseInt(recentCheckouts.count || 0) * 10) + 
      (parseFloat(avgRating.avg_rating || 0) * 20)
    );

    await db(this.tableName)
      .where('id', bookId)
      .update({
        current_popularity_score: popularityScore,
        average_rating: parseFloat(avgRating.avg_rating || 0),
        updated_at: new Date()
      });

    return popularityScore;
  }

  static async searchBooks(schoolId, searchParams) {
    const {
      query,
      category,
      author,
      year_from,
      year_to,
      available_only = true,
      digital_only = false,
      sort_by = 'relevance',
      limit = 50,
      offset = 0
    } = searchParams;

    let dbQuery = db(this.tableName)
      .select([
        'library_books.*',
        db.raw('ts_rank(to_tsvector(\'english\', title || \' \' || author || \' \' || COALESCE(keywords, \'\')), plainto_tsquery(\'english\', ?)) as relevance_score', [query || ''])
      ])
      .where('library_books.school_id', schoolId);

    // Full-text search if query provided
    if (query) {
      dbQuery = dbQuery.where(
        db.raw('to_tsvector(\'english\', title || \' \' || author || \' \' || COALESCE(keywords, \'\')) @@ plainto_tsquery(\'english\', ?)', [query])
      );
    }

    // Apply filters
    if (category) {
      dbQuery = dbQuery.where('category', category);
    }

    if (author) {
      dbQuery = dbQuery.where('author', 'ilike', `%${author}%`);
    }

    if (year_from) {
      dbQuery = dbQuery.where('publication_year', '>=', year_from);
    }

    if (year_to) {
      dbQuery = dbQuery.where('publication_year', '<=', year_to);
    }

    if (available_only) {
      dbQuery = dbQuery.where('status', 'available');
    }

    if (digital_only) {
      dbQuery = dbQuery.whereNotNull('digital_file_path');
    }

    // Sorting
    switch (sort_by) {
      case 'relevance':
        if (query) {
          dbQuery = dbQuery.orderBy('relevance_score', 'desc');
        } else {
          dbQuery = dbQuery.orderBy('current_popularity_score', 'desc');
        }
        break;
      case 'title':
        dbQuery = dbQuery.orderBy('title', 'asc');
        break;
      case 'author':
        dbQuery = dbQuery.orderBy('author', 'asc');
        break;
      case 'newest':
        dbQuery = dbQuery.orderBy('acquisition_date', 'desc');
        break;
      case 'popularity':
        dbQuery = dbQuery.orderBy('current_popularity_score', 'desc');
        break;
      default:
        dbQuery = dbQuery.orderBy('title', 'asc');
    }

    return await dbQuery.limit(limit).offset(offset);
  }

  static async getRecommendations(schoolId, memberId, limit = 10) {
    // Get member's reading history and preferences
    const memberHistory = await db('book_transactions')
      .join('library_books', 'book_transactions.book_id', 'library_books.id')
      .where('book_transactions.member_id', memberId)
      .where('book_transactions.status', 'returned')
      .groupBy('library_books.category', 'library_books.genre')
      .select([
        'library_books.category',
        'library_books.genre',
        db.raw('COUNT(*) as books_read')
      ]);

    if (memberHistory.length === 0) {
      // For new members, recommend popular books
      return await db(this.tableName)
        .where('school_id', schoolId)
        .where('status', 'available')
        .orderBy('current_popularity_score', 'desc')
        .limit(limit);
    }

    // Get books from member's preferred categories
    const preferredCategories = memberHistory
      .sort((a, b) => b.books_read - a.books_read)
      .slice(0, 3)
      .map(h => h.category);

    return await db(this.tableName)
      .where('school_id', schoolId)
      .where('status', 'available')
      .whereIn('category', preferredCategories)
      .whereNotIn('id', function() {
        this.select('book_id')
            .from('book_transactions')
            .where('member_id', memberId);
      })
      .orderBy('current_popularity_score', 'desc')
      .limit(limit);
  }

  static async generateBarcode(schoolId) {
    const prefix = 'LIB';
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${schoolId.slice(0,3).toUpperCase()}-${timestamp}-${randomPart}`;
  }

  static async generateLibraryCode(schoolId, category) {
    const prefix = 'LIB';
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${schoolId.slice(0,3).toUpperCase()}-${category.slice(0,3).toUpperCase()}-${timestamp}-${randomPart}`;
  }

  static async generateAccessionNumber(schoolId) {
    const prefix = 'ACC';
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${schoolId.slice(0,3).toUpperCase()}-${timestamp}-${randomPart}`;
  }
}

module.exports = Book;