import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Calendar } from "lucide-react";
import { useHQGuidelines } from "@/hooks/useHQCommunication";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function GuidelineList() {
  const { data: guidelines, isLoading } = useHQGuidelines();

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

  const getCategoryBadge = (category: string) => {
    const categoryMap: Record<string, string> = {
      'operation': '운영',
      'sales': '판매',
      'inventory': '재고',
      'customer_service': '고객서비스',
      'safety': '안전',
      'compliance': '컴플라이언스',
    };
    return <Badge variant="outline">{categoryMap[category] || category}</Badge>;
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  if (!guidelines || guidelines.length === 0) {
    return (
      <Card className="p-8 text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">등록된 가이드라인이 없습니다</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {guidelines.map((guideline) => (
        <Card key={guideline.id} className="p-6 hover:shadow-md transition-shadow">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold">{guideline.title}</h3>
                  {getCategoryBadge(guideline.category)}
                  {getPriorityBadge(guideline.priority)}
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {guideline.content}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>작성: {format(new Date(guideline.created_at), 'PPp', { locale: ko })}</span>
              </div>
              {guideline.effective_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>시행일: {format(new Date(guideline.effective_date), 'PP', { locale: ko })}</span>
                </div>
              )}
              {guideline.expiry_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>만료일: {format(new Date(guideline.expiry_date), 'PP', { locale: ko })}</span>
                </div>
              )}
            </div>

            {guideline.target_stores.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">대상 매장: {guideline.target_stores.length}개</Badge>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
