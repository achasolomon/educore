// src/components/layout/Navbar.tsx
import { Menu, Bell, Search, Settings, User } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../../lib/stores/authStore';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Dropdown } from '../data-display/DropDown';
import { Input } from '../forms/Input';

interface NavbarProps {
  onMenuClick: () => void;
  title?: string;
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const { user, logout } = useAuthStore();

  const userMenuItems = [
    {
      label: 'Profile',
      onClick: () => console.log('Profile'),
      icon: <User className="h-4 w-4" />,
    },
    {
      label: 'Settings',
      onClick: () => console.log('Settings'),
      icon: <Settings className="h-4 w-4" />,
    },
    {
      label: 'Sign Out',
      onClick: logout,
      danger: true,
    },
  ];

  return (
    <header className="h-16 bg-white border-b border-border-light px-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {title && (
          <div>
            <h1 className="text-xl font-semibold text-neutral-800">{title}</h1>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="hidden md:block">
          {showSearch ? (
            <div className="w-64">
              <Input
                placeholder="Search students, staff..."
                leftIcon={<Search className="h-4 w-4" />}
                onBlur={() => setShowSearch(false)}
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
            >
              <Search className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button className="p-2 rounded-md text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100">
            <Bell className="h-5 w-5" />
            <Badge 
              variant="error" 
              size="sm" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
            >
              3
            </Badge>
          </button>
        </div>

        {/* User Menu */}
        <Dropdown
          trigger={
            <button className="flex items-center space-x-2 p-2 rounded-md hover:bg-neutral-100">
              <Avatar
                src={user?.avatar}
                name={`${user?.firstName} ${user?.lastName}`}
                size="sm"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-neutral-800">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-neutral-500">{user?.role?.name}</p>
              </div>
            </button>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
}