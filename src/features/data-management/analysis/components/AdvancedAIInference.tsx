import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Brain, AlertTriangle, TrendingUp, Sparkles, Zap, Target, GitBranch, Activity } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface AdvancedAIInferenceProps {
  data: any[];
  graphData?: { nodes: any[]; edges: any[] };
  timeSeriesData?: any[];
}

export const AdvancedAIInference = ({ data, graphData, timeSeriesData }: AdvancedAIInferenceProps) => {
  const [inferenceType, setInferenceType] = useState<'causal' | 'anomaly' | 'prediction' | 'pattern'>('causal');
  const [parameters, setParameters] = useState<Record<string, any>>({
    confidence_threshold: 0.7,
    max_chain_length: 3,
    sensitivity: 'medium',
    forecast_horizon: '7 days',
    min_support: 0.1,
  });
  const [results, setResults] = useState<any>(null);

  const inferenceMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('advanced-ai-inference', {
        body: {
          inference_type: inferenceType,
          data: data.slice(0, 1000), // Limit to 1000 records for API
          graph_data: graphData,
          time_series_data: timeSeriesData,
          parameters,
        },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success('AI 추론이 완료되었습니다');
    },
    onError: (error: any) => {
      toast.error(`추론 실패: ${error.message}`);
    },
  });

  const handleInference = () => {
    if (!data || data.length === 0) {
      toast.error('분석할 데이터가 없습니다');
      return;
    }
    inferenceMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            고급 AI 추론 엔진
          </CardTitle>
          <CardDescription>
            Gemini 2.5 Pro를 활용한 고급 데이터 분석 및 추론
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={inferenceType} onValueChange={(v: any) => setInferenceType(v)}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="causal" className="flex items-center gap-1">
                <GitBranch className="h-4 w-4" />
                인과추론
              </TabsTrigger>
              <TabsTrigger value="anomaly" className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                이상탐지
              </TabsTrigger>
              <TabsTrigger value="prediction" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                예측
              </TabsTrigger>
              <TabsTrigger value="pattern" className="flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                패턴발견
              </TabsTrigger>
            </TabsList>

            <TabsContent value="causal" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>신뢰도 임계값 ({parameters.confidence_threshold})</Label>
                  <Slider
                    value={[parameters.confidence_threshold]}
                    onValueChange={([value]) => setParameters({ ...parameters, confidence_threshold: value })}
                    min={0.5}
                    max={0.95}
                    step={0.05}
                  />
                  <p className="text-sm text-muted-foreground">
                    높을수록 확실한 인과관계만 표시
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>최대 인과 체인 길이</Label>
                  <Select
                    value={String(parameters.max_chain_length)}
                    onValueChange={(value) => setParameters({ ...parameters, max_chain_length: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2단계 (A → B)</SelectItem>
                      <SelectItem value="3">3단계 (A → B → C)</SelectItem>
                      <SelectItem value="4">4단계 (A → B → C → D)</SelectItem>
                      <SelectItem value="5">5단계 이상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="anomaly" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>민감도</Label>
                  <Select
                    value={parameters.sensitivity}
                    onValueChange={(value) => setParameters({ ...parameters, sensitivity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">낮음 (큰 이상치만)</SelectItem>
                      <SelectItem value="medium">중간 (균형)</SelectItem>
                      <SelectItem value="high">높음 (작은 이상치도)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Z-Score 임계값</Label>
                  <Slider
                    value={[parameters.z_score_threshold || 3]}
                    onValueChange={([value]) => setParameters({ ...parameters, z_score_threshold: value })}
                    min={2}
                    max={4}
                    step={0.5}
                  />
                  <p className="text-sm text-muted-foreground">
                    통계적 이상치 탐지 기준 (표준편차 배수)
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prediction" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>예측 기간</Label>
                  <Select
                    value={parameters.forecast_horizon}
                    onValueChange={(value) => setParameters({ ...parameters, forecast_horizon: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 day">1일</SelectItem>
                      <SelectItem value="3 days">3일</SelectItem>
                      <SelectItem value="7 days">7일</SelectItem>
                      <SelectItem value="14 days">14일</SelectItem>
                      <SelectItem value="30 days">30일</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>신뢰구간 포함</Label>
                  <Switch
                    checked={parameters.confidence_intervals !== false}
                    onCheckedChange={(checked) => setParameters({ ...parameters, confidence_intervals: checked })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pattern" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>최소 지지도 ({parameters.min_support})</Label>
                  <Slider
                    value={[parameters.min_support]}
                    onValueChange={([value]) => setParameters({ ...parameters, min_support: value })}
                    min={0.05}
                    max={0.5}
                    step={0.05}
                  />
                  <p className="text-sm text-muted-foreground">
                    패턴이 얼마나 자주 나타나야 하는지
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>복잡도 선호</Label>
                  <Select
                    value={parameters.complexity || 'balanced'}
                    onValueChange={(value) => setParameters({ ...parameters, complexity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">단순 (간단한 패턴 위주)</SelectItem>
                      <SelectItem value="balanced">균형 (중간)</SelectItem>
                      <SelectItem value="complex">복잡 (세밀한 패턴)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {data?.length > 0 && (
                <span>
                  {data.length.toLocaleString()}개 레코드
                  {graphData && ` • ${graphData.nodes.length}개 노드`}
                  {timeSeriesData && ` • ${timeSeriesData.length}개 시계열 데이터`}
                </span>
              )}
            </div>
            <Button onClick={handleInference} disabled={inferenceMutation.isPending || !data || data.length === 0}>
              <Zap className="mr-2 h-4 w-4" />
              {inferenceMutation.isPending ? 'AI 분석 중...' : 'AI 추론 시작'}
            </Button>
          </div>

          {inferenceMutation.isPending && (
            <div className="mt-4">
              <Progress value={33} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Gemini 2.5 Pro가 데이터를 분석하고 있습니다...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>분석 결과</CardTitle>
            <CardDescription>
              {new Date(results.timestamp).toLocaleString('ko-KR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.type === 'causal_inference' && (
              <CausalInferenceResults analysis={results.analysis} />
            )}
            {results.type === 'anomaly_detection' && (
              <AnomalyDetectionResults analysis={results.ai_analysis} statistical={results.statistical_baseline} />
            )}
            {results.type === 'predictive_modeling' && (
              <PredictiveModelingResults analysis={results.analysis} />
            )}
            {results.type === 'pattern_discovery' && (
              <PatternDiscoveryResults analysis={results.analysis} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Results components
const CausalInferenceResults = ({ analysis }: { analysis: any }) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <GitBranch className="h-5 w-5" />
        인과 관계
      </h3>
      <div className="space-y-3">
        {analysis.causal_relationships?.map((rel: any, idx: number) => (
          <Card key={idx}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{rel.cause}</Badge>
                  <span className="text-muted-foreground">→</span>
                  <Badge variant="outline">{rel.effect}</Badge>
                </div>
                <Badge variant={rel.confidence > 0.8 ? 'default' : 'secondary'}>
                  {(rel.confidence * 100).toFixed(0)}% 신뢰도
                </Badge>
              </div>
              <p className="text-sm mb-2">{rel.mechanism}</p>
              <div className="space-y-1">
                {rel.evidence?.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    <strong>증거:</strong> {rel.evidence.join(', ')}
                  </div>
                )}
                {rel.test_intervention && (
                  <div className="text-xs text-muted-foreground">
                    <strong>검증 방법:</strong> {rel.test_intervention}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {analysis.causal_chains?.length > 0 && (
      <div>
        <h3 className="font-semibold mb-3">인과 체인</h3>
        <div className="space-y-2">
          {analysis.causal_chains.map((chain: any, idx: number) => (
            <div key={idx} className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                {chain.chain.map((node: string, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <Badge variant="outline">{node}</Badge>
                    {i < chain.chain.length - 1 && <span className="text-muted-foreground">→</span>}
                  </div>
                ))}
                <Badge variant="secondary">{(chain.strength * 100).toFixed(0)}%</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{chain.description}</p>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

const AnomalyDetectionResults = ({ analysis, statistical }: { analysis: any; statistical: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{analysis.summary?.total_anomalies || 0}</div>
          <div className="text-sm text-muted-foreground">총 이상치</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold text-destructive">{analysis.summary?.critical_count || 0}</div>
          <div className="text-sm text-muted-foreground">심각한 이상치</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{statistical?.anomalies?.length || 0}</div>
          <div className="text-sm text-muted-foreground">통계적 이상치</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <Badge variant={
            analysis.summary?.overall_data_health === 'good' ? 'default' :
            analysis.summary?.overall_data_health === 'fair' ? 'secondary' : 'destructive'
          }>
            {analysis.summary?.overall_data_health || 'unknown'}
          </Badge>
          <div className="text-sm text-muted-foreground mt-1">데이터 건강도</div>
        </CardContent>
      </Card>
    </div>

    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5" />
        탐지된 이상치
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {analysis.anomalies?.map((anomaly: any, idx: number) => (
          <Card key={idx}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={
                    anomaly.severity === 'critical' ? 'destructive' :
                    anomaly.severity === 'high' ? 'default' : 'secondary'
                  }>
                    {anomaly.severity}
                  </Badge>
                  <Badge variant="outline">{anomaly.type}</Badge>
                </div>
                <Badge variant="secondary">{(anomaly.confidence * 100).toFixed(0)}%</Badge>
              </div>
              <p className="text-sm font-medium mb-1">{anomaly.description}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>위치: {anomaly.location}</div>
                <div>예상값: {JSON.stringify(anomaly.expected_value)}</div>
                <div>실제값: {JSON.stringify(anomaly.actual_value)}</div>
                {anomaly.recommended_action && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <strong>조치사항:</strong> {anomaly.recommended_action}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

const PredictiveModelingResults = ({ analysis }: { analysis: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{analysis.predictions?.length || 0}</div>
          <div className="text-sm text-muted-foreground">예측 포인트</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <Badge variant={
            analysis.model_quality?.reliability === 'high' ? 'default' :
            analysis.model_quality?.reliability === 'medium' ? 'secondary' : 'destructive'
          }>
            {analysis.model_quality?.reliability || 'unknown'}
          </Badge>
          <div className="text-sm text-muted-foreground mt-1">모델 신뢰도</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{analysis.feature_importance?.length || 0}</div>
          <div className="text-sm text-muted-foreground">주요 특성</div>
        </CardContent>
      </Card>
    </div>

    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        예측값
      </h3>
      <div className="space-y-2">
        {analysis.predictions?.slice(0, 10).map((pred: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="text-sm font-medium">{pred.timestamp}</div>
              <div className="text-xs text-muted-foreground">
                {pred.confidence_lower?.toFixed(2)} ~ {pred.confidence_upper?.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{pred.predicted_value?.toFixed(2)}</div>
              <Badge variant="outline">{(pred.confidence_level * 100).toFixed(0)}%</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>

    {analysis.drivers?.length > 0 && (
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5" />
          예측 드라이버
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {analysis.drivers.map((driver: any, idx: number) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium">{driver.factor}</span>
                  <Badge variant={driver.impact === 'positive' ? 'default' : driver.impact === 'negative' ? 'destructive' : 'secondary'}>
                    {driver.impact}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{driver.explanation}</p>
                <div className="mt-2">
                  <Progress value={driver.magnitude * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )}
  </div>
);

const PatternDiscoveryResults = ({ analysis }: { analysis: any }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{analysis.summary?.total_patterns_found || 0}</div>
          <div className="text-sm text-muted-foreground">발견된 패턴</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{analysis.segments?.length || 0}</div>
          <div className="text-sm text-muted-foreground">세그먼트</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{analysis.trends?.length || 0}</div>
          <div className="text-sm text-muted-foreground">트렌드</div>
        </CardContent>
      </Card>
    </div>

    <div>
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5" />
        발견된 패턴
      </h3>
      <div className="space-y-3">
        {analysis.patterns?.map((pattern: any, idx: number) => (
          <Card key={idx}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{pattern.type}</Badge>
                  <span className="font-medium">{pattern.name}</span>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">Support: {(pattern.support * 100).toFixed(0)}%</Badge>
                  <Badge variant="secondary">Conf: {(pattern.confidence * 100).toFixed(0)}%</Badge>
                </div>
              </div>
              <p className="text-sm mb-2">{pattern.description}</p>
              <div className="p-2 bg-muted rounded text-sm">
                <strong>비즈니스 의미:</strong> {pattern.business_meaning}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>

    {analysis.insights?.length > 0 && (
      <div>
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          핵심 인사이트
        </h3>
        <div className="space-y-2">
          {analysis.insights.map((insight: any, idx: number) => (
            <Card key={idx}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium">{insight.insight}</span>
                  <Badge variant={
                    insight.importance === 'high' ? 'default' :
                    insight.importance === 'medium' ? 'secondary' : 'outline'
                  }>
                    {insight.importance}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  증거: {insight.evidence?.join(', ')}
                </div>
                <div className="p-2 bg-muted rounded text-sm">
                  <strong>권장사항:</strong> {insight.recommendation}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )}
  </div>
);
