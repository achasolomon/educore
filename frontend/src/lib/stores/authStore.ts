// src/lib/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthState, Permission } from '../types/auth';
import { authApi } from '../api/auth';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  
  // Permission helpers
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (roleName: string) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  
  // Subscription helpers
  isSubscriptionActive: () => boolean;
  hasFeatureAccess: (feature: string) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },

      refreshUser: async () => {
        const { token } = get();
        if (!token) return;
        
        try {
          const user = await authApi.getCurrentUser();
          set({ user });
        } catch (error) {
          // Token might be expired
          get().logout();
        }
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user?.role?.permissions) return false;
        
        return user.role.permissions.some(p => 
          `${p.resource}.${p.action}` === permission
        );
      },

      hasAnyPermission: (permissions: string[]) => {
        return permissions.some(permission => get().hasPermission(permission));
      },

      hasRole: (roleName: string) => {
        const { user } = get();
        return user?.role?.name === roleName;
      },

      canAccess: (resource: string, action: string) => {
        return get().hasPermission(`${resource}.${action}`);
      },

      isSubscriptionActive: () => {
        const { user } = get();
        if (!user?.school) return false;
        
        const expiryDate = new Date(user.school.subscriptionExpiry);
        return user.school.isActive && expiryDate > new Date();
      },

      hasFeatureAccess: (feature: string) => {
        const { user } = get();
        if (!user?.school) return false;
        
        const { subscription } = user.school;
        
        // Premium features
        const premiumFeatures = [
          'biometric_attendance',
          'gps_tracking',
          'advanced_analytics',
          'unlimited_sms',
          'whatsapp_integration',
          'automated_reports',
          'bulk_operations',
        ];
        
        if (premiumFeatures.includes(feature)) {
          return subscription === 'premium' && get().isSubscriptionActive();
        }
        
        // Standard features (available to both tiers)
        return get().isSubscriptionActive();
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);