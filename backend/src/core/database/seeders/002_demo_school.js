const crypto = require('crypto');
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Delete in proper order to avoid foreign key violations
  await knex('user_roles').where('school_id', 'IN', 
    knex('schools').select('id').where('code', 'DEMO001')).del();
  
  // Set class_teacher_id to null before deleting users
  await knex('classes').where('school_id', 'IN',
    knex('schools').select('id').where('code', 'DEMO001'))
    .update({ class_teacher_id: null });
  
  // Delete in dependency order
  await knex('terms').where('academic_year_id', 'IN',
    knex('academic_years').select('id').where('school_id', 'IN',
      knex('schools').select('id').where('code', 'DEMO001'))).del();
  
  await knex('academic_years').where('school_id', 'IN',
    knex('schools').select('id').where('code', 'DEMO001')).del();
  
  await knex('classes').where('school_id', 'IN',
    knex('schools').select('id').where('code', 'DEMO001')).del();
  
  await knex('subjects').where('school_id', 'IN',
    knex('schools').select('id').where('code', 'DEMO001')).del();
  
  await knex('users').where('school_id', 'IN',
    knex('schools').select('id').where('code', 'DEMO001')).del();
  
  await knex('schools').where('code', 'DEMO001').del();

  // Create demo school
  const [school] = await knex('schools').insert({
    id: crypto.randomUUID(), // Use crypto instead of knex.raw
    name: 'Demo High School',
    code: 'DEMO001',
    email: 'admin@demohighschool.edu.ng',
    phone: '+234-801-234-5678',
    address: '123 Education Street, Lagos State, Nigeria',
    type: 'secondary',
    status: 'active',
    established_date: '2020-01-01',
    settings: JSON.stringify({
      academic_year_format: 'YYYY/YYYY',
      grading_system: 'percentage',
      max_class_size: 40,
      school_hours: { start: '08:00', end: '14:30' }
    })
  }).returning('*');

  // Create demo users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const teacherPassword = await bcrypt.hash('teacher123', 12);

  const users = [
    {
      id: crypto.randomUUID(), // Use crypto
      school_id: school.id,
      email: 'admin@demohighschool.edu.ng',
      password_hash: adminPassword,
      first_name: 'John',
      last_name: 'Administrator',
      phone: '+234-801-234-5678',
      status: 'active',
      email_verified_at: new Date()
    },
    {
      id: crypto.randomUUID(), // Use crypto
      school_id: school.id,
      email: 'teacher1@demohighschool.edu.ng',
      password_hash: teacherPassword,
      first_name: 'Mary',
      last_name: 'Teacher',
      phone: '+234-802-345-6789',
      status: 'active',
      email_verified_at: new Date()
    },
    {
      id: crypto.randomUUID(), // Use crypto
      school_id: school.id,
      email: 'teacher2@demohighschool.edu.ng',
      password_hash: teacherPassword,
      first_name: 'James',
      last_name: 'Mathematics',
      phone: '+234-803-456-7890',
      status: 'active',
      email_verified_at: new Date()
    }
  ];

  await knex('users').insert(users);

  // Get roles and assign
  const schoolAdminRole = await knex('roles').where('name', 'school_admin').first();
  const teacherRole = await knex('roles').where('name', 'teacher').first();
  const insertedUsers = await knex('users').where('school_id', school.id);
  
  const userRoles = [
    {
      user_id: insertedUsers.find(u => u.email === 'admin@demohighschool.edu.ng').id,
      role_id: schoolAdminRole.id,
      school_id: school.id
    },
    {
      user_id: insertedUsers.find(u => u.email === 'teacher1@demohighschool.edu.ng').id,
      role_id: teacherRole.id,
      school_id: school.id
    },
    {
      user_id: insertedUsers.find(u => u.email === 'teacher2@demohighschool.edu.ng').id,
      role_id: teacherRole.id,
      school_id: school.id
    }
  ];

  await knex('user_roles').insert(userRoles);

  // Create academic year
  const [academicYear] = await knex('academic_years').insert({
    id: crypto.randomUUID(), // Use crypto
    school_id: school.id,
    name: '2024/2025',
    start_date: '2024-09-01',
    end_date: '2025-07-31',
    is_current: true,
    status: 'active'
  }).returning('*');

  // Create terms
  await knex('terms').insert([
    {
      id: crypto.randomUUID(), // Use crypto
      academic_year_id: academicYear.id,
      name: 'First Term',
      term_number: 1,
      start_date: '2024-09-01',
      end_date: '2024-12-15',
      is_current: true
    },
    {
      id: crypto.randomUUID(), // Use crypto
      academic_year_id: academicYear.id,
      name: 'Second Term',
      term_number: 2,
      start_date: '2025-01-15',
      end_date: '2025-04-15',
      is_current: false
    },
    {
      id: crypto.randomUUID(), // Use crypto
      academic_year_id: academicYear.id,
      name: 'Third Term',
      term_number: 3,
      start_date: '2025-04-28',
      end_date: '2025-07-31',
      is_current: false
    }
  ]);

  // Create subjects and classes with crypto UUIDs
  const subjectInserts = [
    { name: 'Mathematics', code: 'MTH', category: 'core' },
    { name: 'English Language', code: 'ENG', category: 'core' },
    { name: 'Physics', code: 'PHY', category: 'core' },
    { name: 'Chemistry', code: 'CHE', category: 'core' }
  ].map(subject => ({
    id: crypto.randomUUID(),
    school_id: school.id,
    ...subject
  }));

  await knex('subjects').insert(subjectInserts);

  const mathTeacher = insertedUsers.find(u => u.last_name === 'Mathematics');
  const classInserts = [
    { name: 'JSS 1A', level: 'JSS 1', section: 'A', class_teacher_id: mathTeacher.id },
    { name: 'JSS 1B', level: 'JSS 1', section: 'B', class_teacher_id: null },
    { name: 'JSS 2A', level: 'JSS 2', section: 'A', class_teacher_id: null }
  ].map(cls => ({
    id: crypto.randomUUID(),
    school_id: school.id,
    ...cls
  }));

  await knex('classes').insert(classInserts);

  console.log('Demo school created successfully!');
  console.log('School Admin: admin@demohighschool.edu.ng / admin123');
  console.log('Teacher: teacher1@demohighschool.edu.ng / teacher123');
};