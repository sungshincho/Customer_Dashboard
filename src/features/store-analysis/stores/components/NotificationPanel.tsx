import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Clock } from "lucide-react";
import { useHQNotifications, useMarkNotificationAsRead } from "@/hooks/useHQCommunication";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function NotificationPanel() {
  const { data: notifications, isLoading } = useHQNotifications();
  const markAsRead = useMarkNotificationAsRead();

  const handleMarkAsRead = (notificationId: string) => {
    markAsRead.mutate(notificationId);
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<string, { label: string; variant: any }> = {
      'message': { label: '메시지', variant: 'default' },
      'guideline': { label: '가이드라인', variant: 'secondary' },
      'comment': { label: '코멘트', variant: 'outline' },
      'alert': { label: '알림', variant: 'destructive' },
    };
    const config = typeMap[type] || { label: type, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">알림</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {!notifications || notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">알림이 없습니다</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-all hover:shadow-sm ${
                !notification.is_read ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {notification.is_read ? (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Bell className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(notification.notification_type)}
                  </div>
                  <h4 className="font-medium">{notification.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>
                      {format(new Date(notification.created_at), 'PPp', { locale: ko })}
                    </span>
                  </div>
                </div>
                {!notification.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    읽음
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
