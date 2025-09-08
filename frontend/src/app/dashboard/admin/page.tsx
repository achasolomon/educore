// src/app/(dashboard)/parent/page.tsx
'use client';

import { DashboardLayout } from '../../../components/layout/DashboardLayout';
import { StatCard } from '../../../components/dashboard/StatCard';
import { ProtectedRoute } from '../../../components/auth/protectedRoutes';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/data-display/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { 
  User, GraduationCap, Calendar, DollarSign,
  CheckCircle, Clock, AlertTriangle
} from 'lucide-react';

const parentStats = [
  {
    title: 'My Children',
    value: '2',
    icon: <User className="h-6 w-6" />,
  },
  {
    title: 'Overall Performance',
    value: '87%',
    icon: <GraduationCap className="h-6 w-6" />,
    trend: { value: 5, label: 'vs last term', isPositive: true },
  },
  {
    title: 'Attendance Rate',
    value: '94%',
    icon: <CheckCircle className="h-6 w-6" />,
    trend: { value: 2, label: 'vs last month', isPositive: true },
  },
  {
    title: 'Outstanding Fees',
    value: '₦0',
    icon: <DollarSign className="h-6 w-6" />,
  },
];

export default function ParentDashboard() {
  return (
    <ProtectedRoute requiredRole="PARENT">
      <DashboardLayout title="Parent Dashboard">
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {parentStats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>

          {/* Children Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Child 1 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Avatar name="Sarah Chen" size="md" className="mr-3" />
                  <div>
                    <p className="text-lg font-semibold">Sarah Chen</p>
                    <p className="text-sm text-neutral-600">Grade 5A • Student ID: SCH001234</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Recent Grades</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mathematics</span>
                      <Badge variant="excellent">A (92%)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">English</span>
                      <Badge variant="excellent">A (89%)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Science</span>
                      <Badge variant="good">B (78%)</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">This Week</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                      <span>Present all days</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning-500 mr-2" />
                      <span>Assignment due tomorrow</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Child 2 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Avatar name="John Chen" size="md" className="mr-3" />
                  <div>
                    <p className="text-lg font-semibold">John Chen</p>
                    <p className="text-sm text-neutral-600">Grade 3B • Student ID: SCH001235</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Recent Grades</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mathematics</span>
                      <Badge variant="good">B (82%)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">English</span>
                      <Badge variant="excellent">A (91%)</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Art</span>
                      <Badge variant="excellent">A (95%)</Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">This Week</h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-warning-500 mr-2" />
                      <span>Late Monday morning</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <CheckCircle className="h-4 w-4 text-success-500 mr-2" />
                      <span>Excellent behavior report</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-primary-600" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: '2024-03-15', event: 'Parent-Teacher Conference', time: '2:00 PM' },
                  { date: '2024-03-20', event: 'Science Fair', time: '10:00 AM' },
                  { date: '2024-03-25', event: 'Term Break Begins', time: 'All Day' },
                ].map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-800">{event.event}</p>
                      <p className="text-sm text-neutral-600">{event.date}</p>
                    </div>
                    <div className="text-sm font-medium text-primary-600">
                      {event.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
