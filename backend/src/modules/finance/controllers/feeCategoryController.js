// backend/src/modules/finance/controllers/feeCategoryController.js
const FeeCategory = require('../models/FeeCategory');
const { validationResult } = require('express-validator');
const logger = require('../../../core/utils/logger');

class FeeCategoryController {
  // Get all fee categories
  static async getAllCategories(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { type } = req.query;

      let categories;
      if (type === 'mandatory') {
        categories = await FeeCategory.getMandatoryCategories(schoolId);
      } else if (type === 'optional') {
        categories = await FeeCategory.getOptionalCategories(schoolId);
      } else {
        categories = await FeeCategory.findBySchool(schoolId);
      }

      res.json({
        success: true,
        data: { categories }
      });

    } catch (error) {
      logger.error('Get all fee categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching fee categories'
      });
    }
  }

  // Create fee category
  static async createCategory(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const schoolId = req.user.schoolId;

      // Check for duplicate code
      const existing = await FeeCategory.findByCode(req.body.code, schoolId);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Fee category with this code already exists'
        });
      }

      const category = await FeeCategory.create(req.body, schoolId);

      logger.info(`Fee category created: ${category.code}`, {
        categoryId: category.id,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Fee category created successfully',
        data: { category }
      });

    } catch (error) {
      logger.error('Create fee category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating fee category'
      });
    }
  }

  // Initialize default categories
  static async initializeDefaults(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const categories = await FeeCategory.initializeDefaultCategories(schoolId);

      res.json({
        success: true,
        message: `Initialized ${categories.length} default fee categories`,
        data: { categories }
      });

    } catch (error) {
      logger.error('Initialize default fee categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing default fee categories'
      });
    }
  }

  // Update fee category
  static async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const schoolId = req.user.schoolId;

      const category = await FeeCategory.update(categoryId, schoolId, req.body);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Fee category not found'
        });
      }

      res.json({
        success: true,
        message: 'Fee category updated successfully',
        data: { category }
      });

    } catch (error) {
      logger.error('Update fee category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating fee category'
      });
    }
  }

  // Delete fee category
  static async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const schoolId = req.user.schoolId;

      await FeeCategory.delete(categoryId, schoolId);

      res.json({
        success: true,
        message: 'Fee category deleted successfully'
      });

    } catch (error) {
      logger.error('Delete fee category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting fee category'
      });
    }
  }
}

module.exports = FeeCategoryController;