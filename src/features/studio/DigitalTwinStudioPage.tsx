/**
 * DigitalTwinStudioPage.tsx
 *
 * 디지털트윈 스튜디오 - 통합 3D 편집 + 시뮬레이션 + 분석
 * 새로운 오버레이 UI 레이아웃
 */

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

// 새 스튜디오 컴포넌트
import { Canvas3D, SceneProvider } from './core';
import { LayerPanel, SimulationPanel, ToolPanel, SceneSavePanel, OverlayControlPanel } from './panels';
import { HeatmapOverlay, CustomerFlowOverlay, ZoneBoundaryOverlay, CustomerAvatarOverlay } from './overlays';
import { useStudioMode, useOverlayVisibility, useScenePersistence } from './hooks';
import { loadUserModels } from './utils';
import type { StudioMode, Model3D, OverlayType, HeatPoint, FlowVector, ZoneBoundary, CustomerAvatar, SceneRecipe, LightingPreset, Vector3 } from './types';

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

type TabType = 'layer' | 'simulation';

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

  // UI 상태
  const [activeTab, setActiveTab] = useState<TabType>('layer');
  const [models, setModels] = useState<ModelLayer[]>([]);
  const [activeLayers, setActiveLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [sceneName, setSceneName] = useState('');

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

  // SceneRecipe 생성
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
    <SceneProvider mode={mode} initialModels={sceneModels}>
      <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-black">
        {/* ========== 3D 캔버스 (배경) ========== */}
        <div className="absolute inset-0 z-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-white" />
            </div>
          ) : (
            <Canvas3D
              mode={mode}
              enableControls={true}
              enableSelection={isEditMode}
              enableTransform={isEditMode}
              showGrid={isEditMode}
            >
              {/* 조건부 오버레이 렌더링 */}
              {isActive('heatmap') && <HeatmapOverlay heatPoints={demoHeatPoints} />}
              {isActive('flow') && <CustomerFlowOverlay flows={demoFlows} />}
              {isActive('zone') && <ZoneBoundaryOverlay zones={demoZones} />}
              {isActive('avatar') && <CustomerAvatarOverlay customers={demoCustomers} />}
            </Canvas3D>
          )}
        </div>

        {/* ========== UI 오버레이 ========== */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* ----- 왼쪽 패널 ----- */}
          <div className="absolute left-4 top-4 bottom-4 w-80 pointer-events-auto">
            <div className="h-full bg-black/80 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
              {/* 탭 헤더 */}
              <div className="flex border-b border-white/10">
                <TabButton active={activeTab === 'layer'} onClick={() => setActiveTab('layer')}>
                  레이어
                </TabButton>
                <TabButton
                  active={activeTab === 'simulation'}
                  onClick={() => setActiveTab('simulation')}
                >
                  AI 시뮬레이션
                </TabButton>
              </div>

              {/* 탭 컨텐츠 */}
              <div className="flex-1 overflow-y-auto">
                {activeTab === 'layer' ? (
                  <LayerPanel />
                ) : (
                  <SimulationPanel
                    onRunSimulation={(scenarios) => {
                      toast.info(`시뮬레이션 실행: ${scenarios.join(', ')}`);
                    }}
                    isRunning={isInferring}
                    contextData={contextData}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ----- 오른쪽 상단: 도구 ----- */}
          <div className="absolute right-4 top-4 pointer-events-auto">
            <ToolPanel
              mode={mode}
              onModeChange={setMode}
              hasSelection={false}
            />
          </div>

          {/* ----- 오른쪽 중단: 오버레이 컨트롤 ----- */}
          <div className="absolute right-4 top-32 pointer-events-auto">
            <OverlayControlPanel
              activeOverlays={activeOverlays}
              onToggle={(id) => toggleOverlay(id as OverlayType)}
            />
          </div>

          {/* ----- 오른쪽 하단: 씬 저장 ----- */}
          <div className="absolute right-4 bottom-24 pointer-events-auto">
            <SceneSavePanel
              currentSceneName={sceneName}
              savedScenes={scenes}
              isSaving={isSaving}
              isDirty={false}
              onSave={handleSaveScene}
              onLoad={(id) => setActiveScene(id)}
              onDelete={(id) => deleteScene(id)}
              onNew={() => {
                setSceneName('');
              }}
            />
          </div>

          {/* ----- 하단 중앙: 실행 버튼 ----- */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-auto">
            <Button
              className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm
                         border border-white/20 rounded-xl text-white font-medium
                         transition-all hover:scale-105"
              onClick={() => {
                setMode('simulate');
                toast.info('시뮬레이션 모드로 전환');
              }}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              모든 시뮬레이션 실행
            </Button>
          </div>
        </div>
      </div>
    </SceneProvider>
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
