import { useEffect, useState, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Grid3x3, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Package, 
  Info,
  Brain,
  Network
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

/**
 * SimulationHubPage v2.2
 * 
 * Phase 3 업데이트:
 * - useEnhancedAIInference Hook 사용
 * - 온톨로지 컨텍스트 자동 로드
 * - 지식 그래프 기반 추론 강화
 * - 온톨로지 인사이트 표시
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
    error: inferError,
    lastResult,
    ontologyContext,
    infer,
    inferWithOntology,
    runOntologyInference,
    loadOntologyContext,
  } = useEnhancedAIInference();

  // 온톨로지 모드 상태
  const [useOntologyMode, setUseOntologyMode] = useState(true);
  const [ontologyLoaded, setOntologyLoaded] = useState(false);

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', { 
      page: location.pathname,
      page_name: 'Simulation Hub v2.2 (Ontology Enhanced)',
      timestamp: new Date().toISOString() 
    });
  }, [location.pathname]);

  // 온톨로지 컨텍스트 자동 로드
  useEffect(() => {
    if (selectedStore?.id && useOntologyMode && !ontologyLoaded) {
      loadOntologyContext().then((context) => {
        if (context) {
          setOntologyLoaded(true);
          toast.success(`온톨로지 컨텍스트 로드: ${context.entities.total}개 엔티티, ${context.relations.total}개 관계`);
        }
      });
    }
  }, [selectedStore?.id, useOntologyMode, ontologyLoaded, loadOntologyContext]);

  // 매장 변경 시 온톨로지 리셋
  useEffect(() => {
    setOntologyLoaded(false);
  }, [selectedStore?.id]);

  // ===== AI 모델 선택 상태 =====
  const [selectedScenarios, setSelectedScenarios] = useState<SimulationScenario[]>([
    'demand', 'inventory', 'pricing', 'layout', 'marketing'
  ]);
  const [parameters, setParameters] = useState<SimulationParameters>(defaultParameters);
  
  // 시나리오 설정
  const scenarios: SimulationScenarioConfig[] = useMemo(() => {
    return defaultScenarios.map(scenario => ({
      ...scenario,
      enabled: hasMinimumData,
    }));
  }, [hasMinimumData]);

  // ===== 시뮬레이션 결과 상태 =====
  const [results, setResults] = useState<Record<SimulationScenario, any>>({
    demand: null,
    inventory: null,
    pricing: null,
    layout: null,
    marketing: null,
  });
  
  const [resultMeta, setResultMeta] = useState<Record<SimulationScenario, SimulationResultMeta>>({
    demand: { status: 'idle' },
    inventory: { status: 'idle' },
    pricing: { status: 'idle' },
    layout: { status: 'idle' },
    marketing: { status: 'idle' },
  });

  const [loadingStates, setLoadingStates] = useState<Record<SimulationScenario, boolean>>({
    demand: false,
    inventory: false,
    pricing: false,
    layout: false,
    marketing: false,
  });

  // ===== 핸들러 =====
  const handleScenarioToggle = useCallback((scenario: SimulationScenario) => {
    setSelectedScenarios(prev => 
      prev.includes(scenario)
        ? prev.filter(s => s !== scenario)
        : [...prev, scenario]
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

  // 스토어 컨텍스트 생성
  const buildStoreContext = useCallback(() => {
    const productsSource = importedData.find(d => d.id === 'products');
    const inventorySource = importedData.find(d => d.id === 'inventory');
    const kpisSource = importedData.find(d => d.id === 'kpis');
    const entitiesSource = importedData.find(d => d.id === 'ontology_entities');

    return {
      storeInfo: selectedStore ? {
        id: selectedStore.id,
        name: selectedStore.store_name,
        code: selectedStore.store_code,
      } : null,
      products: { count: productsSource?.recordCount || 0 },
      inventory: { count: inventorySource?.recordCount || 0 },
      recentKpis: { count: kpisSource?.recordCount || 0 },
      entities: { count: entitiesSource?.recordCount || 0 },
      mappingStatus,
    };
  }, [selectedStore, importedData, mappingStatus]);

  // 단일 시뮬레이션 실행 (온톨로지 모드 지원)
  const runSimulation = useCallback(async (type: SimulationScenario) => {
    if (!selectedStore || !hasMinimumData) {
      toast.error('매장 데이터가 충분하지 않습니다');
      return;
    }

    const startTime = Date.now();
    setLoadingStates(prev => ({ ...prev, [type]: true }));
    setResultMeta(prev => ({ 
      ...prev, 
      [type]: { status: 'loading' } 
    }));

    try {
      const storeContext = buildStoreContext();
      
      // Phase 3: 온톨로지 모드에 따라 다른 함수 호출
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
            dataPointsAnalyzed: mappingStatus.totalEntities + (ontologyContext?.relations.total || 0),
            confidenceScore: result.confidenceScore || parameters.confidenceLevel,
          }
        }));
        
        logActivity('feature_use', {
          feature: 'simulation_run',
          simulation_type: type,
          store_id: selectedStore.id,
          store_name: selectedStore.store_name,
          ontology_mode: useOntologyMode,
          ontology_entities: ontologyContext?.entities.total || 0,
          ontology_relations: ontologyContext?.relations.total || 0,
          parameters,
          mapping_health: mappingStatus.healthScore,
          timestamp: new Date().toISOString()
        });
        
        const modeLabel = useOntologyMode ? '(온톨로지 강화) ' : '';
        toast.success(`${modeLabel}${getSimulationTitle(type)} 완료`);
      }
    } catch (error) {
      console.error(`${type} simulation error:`, error);
      setResultMeta(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
        }
      }));
      toast.error(`${getSimulationTitle(type)} 실패`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [type]: false }));
    }
  }, [
    selectedStore, 
    hasMinimumData, 
    parameters, 
    useOntologyMode, 
    infer, 
    inferWithOntology, 
    buildStoreContext, 
    mappingStatus, 
    ontologyContext, 
    logActivity
  ]);

  // 선택된 시뮬레이션 전체 실행
  const runAllSimulations = useCallback(async () => {
    if (!selectedStore || !hasMinimumData) {
      toast.error('매장을 선택하고 데이터를 확인하세요');
      return;
    }

    if (selectedScenarios.length === 0) {
      toast.error('최소 1개 이상의 시나리오를 선택하세요');
      return;
    }

    const modeLabel = useOntologyMode ? '온톨로지 강화 ' : '';
    toast.info(`${modeLabel}${selectedScenarios.length}개 시뮬레이션을 시작합니다...`);
    
    await Promise.all(
      selectedScenarios.map(type => runSimulation(type))
    );

    toast.success('모든 시뮬레이션이 완료되었습니다');
  }, [selectedStore, hasMinimumData, selectedScenarios, runSimulation, useOntologyMode]);

  // 온톨로지 전용 분석 실행
  const runOntologyAnalysis = useCallback(async (
    type: 'recommendation' | 'anomaly_detection' | 'pattern_analysis'
  ) => {
    if (!selectedStore) {
      toast.error('매장을 선택해주세요');
      return;
    }

    const result = await runOntologyInference(type);
    if (result) {
      console.log('Ontology analysis result:', result);
      // 결과 처리 로직 추가 가능
    }
  }, [selectedStore, runOntologyInference]);

  // 내보내기 핸들러
  const handleExport = useCallback((type: SimulationScenario, format: 'csv' | 'pdf' | 'json') => {
    const result = results[type];
    if (!result) return;

    toast.info(`${getSimulationTitle(type)} 결과를 ${format.toUpperCase()}로 내보내는 중...`);
    
    logActivity('feature_use', {
      feature: 'simulation_export',
      simulation_type: type,
      format,
      ontology_enhanced: result.ontologyEnhanced || false,
      timestamp: new Date().toISOString()
    });
  }, [results, logActivity]);

  const getSimulationTitle = (type: string) => {
    const titles: Record<string, string> = {
      demand: '수요 예측',
      layout: '레이아웃 최적화',
      inventory: '재고 최적화',
      pricing: '가격 최적화',
      marketing: '마케팅 전략',
    };
    return titles[type] || type;
  };

  // ===== 렌더링 =====
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
                  온톨로지 강화
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2">
              {useOntologyMode 
                ? '지식 그래프 기반 AI 추론으로 매장 운영을 최적화하세요'
                : '온톨로지 기반 AI 추론으로 매장 운영을 최적화하세요'
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 온톨로지 모드 토글 */}
            <Button
              variant={useOntologyMode ? "default" : "outline"}
              size="sm"
              onClick={() => setUseOntologyMode(!useOntologyMode)}
              className="gap-1"
            >
              <Brain className="h-4 w-4" />
              {useOntologyMode ? '온톨로지 ON' : '온톨로지 OFF'}
            </Button>
            {isAdmin && (
              <Badge variant="outline" className="gap-1">
                <Info className="h-3 w-3" />
                관리자 모드
              </Badge>
            )}
          </div>
        </div>

        {/* 온톨로지 컨텍스트 상태 표시 */}
        {useOntologyMode && ontologyContext && (
          <Alert className="bg-primary/5 border-primary/20">
            <Network className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                <strong>지식 그래프 활성화:</strong>{' '}
                {ontologyContext.entities.total}개 엔티티, {ontologyContext.relations.total}개 관계, {' '}
                {ontologyContext.patterns.frequentPairs.length}개 패턴 발견
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadOntologyContext()}
              >
                새로고침
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 매장 미선택 경고 */}
        {!selectedStore && (
          <Alert>
            <AlertDescription>
              매장을 선택하면 AI가 자동으로 데이터를 분석하여 최적화 방안을 제안합니다.
            </AlertDescription>
          </Alert>
        )}

        {/* 1. 데이터 소스 & 온톨로지 매핑 */}
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

        {/* 2. AI 모델 선택 */}
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

        {/* 3. 레이아웃 최적화 (전체 너비) */}
        <SimulationResultCard
          type="layout"
          title="레이아웃 최적화"
          description="고객 동선 분석을 통한 매장 공간 배치 최적화 제안"
          icon={Grid3x3}
          color="cyan"
          isLoading={loadingStates.layout}
          hasResult={!!results.layout}
          meta={resultMeta.layout}
          onRefresh={() => runSimulation('layout')}
          onExport={(format) => handleExport('layout', format)}
          fullWidth
          minHeight="400px"
        >
          {results.layout?.sceneRecipe && (
            <div className="h-[400px] rounded-lg border bg-muted/20 overflow-hidden">
              <SharedDigitalTwinScene
                overlayType="layout"
                layoutSimulationData={results.layout.sceneRecipe}
              />
            </div>
          )}
          {/* 온톨로지 인사이트 표시 */}
          {results.layout?.ontologyBasedInsights && (
            <div className="mt-4 p-3 bg-primary/5 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Network className="h-4 w-4 text-primary" />
                온톨로지 기반 인사이트
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                {Object.entries(results.layout.ontologyBasedInsights).map(([key, value]) => (
                  <li key={key}>• {String(value)}</li>
                ))}
              </ul>
            </div>
          )}
        </SimulationResultCard>

        {/* 4. 나머지 4개 시뮬레이션 - 2x2 그리드 */}
        <SimulationResultGrid columns={2}>
          {/* 수요 예측 */}
          <SimulationResultCard
            type="demand"
            title="향후 수요 예측"
            description={`과거 ${parameters.dataRange}일 데이터로 향후 ${parameters.forecastPeriod}일 수요 예측`}
            icon={TrendingUp}
            color="blue"
            isLoading={loadingStates.demand}
            hasResult={!!results.demand}
            meta={resultMeta.demand}
            onRefresh={() => runSimulation('demand')}
            onExport={(format) => handleExport('demand', format)}
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
                  <OntologyInsightBadge insights={results.demand.ontologyBasedInsights} />
                )}
              </>
            )}
          </SimulationResultCard>

          {/* 재고 최적화 */}
          <SimulationResultCard
            type="inventory"
            title="재고 최적화"
            description="현재 재고 분석 및 최적 재고 수준·발주 시점 제안"
            icon={Package}
            color="green"
            isLoading={loadingStates.inventory}
            hasResult={!!results.inventory}
            meta={resultMeta.inventory}
            onRefresh={() => runSimulation('inventory')}
            onExport={(format) => handleExport('inventory', format)}
          >
            {results.inventory && (
              <>
                <InventoryOptimizationResult 
                  recommendations={results.inventory.recommendations}
                  summary={results.inventory.summary}
                />
                {results.inventory.ontologyBasedInsights && (
                  <OntologyInsightBadge insights={results.inventory.ontologyBasedInsights} />
                )}
              </>
            )}
          </SimulationResultCard>

          {/* 가격 최적화 */}
          <SimulationResultCard
            type="pricing"
            title="가격 최적화"
            description="가격 탄력성 분석을 통한 최적 가격 전략 제안"
            icon={DollarSign}
            color="yellow"
            isLoading={loadingStates.pricing}
            hasResult={!!results.pricing}
            meta={resultMeta.pricing}
            onRefresh={() => runSimulation('pricing')}
            onExport={(format) => handleExport('pricing', format)}
          >
            {results.pricing && (
              <>
                <PricingOptimizationResult 
                  recommendations={results.pricing.recommendations}
                  summary={results.pricing.summary}
                />
                {results.pricing.ontologyBasedStrategies && (
                  <OntologyInsightBadge insights={results.pricing.ontologyBasedStrategies} />
                )}
              </>
            )}
          </SimulationResultCard>

          {/* 마케팅 전략 */}
          <SimulationResultCard
            type="marketing"
            title="추천 마케팅·프로모션 전략"
            description="고객 세그먼트 분석 기반 개인화 마케팅 전략 제안"
            icon={Target}
            color="purple"
            isLoading={loadingStates.marketing}
            hasResult={!!results.marketing}
            meta={resultMeta.marketing}
            onRefresh={() => runSimulation('marketing')}
            onExport={(format) => handleExport('marketing', format)}
          >
            {results.marketing && (
              <>
                <RecommendationStrategyResult 
                  strategies={results.marketing.strategies}
                  summary={results.marketing.summary}
                  performanceMetrics={results.marketing.performanceMetrics}
                />
                {results.marketing.ontologyBasedInsights && (
                  <OntologyInsightBadge insights={results.marketing.ontologyBasedInsights} />
                )}
              </>
            )}
          </SimulationResultCard>
        </SimulationResultGrid>
      </div>
    </DashboardLayout>
  );
}

/**
 * 온톨로지 인사이트 배지 컴포넌트
 */
function OntologyInsightBadge({ insights }: { insights: Record<string, any> }) {
  const entries = Object.entries(insights).slice(0, 3);
  
  if (entries.length === 0) return null;
  
  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-primary/5 to-transparent rounded-lg border border-primary/10">
      <div className="flex items-center gap-2 text-xs font-medium text-primary mb-2">
        <Network className="h-3 w-3" />
        지식 그래프 인사이트
      </div>
      <ul className="text-xs text-muted-foreground space-y-1">
        {entries.map(([key, value]) => (
          <li key={key} className="flex items-start gap-1">
            <span className="text-primary">•</span>
            <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
