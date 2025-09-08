// src/app/(auth)/layout.tsx
'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const pathname = usePathname();
  
  // Use wider layout for register page
  const isRegisterPage = pathname === '/auth/register';
  const containerWidth = isRegisterPage ? 'max-w-2xl' : 'max-w-md';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-100 flex items-center justify-center p-4">
      <div className={`w-full ${containerWidth}`}>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {children}
        </div>
        
        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-neutral-600">
            © 2024 School Management System. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Background Pattern */}
      <div className="fixed inset-0 -z-10 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-orange-600" />
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
      </div>
    </div>
  );
}