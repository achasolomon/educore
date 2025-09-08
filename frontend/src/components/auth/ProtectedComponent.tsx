// src/components/auth/ProtectedComponent.tsx
import { ReactNode } from 'react';
import { useAuthStore } from '../../lib/stores/authStore';

interface ProtectedComponentProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
  fallback?: ReactNode;
  requiresFeature?: string;
}

export function ProtectedComponent({
  children,
  requiredPermissions = [],
  requiredRole,
  fallback = null,
  requiresFeature
}: ProtectedComponentProps) {
  const { hasAnyPermission, hasRole, hasFeatureAccess } = useAuthStore();

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <>{fallback}</>;
  }

  // Check feature access (subscription-based)
  if (requiresFeature && !hasFeatureAccess(requiresFeature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
