/**
 * DigitalTwinStudioPage.tsx
 *
 * 디지털트윈 스튜디오 - 통합 3D 편집 + 시뮬레이션 + 분석
 * 드래그 가능 패널 시스템 + 시뮬레이션 결과 패널
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Sparkles, Layers, Save, Play, GitCompare } from 'lucide-react';
import { toast } from 'sonner';

// 새 스튜디오 컴포넌트
import { Canvas3D, SceneProvider, useScene } from './core';
import { LayerPanel, SimulationPanel, ToolPanel, SceneSavePanel, OverlayControlPanel, PropertyPanel } from './panels';
import { HeatmapOverlay, CustomerFlowOverlay, ZoneBoundaryOverlay, CustomerAvatarOverlay, LayoutOptimizationOverlay, FlowOptimizationOverlay, CongestionOverlay, StaffingOverlay } from './overlays';
import { DraggablePanel } from './components/DraggablePanel';
import { AIOptimizationTab } from './tabs/AIOptimizationTab';
import { AISimulationTab } from './tabs/AISimulationTab';
import {
  LayoutResultPanel,
  FlowResultPanel,
  CongestionResultPanel,
  StaffingResultPanel,
  type LayoutResult,
  type FlowResult,
  type CongestionResult,
  type StaffingResult,
} from './panels/results';
import { useStudioMode, useOverlayVisibility, useScenePersistence, useSceneSimulation } from './hooks';
import { loadUserModels } from './utils';
import type { StudioMode, Model3D, OverlayType, HeatPoint, FlowVector, ZoneBoundary, CustomerAvatar, SceneRecipe, LightingPreset, Vector3, SimulationScenario, TransformMode } from './types';

// 기존 시뮬레이션 훅
import { useStoreContext } from '@/features/simulation/hooks/useStoreContext';
import { useEnhancedAIInference } from '@/features/simulation/hooks/useEnhancedAIInference';
import { useDateFilterStore } from '@/store/dateFilterStore';

// 타입 변환 헬퍼
interface ModelLayer {
  id: string;
  name: string;
  type: 'space' | 'furniture' | 'product' | 'custom';
  model_url: string;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  dimensions?: { width: number; height: number; depth: number };
  metadata?: Record<string, any>;
}

type TabType = 'layer' | 'ai-optimization' | 'ai-simulation';

// 시뮬레이션 결과 상태 타입
interface SimulationResults {
  layout: LayoutResult | null;
  flow: FlowResult | null;
  congestion: CongestionResult | null;
  staffing: StaffingResult | null;
}

// 패널 표시 상태 타입
interface VisiblePanels {
  tools: boolean;
  overlay: boolean;
  sceneSave: boolean;
  property: boolean;
  layoutResult: boolean;
  flowResult: boolean;
  congestionResult: boolean;
  staffingResult: boolean;
}

// ============================================================================
// 메인 페이지 컴포넌트
// ============================================================================
export default function DigitalTwinStudioPage() {
  const { user } = useAuth();
  const { logActivity } = useActivityLogger();
  const location = useLocation();
  const { selectedStore } = useSelectedStore();
  const { getDays } = useDateFilterStore();

  // 모드 관리
  const { mode, setMode, isEditMode } = useStudioMode({ initialMode: 'view' });

  // 오버레이 관리
  const { activeOverlays, toggleOverlay, isActive } = useOverlayVisibility();

  // 씬 저장 관리
  const { scenes, activeScene, isSaving, saveScene, deleteScene, setActiveScene } =
    useScenePersistence({ userId: user?.id, storeId: selectedStore?.id });

  // 씬 기반 시뮬레이션 (As-is → To-be)
  const sceneSimulation = useSceneSimulation();

  // UI 상태
  const [activeTab, setActiveTab] = useState<TabType>('layer');
  const [models, setModels] = useState<ModelLayer[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sceneName, setSceneName] = useState('');
  const [transformMode, setTransformMode] = useState<TransformMode>('translate');

  // 드래그 패널 표시 상태 (모든 패널 기본 표시)
  const [visiblePanels, setVisiblePanels] = useState<VisiblePanels>({
    tools: true,
    overlay: true,
    sceneSave: true,
    property: true,
    layoutResult: true,
    flowResult: true,
    congestionResult: true,
    staffingResult: true,
  });

  // 시뮬레이션 결과 상태
  const [simulationResults, setSimulationResults] = useState<SimulationResults>({
    layout: null,
    flow: null,
    congestion: null,
    staffing: null,
  });

  // 시뮬레이션 데이터
  const days = getDays();
  const { contextData, loading: contextLoading } = useStoreContext(selectedStore?.id, days);
  const { loading: isInferring } = useEnhancedAIInference();

  // 페이지 방문 로깅
  useEffect(() => {
    logActivity('page_view', {
      page: location.pathname,
      page_name: 'Digital Twin Studio (New)',
      mode,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname, mode]);

  // 모델 로드
  const loadModelsAsync = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const loadedModels = await loadUserModels(user.id, selectedStore?.id);
      setModels(loadedModels);
      if (loadedModels.length > 0) {
        setActiveLayers(loadedModels.map((m) => m.id));
      }
    } catch (error) {
      toast.error('모델 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModelsAsync();
  }, [user, selectedStore]);

  // 패널 닫기 핸들러
  const closePanel = useCallback((panelId: keyof VisiblePanels) => {
    setVisiblePanels((prev) => ({ ...prev, [panelId]: false }));
  }, []);

  // 시뮬레이션 완료 핸들러
  const handleSimulationComplete = useCallback((type: keyof SimulationResults, result: LayoutResult | FlowResult | CongestionResult | StaffingResult) => {
    setSimulationResults((prev) => ({ ...prev, [type]: result }));
    const panelKey = `${type}Result` as keyof VisiblePanels;
    setVisiblePanels((prev) => ({ ...prev, [panelKey]: true }));
  }, []);

  // 시뮬레이션 실행 핸들러
  const handleRunSimulation = useCallback((scenarios: SimulationScenario[]) => {
    toast.info(`시뮬레이션 실행: ${scenarios.join(', ')}`);

    // 각 시나리오별 Mock 결과 생성 (실제 구현시 API 연동)
    scenarios.forEach((scenario) => {
      setTimeout(() => {
        switch (scenario) {
          case 'layout':
            handleSimulationComplete('layout', {
              currentEfficiency: 72,
              optimizedEfficiency: 89,
              revenueIncrease: 2400000,
              dwellTimeIncrease: 8,
              conversionIncrease: 3.2,
              changes: [
                { item: '메인 테이블', from: 'A존 중앙', to: 'B존 입구', effect: '+15% 노출' },
                { item: '디스플레이', from: '벽면', to: '동선 교차점', effect: '+23% 체류' },
              ],
            });
            break;
          case 'flow':
            handleSimulationComplete('flow', {
              currentPathLength: 45,
              optimizedPathLength: 38,
              bottlenecks: [
                { location: '입구 → A존', congestion: 78, cause: '통로 폭 부족', suggestion: '진열대 이동' },
                { location: 'B존 중앙', congestion: 65, cause: '고객 체류', suggestion: '휴식 공간 추가' },
              ],
              improvements: [
                { metric: '평균 이동 시간', value: '-18%' },
                { metric: '병목 해소율', value: '85%' },
                { metric: '고객 만족도', value: '+12%' },
              ],
            });
            break;
          case 'congestion':
            handleSimulationComplete('congestion', {
              date: '2024-12-15 (일)',
              peakHours: '14:00 - 16:00',
              peakCongestion: 85,
              maxCapacity: 50,
              hourlyData: [
                { hour: '10:00', congestion: 25 },
                { hour: '12:00', congestion: 55 },
                { hour: '14:00', congestion: 85 },
                { hour: '16:00', congestion: 70 },
                { hour: '18:00', congestion: 45 },
                { hour: '20:00', congestion: 30 },
              ],
              zoneData: [
                { zone: '입구', congestion: 45 },
                { zone: 'A존', congestion: 85 },
                { zone: 'B존', congestion: 60 },
                { zone: '계산대', congestion: 75 },
              ],
              recommendations: [
                '14-16시 추가 인력 배치',
                'A존 진열대 간격 확대',
                '계산대 운영 효율화',
              ],
            });
            break;
          case 'staffing':
            handleSimulationComplete('staffing', {
              currentCoverage: 68,
              optimizedCoverage: 92,
              staffCount: 3,
              staffPositions: [
                { name: '직원 A', current: '입구', suggested: 'A존 중앙', coverageGain: '+12%' },
                { name: '직원 B', current: 'B존', suggested: 'A-B존 경계', coverageGain: '+8%' },
                { name: '직원 C', current: '계산대', suggested: '계산대', coverageGain: '유지' },
              ],
              improvements: [
                { metric: '고객 응대율', value: '+35%' },
                { metric: '대기 시간', value: '-25%' },
                { metric: '매출 효과', value: '+₩150만/월' },
              ],
            });
            break;
        }
      }, 1000 + Math.random() * 1000);
    });
  }, [handleSimulationComplete]);

  // SceneRecipe 생성 (handleRunAllSimulations보다 먼저 정의되어야 함)
  // SceneRecipe 생성 (handleRunAllSimulations에서 사용하므로 먼저 정의)
  const currentRecipe = useMemo<SceneRecipe | null>(() => {
    const activeModels = models.filter((m) => activeLayers.includes(m.id));
    if (activeModels.length === 0) return null;

    const spaceModel = activeModels.find((m) => m.type === 'space');
    if (!spaceModel) return null;

    const lightingPreset: LightingPreset = {
      name: 'warm-retail',
      description: 'Default',
      lights: [
        { type: 'ambient', color: '#ffffff', intensity: 0.5 },
        { type: 'directional', color: '#ffffff', intensity: 1, position: { x: 10, y: 10, z: 5 } },
      ],
    };

    return {
      space: {
        id: spaceModel.id,
        model_url: spaceModel.model_url,
        type: 'space',
        position: spaceModel.position || { x: 0, y: 0, z: 0 },
        rotation: spaceModel.rotation || { x: 0, y: 0, z: 0 },
        scale: spaceModel.scale || { x: 1, y: 1, z: 1 },
        dimensions: spaceModel.dimensions,
        metadata: spaceModel.metadata,
      },
      furniture: activeModels
        .filter((m) => m.type === 'furniture')
        .map((m) => ({
          id: m.id,
          model_url: m.model_url,
          type: 'furniture' as const,
          furniture_type: m.name,
          position: m.position || { x: 0, y: 0, z: 0 },
          rotation: m.rotation || { x: 0, y: 0, z: 0 },
          scale: m.scale || { x: 1, y: 1, z: 1 },
          dimensions: m.dimensions,
          movable: true,
          metadata: m.metadata,
        })),
      products: activeModels
        .filter((m) => m.type === 'product')
        .map((m) => ({
          id: m.id,
          model_url: m.model_url,
          type: 'product' as const,
          product_id: m.metadata?.entityId,
          sku: m.name,
          position: m.position || { x: 0, y: 0, z: 0 },
          rotation: m.rotation || { x: 0, y: 0, z: 0 },
          scale: m.scale || { x: 1, y: 1, z: 1 },
          dimensions: m.dimensions,
          movable: true,
          metadata: m.metadata,
        })),
      lighting: lightingPreset,
      camera: { position: { x: 10, y: 10, z: 15 }, target: { x: 0, y: 0, z: 0 }, fov: 50 },
    };
  }, [models, activeLayers]);

  // 전체 시뮬레이션 실행 (씬 기반 + 레거시 UI 결과)
  const handleRunAllSimulations = useCallback(async () => {
    setMode('simulate');

    // 레거시 UI 결과 패널용 (데모 데이터)
    handleRunSimulation(['layout', 'flow', 'congestion', 'staffing']);

    // 씬 기반 시뮬레이션도 함께 실행 (실제 모델 이동용)
    // currentRecipe를 직접 전달하여 state 동기화 문제 해결
    if (currentRecipe) {
      await sceneSimulation.runAllSimulations(
        {
          layout: { goal: 'revenue' },
          flow: { duration: '1hour', customerCount: 100 },
          staffing: { staffCount: 3, goal: 'customer_service' },
        },
        currentRecipe  // 씬 직접 전달
      );
    }
  }, [setMode, handleRunSimulation, currentRecipe, sceneSimulation]);

  // SceneProvider용 모델 변환
  const sceneModels: Model3D[] = useMemo(() => {
    return models
      .filter((m) => activeLayers.includes(m.id))
      .map((m) => ({
        id: m.id,
        name: m.name,
        url: m.model_url,
        position: [m.position?.x || 0, m.position?.y || 0, m.position?.z || 0] as [number, number, number],
        rotation: [m.rotation?.x || 0, m.rotation?.y || 0, m.rotation?.z || 0] as [number, number, number],
        scale: [m.scale?.x || 1, m.scale?.y || 1, m.scale?.z || 1] as [number, number, number],
        visible: true,
        type: m.type,
        metadata: m.metadata,
        dimensions: m.dimensions,
      }));
  }, [models, activeLayers]);


  // As-is → To-be 씬 기반 시뮬레이션 실행
  const handleRunSceneSimulation = useCallback(async () => {
    if (!currentRecipe) {
      toast.error('씬을 먼저 구성해주세요');
      return;
    }

    // 씬 직접 전달하여 시뮬레이션 실행
    await sceneSimulation.runAllSimulations(
      {
        layout: { goal: 'revenue' },
        flow: { duration: '1hour', customerCount: 100 },
        staffing: { staffCount: 3, goal: 'customer_service' },
      },
      currentRecipe
    );

    // AI 시뮬레이션 탭으로 전환
    setActiveTab('ai-simulation');
    setMode('simulate');
  }, [currentRecipe, sceneSimulation, setMode]);

  // 데모 오버레이 데이터
  const demoHeatPoints: HeatPoint[] = useMemo(
    () => [
      { x: 0, y: 0, z: 0, intensity: 0.8 },
      { x: 3, y: 0, z: 2, intensity: 0.6 },
      { x: -2, y: 0, z: 3, intensity: 0.9 },
      { x: 4, y: 0, z: -2, intensity: 0.4 },
    ],
    []
  );

  const demoFlows: FlowVector[] = useMemo(
    () => [
      { start: [-5, 0.5, 0], end: [0, 0.5, 0], magnitude: 0.8 },
      { start: [0, 0.5, 0], end: [3, 0.5, 3], magnitude: 0.6 },
      { start: [3, 0.5, 3], end: [5, 0.5, 0], magnitude: 0.4 },
    ],
    []
  );

  const demoZones: ZoneBoundary[] = useMemo(
    () => [
      {
        id: 'zone-1',
        name: '입구',
        points: [
          [-6, 0, -3],
          [-6, 0, 3],
          [-3, 0, 3],
          [-3, 0, -3],
        ],
        color: '#3b82f6',
      },
      {
        id: 'zone-2',
        name: '디스플레이',
        points: [
          [-3, 0, -3],
          [-3, 0, 3],
          [3, 0, 3],
          [3, 0, -3],
        ],
        color: '#22c55e',
      },
      {
        id: 'zone-3',
        name: '계산대',
        points: [
          [3, 0, -3],
          [3, 0, 3],
          [6, 0, 3],
          [6, 0, -3],
        ],
        color: '#f59e0b',
      },
    ],
    []
  );

  const demoCustomers: CustomerAvatar[] = useMemo(
    () => [
      { id: 'c1', position: [-4, 0, 1], status: 'browsing' },
      { id: 'c2', position: [1, 0, 2], status: 'purchasing' },
      { id: 'c3', position: [4, 0, -1], status: 'leaving' },
    ],
    []
  );

  // ZoneBoundary → SimulationZone 변환 (시뮬레이션 엔진용)
  const simulationZones = useMemo(() => {
    return demoZones.map((zone) => {
      // points 배열에서 x, z 범위 계산
      const xValues = zone.points.map((p) => p[0]);
      const zValues = zone.points.map((p) => p[2]);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const minZ = Math.min(...zValues);
      const maxZ = Math.max(...zValues);

      // 중심점과 크기 계산
      const centerX = (minX + maxX) / 2;
      const centerZ = (minZ + maxZ) / 2;
      const width = maxX - minX;
      const depth = maxZ - minZ;

      // zone_type 추론 (이름 기반)
      let zone_type = 'display';
      const nameLower = zone.name.toLowerCase();
      if (nameLower.includes('입구') || nameLower.includes('entry') || nameLower.includes('entrance')) {
        zone_type = 'entrance';
      } else if (nameLower.includes('출구') || nameLower.includes('exit')) {
        zone_type = 'exit';
      } else if (nameLower.includes('계산') || nameLower.includes('checkout') || nameLower.includes('register')) {
        zone_type = 'checkout';
      } else if (nameLower.includes('피팅') || nameLower.includes('fitting')) {
        zone_type = 'fitting';
      }

      return {
        id: zone.id,
        zone_name: zone.name,
        x: centerX,
        z: centerZ,
        width,
        depth,
        zone_type,
      };
    });
  }, [demoZones]);

  // 씬 저장 핸들러
  const handleSaveScene = async (name: string) => {
    if (!currentRecipe) return;
    try {
      await saveScene(currentRecipe, name, activeScene?.id);
      setSceneName(name);
      logActivity('feature_use', {
        feature: 'scene_save',
        scene_name: name,
        layer_count: activeLayers.length,
        store_id: selectedStore?.id,
      });
    } catch (err) {
      // 에러는 useScenePersistence에서 처리
    }
  };

  if (!selectedStore) {
    return (
      <DashboardLayout>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>매장을 선택해주세요</AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SceneProvider mode={mode} initialModels={sceneModels}>
        <div className="relative w-full h-[calc(100vh-120px)] overflow-hidden bg-black rounded-lg">
          {/* ========== 3D 캔버스 (배경) ========== */}
          <div className="absolute inset-0 z-0">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : (
              <Canvas3D
                mode={mode}
                transformMode={transformMode}
                enableControls={true}
                enableSelection={isEditMode}
                enableTransform={isEditMode}
                showGrid={isEditMode}
                zones={simulationZones}
              >
                {/* 기본 오버레이 (데모 데이터) */}
                {isActive('heatmap') && !sceneSimulation.state.results.layout && <HeatmapOverlay heatPoints={demoHeatPoints} />}
                {isActive('flow') && !sceneSimulation.state.results.flow && <CustomerFlowOverlay flows={demoFlows} />}
                {isActive('zone') && <ZoneBoundaryOverlay zones={demoZones} />}
                {isActive('avatar') && !sceneSimulation.state.results.staffing && <CustomerAvatarOverlay customers={demoCustomers} />}

                {/* 시뮬레이션 결과 오버레이 */}
                {sceneSimulation.state.results.layout && (
                  <LayoutOptimizationOverlay
                    result={sceneSimulation.state.results.layout as any}
                    showBefore={false}
                    showAfter={true}
                    showMoves={true}
                    showZoneHighlights={true}
                  />
                )}
                {sceneSimulation.state.results.flow && (
                  <FlowOptimizationOverlay
                    result={sceneSimulation.state.results.flow as any}
                    showPaths={true}
                    showBottlenecks={true}
                    showHeatmap={true}
                    animatePaths={true}
                  />
                )}
                {sceneSimulation.state.results.congestion && (
                  <CongestionOverlay
                    result={sceneSimulation.state.results.congestion as any}
                    showHeatmap={true}
                    showZoneMarkers={true}
                    showCrowdAnimation={true}
                    animateTimeProgress={false}
                  />
                )}
                {sceneSimulation.state.results.staffing && (
                  <StaffingOverlay
                    result={sceneSimulation.state.results.staffing as any}
                    showStaffMarkers={true}
                    showCurrentPositions={true}
                    showSuggestedPositions={true}
                    showCoverageZones={true}
                    showMovementPaths={true}
                    animateMovement={true}
                  />
                )}
              </Canvas3D>
            )}
          </div>

          {/* ========== UI 오버레이 ========== */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {/* ----- 왼쪽 패널 (고정) ----- */}
            <div className="absolute left-4 top-4 bottom-4 w-80 pointer-events-auto">
              <div className="h-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
                {/* 탭 헤더 */}
                <div className="flex border-b border-white/10">
                  <TabButton active={activeTab === 'layer'} onClick={() => setActiveTab('layer')}>
                    <Layers className="w-3 h-3 mr-1 inline" />
                    레이어
                  </TabButton>
                  <TabButton
                    active={activeTab === 'ai-optimization'}
                    onClick={() => setActiveTab('ai-optimization')}
                  >
                    <Sparkles className="w-3 h-3 mr-1 inline" />
                    AI 최적화
                  </TabButton>
                  <TabButton
                    active={activeTab === 'ai-simulation'}
                    onClick={() => setActiveTab('ai-simulation')}
                  >
                    <Play className="w-3 h-3 mr-1 inline" />
                    AI 시뮬레이션
                  </TabButton>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="flex-1 overflow-y-auto">
                  {activeTab === 'layer' && <LayerPanel />}
                  {activeTab === 'ai-optimization' && (
                    <AIOptimizationTab
                      storeId={selectedStore?.id || ''}
                      sceneData={currentRecipe}
                      sceneSimulation={sceneSimulation}
                      onSceneUpdate={(newScene) => {
                        // SceneProvider에 시뮬레이션 결과 적용
                        if (newScene.furnitureMoves) {
                          // applySimulationResults는 useScene에서 가져옴
                        }
                      }}
                      onOverlayToggle={toggleOverlay}
                    />
                  )}
                  {activeTab === 'ai-simulation' && (
                    <AISimulationTab
                      storeId={selectedStore?.id || ''}
                      sceneData={currentRecipe}
                      onOverlayToggle={toggleOverlay}
                      simulationZones={simulationZones}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* ========== 드래그 가능한 플로팅 패널들 ========== */}

            {/* 오른쪽 상단: 도구 패널 (드래그 가능, 접기/펼치기 가능) */}
            {visiblePanels.tools && (
              <DraggablePanel
                id="tool-panel"
                title="도구"
                rightOffset={100}
                defaultPosition={{ x: 0, y: 16 }}
                collapsible={true}
                defaultCollapsed={true}
                width="w-auto"
                resizable={false}
              >
                <ToolPanel
                  mode={mode}
                  onModeChange={setMode}
                  onTransformModeChange={setTransformMode}
                  hasSelection={false}
                />
              </DraggablePanel>
            )}

            {/* 오버레이 컨트롤 패널 */}
            {visiblePanels.overlay && (
              <DraggablePanel
                id="overlay"
                title="오버레이"
                icon={<Layers className="w-4 h-4" />}
                rightOffset={100}
                defaultPosition={{ x: 0, y: 60 }}
                defaultCollapsed={true}
                width="w-48"
              >
                <div className="space-y-2">
                  {[
                    { id: 'heatmap', label: '히트맵' },
                    { id: 'flow', label: '동선' },
                    { id: 'zone', label: '구역' },
                    { id: 'avatar', label: '고객' },
                  ].map((overlay) => (
                    <label
                      key={overlay.id}
                      className="flex items-center gap-2 text-xs text-white/80 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isActive(overlay.id as OverlayType)}
                        onChange={() => toggleOverlay(overlay.id as OverlayType)}
                        className="w-3 h-3 rounded"
                      />
                      {overlay.label}
                    </label>
                  ))}
                </div>
              </DraggablePanel>
            )}

            {/* 씬 저장 패널 */}
            {visiblePanels.sceneSave && (
              <DraggablePanel
                id="scene-save"
                title="씬 저장"
                icon={<Save className="w-4 h-4" />}
                rightOffset={100}
                defaultPosition={{ x: 0, y: 104 }}
                defaultCollapsed={true}
                width="w-48"
              >
                <SceneSavePanel
                  currentSceneName={sceneName}
                  savedScenes={scenes.slice(0, 3)}
                  isSaving={isSaving}
                  isDirty={false}
                  onSave={handleSaveScene}
                  onLoad={(id) => setActiveScene(id)}
                  onDelete={(id) => deleteScene(id)}
                  onNew={() => setSceneName('')}
                  maxScenes={3}
                />
              </DraggablePanel>
            )}

            {/* 속성 패널 (편집 모드에서만 표시) */}
            {isEditMode && visiblePanels.property && (
              <DraggablePanel
                id="property-panel"
                title="속성"
                rightOffset={100}
                defaultPosition={{ x: 0, y: 148 }}
                defaultCollapsed={false}
                width="w-72"
              >
                <PropertyPanel />
              </DraggablePanel>
            )}

            {/* ========== 시뮬레이션 결과 패널들 (우측 정렬) ========== */}
            <SimulationResultPanels
              visiblePanels={{
                layoutResult: visiblePanels.layoutResult,
                flowResult: visiblePanels.flowResult,
                congestionResult: visiblePanels.congestionResult,
                staffingResult: visiblePanels.staffingResult,
              }}
              simulationResults={simulationResults}
              sceneSimulationResults={sceneSimulation.state.results}
              onClose={closePanel}
              toggleOverlay={toggleOverlay}
            />

            {/* ----- 하단 중앙: 실행 버튼 ----- */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto flex gap-3">
              <Button
                className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm
                           border border-white/20 rounded-xl text-white font-medium
                           transition-all hover:scale-105"
                onClick={handleRunAllSimulations}
                disabled={isInferring}
              >
                {isInferring ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 mr-2" />
                )}
                시뮬레이션 실행
              </Button>
              <Button
                className="px-6 py-3 bg-primary/80 hover:bg-primary backdrop-blur-sm
                           border border-primary/40 rounded-xl text-white font-medium
                           transition-all hover:scale-105"
                onClick={handleRunSceneSimulation}
                disabled={sceneSimulation.isSimulating || !currentRecipe}
              >
                {sceneSimulation.isSimulating ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <GitCompare className="w-5 h-5 mr-2" />
                )}
                씬 최적화 (As-is → To-be)
              </Button>
            </div>
          </div>
        </div>
      </SceneProvider>
    </DashboardLayout>
  );
}

// ============================================================================
// 탭 버튼 컴포넌트
// ============================================================================
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex-1 py-3 text-sm font-medium transition-colors
        ${
          active
            ? 'text-white bg-white/10 border-b-2 border-primary'
            : 'text-white/60 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {children}
    </button>
  );
}

// ============================================================================
// 시뮬레이션 결과 패널 래퍼 (useScene 접근 가능)
// ============================================================================
interface SimulationResultPanelsProps {
  visiblePanels: {
    layoutResult: boolean;
    flowResult: boolean;
    congestionResult: boolean;
    staffingResult: boolean;
  };
  simulationResults: {
    layout: LayoutResult | null;
    flow: FlowResult | null;
    congestion: CongestionResult | null;
    staffing: StaffingResult | null;
  };
  sceneSimulationResults: {
    layout?: any;
    flow?: any;
    congestion?: any;
    staffing?: any;
  };
  onClose: (panel: 'layoutResult' | 'flowResult' | 'congestionResult' | 'staffingResult') => void;
  toggleOverlay: (overlay: string) => void;
}

function SimulationResultPanels({
  visiblePanels,
  simulationResults,
  sceneSimulationResults,
  onClose,
  toggleOverlay,
}: SimulationResultPanelsProps) {
  const { applySimulationResults } = useScene();

  // 3D 씬에 레이아웃 변경 적용 (모델 위치 이동)
  const handleShowLayoutIn3D = useCallback(() => {
    const layoutResult = sceneSimulationResults.layout;
    if (layoutResult?.furnitureMoves && layoutResult.furnitureMoves.length > 0) {
      applySimulationResults({
        furnitureMoves: layoutResult.furnitureMoves,
        animated: true,
      });
      toggleOverlay('zone');
      toast.success('3D 씬에 레이아웃 변경이 적용되었습니다');
    } else {
      toggleOverlay('zone');
      toast.info('3D 뷰에서 변경사항 표시');
    }
  }, [sceneSimulationResults.layout, applySimulationResults, toggleOverlay]);

  return (
    <>
      {visiblePanels.layoutResult && (
        <LayoutResultPanel
          result={simulationResults.layout}
          onClose={() => onClose('layoutResult')}
          onApply={() => {
            // ROI 측정 모달 완료 후 호출됨 - 별도 동작 없음
            // (모달이 이미 ROI 페이지로 이동하거나 토스트 표시함)
          }}
          onShowIn3D={handleShowLayoutIn3D}
          rightOffset={320}
          defaultPosition={{ x: 0, y: 16 }}
        />
      )}

      {visiblePanels.flowResult && (
        <FlowResultPanel
          result={simulationResults.flow}
          onClose={() => onClose('flowResult')}
          onApply={() => {
            toast.success('동선 최적화 적용됨');
          }}
          onShowFlow={() => {
            toggleOverlay('flow');
            toast.info('동선 오버레이 표시');
          }}
          rightOffset={320}
          defaultPosition={{ x: 0, y: 60 }}
        />
      )}

      {visiblePanels.congestionResult && (
        <CongestionResultPanel
          result={simulationResults.congestion}
          onClose={() => onClose('congestionResult')}
          onPlayAnimation={() => {
            toast.info('시간대별 애니메이션 재생');
          }}
          rightOffset={320}
          defaultPosition={{ x: 0, y: 104 }}
        />
      )}

      {visiblePanels.staffingResult && (
        <StaffingResultPanel
          result={simulationResults.staffing}
          onClose={() => onClose('staffingResult')}
          onApply={() => {
            toast.success('인력 배치 최적화 적용됨');
          }}
          onShowPositions={() => {
            toggleOverlay('avatar');
            toast.info('직원 위치 표시');
          }}
          rightOffset={320}
          defaultPosition={{ x: 0, y: 148 }}
        />
      )}
    </>
  );
}
