
// backend/src/modules/academics/controllers/classController.js
const Class = require('../models/Class');
const db = require('../../../core/database/connection');

class ClassController {
  static async getClasses(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { page = 1, limit = 20, is_active = true } = req.query;
      const offset = (page - 1) * limit;

      const result = await Class.getAllBySchool(schoolId, {
        is_active: is_active === 'true',
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          classes: result.data,
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get classes error:', error);
      res.status(500).json({ success: false, message: 'Error fetching classes' });
    }
  }

  static async getClass(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      const classRecord = await Class.findById(id, schoolId);
      if (!classRecord) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      const students = await Class.getStudents(id, schoolId);

      res.json({
        success: true,
        data: {
          class: { ...classRecord, students }
        }
      });
    } catch (error) {
      console.error('Get class error:', error);
      res.status(500).json({ success: false, message: 'Error fetching class' });
    }
  }

  static async createClass(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { name, level, section, capacity, classTeacherId, description } = req.body;

      if (!name || !level) {
        return res.status(400).json({
          success: false,
          message: 'Name and level are required'
        });
      }

      const classData = {
        name,
        level,
        section,
        capacity: capacity || 50,
        class_teacher_id: classTeacherId,
        description,
        is_active: true
      };

      const classRecord = await Class.create(classData, schoolId);

      res.status(201).json({
        success: true,
        message: 'Class created successfully',
        data: { class: classRecord }
      });
    } catch (error) {
      console.error('Create class error:', error);
      res.status(500).json({ success: false, message: 'Error creating class' });
    }
  }

  static async updateClass(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;
      const { name, level, section, capacity, classTeacherId, description, isActive } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (level) updateData.level = level;
      if (section) updateData.section = section;
      if (capacity) updateData.capacity = capacity;
      if (classTeacherId) updateData.class_teacher_id = classTeacherId;
      if (description) updateData.description = description;
      if (isActive !== undefined) updateData.is_active = isActive;

      const classRecord = await Class.update(id, updateData, schoolId);
      if (!classRecord) {
        return res.status(404).json({ success: false, message: 'Class not found' });
      }

      res.json({
        success: true,
        message: 'Class updated successfully',
        data: { class: classRecord }
      });
    } catch (error) {
      console.error('Update class error:', error);
      res.status(500).json({ success: false, message: 'Error updating class' });
    }
  }
}

module.exports = ClassController;