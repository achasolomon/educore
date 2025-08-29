// backend/src/modules/scratch-cards/controllers/scratchCardController.js
const ScratchCard = require('../models/ScratchCard');
const db = require('../../../core/database/connection');

class ScratchCardController {
  // Generate scratch cards
  static async generateCards(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        count = 50, 
        cardType = 'standard', 
        termId 
      } = req.body;

      if (!termId) {
        return res.status(400).json({
          success: false,
          message: 'Term ID is required'
        });
      }

      // Card pricing
      const pricing = {
        basic: 200,
        standard: 500,
        premium: 1000
      };

      const amount = pricing[cardType];
      if (!amount) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card type'
        });
      }

      const cards = await ScratchCard.bulkGenerate(
        parseInt(count),
        cardType,
        amount,
        termId,
        schoolId
      );

      res.status(201).json({
        success: true,
        message: `Generated ${cards.length} ${cardType} cards`,
        data: {
          cards: cards.map(card => ({
            id: card.id,
            cardNumber: card.card_number,
            pin: card.pin,
            cardType: card.card_type,
            amount: card.amount
          })),
          totalValue: cards.length * amount
        }
      });

    } catch (error) {
      console.error('Generate cards error:', error);
      res.status(500).json({ success: false, message: 'Error generating cards' });
    }
  }

  // Public endpoint to check results using card
  static async checkResults(req, res) {
    try {
      const { cardNumber, pin, schoolCode } = req.body;

      if (!cardNumber || !pin || !schoolCode) {
        return res.status(400).json({
          success: false,
          message: 'Card number, PIN, and school code are required'
        });
      }

      // Get school by code
      const school = await db('schools').where('code', schoolCode).first();
      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found'
        });
      }

      const result = await ScratchCard.getStudentResults(
        cardNumber,
        pin,
        school.id
      );

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        data: result.data
      });

    } catch (error) {
      console.error('Check results error:', error);
      res.status(500).json({ success: false, message: 'Error checking results' });
    }
  }

  // Assign card to student
  static async assignCard(req, res) {
    try {
      const { cardId } = req.params;
      const { studentId } = req.body;
      const schoolId = req.user.schoolId;

      const card = await db('scratch_cards')
        .where({ id: cardId, school_id: schoolId })
        .first();

      if (!card) {
        return res.status(404).json({
          success: false,
          message: 'Card not found'
        });
      }

      if (card.status === 'used') {
        return res.status(400).json({
          success: false,
          message: 'Card already used'
        });
      }

      await db('scratch_cards')
        .where({ id: cardId })
        .update({
          student_id: studentId,
          status: 'used',
          used_at: new Date()
        });

      res.json({
        success: true,
        message: 'Card assigned to student successfully'
      });

    } catch (error) {
      console.error('Assign card error:', error);
      res.status(500).json({ success: false, message: 'Error assigning card' });
    }
  }

  // Get card statistics
  static async getCardStats(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { termId } = req.query;

      const stats = await ScratchCard.getCardStats(schoolId, { term_id: termId });

      // Calculate totals
      let totalCards = 0;
      let totalRevenue = 0;
      let usedCards = 0;

      stats.forEach(stat => {
        totalCards += parseInt(stat.count);
        totalRevenue += parseFloat(stat.total_amount || 0);
        if (stat.status === 'used') {
          usedCards += parseInt(stat.count);
        }
      });

      res.json({
        success: true,
        data: {
          overview: {
            totalCards,
            usedCards,
            activeCards: totalCards - usedCards,
            totalRevenue,
            usageRate: totalCards > 0 ? ((usedCards / totalCards) * 100).toFixed(2) : 0
          },
          breakdown: stats
        }
      });

    } catch (error) {
      console.error('Get card stats error:', error);
      res.status(500).json({ success: false, message: 'Error fetching card statistics' });
    }
  }

  // Get all cards with pagination
  static async getCards(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { 
        page = 1, 
        limit = 20,
        cardType,
        status,
        termId 
      } = req.query;

      const offset = (page - 1) * limit;

      let query = db('scratch_cards')
        .select([
          'scratch_cards.*',
          'students.first_name as student_first_name',
          'students.last_name as student_last_name',
          'students.student_id',
          'terms.name as term_name'
        ])
        .leftJoin('students', 'scratch_cards.student_id', 'students.id')
        .join('terms', 'scratch_cards.term_id', 'terms.id')
        .where('scratch_cards.school_id', schoolId);

      if (cardType) query = query.where('scratch_cards.card_type', cardType);
      if (status) query = query.where('scratch_cards.status', status);
      if (termId) query = query.where('scratch_cards.term_id', termId);

      const cards = await query
        .orderBy('scratch_cards.created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const [{ count }] = await db('scratch_cards')
        .count('* as count')
        .where('school_id', schoolId);

      res.json({
        success: true,
        data: {
          cards,
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(count),
            pages: Math.ceil(count / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get cards error:', error);
      res.status(500).json({ success: false, message: 'Error fetching cards' });
    }
  }
}

module.exports = ScratchCardController;