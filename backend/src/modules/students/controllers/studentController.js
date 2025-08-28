// backend/src/modules/students/controllers/studentController.js
const Student = require('../models/Student');
const db = require('../../../core/database/connection');

class StudentController {
  static async getStudents(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const { page = 1, limit = 20, status = 'active', search, class_id } = req.query;
      const offset = (page - 1) * limit;

      const result = await Student.getAllBySchool(schoolId, {
        status, limit: parseInt(limit), offset, search, class_id
      });

      res.json({
        success: true,
        data: {
          students: result.data,
          pagination: {
            current: parseInt(page),
            limit: parseInt(limit),
            total: result.total,
            pages: Math.ceil(result.total / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({ success: false, message: 'Error fetching students' });
    }
  }

  static async getStudent(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      const student = await Student.getWithGuardians(id, schoolId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      res.json({ success: true, data: { student } });
    } catch (error) {
      console.error('Get student error:', error);
      res.status(500).json({ success: false, message: 'Error fetching student' });
    }
  }

  static async createStudent(req, res) {
    try {
      const schoolId = req.user.schoolId;
      const {
        firstName, lastName, middleName, dateOfBirth, gender, address, classId, guardians = []
      } = req.body;

      if (!firstName || !lastName || !dateOfBirth || !gender || !address) {
        return res.status(400).json({
          success: false,
          message: 'Required: firstName, lastName, dateOfBirth, gender, address'
        });
      }

      const studentData = {
        first_name: firstName,
        last_name: lastName,
        middle_name: middleName,
        date_of_birth: dateOfBirth,
        gender,
        address,
        class_id: classId,
        admission_date: new Date(),
        status: 'active'
      };

      const student = await Student.create(studentData, schoolId);

      // Create guardians
      for (const guardianData of guardians) {
        const [guardian] = await db('guardians')
          .insert({
            school_id: schoolId,
            first_name: guardianData.firstName,
            last_name: guardianData.lastName,
            phone: guardianData.phone,
            email: guardianData.email,
            occupation: guardianData.occupation,
            home_address: guardianData.address
          })
          .returning('*');

        await db('student_guardians').insert({
          student_id: student.id,
          guardian_id: guardian.id,
          relationship: guardianData.relationship,
          is_primary: guardianData.isPrimary || false
        });
      }

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: { student: { id: student.id, studentId: student.student_id } }
      });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(500).json({ success: false, message: 'Error creating student' });
    }
  }

  static async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;
      const { firstName, lastName, middleName, address, status, classId } = req.body;

      const updateData = {};
      if (firstName) updateData.first_name = firstName;
      if (lastName) updateData.last_name = lastName;
      if (middleName) updateData.middle_name = middleName;
      if (address) updateData.address = address;
      if (status) updateData.status = status;
      if (classId) updateData.class_id = classId;

      const student = await Student.update(id, updateData, schoolId);
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      res.json({ success: true, message: 'Student updated successfully', data: { student } });
    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({ success: false, message: 'Error updating student' });
    }
  }

  static async deleteStudent(req, res) {
    try {
      const { id } = req.params;
      const schoolId = req.user.schoolId;

      await Student.update(id, { status: 'withdrawn' }, schoolId);
      res.json({ success: true, message: 'Student withdrawn successfully' });
    } catch (error) {
      console.error('Delete student error:', error);
      res.status(500).json({ success: false, message: 'Error withdrawing student' });
    }
  }

  static async getStudentStats(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const stats = await db('students')
        .select([
          db.raw('COUNT(*) as total_students'),
          db.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_students'),
          db.raw('COUNT(CASE WHEN gender = \'male\' THEN 1 END) as male_students'),
          db.raw('COUNT(CASE WHEN gender = \'female\' THEN 1 END) as female_students')
        ])
        .where('school_id', schoolId)
        .first();

      const classCounts = await db('students')
        .select(['classes.name', db.raw('COUNT(*) as count')])
        .join('classes', 'students.class_id', 'classes.id')
        .where('students.school_id', schoolId)
        .where('students.status', 'active')
        .groupBy('classes.name')
        .orderBy('count', 'desc');

      res.json({
        success: true,
        data: { overview: stats, classDistribution: classCounts }
      });
    } catch (error) {
      console.error('Get student stats error:', error);
      res.status(500).json({ success: false, message: 'Error fetching statistics' });
    }
  }
}

module.exports = StudentController;