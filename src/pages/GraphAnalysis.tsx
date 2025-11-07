import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Network, TrendingUp, AlertCircle, Zap } from "lucide-react";
import ForceGraph2D from "react-force-graph-2d";
import { normalizeMultipleDatasets } from "@/utils/dataNormalizer";

interface Node {
  id: string;
  type: string;
  label: string;
  properties?: any;
  metrics?: any;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  weight: number;
  properties?: any;
}

interface Insight {
  title: string;
  description: string;
  impact: string;
  recommendation: string;
}

interface AnalysisResult {
  nodes: Node[];
  edges: Edge[];
  insights: Insight[];
  correlations?: any[];
  wtpAnalysis?: any;
  timeSeriesPatterns?: any[];
}

const GraphAnalysis = () => {
  const [imports, setImports] = useState<any[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [nodeRelations, setNodeRelations] = useState<Record<string, boolean>>({
    purchases: true,
    visits: true,
    moves_to: true,
    contains: true,
    located_in: true,
    belongs_to: true,
    influenced_by: false,
    correlated_with: false,
  });
  const { toast } = useToast();
  const graphRef = useRef<any>();

  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("user_data_imports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setImports(data || []);
    } catch (error: any) {
      toast({
        title: "오류",
        description: "데이터 불러오기 실패: " + error.message,
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = async () => {
    if (selectedImportIds.length === 0) {
      toast({
        title: "데이터 선택 필요",
        description: "분석할 데이터를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisStage('preparing');
    setAnalysisMessage('분석 준비 중...');
    
    try {
      const selectedImports = imports.filter(imp => selectedImportIds.includes(imp.id));
      if (selectedImports.length === 0) throw new Error("선택한 데이터를 찾을 수 없습니다.");

      // 🆕 데이터 정규화
      setAnalysisMessage('데이터 구조 정규화 중...');
      const normalizedDatasets = normalizeMultipleDatasets(
        selectedImports.map(imp => ({
          raw_data: imp.raw_data,
          data_type: imp.data_type
        }))
      );
      
      // 정규화된 데이터 통합
      const combinedData = Object.values(normalizedDatasets).flatMap(ds => ds.mapped_data);
      const analysisTypes = Object.values(normalizedDatasets).map(ds => ds.schema_type).join(', ');
      
      // 데이터 품질 체크
      const avgQuality = Object.values(normalizedDatasets).reduce((sum, ds) => 
        sum + ds.metadata.quality_score, 0
      ) / Object.keys(normalizedDatasets).length;
      
      if (avgQuality < 0.3) {
        toast({
          title: "데이터 품질 경고",
          description: `데이터 매핑 품질이 낮습니다 (${(avgQuality * 100).toFixed(0)}%). 분석 결과가 부정확할 수 있습니다.`,
          variant: "destructive",
        });
      }
      
      // 예상 시간 계산
      const estimatedSeconds = Math.ceil(combinedData.length / 10) + 30;
      setEstimatedTime(`약 ${estimatedSeconds}초`);

      const activeRelations = Object.entries(nodeRelations)
        .filter(([_, active]) => active)
        .map(([type]) => type);

      // 정규화된 메타데이터도 함께 전송
      const metadata = {
        datasets: Object.entries(normalizedDatasets).map(([key, ds]) => ({
          key,
          schema_type: ds.schema_type,
          record_count: ds.metadata.total_records,
          quality_score: ds.metadata.quality_score,
          column_mappings: ds.metadata.column_mappings,
        }))
      };

      // 스트리밍 요청
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-retail-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            data: combinedData,
            analysisType: analysisTypes,
            nodeRelations: activeRelations,
            stream: true,
            metadata, // 🆕 정규화 메타데이터 포함
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to start analysis');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'progress') {
              setAnalysisProgress(data.progress);
              setAnalysisStage(data.stage);
              setAnalysisMessage(data.message);
            } else if (data.type === 'result') {
              setAnalysisResult(data.analysis);
              toast({
                title: "분석 완료",
                description: `${data.analysis.nodes?.length || 0}개의 노드와 ${data.analysis.edges?.length || 0}개의 관계가 발견되었습니다.`,
              });
            } else if (data.type === 'error') {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "분석 실패",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStage('');
      setAnalysisMessage('');
      setEstimatedTime('');
    }
  };

  const getNodeColor = (nodeType: string) => {
    const colors: Record<string, string> = {
      Customer: "#3b82f6",
      Product: "#10b981",
      Brand: "#8b5cf6",
      Store: "#f59e0b",
      Zone: "#06b6d4",
      Path: "#ec4899",
      Transaction: "#14b8a6",
      Event: "#f97316",
    };
    return colors[nodeType] || "#6b7280";
  };

  const graphData = analysisResult ? {
    nodes: analysisResult.nodes?.map(node => ({
      id: node.id,
      name: node.label,
      type: node.type,
      color: getNodeColor(node.type),
      ...node
    })) || [],
    links: analysisResult.edges?.filter(edge => 
      nodeRelations[edge.type as keyof typeof nodeRelations]
    ).map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      value: edge.weight,
      ...edge
    })) || []
  } : { nodes: [], links: [] };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">그래프 네트워크 분석</h1>
          <p className="text-muted-foreground mt-2">
            LSTM-GNN 하이브리드 모델 기반 리테일 데이터 분석
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>분석 설정</CardTitle>
              <CardDescription>데이터 선택 및 관계 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>분석 데이터</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (selectedImportIds.length === imports.length) {
                        setSelectedImportIds([]);
                      } else {
                        setSelectedImportIds(imports.map(imp => imp.id));
                      }
                    }}
                  >
                    {selectedImportIds.length === imports.length ? "전체 해제" : "전체 선택"}
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                  {(() => {
                    // 파일별로 그룹화
                    const groupedImports = imports.reduce((acc, imp) => {
                      const key = imp.file_name;
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(imp);
                      return acc;
                    }, {} as Record<string, any[]>);

                    return Object.entries(groupedImports).map(([fileName, fileImports]: [string, any[]]) => (
                      <div key={fileName} className="space-y-1">
                        {fileImports.length > 1 && (
                          <div className="font-medium text-sm text-muted-foreground px-2 py-1 bg-muted/50 rounded">
                            {fileName}
                          </div>
                        )}
                        {fileImports.map((imp: any) => (
                          <div key={imp.id} className="flex items-center space-x-2 pl-2">
                            <input
                              type="checkbox"
                              id={`import-${imp.id}`}
                              checked={selectedImportIds.includes(imp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedImportIds([...selectedImportIds, imp.id]);
                                } else {
                                  setSelectedImportIds(selectedImportIds.filter(id => id !== imp.id));
                                }
                              }}
                              className="rounded border-input"
                            />
                            <Label 
                              htmlFor={`import-${imp.id}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {fileImports.length > 1 ? (
                                <>
                                  <Badge variant="outline" className="mr-2">{imp.sheet_name || '시트1'}</Badge>
                                  ({imp.data_type}, {imp.row_count.toLocaleString()}개)
                                </>
                              ) : (
                                <>
                                  {imp.file_name}
                                  {imp.sheet_name && <Badge variant="outline" className="ml-2">{imp.sheet_name}</Badge>}
                                  <span className="text-muted-foreground ml-1">({imp.data_type}, {imp.row_count.toLocaleString()}개)</span>
                                </>
                              )}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="space-y-3">
                <Label>노드 관계 활성화</Label>
                <div className="space-y-2">
                  {Object.entries(nodeRelations).map(([type, active]) => (
                    <div key={type} className="flex items-center justify-between">
                      <Label htmlFor={type} className="text-sm cursor-pointer">
                        {type}
                      </Label>
                      <Switch
                        id={type}
                        checked={active}
                        onCheckedChange={(checked) => 
                          setNodeRelations(prev => ({ ...prev, [type]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {isAnalyzing && (
                <div className="space-y-3 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{analysisMessage}</span>
                      <span className="font-medium">{analysisProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-300 ease-out"
                        style={{ width: `${analysisProgress}%` }}
                      />
                    </div>
                  </div>
                  {estimatedTime && (
                    <p className="text-xs text-muted-foreground text-center">
                      예상 소요 시간: {estimatedTime}
                    </p>
                  )}
                </div>
              )}

              <Button 
                onClick={handleAnalyze} 
                disabled={selectedImportIds.length === 0 || isAnalyzing}
                className="w-full"
              >
                <Network className="mr-2 h-4 w-4" />
                {isAnalyzing ? "분석 중..." : `분석 시작 (${selectedImportIds.length}개)`}
              </Button>
            </CardContent>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>네트워크 그래프</CardTitle>
                <CardDescription>온톨로지 기반 노드 관계 시각화</CardDescription>
              </CardHeader>
              <CardContent>
                {analysisResult && graphData.nodes.length > 0 ? (
                  <div className="h-[500px] bg-background rounded-lg border">
                    <ForceGraph2D
                      ref={graphRef}
                      graphData={graphData}
                      nodeLabel="name"
                      nodeColor="color"
                      linkDirectionalParticles={2}
                      linkDirectionalParticleWidth={2}
                      nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
                        const label = node.name;
                        const fontSize = 12/globalScale;
                        ctx.font = `${fontSize}px Sans-Serif`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillStyle = node.color;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.fillStyle = 'hsl(var(--foreground))';
                        ctx.fillText(label, node.x, node.y + 10);
                      }}
                      width={800}
                      height={500}
                    />
                  </div>
                ) : (
                  <div className="h-[500px] flex items-center justify-center border rounded-lg bg-muted/20">
                    <div className="text-center">
                      <Network className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        데이터를 선택하고 분석을 시작하세요
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {analysisResult && (
              <Tabs defaultValue="insights">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="insights">인사이트</TabsTrigger>
                  <TabsTrigger value="correlations">상관관계</TabsTrigger>
                  <TabsTrigger value="wtp">WTP 분석</TabsTrigger>
                </TabsList>

                <TabsContent value="insights" className="space-y-4">
                  {analysisResult.insights?.map((insight, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge variant={
                            insight.impact === 'high' ? 'destructive' :
                            insight.impact === 'medium' ? 'default' : 'secondary'
                          }>
                            {insight.impact} impact
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                        <div className="flex items-start gap-2 pt-2 border-t">
                          <TrendingUp className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <p className="text-sm font-medium">{insight.recommendation}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="correlations">
                  <Card>
                    <CardHeader>
                      <CardTitle>팩터 간 상관관계</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysisResult.correlations && analysisResult.correlations.length > 0 ? (
                        <div className="space-y-3">
                          {analysisResult.correlations.map((corr: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {corr.factor1} ↔ {corr.factor2}
                                </p>
                                <p className="text-xs text-muted-foreground">{corr.significance}</p>
                              </div>
                              <Badge variant="outline">
                                {(corr.correlation * 100).toFixed(1)}%
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">상관관계 데이터가 없습니다</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="wtp">
                  <Card>
                    <CardHeader>
                      <CardTitle>WTP (Willingness To Pay) 분석</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analysisResult.wtpAnalysis ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="p-4 border rounded-lg">
                              <p className="text-sm text-muted-foreground">평균 WTP</p>
                              <p className="text-2xl font-bold">{analysisResult.wtpAnalysis.avgWTP}</p>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <p className="text-sm text-muted-foreground">가격 탄력성</p>
                              <p className="text-2xl font-bold">{analysisResult.wtpAnalysis.priceElasticity}</p>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg bg-muted/20">
                            <div className="flex items-start gap-2">
                              <Zap className="h-4 w-4 text-primary mt-0.5" />
                              <div>
                                <p className="text-sm font-medium mb-2">권장사항</p>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {analysisResult.wtpAnalysis.recommendations?.map((rec: string, idx: number) => (
                                    <li key={idx}>• {rec}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">WTP 데이터가 없습니다</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GraphAnalysis;
