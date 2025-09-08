// src/app/(dashboard)/admin/page.tsx
'use client';

import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { StatCard } from '../../../components/dashboard/StatCard';
import { QuickActionCard } from '../../../components/dashboard/QuickActionCard';
import { RecentActivityCard } from '../../../components/dashboard/RecentActivityCard';
import { ProtectedRoute } from '../../../components/auth/protectedRoutes';
import { 
  Users, GraduationCap, DollarSign, TrendingUp, 
  UserPlus, BookOpen, CreditCard, MessageSquare,
  FileText, Settings, BarChart3, UserCheck
} from 'lucide-react';

// Mock data - replace with real API calls
const stats = [
  {
    title: 'Total Students',
    value: '1,247',
    icon: <Users className="h-6 w-6" />,
    trend: { value: 8, label: 'vs last month', isPositive: true },
  },
  {
    title: 'Active Staff',
    value: '89',
    icon: <UserCheck className="h-6 w-6" />,
    trend: { value: 2, label: 'vs last month', isPositive: true },
  },
  {
    title: 'Monthly Revenue',
    value: '₦2.4M',
    icon: <DollarSign className="h-6 w-6" />,
    trend: { value: 12, label: 'vs last month', isPositive: true },
  },
  {
    title: 'Outstanding Fees',
    value: '₦450K',
    icon: <TrendingUp className="h-6 w-6" />,
    trend: { value: -5, label: 'vs last month', isPositive: false },
  },
];

const quickActions = [
  {
    label: 'Add New Student',
    href: '/students/add',
    icon: <UserPlus className="h-4 w-4" />,
    description: 'Register a new student',
  },
  {
    label: 'Generate Report Cards',
    href: '/academics/cards',
    icon: <FileText className="h-4 w-4" />,
    description: 'Create scratch cards for results',
  },
  {
    label: 'Send Announcement',
    href: '/communication/announcements',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Broadcast to parents/students',
  },
  {
    label: 'Financial Reports',
    href: '/finance/reports',
    icon: <BarChart3 className="h-4 w-4" />,
    description: 'View revenue analytics',
  },
];

const recentActivities = [
  {
    id: '1',
    user: { name: 'Sarah Johnson', role: 'Teacher', avatar: undefined },
    action: 'uploaded grades for',
    target: 'Mathematics - Grade 5A',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    type: 'success' as const,
  },
  {
    id: '2',
    user: { name: 'Michael Chen', role: 'Parent', avatar: undefined },
    action: 'made payment for',
    target: 'John Chen - Term 2 Fees',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    type: 'success' as const,
  },
  {
    id: '3',
    user: { name: 'Emily Davis', role: 'Principal', avatar: undefined },
    action: 'approved admission for',
    target: 'David Wilson',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    type: 'info' as const,
  },
];

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredPermissions={['students.view', 'academics.grades.view']}>
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <QuickActionCard title="Quick Actions" actions={quickActions} />

            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <RecentActivityCard activities={recentActivities} />
            </div>
          </div>

          {/* Additional Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Academic Performance Overview */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Academic Performance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Excellent (A)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-neutral-200 rounded-full">
                      <div className="w-16 h-2 bg-academic-excellent rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">67%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Good (B)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-neutral-200 rounded-full">
                      <div className="w-12 h-2 bg-academic-good rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">50%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Average (C)</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-neutral-200 rounded-full">
                      <div className="w-8 h-2 bg-academic-average rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">33%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-600">Needs Improvement</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-neutral-200 rounded-full">
                      <div className="w-4 h-2 bg-academic-poor rounded-full"></div>
                    </div>
                    <span className="text-sm font-medium">17%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Overview */}
            <div className="bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-lg font-semibold mb-4">Attendance Overview</h3>
              <div className="text-center">
                <div className="relative inline-flex">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#e5e5e5"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="#f97316"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${92 * 2.51327} ${100 * 2.51327}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-neutral-800">92%</span>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 mt-2">Overall Attendance Rate</p>
                <p className="text-xs text-primary-600 font-medium">+3% from last week</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}