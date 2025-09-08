// src/components/ui/Loading.tsx
import { cn } from '../../../lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const Loading = ({ size = 'md', text, fullScreen = false, className }: LoadingProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const LoadingSpinner = () => (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <Loader2 className={cn("animate-spin text-primary-500", sizeClasses[size])} />
      {text && (
        <p className="mt-2 text-sm text-neutral-600">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-modal flex items-center justify-center bg-white/80 backdrop-blur-sm">
        <LoadingSpinner />
      </div>
    );
  }

  return <LoadingSpinner />;
};

export { Loading };
