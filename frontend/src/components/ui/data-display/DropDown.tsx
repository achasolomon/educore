// src/components/ui/Dropdown.tsx
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface DropdownItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

const Dropdown = ({ trigger, items, align = 'right', className }: DropdownProps) => {
  return (
    <Menu as="div" className={cn("relative inline-block text-left", className)}>
      <MenuButton as="div">
        {trigger}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className={cn(
          "absolute z-dropdown mt-2 w-56 origin-top-right divide-y divide-neutral-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none",
          align === 'left' ? 'left-0' : 'right-0'
        )}>
          <div className="px-1 py-1">
            {items.map((item, index) => (
              <MenuItem key={index} disabled={item.disabled}>
                {({ active }) => (
                  <button
                    onClick={item.onClick}
                    className={cn(
                      "group flex w-full items-center rounded-md px-2 py-2 text-sm transition-colors",
                      active && !item.danger && "bg-primary-50 text-primary-600",
                      active && item.danger && "bg-error-50 text-error-600",
                      !active && item.danger && "text-error-600",
                      !active && !item.danger && "text-neutral-700",
                      item.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={item.disabled}
                  >
                    {item.icon && (
                      <span className="mr-2">{item.icon}</span>
                    )}
                    {item.label}
                  </button>
                )}
              </MenuItem>
            ))}
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

export { Dropdown };