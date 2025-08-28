// backend/src/modules/academics/controllers/subjectController.js
const Subject = require('../models/Subject');

class SubjectController {
  static async getSubjects(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { page = 1, limit = 20, is_active = true, category } = req.query;
      const offset = (page - 1) * limit;

      const result = await Subject.getAllBySchool(schoolId, {
        is_active: is_active === 'true',
        category,
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          subjects: result.data,
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get subjects error:', error);
      res.status(500).json({ success: false, message: 'Error fetching subjects' });
    }
  }

  static async createSubject(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { name, code, description, category } = req.body;

      if (!name || !code) {
        return res.status(400).json({
          success: false,
          message: 'Name and code are required'
        });
      }

      const subjectData = {
        name,
        code: code.toUpperCase(),
        description,
        category: category || 'core',
        is_active: true
      };

      const subject = await Subject.create(subjectData, schoolId);

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Create subject error:', error);
      res.status(500).json({ success: false, message: 'Error creating subject' });
    }
  }

  static async updateSubject(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;
      const { name, code, description, category, isActive } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (code) updateData.code = code.toUpperCase();
      if (description) updateData.description = description;
      if (category) updateData.category = category;
      if (isActive !== undefined) updateData.is_active = isActive;

      const subject = await Subject.update(id, updateData, schoolId);
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }

      res.json({
        success: true,
        message: 'Subject updated successfully',
        data: { subject }
      });
    } catch (error) {
      console.error('Update subject error:', error);
      res.status(500).json({ success: false, message: 'Error updating subject' });
    }
  }
}

module.exports = SubjectController;