// src/components/layout/DashboardLayout.tsx
import { useState, ReactNode } from 'react';
import { Sidebar } from '../ui/navigation/Sidebar';
import { Navbar } from '../ui/navigation/Navbar';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-secondary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:pl-64">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}