import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send } from "lucide-react";
import { useSendMessage } from "@/hooks/useHQCommunication";
import { useSelectedStore } from "@/hooks/useSelectedStore";

export function MessageForm() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [recipientStoreId, setRecipientStoreId] = useState<string>("");
  const [priority, setPriority] = useState<string>("normal");
  const [messageType, setMessageType] = useState<string>("general");

  const sendMessage = useSendMessage();
  const { stores } = useSelectedStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      return;
    }

    await sendMessage.mutateAsync({
      recipient_store_id: recipientStoreId || undefined,
      subject: subject.trim() || undefined,
      content: content.trim(),
      priority,
      message_type: messageType,
    });

    // Reset form
    setSubject("");
    setContent("");
    setRecipientStoreId("");
    setPriority("normal");
    setMessageType("general");
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">새 메시지 작성</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>수신 매장</Label>
            <Select value={recipientStoreId} onValueChange={setRecipientStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="전체 매장" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 매장</SelectItem>
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
              </SelectContent>
            </Select>
          </div>
        </div>

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
          <Label>제목</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="메시지 제목 (선택사항)"
          />
        </div>

        <div className="space-y-2">
          <Label>내용 *</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="메시지 내용을 입력하세요"
            rows={6}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!content.trim() || sendMessage.isPending}
        >
          <Send className="w-4 h-4 mr-2" />
          {sendMessage.isPending ? "전송 중..." : "메시지 전송"}
        </Button>
      </form>
    </Card>
  );
}
