/**
 * Canvas3D.tsx
 *
 * 통합 3D 캔버스 컴포넌트
 * - 모든 3D 렌더링을 단일 컴포넌트로 통합
 * - 모드 기반 동작 (편집/뷰/시뮬레이션)
 * - 오버레이 및 UI 통합
 * - 실시간 고객 시뮬레이션 지원
 */

import { Suspense, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Preload } from '@react-three/drei';
import { cn } from '@/lib/utils';
import { useScene } from './SceneProvider';
import { SceneEnvironment } from './SceneEnvironment';
import { ModelLoader } from './ModelLoader';
import { SelectionManager } from './SelectionManager';
import { TransformControls } from './TransformControls';
import { PostProcessing } from './PostProcessing';
import { CustomerAgents } from '../components/CustomerAgents';
import { useSimulationEngine } from '@/hooks/useSimulationEngine';
import { useSimulationStore } from '@/stores/simulationStore';
import { ChildProductItem } from '@/features/simulation/components/digital-twin/ChildProductItem';
import type { StudioMode, EnvironmentPreset, Canvas3DProps } from '../types';
import type { ProductAsset } from '@/types/scene3d';

// 시뮬레이션용 Zone 타입
interface SimulationZone {
  id: string;
  zone_name?: string;
  x?: number;
  z?: number;
  width?: number;
  depth?: number;
  zone_type?: string;
  coordinates?: {
    x?: number;
    z?: number;
    width?: number;
    depth?: number;
  };
}

// ============================================================================
// 확장된 Canvas3D Props (zones 추가)
// ============================================================================
interface ExtendedCanvas3DProps extends Canvas3DProps {
  zones?: SimulationZone[];
}

// ============================================================================
// Canvas3D 컴포넌트
// ============================================================================
export function Canvas3D({
  mode = 'view',
  transformMode = 'translate',
  enableControls = true,
  enableSelection = false,
  enableTransform = false,
  showGrid = false,
  className,
  children,
  onAssetClick,
  zones = [],
}: ExtendedCanvas3DProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          preserveDrawingBuffer: true,
        }}
      >
        <SceneContent
          mode={mode}
          transformMode={transformMode}
          enableControls={enableControls}
          enableSelection={enableSelection}
          enableTransform={enableTransform}
          showGrid={showGrid}
          onAssetClick={onAssetClick}
          zones={zones}
        >
          {children}
        </SceneContent>
      </Canvas>
    </div>
  );
}

// ============================================================================
// 씬 컨텐츠 (Canvas 내부)
// ============================================================================
interface SceneContentProps {
  mode: StudioMode;
  transformMode: string;
  enableControls: boolean;
  enableSelection: boolean;
  enableTransform: boolean;
  showGrid: boolean;
  onAssetClick?: (assetId: string, assetType: string) => void;
  children?: ReactNode;
  zones?: SimulationZone[];
}

function SceneContent({
  mode,
  transformMode,
  enableControls,
  enableSelection,
  enableTransform,
  showGrid,
  onAssetClick,
  children,
  zones = [],
}: SceneContentProps) {
  const { camera } = useScene();

  // 실시간 시뮬레이션 상태
  const isRunning = useSimulationStore((state) => state.isRunning);
  const config = useSimulationStore((state) => state.config);

  // 시뮬레이션 엔진 활성화 (사용자가 시작 버튼을 클릭했을 때)
  useSimulationEngine({
    zones: zones || [],
    enabled: isRunning
  });

  return (
    <>
      {/* 카메라 */}
      <PerspectiveCamera
        makeDefault
        position={[camera.position.x, camera.position.y, camera.position.z]}
        fov={camera.fov}
        near={0.1}
        far={1000}
      />

      <Suspense fallback={<LoadingFallback />}>
        {/* 환경 설정 */}
        <SceneEnvironment />

        {/* 그리드 (편집 모드) */}
        {showGrid && (
          <gridHelper args={[50, 50, '#444444', '#222222']} position={[0, 0.001, 0]} />
        )}

        {/* 카메라 컨트롤 */}
        {enableControls && (
          <OrbitControls
            makeDefault
            target={[camera.target.x, camera.target.y, camera.target.z]}
            enableDamping
            dampingFactor={0.05}
            minDistance={2}
            maxDistance={100}
            maxPolarAngle={Math.PI / 2 + 0.1}
            minPolarAngle={0.1}
          />
        )}

        {/* 모델 렌더링 */}
        <SceneModels onAssetClick={onAssetClick} />

        {/* 🆕 고객 에이전트 시뮬레이션 (실시간 모드) */}
        <CustomerAgents
          showPaths={config.showAgentPaths}
          showLabels={false}
        />

        {/* 선택 관리 (편집 모드) */}
        {enableSelection && <SelectionManager />}

        {/* 변환 컨트롤 (편집 모드) */}
        {enableTransform && <TransformControls mode={transformMode as any} />}

        {/* 자식 컴포넌트 (오버레이 등) */}
        {children}

        {/* 후처리 효과 (뷰/시뮬레이션 모드) */}
        <PostProcessing enabled={mode !== 'edit'} />

        {/* 프리로드 */}
        <Preload all />
      </Suspense>
    </>
  );
}

// ============================================================================
// 씬 모델 렌더링
// ============================================================================
interface SceneModelsProps {
  onAssetClick?: (assetId: string, assetType: string) => void;
}

function SceneModels({ onAssetClick }: SceneModelsProps) {
  const { models, selectedId, hoveredId, select, hover } = useScene();

  return (
    <group>
      {models
        .filter((model) => model.visible)
        .map((model) => {
          // 가구 모델인 경우, childProducts도 함께 렌더링
          const rawChildProducts = (model.metadata as any)?.childProducts as any[] | undefined;
          const hasChildren = model.type === 'furniture' && rawChildProducts && rawChildProducts.length > 0;

          // childProducts를 ProductAsset 형식으로 변환 (rotation은 degrees → radians)
          const degToRad = (deg: number) => (deg || 0) * Math.PI / 180;
          const childProducts: ProductAsset[] | undefined = hasChildren
            ? rawChildProducts!.map((cp) => ({
                id: cp.id,
                type: 'product' as const,
                model_url: cp.model_url || '',
                position: cp.position || { x: 0, y: 0, z: 0 },
                // 🔧 FIX: degrees → radians 변환
                rotation: {
                  x: degToRad(cp.rotation?.x),
                  y: degToRad(cp.rotation?.y),
                  z: degToRad(cp.rotation?.z),
                },
                scale: cp.scale || { x: 1, y: 1, z: 1 },
                sku: cp.metadata?.sku || cp.name,
                display_type: cp.metadata?.displayType,
                dimensions: cp.metadata?.dimensions || { width: 0.3, height: 0.4, depth: 0.2 },
                isRelativePosition: true,
              }))
            : undefined;

          return (
            <group
              key={model.id}
              position={model.position}
              rotation={model.rotation}
            >
              {/* 가구/모델 자체 렌더링 (position은 group에서 처리) */}
              <ModelLoader
                modelId={model.id}
                url={model.url}
                position={[0, 0, 0]}  // group이 position 담당
                rotation={[0, 0, 0]}  // group이 rotation 담당
                scale={model.scale}
                selected={model.id === selectedId}
                hovered={model.id === hoveredId}
                onClick={() => {
                  select(model.id);
                  onAssetClick?.(model.id, model.type);
                }}
                onPointerOver={() => hover(model.id)}
                onPointerOut={() => hover(null)}
              />

              {/* 자식 제품들 (가구 기준 상대 좌표) */}
              {hasChildren && childProducts!.map((child) => (
                <ChildProductItem
                  key={child.id}
                  asset={child}
                  onClick={() => {
                    select(child.id);
                    onAssetClick?.(child.id, 'product');
                  }}
                />
              ))}
            </group>
          );
        })}
    </group>
  );
}

// ============================================================================
// 로딩 폴백
// ============================================================================
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4a90d9" wireframe transparent opacity={0.5} />
    </mesh>
  );
}

// ============================================================================
// 단독 Canvas3D (SceneProvider 없이 사용)
// ============================================================================
interface StandaloneCanvas3DProps extends Canvas3DProps {
  environmentPreset?: EnvironmentPreset;
  hdriPath?: string;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  cameraFov?: number;
}

export function StandaloneCanvas3D({
  mode = 'view',
  enableControls = true,
  showGrid = false,
  className,
  children,
  environmentPreset = 'city',
  hdriPath,
  cameraPosition = [10, 10, 15],
  cameraTarget = [0, 0, 0],
  cameraFov = 50,
}: StandaloneCanvas3DProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          preserveDrawingBuffer: true,
        }}
      >
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={cameraFov}
          near={0.1}
          far={1000}
        />

        <Suspense fallback={<LoadingFallback />}>
          <SceneEnvironment environmentPreset={environmentPreset} hdriPath={hdriPath} />

          {showGrid && (
            <gridHelper args={[50, 50, '#444444', '#222222']} position={[0, 0.001, 0]} />
          )}

          {enableControls && (
            <OrbitControls
              makeDefault
              target={cameraTarget}
              enableDamping
              dampingFactor={0.05}
              minDistance={2}
              maxDistance={100}
              maxPolarAngle={Math.PI / 2 + 0.1}
              minPolarAngle={0.1}
            />
          )}

          {children}

          <PostProcessing enabled={mode !== 'edit'} />

          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default Canvas3D;
