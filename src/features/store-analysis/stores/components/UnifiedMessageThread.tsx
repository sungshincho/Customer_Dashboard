import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, MailOpen, Clock, Send, Pin } from "lucide-react";
import { useHQMessages, useSendMessage, useMarkMessageAsRead } from "@/hooks/useHQCommunication";
import { useSelectedStore } from "@/hooks/useSelectedStore";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function UnifiedMessageThread() {
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [recipientStoreId, setRecipientStoreId] = useState<string>("");
  const [priority, setPriority] = useState<string>("normal");
  const [messageType, setMessageType] = useState<string>("general");

  const { stores, selectedStore } = useSelectedStore();
  const { isOrgHQ } = useAuth();
  const { data: messages, isLoading } = useHQMessages(selectedStore?.id);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkMessageAsRead();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return;
    }

    await sendMessage.mutateAsync({
      recipient_store_id: recipientStoreId || selectedStore?.id,
      subject: subject.trim() || undefined,
      content: newMessage.trim(),
      priority,
      message_type: messageType,
    });

    setNewMessage("");
    setSubject("");
    setPriority("normal");
    setMessageType("general");
  };

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

  return (
    <div className="space-y-6">
      {/* Message Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">새 메시지/코멘트 작성</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isOrgHQ && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>수신 매장</Label>
                <Select value={recipientStoreId} onValueChange={setRecipientStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedStore?.store_name || "매장 선택"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">현재 선택된 매장</SelectItem>
                    {stores?.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.store_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>메시지 유형</Label>
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">일반</SelectItem>
                    <SelectItem value="announcement">공지</SelectItem>
                    <SelectItem value="instruction">지시</SelectItem>
                    <SelectItem value="inquiry">문의</SelectItem>
                    <SelectItem value="comment">코멘트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>우선순위</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">긴급</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="normal">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>제목 (선택)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="메시지 제목"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>내용 *</Label>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="메시지 또는 코멘트를 입력하세요..."
              rows={4}
              required
            />
          </div>

          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessage.isPending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendMessage.isPending ? "전송 중..." : "전송"}
          </Button>
        </form>
      </Card>

      {/* Message List */}
      <div className="space-y-3">
        {!messages || messages.length === 0 ? (
          <Card className="p-8 text-center">
            <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">메시지가 없습니다</p>
          </Card>
        ) : (
          messages.map((message) => (
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
          ))
        )}
      </div>
    </div>
  );
}
