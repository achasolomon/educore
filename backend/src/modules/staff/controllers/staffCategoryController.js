// backend/src/modules/staff/controllers/staffCategoryController.js
class StaffCategoryController {
  // Get all staff categories
  static async getAllCategories(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const categories = await StaffCategory.findBySchool(schoolId);

      res.json({
        success: true,
        data: { categories }
      });

    } catch (error) {
      logger.error('Get all categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching staff categories'
      });
    }
  }

  // Create staff category
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
      const existing = await StaffCategory.findByCode(req.body.code, schoolId);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'Category with this code already exists'
        });
      }

      const category = await StaffCategory.create(req.body, schoolId);

      logger.info(`Staff category created: ${category.code}`, {
        categoryId: category.id,
        schoolId
      });

      res.status(201).json({
        success: true,
        message: 'Staff category created successfully',
        data: { category }
      });

    } catch (error) {
      logger.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating staff category'
      });
    }
  }

  // Initialize default categories
  static async initializeDefaults(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const categories = await StaffCategory.initializeDefaultCategories(schoolId);

      res.json({
        success: true,
        message: `Initialized ${categories.length} default categories`,
        data: { categories }
      });

    } catch (error) {
      logger.error('Initialize default categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error initializing default categories'
      });
    }
  }

  // Update staff category
  static async updateCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const schoolId = req.user.schoolId;

      const category = await StaffCategory.update(categoryId, schoolId, req.body);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Staff category not found'
        });
      }

      res.json({
        success: true,
        message: 'Staff category updated successfully',
        data: { category }
      });

    } catch (error) {
      logger.error('Update category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating staff category'
      });
    }
  }

  // Delete staff category
  static async deleteCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const schoolId = req.user.schoolId;

      await StaffCategory.delete(categoryId, schoolId);

      res.json({
        success: true,
        message: 'Staff category deleted successfully'
      });

    } catch (error) {
      logger.error('Delete category error:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting staff category'
      });
    }
  }
}

module.exports = StaffCategoryController ;