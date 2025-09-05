
// backend/src/modules/library/controllers/memberController.js
const LibraryMember = require('../models/LibraryMember');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');
const  errorHandler = require('../../../core/middleware/errorHandler');
const successHandler = require('../../../core/middleware/successHandler');

class MemberController {
  
  async createMember(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorHandler(res, 'Validation failed', 400, errors.array());
      }

      const member = await LibraryMember.create(req.body, req.user.school_id);
      logger.info(`Library member created: ${member.id}`, { user_id: req.user.id });
      
      return successHandler(res, 'Library member created successfully', member, 201);
    } catch (error) {
      logger.error('Library member creation failed:', error);
      return errorHandler(res, error.message, 500);
    }
  }

  async getMembers(req, res) {
    try {
      const filters = {
        status: req.query.status,
        member_type: req.query.member_type,
        search: req.query.search
      };

      const members = await LibraryMember.findBySchool(req.user.school_id, filters);
      
      return successHandler(res, 'Members retrieved successfully', members);
    } catch (error) {
      logger.error('Failed to retrieve members:', error);
      return errorHandler(res, error.message, 500);
    }
  }

  async getMemberById(req, res) {
    try {
      const member = await LibraryMember.findById(req.params.id, req.user.school_id);
      
      if (!member) {
        return errorHandler(res, 'Library member not found', 404);
      }

      return successHandler(res, 'Member retrieved successfully', member);
    } catch (error) {
      logger.error('Failed to retrieve member:', error);
      return errorHandler(res, error.message, 500);
    }
  }

  async updateMemberPrivileges(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errorHandler(res, 'Validation failed', 400, errors.array());
      }

      const member = await LibraryMember.updateBorrowingPrivileges(
        req.params.id,
        req.user.school_id,
        req.body
      );

      if (!member) {
        return errorHandler(res, 'Library member not found', 404);
      }

      logger.info(`Member privileges updated: ${member.id}`, { user_id: req.user.id });

      return successHandler(res, 'Member privileges updated successfully', member);
    } catch (error) {
      logger.error('Member privileges update failed:', error);
      return errorHandler(res, error.message, 500);
    }
  }
}

module.exports = new MemberController();