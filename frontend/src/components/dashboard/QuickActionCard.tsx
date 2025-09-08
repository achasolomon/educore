// src/components/dashboard/QuickActionCard.tsx
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/data-display/Card';
import { Button } from '../ui/Button';
import { ArrowRight } from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: ReactNode;
  description?: string;
}

interface QuickActionCardProps {
  title: string;
  actions: QuickAction[];
}

export function QuickActionCard({ title, actions }: QuickActionCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full justify-start h-auto p-3"
            onClick={() => window.location.href = action.href}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <div className="text-primary-600 text-sm">
                    {action.icon}
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-medium text-neutral-800">{action.label}</p>
                  {action.description && (
                    <p className="text-xs text-neutral-500">{action.description}</p>
                  )}
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400" />
            </div>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}