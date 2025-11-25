import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, MailOpen, Clock } from "lucide-react";
import { useHQMessages, useMarkMessageAsRead } from "@/hooks/useHQCommunication";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface MessageListProps {
  storeId?: string;
}

export function MessageList({ storeId }: MessageListProps) {
  const { data: messages, isLoading } = useHQMessages(storeId);
  const markAsRead = useMarkMessageAsRead();

  const handleMarkAsRead = (messageId: string) => {
    markAsRead.mutate(messageId);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">긴급</Badge>;
      case 'high':
        return <Badge className="bg-orange-500">높음</Badge>;
      case 'normal':
        return <Badge variant="secondary">보통</Badge>;
      default:
        return <Badge variant="outline">낮음</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!messages || messages.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">메시지가 없습니다</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <Card
          key={message.id}
          className={`p-4 transition-all hover:shadow-md ${
            !message.is_read ? 'border-primary bg-primary/5' : ''
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">
                {message.is_read ? (
                  <MailOpen className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <Mail className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold">{message.sender_name}</span>
                  <Badge variant="outline">{message.sender_role}</Badge>
                  {getPriorityBadge(message.priority)}
                  <Badge variant="secondary">{message.message_type}</Badge>
                </div>
                {message.subject && (
                  <h4 className="font-medium">{message.subject}</h4>
                )}
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {message.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>
                    {format(new Date(message.created_at), 'PPp', { locale: ko })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {!message.is_read && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkAsRead(message.id)}
                >
                  읽음 표시
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
