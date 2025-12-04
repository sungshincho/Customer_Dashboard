import { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Grid3x3, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Package, 
  Info,
  Brain,
  Network,
  History,
  BarChart3,
  Save,
} from 'lucide-react';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { toast } from 'sonner';
import { SharedDigitalTwinScene } from "@/features/simulation/components/digital-twin";
import { DemandForecastResult } from '../components/DemandForecastResult';
import { InventoryOptimizationResult } from '../components/InventoryOptimizationResult';
import { PricingOptimizationResult } from '../components/PricingOptimizationResult';
import { RecommendationStrategyResult } from '../components/RecommendationStrategyResult';
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useLocation } from "react-router-dom";

// v2 컴포넌트들
import { DataSourceMappingCard } from '../components/DataSourceMappingCard';
import { 
  AIModelSelector, 
  defaultScenarios, 
  defaultParameters,
  type SimulationScenario,
  type SimulationParameters,
  type SimulationScenarioConfig
} from '../components/AIModelSelector';
import { 
  SimulationResultCard, 
  SimulationResultGrid,
  type SimulationResultMeta
} from '../components/SimulationResultCard';

// Phase 2: 데이터 소스 매핑 Hook
import { useDataSourceMapping } from '../hooks/useDataSourceMapping';

// Phase 3: 온톨로지 강화 AI 추론 Hook
import { useEnhancedAIInference } from '../hooks/useEnhancedAIInference';

// Phase 4: 내보내기, 히스토리, 시각화
import { exportSimulationResult } from '../utils/simulationExporter';
import { useSimulationHistory } from '../hooks/useSimulationHistory';
import { OntologyInsightChart } from '../components/OntologyInsightChart';
import { SimulationHistoryPanel } from '../components/SimulationHistoryPanel';

/**
 * SimulationHubPage v2.3
 * 
 * Phase 4 업데이트:
 * - 실제 내보내기 기능 (CSV, PDF, JSON)
 * - 시뮬레이션 히스토리 저장 및 비교
 * - 온톨로지 인사이트 시각화 차트
 */
export default function SimulationHubPage() {
  const { selectedStore } = useSelectedStore();
  const { logActivity } = useActivityLogger();
  const location = useLocation();

  // Phase 2: 데이터 소스 매핑
  const {
    importedData,
    presetApis,
    customApis,
    mappingStatus,
    loading: dataSourcesLoading,
    refreshMapping,
    connectApi,
    disconnectApi,
    configurePresetApi,
    isAdmin,
    hasMinimumData,
  } = useDataSourceMapping();

  // Phase 3: 온톨로지 강화 AI 추론
  const {
    loading: isInferring,
    lastResult,
    ontologyContext,
    infer,
    inferWithOntology,
    loadOntologyContext,
  } = useEnhancedAIInference();

  // Phase 4: 히스토리
  const {
    history,
    saveToHistory,
  } = useSimulationHistory();

  // 상태
  const [useOntologyMode, setUseOntologyMode] = useState(true);
  const [ontologyLoaded, setOntologyLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'history' | 'insights'>('simulation');
  const [autoSave, setAutoSave] = useState(true);

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Simulation Hub v2.3',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  // 온톨로지 컨텍스트 자동 로드
  useEffect(() => {
    if (selectedStore?.id && useOntologyMode && !ontologyLoaded) {
      loadOntologyContext().then((context) => {
        if (context) {
          setOntologyLoaded(true);
          toast.success(`온톨로지: ${context.entities.total}개 엔티티, ${context.relations.total}개 관계`);
        }
      });
    }
  }, [selectedStore?.id, useOntologyMode, ontologyLoaded, loadOntologyContext]);

  useEffect(() => {
    setOntologyLoaded(false);
  }, [selectedStore?.id]);

  // AI 모델 선택 상태
  const [selectedScenarios, setSelectedScenarios] = useState<SimulationScenario[]>([
    'demand', 'inventory', 'pricing', 'layout', 'marketing'
  ]);
  const [parameters, setParameters] = useState<SimulationParameters>(defaultParameters);
  
  const scenarios: SimulationScenarioConfig[] = useMemo(() => {
    return defaultScenarios.map(scenario => ({
      ...scenario,
      enabled: hasMinimumData,
    }));
  }, [hasMinimumData]);

  // 시뮬레이션 결과 상태
  const [results, setResults] = useState<Record<SimulationScenario, any>>({
    demand: null, inventory: null, pricing: null, layout: null, marketing: null,
  });
  
  const [resultMeta, setResultMeta] = useState<Record<SimulationScenario, SimulationResultMeta>>({
    demand: { status: 'idle' }, inventory: { status: 'idle' }, pricing: { status: 'idle' },
    layout: { status: 'idle' }, marketing: { status: 'idle' },
  });

  const [loadingStates, setLoadingStates] = useState<Record<SimulationScenario, boolean>>({
    demand: false, inventory: false, pricing: false, layout: false, marketing: false,
  });

  // 핸들러
  const handleScenarioToggle = useCallback((scenario: SimulationScenario) => {
    setSelectedScenarios(prev => 
      prev.includes(scenario) ? prev.filter(s => s !== scenario) : [...prev, scenario]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedScenarios(scenarios.filter(s => s.enabled).map(s => s.id));
  }, [scenarios]);

  const handleDeselectAll = useCallback(() => {
    setSelectedScenarios([]);
  }, []);

  const handleParameterChange = useCallback((params: Partial<SimulationParameters>) => {
    setParameters(prev => ({ ...prev, ...params }));
  }, []);

  const buildStoreContext = useCallback(() => {
    return {
      storeInfo: selectedStore ? {
        id: selectedStore.id,
        name: selectedStore.store_name,
        code: selectedStore.store_code,
      } : null,
      products: { count: importedData.find(d => d.id === 'products')?.recordCount || 0 },
      inventory: { count: importedData.find(d => d.id === 'inventory')?.recordCount || 0 },
      mappingStatus,
    };
  }, [selectedStore, importedData, mappingStatus]);

  // 시뮬레이션 실행
  const runSimulation = useCallback(async (type: SimulationScenario) => {
    if (!selectedStore || !hasMinimumData) {
      toast.error('매장 데이터가 충분하지 않습니다');
      return;
    }

    const startTime = Date.now();
    setLoadingStates(prev => ({ ...prev, [type]: true }));
    setResultMeta(prev => ({ ...prev, [type]: { status: 'loading' } }));

    try {
      const storeContext = buildStoreContext();
      const inferFn = useOntologyMode ? inferWithOntology : infer;
      
      const result = await inferFn(type, {
        dataRange: parameters.dataRange,
        forecastPeriod: parameters.forecastPeriod,
        confidenceLevel: parameters.confidenceLevel,
        includeSeasonality: parameters.includeSeasonality,
        includeExternalFactors: parameters.includeExternalFactors,
      }, storeContext);
      
      if (result) {
        setResults(prev => ({ ...prev, [type]: result }));
        setResultMeta(prev => ({
          ...prev,
          [type]: {
            status: 'success',
            executedAt: new Date().toISOString(),
            processingTime: Date.now() - startTime,
            confidenceScore: result.confidenceScore || parameters.confidenceLevel,
          }
        }));
        
        if (autoSave) {
          await saveToHistory(type, parameters, result);
        }
        
        toast.success(`${getSimulationTitle(type)} 완료`);
      }
    } catch (error) {
      setResultMeta(prev => ({
        ...prev,
        [type]: { status: 'error', errorMessage: error instanceof Error ? error.message : '오류' }
      }));
      toast.error(`${getSimulationTitle(type)} 실패`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  }, [selectedStore, hasMinimumData, parameters, useOntologyMode, infer, inferWithOntology, buildStoreContext, autoSave, saveToHistory]);

  const runAllSimulations = useCallback(async () => {
    if (!selectedStore || !hasMinimumData || selectedScenarios.length === 0) {
      toast.error('시나리오를 선택하세요');
      return;
    }
    toast.info(`${selectedScenarios.length}개 시뮬레이션 시작...`);
    await Promise.all(selectedScenarios.map(type => runSimulation(type)));
    toast.success('모든 시뮬레이션 완료');
  }, [selectedStore, hasMinimumData, selectedScenarios, runSimulation]);

  // 내보내기
  const handleExport = useCallback(async (type: SimulationScenario, format: 'csv' | 'pdf' | 'json') => {
    const result = results[type];
    if (!result) { toast.error('결과 없음'); return; }
    await exportSimulationResult(type, result, format);
  }, [results]);

  // 수동 저장
  const handleManualSave = useCallback(async (type: SimulationScenario) => {
    const result = results[type];
    if (!result) { toast.error('저장할 결과 없음'); return; }
    await saveToHistory(type, parameters, result);
  }, [results, parameters, saveToHistory]);

  const getSimulationTitle = (type: string) => {
    const titles: Record<string, string> = {
      demand: '수요 예측', layout: '레이아웃 최적화', inventory: '재고 최적화',
      pricing: '가격 최적화', marketing: '마케팅 전략',
    };
    return titles[type] || type;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              시뮬레이션 허브
              {useOntologyMode && (
                <Badge variant="secondary" className="ml-2 gap-1">
                  <Network className="h-3 w-3" />
                  온톨로지
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              지식 그래프 기반 AI 추론으로 매장 운영 최적화
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoSave ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoSave(!autoSave)}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {autoSave ? '자동저장' : '수동저장'}
            </Button>
            <Button
              variant={useOntologyMode ? "default" : "outline"}
              size="sm"
              onClick={() => setUseOntologyMode(!useOntologyMode)}
              className="gap-1"
            >
              <Brain className="h-4 w-4" />
              온톨로지 {useOntologyMode ? 'ON' : 'OFF'}
            </Button>
            {isAdmin && (
              <Badge variant="outline" className="gap-1">
                <Info className="h-3 w-3" />
                관리자
              </Badge>
            )}
          </div>
        </div>

        {/* 탭 */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="simulation" className="gap-2">
              <Sparkles className="h-4 w-4" />
              시뮬레이션
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              히스토리
              {history.length > 0 && <Badge variant="secondary">{history.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              온톨로지 분석
            </TabsTrigger>
          </TabsList>

          {/* 시뮬레이션 탭 */}
          <TabsContent value="simulation" className="space-y-6 mt-6">
            {useOntologyMode && ontologyContext && (
              <Alert className="bg-primary/5 border-primary/20">
                <Network className="h-4 w-4" />
                <AlertDescription>
                  <strong>지식 그래프:</strong> {ontologyContext.entities.total}개 엔티티, {ontologyContext.relations.total}개 관계, {ontologyContext.patterns.frequentPairs.length}개 패턴
                </AlertDescription>
              </Alert>
            )}

            {!selectedStore && (
              <Alert>
                <AlertDescription>매장을 선택하면 AI가 데이터를 분석합니다.</AlertDescription>
              </Alert>
            )}

            <DataSourceMappingCard
              importedData={importedData}
              presetApis={presetApis}
              customApis={customApis}
              mappingStatus={mappingStatus}
              isAdmin={isAdmin}
              onRefresh={refreshMapping}
              onConnectApi={(apiId) => connectApi({ type: 'custom', name: apiId })}
              onDisconnectApi={disconnectApi}
              onConfigureApi={(apiId) => configurePresetApi(apiId, true)}
              isLoading={dataSourcesLoading}
            />

            <AIModelSelector
              scenarios={scenarios}
              selectedScenarios={selectedScenarios}
              parameters={parameters}
              onScenarioToggle={handleScenarioToggle}
              onSelectAll={handleSelectAll}
              onDeselectAll={handleDeselectAll}
              onParameterChange={handleParameterChange}
              onRunSimulation={runAllSimulations}
              isRunning={Object.values(loadingStates).some(v => v) || isInferring}
              disabled={!selectedStore || !hasMinimumData}
            />

            {/* 레이아웃 */}
            <SimulationResultCard
              type="layout" title="레이아웃 최적화" description="고객 동선 분석"
              icon={Grid3x3} color="cyan"
              isLoading={loadingStates.layout} hasResult={!!results.layout} meta={resultMeta.layout}
              onRefresh={() => runSimulation('layout')}
              onExport={(format) => handleExport('layout', format)}
              onSave={() => handleManualSave('layout')}
              fullWidth minHeight="400px"
            >
              {results.layout?.sceneRecipe && (
                <div className="h-[400px] rounded-lg border overflow-hidden">
                  <SharedDigitalTwinScene overlayType="layout" layoutSimulationData={results.layout.sceneRecipe} />
                </div>
              )}
              {results.layout?.ontologyBasedInsights && (
                <OntologyInsightChart insights={results.layout.ontologyBasedInsights} compact />
              )}
            </SimulationResultCard>

            {/* 4개 그리드 */}
            <SimulationResultGrid columns={2}>
              <SimulationResultCard
                type="demand" title="수요 예측" description={`${parameters.dataRange}일→${parameters.forecastPeriod}일`}
                icon={TrendingUp} color="blue"
                isLoading={loadingStates.demand} hasResult={!!results.demand} meta={resultMeta.demand}
                onRefresh={() => runSimulation('demand')}
                onExport={(format) => handleExport('demand', format)}
                onSave={() => handleManualSave('demand')}
              >
                {results.demand && (
                  <>
                    <DemandForecastResult 
                      forecastData={results.demand.demandForecast?.forecastData}
                      summary={results.demand.demandForecast?.summary}
                      demandDrivers={results.demand.demandDrivers}
                      topProducts={results.demand.topProducts}
                      recommendations={results.demand.recommendations}
                    />
                    {results.demand.ontologyBasedInsights && (
                      <OntologyInsightChart insights={results.demand.ontologyBasedInsights} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>

              <SimulationResultCard
                type="inventory" title="재고 최적화" description="최적 재고 수준"
                icon={Package} color="green"
                isLoading={loadingStates.inventory} hasResult={!!results.inventory} meta={resultMeta.inventory}
                onRefresh={() => runSimulation('inventory')}
                onExport={(format) => handleExport('inventory', format)}
                onSave={() => handleManualSave('inventory')}
              >
                {results.inventory && (
                  <>
                    <InventoryOptimizationResult 
                      recommendations={results.inventory.recommendations}
                      summary={results.inventory.summary}
                    />
                    {results.inventory.ontologyBasedInsights && (
                      <OntologyInsightChart insights={results.inventory.ontologyBasedInsights} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>

              <SimulationResultCard
                type="pricing" title="가격 최적화" description="최적 가격 전략"
                icon={DollarSign} color="yellow"
                isLoading={loadingStates.pricing} hasResult={!!results.pricing} meta={resultMeta.pricing}
                onRefresh={() => runSimulation('pricing')}
                onExport={(format) => handleExport('pricing', format)}
                onSave={() => handleManualSave('pricing')}
              >
                {results.pricing && (
                  <>
                    <PricingOptimizationResult 
                      recommendations={results.pricing.recommendations}
                      summary={results.pricing.summary}
                    />
                    {results.pricing.ontologyBasedStrategies && (
                      <OntologyInsightChart insights={results.pricing.ontologyBasedStrategies} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>

              <SimulationResultCard
                type="marketing" title="마케팅 전략" description="개인화 마케팅"
                icon={Target} color="purple"
                isLoading={loadingStates.marketing} hasResult={!!results.marketing} meta={resultMeta.marketing}
                onRefresh={() => runSimulation('marketing')}
                onExport={(format) => handleExport('marketing', format)}
                onSave={() => handleManualSave('marketing')}
              >
                {results.marketing && (
                  <>
                    <RecommendationStrategyResult 
                      strategies={results.marketing.strategies}
                      summary={results.marketing.summary}
                      performanceMetrics={results.marketing.performanceMetrics}
                    />
                    {results.marketing.ontologyBasedInsights && (
                      <OntologyInsightChart insights={results.marketing.ontologyBasedInsights} compact />
                    )}
                  </>
                )}
              </SimulationResultCard>
            </SimulationResultGrid>
          </TabsContent>

          {/* 히스토리 탭 */}
          <TabsContent value="history" className="mt-6">
            <SimulationHistoryPanel
              onSelectResult={(result) => toast.info('시뮬레이션 탭에서 확인하세요')}
            />
          </TabsContent>

          {/* 온톨로지 분석 탭 */}
          <TabsContent value="insights" className="mt-6">
            {ontologyContext ? (
              <OntologyInsightChart
                ontologyContext={ontologyContext}
                insights={lastResult?.ontologyBasedInsights}
              />
            ) : (
              <Alert>
                <Network className="h-4 w-4" />
                <AlertDescription>
                  온톨로지 모드를 활성화하고 매장을 선택하세요.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
