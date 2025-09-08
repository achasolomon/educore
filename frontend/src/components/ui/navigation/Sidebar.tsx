// src/components/ui/navigation/Sidebar.tsx
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Home, Users, GraduationCap, DollarSign, MessageSquare, 
  BarChart3, Settings, ChevronDown, ChevronRight, Menu, X,
  UserCheck, Bus, BookOpen, Heart, Shield, FileText
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../../lib/stores/authStore';
import { Avatar } from '../../ui/Avatar';
import { Badge } from '../../ui/Badge';
import { ProtectedComponent } from '../../auth/ProtectedComponent';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  permissions?: string[];
  children?: MenuItem[];
  badge?: string;
  badgeVariant?: 'primary' | 'success' | 'warning';
  requiresFeature?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'students',
    label: 'Student Management',
    icon: Users,
    permissions: ['students.view'],
    children: [
      { id: 'students-list', label: 'All Students', icon: Users, href: '/students', permissions: ['students.view'] },
      { id: 'students-add', label: 'Add Student', icon: Users, href: '/students/add', permissions: ['students.create'] },
      { id: 'students-admission', label: 'Admissions', icon: Users, href: '/students/admissions', permissions: ['students.create'] },
    ],
  },
  {
    id: 'academics',
    label: 'Academic Management',
    icon: GraduationCap,
    permissions: ['academics.grades.view', 'academics.lessons.view'],
    children: [
      { id: 'classes', label: 'Classes & Subjects', icon: GraduationCap, href: '/academics/classes', permissions: ['academics.grades.view'] },
      { id: 'timetable', label: 'Timetable', icon: GraduationCap, href: '/academics/timetable', permissions: ['academics.lessons.view'] },
      { id: 'grades', label: 'Grades & Results', icon: GraduationCap, href: '/academics/grades', permissions: ['academics.grades.view'] },
      { id: 'lesson-plans', label: 'Lesson Plans', icon: BookOpen, href: '/academics/lessons', permissions: ['academics.lessons.view'] },
      { id: 'scratch-cards', label: 'Result Cards', icon: FileText, href: '/academics/cards', permissions: ['academics.scratchcards.manage'], badge: '₦' },
    ],
  },
  {
    id: 'attendance',
    label: 'Attendance & Safety',
    icon: UserCheck,
    permissions: ['students.view'],
    children: [
      { id: 'attendance-tracking', label: 'Take Attendance', icon: UserCheck, href: '/attendance', permissions: ['students.view'] },
      { id: 'attendance-reports', label: 'Attendance Reports', icon: BarChart3, href: '/attendance/reports', permissions: ['students.view'] },
      { id: 'safety-checkin', label: 'Safety Check-in', icon: Shield, href: '/attendance/safety', permissions: ['students.view'], requiresFeature: 'safety_tracking' },
    ],
  },
  {
    id: 'finance',
    label: 'Financial Management',
    icon: DollarSign,
    permissions: ['finance.fees.view', 'finance.payments.view'],
    children: [
      { id: 'fee-structure', label: 'Fee Structure', icon: DollarSign, href: '/finance/fees', permissions: ['finance.fees.view'] },
      { id: 'payments', label: 'Payments', icon: DollarSign, href: '/finance/payments', permissions: ['finance.payments.view'] },
      { id: 'invoices', label: 'Invoices', icon: FileText, href: '/finance/invoices', permissions: ['finance.payments.view'] },
      { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3, href: '/finance/reports', permissions: ['finance.reports.generate'] },
    ],
  },
  {
    id: 'communication',
    label: 'Communication',
    icon: MessageSquare,
    permissions: ['communication.send'],
    children: [
      { id: 'messages', label: 'Messages', icon: MessageSquare, href: '/communication/messages', permissions: ['communication.send'] },
      { id: 'announcements', label: 'Announcements', icon: MessageSquare, href: '/communication/announcements', permissions: ['communication.broadcast'] },
      { id: 'sms-center', label: 'SMS Center', icon: MessageSquare, href: '/communication/sms', permissions: ['communication.send'] },
    ],
  },
  {
    id: 'staff',
    label: 'Staff Management',
    icon: Users,
    permissions: ['staff.view'],
    children: [
      { id: 'staff-list', label: 'All Staff', icon: Users, href: '/staff', permissions: ['staff.view'] },
      { id: 'staff-add', label: 'Add Staff', icon: Users, href: '/staff/add', permissions: ['staff.create'] },
      { id: 'staff-performance', label: 'Performance', icon: BarChart3, href: '/staff/performance', permissions: ['staff.view'] },
    ],
  },
  {
    id: 'transport',
    label: 'Transport Management',
    icon: Bus,
    permissions: ['students.view'],
    requiresFeature: 'gps_tracking',
    children: [
      { id: 'transport-routes', label: 'Routes & Vehicles', icon: Bus, href: '/transport/routes', permissions: ['students.view'] },
      { id: 'transport-tracking', label: 'Live Tracking', icon: Bus, href: '/transport/tracking', permissions: ['students.view'], badge: 'Live', badgeVariant: 'success' },
    ],
  },
  {
    id: 'library',
    label: 'Library Management',
    icon: BookOpen,
    permissions: ['students.view'],
    children: [
      { id: 'library-catalog', label: 'Book Catalog', icon: BookOpen, href: '/library/catalog', permissions: ['students.view'] },
      { id: 'library-checkouts', label: 'Check-in/out', icon: BookOpen, href: '/library/checkouts', permissions: ['students.view'] },
    ],
  },
  {
    id: 'health',
    label: 'Health Records',
    icon: Heart,
    permissions: ['students.view'],
    href: '/health',
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: BarChart3,
    permissions: ['finance.reports.generate', 'academics.grades.view'],
    children: [
      { id: 'academic-reports', label: 'Academic Reports', icon: BarChart3, href: '/reports/academic', permissions: ['academics.grades.view'] },
      { id: 'financial-reports', label: 'Financial Reports', icon: BarChart3, href: '/reports/financial', permissions: ['finance.reports.generate'] },
      { id: 'custom-reports', label: 'Custom Reports', icon: BarChart3, href: '/reports/custom', permissions: ['academics.grades.view'], requiresFeature: 'advanced_analytics' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const handleNavigation = (href: string) => {
    router.push(href);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = pathname === item.href;

    return (
      <ProtectedComponent
        key={item.id}
        requiredPermissions={item.permissions}
        requiresFeature={item.requiresFeature}
      >
        <div className="mb-1">
          <button
            onClick={() => {
              if (hasChildren) {
                toggleExpanded(item.id);
              } else if (item.href) {
                handleNavigation(item.href);
              }
            }}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              level > 0 && "ml-4",
              isActive
                ? "bg-primary-100 text-primary-800 border-r-2 border-primary-500"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800"
            )}
          >
            <div className="flex items-center">
              <item.icon className={cn("h-4 w-4 mr-3", isActive && "text-primary-600")} />
              <span>{item.label}</span>
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant || 'primary'} 
                  size="sm" 
                  className="ml-2"
                >
                  {item.badge}
                </Badge>
              )}
            </div>
            {hasChildren && (
              <div className="flex-shrink-0 ml-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            )}
          </button>
          
          {hasChildren && isExpanded && (
            <div className="mt-1 space-y-1">
              {item.children!.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      </ProtectedComponent>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border-light transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-light">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-sm font-bold text-white">SM</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-800">
                {user?.school?.name || 'School Manager'}
              </h2>
              <Badge variant={user?.school?.subscription === 'premium' ? 'primary' : 'secondary'} size="sm">
                {user?.school?.subscription || 'Standard'}
              </Badge>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden">
            <X className="h-5 w-5 text-neutral-500" />
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-border-light">
          <div className="flex items-center space-x-3">
            <Avatar
              src={user?.avatar}
              name={`${user?.firstName} ${user?.lastName}`}
              size="md"
              status="online"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-neutral-500 truncate">
                {user?.role?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border-light">
          <button
            onClick={logout}
            className="w-full text-left px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}