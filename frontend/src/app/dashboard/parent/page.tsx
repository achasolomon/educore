// src/app/(dashboard)/teacher/page.tsx
'use client';

import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { StatCard } from '../../../components/dashboard/StatCard';
import { QuickActionCard } from '../../../components/dashboard/QuickActionCard';
import { ProtectedRoute } from '../../../components/auth/protectedRoutes';
import { 
  Users, BookOpen, ClipboardCheck, MessageSquare,
  UserCheck, FileText, Calendar, PlusCircle
} from 'lucide-react';

const teacherStats = [
  {
    title: 'My Classes',
    value: '4',
    icon: <Users className="h-6 w-6" />,
  },
  {
    title: 'Total Students',
    value: '156',
    icon: <UserCheck className="h-6 w-6" />,
  },
  {
    title: 'Pending Grades',
    value: '23',
    icon: <ClipboardCheck className="h-6 w-6" />,
  },
  {
    title: 'This Week\'s Lessons',
    value: '18',
    icon: <BookOpen className="h-6 w-6" />,
  },
];

const teacherActions = [
  {
    label: 'Take Attendance',
    href: '/attendance',
    icon: <UserCheck className="h-4 w-4" />,
    description: 'Mark student attendance',
  },
  {
    label: 'Enter Grades',
    href: '/academics/grades',
    icon: <ClipboardCheck className="h-4 w-4" />,
    description: 'Update student grades',
  },
  {
    label: 'Create Lesson Plan',
    href: '/academics/lessons/create',
    icon: <PlusCircle className="h-4 w-4" />,
    description: 'Plan your next lesson',
  },
  {
    label: 'Send Message',
    href: '/communication/messages',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Contact parents or staff',
  },
];

export default function TeacherDashboard() {
  return (
    <ProtectedRoute requiredRole="TEACHER">
      <DashboardLayout title="Teacher Dashboard">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teacherStats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickActionCard title="Quick Actions" actions={teacherActions} />
            
            {/* Today's Schedule */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Today's Schedule
              </h3>
              <div className="space-y-3">
                {[
                  { time: '08:00 - 08:45', subject: 'Mathematics', class: 'Grade 5A', room: 'Room 101' },
                  { time: '09:00 - 09:45', subject: 'Mathematics', class: 'Grade 5B', room: 'Room 101' },
                  { time: '11:00 - 11:45', subject: 'Mathematics', class: 'Grade 4A', room: 'Room 101' },
                  { time: '14:00 - 14:45', subject: 'Mathematics', class: 'Grade 4B', room: 'Room 101' },
                ].map((schedule, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-800">{schedule.subject}</p>
                      <p className="text-sm text-neutral-600">{schedule.class} • {schedule.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-primary-600">{schedule.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}