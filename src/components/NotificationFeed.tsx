import { Bell, CheckCircle2, AlertTriangle, XCircle, Info, Mail, MessageSquare, Shield, DollarSign, Settings, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { UserNotification } from '@/types/activity';
import { formatDistanceToNow } from 'date-fns';
import { sortNotificationsByPriority, getCategoryInfo, getPriorityInfo } from '@/lib/notificationPrioritization';

interface NotificationFeedProps {
  notifications: UserNotification[];
  unreadCount: number;
}

const notificationStyles = {
  success: {
    icon: CheckCircle2,
    badge: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-200 dark:border-green-800',
  },
  error: {
    icon: XCircle,
    badge: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-200 dark:border-red-800',
  },
  warning: {
    icon: AlertTriangle,
    badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800',
  },
  info: {
    icon: Info,
    badge: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-200 dark:border-blue-800',
  },
} as const;

const categoryIcons = {
  transaction: DollarSign,
  security: Shield,
  account: Settings,
  compliance: AlertTriangle,
  system: Info,
  marketing: Megaphone,
};

export function NotificationFeed({ notifications, unreadCount }: NotificationFeedProps) {
  const sortedNotifications = sortNotificationsByPriority(notifications);

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4 text-primary" />
            Alerts & Notifications
          </CardTitle>
          <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
            {unreadCount} unread
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
            Transfer confirmations and failure alerts will appear here.
          </div>
        ) : (
          sortedNotifications.map((notification) => {
            const style = notificationStyles[notification.type];
            const Icon = style.icon;
            const CategoryIcon = categoryIcons[notification.category] || Info;
            const categoryInfo = getCategoryInfo(notification.category);
            const priorityInfo = getPriorityInfo(notification.priority);
            const sentChannels = notification.deliveries.filter((delivery) => delivery.status === 'sent');

            return (
              <div 
                key={notification.id} 
                className={`rounded-xl border border-border/60 p-4 ${
                  notification.priority === 'critical' ? 'border-l-4 border-l-red-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="mt-0.5 rounded-full bg-muted p-2">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-foreground">{notification.title}</p>
                        {!notification.readAt && (
                          <span className={`text-xs px-2 py-0.5 rounded border ${style.badge}`}>
                            New
                          </span>
                        )}
                        {/* Priority Badge */}
                        <span className={`text-xs px-2 py-0.5 rounded ${priorityInfo.color}`}>
                          {priorityInfo.icon} {priorityInfo.label}
                        </span>
                        {/* Category Badge */}
                        <span className={`text-xs px-2 py-0.5 rounded border ${categoryInfo.color}`}>
                          {categoryInfo.icon} {categoryInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span>{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</span>
                        {notification.expiresAt && new Date() < notification.expiresAt && (
                          <span className="text-amber-600">Expires {formatDistanceToNow(notification.expiresAt, { addSuffix: true })}</span>
                        )}
                        {sentChannels.some((delivery) => delivery.channel === 'email') && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Email sent
                          </span>
                        )}
                        {sentChannels.some((delivery) => delivery.channel === 'sms') && (
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            SMS sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
