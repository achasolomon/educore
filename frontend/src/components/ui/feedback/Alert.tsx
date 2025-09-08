// src/components/ui/Alert.tsx
import { HTMLAttributes, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

const alertVariants = cva(
  "relative w-full rounded-lg border p-4",
  {
    variants: {
      variant: {
        success: "bg-success-50 text-success-800 border-success-200",
        error: "bg-error-50 text-error-800 border-error-200",
        warning: "bg-warning-50 text-warning-800 border-warning-200",
        info: "bg-blue-50 text-blue-800 border-blue-200",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  icon?: ReactNode;
  showIcon?: boolean;
}

const Alert = ({ 
  className, 
  variant, 
  title, 
  children, 
  icon, 
  showIcon = true,
  ...props 
}: AlertProps) => {
  const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const IconComponent = variant ? iconMap[variant] : Info;

  return (
    <div
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            {icon || <IconComponent className="h-5 w-5" />}
          </div>
        )}
        <div className={cn("ml-3", !showIcon && "ml-0")}>
          {title && (
            <h3 className="text-sm font-medium mb-1">{title}</h3>
          )}
          <div className="text-sm">{children}</div>
        </div>
      </div>
    </div>
  );
};

export { Alert, alertVariants };