import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Trash2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useSelectedStore } from "@/hooks/useSelectedStore";

interface AnalysisHistoryItem {
  id: string;
  analysis_type: string;
  input_data: any;
  result: string;
  created_at: string;
}

interface AnalysisHistoryProps {
  analysisType: string;
  refreshTrigger?: number;
}

export const AnalysisHistory = ({ analysisType, refreshTrigger }: AnalysisHistoryProps) => {
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { selectedStore } = useSelectedStore();

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedStore) return;

      const { data, error} = await (supabase as any)
        .from('analysis_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', selectedStore.id)
        .eq('analysis_type', analysisType)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (error: any) {
      console.error('히스토리 조회 오류:', error);
      toast({
        title: "조회 실패",
        description: "히스토리를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [analysisType, refreshTrigger, selectedStore]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('analysis_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast({
        title: "삭제 완료",
        description: "분석 기록이 삭제되었습니다.",
      });
    } catch (error: any) {
      console.error('삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: "기록 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6 glass-card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6 glass-card">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <History className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">분석 기록이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            AI 분석을 실행하면 여기에 기록이 남습니다.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <Card key={item.id} className="p-6 glass-card">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {format(new Date(item.created_at), 'PPp', { locale: ko })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(item.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {item.result}
          </div>
        </Card>
      ))}
    </div>
  );
};
