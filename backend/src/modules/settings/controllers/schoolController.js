// backend/src/modules/settings/controllers/schoolController.js
const db = require('../../../core/database/connection');

class SchoolController {
  // Get school settings
  static async getSchoolSettings(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const school = await db('schools')
        .select([
          'id', 'name', 'code', 'email', 'phone', 'address',
          'logo_url', 'website', 'type', 'status', 'settings',
          'established_date'
        ])
        .where('id', schoolId)
        .first();

      if (!school) {
        return res.status(404).json({
          success: false,
          message: 'School not found'
        });
      }

      res.json({
        success: true,
        data: { school }
      });

    } catch (error) {
      console.error('Get school settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching school settings'
      });
    }
  }

  // Update school settings
  static async updateSchoolSettings(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        name,
        email,
        phone,
        address,
        website,
        settings
      } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (website !== undefined) updateData.website = website;
      if (settings !== undefined) updateData.settings = JSON.stringify(settings);

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No data provided for update'
        });
      }

      await db('schools')
        .where('id', schoolId)
        .update({
          ...updateData,
          updated_at: new Date()
        });

      const updatedSchool = await db('schools')
        .select([
          'id', 'name', 'code', 'email', 'phone', 'address',
          'logo_url', 'website', 'type', 'status', 'settings'
        ])
        .where('id', schoolId)
        .first();

      res.json({
        success: true,
        message: 'School settings updated successfully',
        data: { school: updatedSchool }
      });

    } catch (error) {
      console.error('Update school settings error:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating school settings'
      });
    }
  }

  // Get school dashboard statistics
  static async getSchoolDashboard(req, res) {
    try {
      const schoolId = req.user.schoolId;

      // Get basic counts
      const [userCount] = await db('users')
        .count('* as count')
        .where('school_id', schoolId)
        .where('status', 'active');

      const [studentCount] = await db('students')
        .count('* as count')
        .where('school_id', schoolId)
        .where('status', 'active');

      const [classCount] = await db('classes')
        .count('* as count')
        .where('school_id', schoolId)
        .where('is_active', true);

      const [subjectCount] = await db('subjects')
        .count('* as count')
        .where('school_id', schoolId)
        .where('is_active', true);

      // Get recent activity
      const recentUsers = await db('users')
        .select(['first_name', 'last_name', 'email', 'created_at'])
        .where('school_id', schoolId)
        .orderBy('created_at', 'desc')
        .limit(5);

      res.json({
        success: true,
        data: {
          statistics: {
            totalUsers: parseInt(userCount.count),
            totalStudents: parseInt(studentCount.count),
            totalClasses: parseInt(classCount.count),
            totalSubjects: parseInt(subjectCount.count)
          },
          recentActivity: {
            newUsers: recentUsers
          }
        }
      });

    } catch (error) {
      console.error('Get dashboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching dashboard data'
      });
    }
  }
}

module.exports = SchoolController;