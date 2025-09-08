// src/components/dashboard/RecentActivityCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '../ui/data-display/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../lib/utils';

interface Activity {
  id: string;
  user: {
    name: string;
    avatar?: string;
    role: string;
  };
  action: string;
  target: string;
  timestamp: Date;
  type: 'success' | 'warning' | 'info' | 'error';
}

interface RecentActivityCardProps {
  activities: Activity[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'primary';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <p className="text-neutral-500 text-center py-8">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <Avatar
                  src={activity.user.avatar}
                  name={activity.user.name}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-neutral-800">
                      {activity.user.name}
                    </p>
                   <time className="text-xs text-neutral-500">
                      {formatDate(activity.timestamp, 'relative')}
                    </time>
                  </div>
                  <p className="text-sm text-neutral-600 mb-1">
                    {activity.action} <span className="font-medium">{activity.target}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant={getActivityColor(activity.type)} size="sm">
                      {activity.user.role}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}