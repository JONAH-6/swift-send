import { useState, useEffect } from "react";
import { Bell, Check, CheckCheck, X, AlertTriangle, Shield, DollarSign, Settings, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { sortNotificationsByPriority, getCriticalNotifications, getCategoryInfo, getPriorityInfo } from "@/lib/notificationPrioritization";
import type { UserNotification } from "@/types/activity";

interface NotificationResponse {
  items: UserNotification[];
  unreadCount: number;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'critical'>('all');

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/notifications?limit=50");
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        const sortedNotifications = sortNotificationsByPriority(data.items);
        setNotifications(sortedNotifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiFetch(`/notifications/${notificationId}/read`, {
        method: "POST",
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId
              ? { ...n, readAt: new Date().toISOString() }
              : n,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiFetch("/notifications/mark-all-read", {
        method: "POST",
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            readAt: n.readAt || new Date().toISOString(),
          })),
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'transaction':
        return <DollarSign className="w-4 h-4" />;
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'account':
        return <Settings className="w-4 h-4" />;
      case 'compliance':
        return <AlertTriangle className="w-4 h-4" />;
      case 'marketing':
        return <Megaphone className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const filteredNotifications = filter === 'critical' 
    ? getCriticalNotifications(notifications)
    : notifications;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
              : "All caught up!"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Filter Tabs */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={filter === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('critical')}
              className="flex-1"
            >
              Critical
            </Button>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="w-full"
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}

          <ScrollArea className="h-[calc(100vh-200px)]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No notifications yet
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const categoryInfo = getCategoryInfo(notification.category);
                  const priorityInfo = getPriorityInfo(notification.priority);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.readAt ? "bg-muted/30" : "bg-card"
                      } ${notification.priority === 'critical' ? 'border-l-4 border-l-red-500' : ''} transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Priority Badge */}
                            <span className={`text-xs px-2 py-0.5 rounded ${priorityInfo.color}`}>
                              {priorityInfo.icon} {priorityInfo.label}
                            </span>
                            
                            {/* Category Badge */}
                            <span className={`text-xs px-2 py-0.5 rounded border ${categoryInfo.color}`}>
                              {categoryInfo.icon} {categoryInfo.label}
                            </span>
                            
                            {!notification.readAt && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(notification.createdAt, { addSuffix: true })}</span>
                            {notification.expiresAt && new Date() < notification.expiresAt && (
                              <span className="text-amber-600">Expires {formatDistanceToNow(notification.expiresAt, { addSuffix: true })}</span>
                            )}
                          </div>
                        </div>
                        {!notification.readAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
