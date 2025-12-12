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
import type { StudioMode, EnvironmentPreset, Canvas3DProps } from '../types';

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
        .map((model) => (
          <ModelLoader
            key={model.id}
            modelId={model.id}
            url={model.url}
            position={model.position}
            rotation={model.rotation}
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
        ))}
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
