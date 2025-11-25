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
import { FileText, Send } from "lucide-react";
import { useCreateGuideline } from "@/hooks/useHQCommunication";

export function GuidelineForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("operation");
  const [priority, setPriority] = useState<string>("normal");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const createGuideline = useCreateGuideline();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      return;
    }

    await createGuideline.mutateAsync({
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      effective_date: effectiveDate || undefined,
      expiry_date: expiryDate || undefined,
    });

    // Reset form
    setTitle("");
    setContent("");
    setCategory("operation");
    setPriority("normal");
    setEffectiveDate("");
    setExpiryDate("");
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5" />
        <h3 className="text-lg font-semibold">새 가이드라인 작성</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>제목 *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="가이드라인 제목"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>카테고리</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="operation">운영</SelectItem>
                <SelectItem value="sales">판매</SelectItem>
                <SelectItem value="inventory">재고</SelectItem>
                <SelectItem value="customer_service">고객서비스</SelectItem>
                <SelectItem value="safety">안전</SelectItem>
                <SelectItem value="compliance">컴플라이언스</SelectItem>
              </SelectContent>
            </Select>
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
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>시행일</Label>
            <Input
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>만료일</Label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>내용 *</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="가이드라인 내용을 입력하세요"
            rows={8}
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!title.trim() || !content.trim() || createGuideline.isPending}
        >
          <Send className="w-4 h-4 mr-2" />
          {createGuideline.isPending ? "등록 중..." : "가이드라인 등록"}
        </Button>
      </form>
    </Card>
  );
}
