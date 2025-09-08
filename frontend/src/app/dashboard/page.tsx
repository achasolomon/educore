// src/app/(dashboard)/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { Loading } from '@/components/ui/feedback/Loading';

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Redirect to role-specific dashboard
      const roleRedirects = {
        'Super Administrator': '/admin',
        'School Administrator': '/admin', 
        'Principal': '/admin',
        'Teacher': '/teacher',
        'Parent/Guardian': '/parent',
        'Student': '/student',
      };

      const redirectPath = roleRedirects[user?.role?.name as keyof typeof roleRedirects] || '/admin';
      router.push(redirectPath);
    }
  }, [user, isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center">
      <Loading size="lg" text="Loading your dashboard..." />
    </div>
  );
}
