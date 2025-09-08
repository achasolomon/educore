// src/components/ui/Modal.tsx
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className
}: ModalProps) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full mx-4',
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-modal" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <div className={cn(
                "w-full transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all",
                sizeClasses[size],
                className
              )}>
                <div className="flex items-center justify-between mb-4">
                  {title && (
                    <h3 className="text-lg font-semibold text-neutral-800">
                      {title}
                    </h3>
                  )}
                  
                  {showCloseButton && (
                    <button
                      type="button"
                      className="rounded-md p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onClick={onClose}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                {children}
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export { Modal };