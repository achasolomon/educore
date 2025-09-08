// src/components/dashboard/StatCard.tsx
import { ReactNode } from 'react';
import { Card } from '../ui/data-display/Card';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon, trend, className, onClick }: StatCardProps) {
  return (
    <Card
      hover={!!onClick}
      className={cn("p-6 cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-neutral-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-800">{value}</p>
          
          {trend && (
            <div className="flex items-center mt-2">
              <Badge 
                variant={trend.isPositive ? 'success' : 'error'} 
                size="sm"
                className="mr-2"
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </Badge>
              <span className="text-xs text-neutral-500">{trend.label}</span>
            </div>
          )}
        </div>
        
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
          <div className="text-primary-600">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}