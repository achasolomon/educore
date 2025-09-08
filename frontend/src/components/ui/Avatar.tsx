// src/components/ui/Avatar.tsx
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { User } from 'lucide-react';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, name, size = 'md', status, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-8 w-8',
      md: 'h-10 w-10',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
      '2xl': 'h-20 w-20',
    };

    const statusColors = {
      online: 'bg-success-500',
      offline: 'bg-neutral-400',
      busy: 'bg-error-500',
      away: 'bg-warning-500',
    };

    const getInitials = (name?: string) => {
      if (!name) return '';
      return name
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
    };

    return (
      <div className={cn("relative", className)} ref={ref} {...props}>
        <div className={cn(
          "relative inline-flex items-center justify-center rounded-full bg-neutral-100 overflow-hidden",
          sizeClasses[size]
        )}>
          {src ? (
            <img
              src={src}
              alt={alt || name}
              className="h-full w-full object-cover"
            />
          ) : name ? (
            <span className="text-sm font-medium text-neutral-600 select-none">
              {getInitials(name)}
            </span>
          ) : (
            <User className="h-1/2 w-1/2 text-neutral-400" />
          )}
        </div>
        
        {status && (
          <div className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white",
            statusColors[status]
          )} />
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };