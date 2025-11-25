import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedStore } from "@/hooks/useSelectedStore";

interface AIAnalysisButtonProps {
  analysisType: string;
  data: any;
  title?: string;
  onAnalysisComplete?: () => void;
  graphData?: {
    nodes: any[];
    edges: any[];
  };
}

export const AIAnalysisButton = ({ analysisType, data, title = "AI 분석 요청", onAnalysisComplete, graphData }: AIAnalysisButtonProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { toast } = useToast();
  const { selectedStore } = useSelectedStore();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase.functions.invoke('analyze-store-data', {
        body: { 
          analysisType, 
          data,
          userId: user?.id,
          graphData
        }
      });

      if (error) {
        throw error;
      }

      if (result?.error) {
        throw new Error(result.error);
      }

      setAnalysis(result.analysis);
      
      // Save to history
      if (user && selectedStore) {
        await (supabase as any).from('analysis_history').insert({
          user_id: user.id,
          store_id: selectedStore.id,
          analysis_type: analysisType,
          input_data: data,
          result: result.analysis
        });
      }

      if (onAnalysisComplete) {
        onAnalysisComplete();
      }

      toast({
        title: "AI 분석 완료",
        description: "분석 결과를 확인해보세요.",
      });
    } catch (error: any) {
      console.error("AI 분석 오류:", error);
      toast({
        title: "분석 실패",
        description: error.message || "AI 분석 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing}
        className="gap-2"
        variant="default"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            분석 중...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {title}
          </>
        )}
      </Button>

      {analysis && (
        <Card className="p-6 glass-card animate-fade-in">
          <div className="flex items-start gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-semibold mb-2">AI 분석 결과</h4>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                {analysis}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
