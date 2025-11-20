import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TestTube, Sparkles, ArrowRight } from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAIInference } from '../hooks';
import { toast } from 'sonner';

interface SimulationRecommendation {
  type: 'layout' | 'pricing' | 'demand-inventory' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  expectedImpact: string;
}

export default function ScenarioLabPage() {
  const { selectedStore } = useSelectedStore();
  const navigate = useNavigate();
  const [goalText, setGoalText] = useState('');
  const [recommendations, setRecommendations] = useState<SimulationRecommendation[]>([]);
  const { analyzeGoal, loading: isAnalyzing } = useAIInference();

  const handleAnalyze = async () => {
    if (!goalText.trim()) {
      toast.error('목표를 입력해주세요');
      return;
    }

    if (!selectedStore) {
      toast.error('매장을 선택해주세요');
      return;
    }

    const result = await analyzeGoal(goalText, selectedStore.id);
    
    if (result) {
      setRecommendations(result);
      toast.success('AI 분석이 완료되었습니다');
    }
  };

  const handleNavigateToSimulation = (type: SimulationRecommendation['type'], recommendation: SimulationRecommendation) => {
    const routes = {
      'layout': '/simulation/layout',
      'pricing': '/simulation/pricing',
      'demand-inventory': '/simulation/demand-inventory',
      'recommendation': '/simulation/recommendation',
    };

    navigate(routes[type], { 
      state: { 
        goalText,
        recommendation,
        storeId: selectedStore?.id 
      } 
    });
  };

  const getPriorityColor = (priority: SimulationRecommendation['priority']) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      case 'low': return 'text-muted-foreground';
    }
  };

  const getPriorityLabel = (priority: SimulationRecommendation['priority']) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '중간';
      case 'low': return '낮음';
    }
  };

  const getTypeLabel = (type: SimulationRecommendation['type']) => {
    switch (type) {
      case 'layout': return '레이아웃 최적화';
      case 'pricing': return '가격 최적화';
      case 'demand-inventory': return '수요 & 재고 최적화';
      case 'recommendation': return '추천 전략';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">🧪 Scenario Lab</h1>
          <p className="text-muted-foreground mt-2">
            시나리오 생성: 레이아웃, 스태핑, 프로모션, 가격/재고 | KPI 예측: ΔCVR, ΔATV, ΔSales/㎡, ΔOpex, ΔProfit
          </p>
        </div>

        <Alert>
          <TestTube className="h-4 w-4" />
          <AlertDescription>
            다양한 비즈니스 시나리오를 설정하고 AI 기반으로 KPI 변화량을 예측합니다.
          </AlertDescription>
        </Alert>

        {!selectedStore && (
          <Alert>
            <AlertDescription>
              매장을 선택하여 시뮬레이션을 시작하세요.
            </AlertDescription>
          </Alert>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {/* 목표 입력 */}
          <Card>
            <CardHeader>
              <CardTitle>비즈니스 목표 입력</CardTitle>
              <CardDescription>
                달성하고 싶은 목표나 현재 상황을 자유롭게 입력하세요. AI가 분석하여 최적의 시뮬레이션 전략을 추천합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={goalText}
                onChange={(e) => setGoalText(e.target.value)}
                placeholder="예시: 전년 동기 대비 매출 5% 감소, 매출 5% 증가시키고 싶어"
                className="min-h-[120px] text-base"
              />
              <Button
                onClick={handleAnalyze}
                disabled={!selectedStore || isAnalyzing || !goalText.trim()}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="w-5 h-5" />
                {isAnalyzing ? 'AI 분석 중...' : 'AI 분석 시작'}
              </Button>
            </CardContent>
          </Card>

          {/* AI 분석 결과 */}
          {recommendations.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">AI 추천 시뮬레이션 전략</h2>
              <div className="grid gap-4">
                {recommendations.map((rec, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{rec.title}</CardTitle>
                            <span className={`text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                              우선순위: {getPriorityLabel(rec.priority)}
                            </span>
                          </div>
                          <CardDescription>{getTypeLabel(rec.type)}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{rec.description}</p>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">추천 액션</h4>
                        <ul className="space-y-1">
                          {rec.suggestedActions.map((action, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        <p className="text-sm">
                          <span className="font-medium">예상 효과:</span>{' '}
                          <span className="text-primary">{rec.expectedImpact}</span>
                        </p>
                      </div>

                      <Button
                        onClick={() => handleNavigateToSimulation(rec.type, rec)}
                        className="w-full gap-2"
                        variant="outline"
                      >
                        {getTypeLabel(rec.type)} 시뮬레이션 시작
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
