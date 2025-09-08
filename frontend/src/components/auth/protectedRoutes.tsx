// src/components/auth/ProtectedRoute.tsx
import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/stores/authStore';
import { Loading } from '../ui/feedback/Loading';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  fallbackUrl?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRole,
  fallbackUrl = '/login'
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, hasAnyPermission, hasRole, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push(fallbackUrl);
      return;
    }

    // Check role requirement
    if (requiredRole && !hasRole(requiredRole)) {
      router.push('/unauthorized');
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
      router.push('/unauthorized');
      return;
    }
  }, [isAuthenticated, isLoading, requiredPermissions, requiredRole, router, hasAnyPermission, hasRole, fallbackUrl]);

  if (isLoading) {
    return <Loading fullScreen text="Loading..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return null;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return null;
  }

    return <>{children}</>;
  }