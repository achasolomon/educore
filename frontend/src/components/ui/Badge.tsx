// src/components/ui/Badge.tsx
import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        primary: "bg-primary-100 text-primary-800 border border-primary-200",
        secondary: "bg-secondary-100 text-secondary-800 border border-secondary-200",
        success: "bg-success-100 text-success-800 border border-success-200",
        error: "bg-error-100 text-error-800 border border-error-200",
        warning: "bg-warning-100 text-warning-800 border border-warning-200",
        outline: "text-neutral-600 border border-neutral-200",
        
        // Academic status badges
        excellent: "grade-excellent",
        good: "grade-good", 
        average: "grade-average",
        poor: "grade-poor",
        
        // Attendance status badges
        present: "status-present",
        absent: "status-absent",
        late: "status-late",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };