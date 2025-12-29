/**
 * SceneEnvironment.tsx
 *
 * 고품질 Three.js 씬 환경 설정
 * - 렌더러 설정 (Tone Mapping, 색공간)
 * - Environment Map (HDRI 조명)
 * - 기본 라이팅
 * - 그림자 설정
 */

import { useThree } from '@react-three/fiber';
import { Environment, ContactShadows, BakeShadows, useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { EnvironmentPreset } from '../types';

// ============================================================================
// Environment Model 타입
// ============================================================================
export interface EnvironmentModelData {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isBaked?: boolean;
}

// ============================================================================
// 씬 설정
// ============================================================================
// NOTE: THREE 상수는 컴포넌트 내부에서 직접 사용 (TDZ 에러 방지)
export const SCENE_CONFIG = {
  // 렌더러 설정 (THREE 상수는 RendererSetup에서 직접 사용)
  renderer: {
    toneMappingExposure: 1.1,
    physicallyCorrectLights: true,
  },

  // Environment Map 설정
  environment: {
    preset: 'city' as EnvironmentPreset,
    background: false,
    intensity: 0.8,
  },

  // 배경색
  backgroundColor: '#f5f3ef',

  // 주 광원
  mainLight: {
    color: '#4466aa',
    intensity: 0.8,
    position: [8, 20, 8] as [number, number, number],
    castShadow: true,
    shadow: {
      mapSize: 2048,
      bias: -0.0001,
      normalBias: 0.02,
      camera: {
        near: 0.5,
        far: 50,
        left: -20,
        right: 20,
        top: 20,
        bottom: -20,
      },
    },
  },

  // 보조 광원
  fillLight: {
    color: '#e8f4fc',
    intensity: 0.6,
    position: [-12, 8, -8] as [number, number, number],
  },

  // 림 라이트
  rimLight: {
    enabled: true,
    color: '#fff5e6',
    intensity: 0.5,
    position: [-5, 12, -15] as [number, number, number],
  },

  // Ambient Light
  ambientLight: {
    color: '#f0ebe5',
    intensity: 0.4,
  },

  // Contact Shadows
  contactShadows: {
    enabled: false,
    opacity: 0.35,
    blur: 2.0,
    far: 10,
    resolution: 512,
    color: '#1a1510',
    position: [0, -0.01, 0] as [number, number, number],
    scale: 30,
  },
};

// ============================================================================
// 밤 씬 설정 (시간대: evening, night)
// ============================================================================
export const NIGHT_SCENE_CONFIG = {
  // 렌더러 설정
  renderer: {
    toneMappingExposure: 0.8,  // 약간 어둡게
    physicallyCorrectLights: true,
  },

  // Environment Map 설정
  environment: {
    preset: 'night' as EnvironmentPreset,  // 밤 환경맵
    background: false,
    intensity: 0.5,  // 조명 낮춤
  },

  // 배경색
  backgroundColor: '#0a0a12',  // 어두운 배경

  // 주 광원 (달빛 느낌)
  mainLight: {
    color: '#6688aa',  // 푸른빛 달빛
    intensity: 0.5,    // 약한 강도
    position: [8, 20, 8] as [number, number, number],
    castShadow: true,
    shadow: {
      mapSize: 2048,
      bias: -0.0001,
      normalBias: 0.02,
      camera: {
        near: 0.5,
        far: 50,
        left: -20,
        right: 20,
        top: 20,
        bottom: -20,
      },
    },
  },

  // 보조 광원
  fillLight: {
    color: '#334466',  // 어두운 푸른빛
    intensity: 0.3,
    position: [-12, 8, -8] as [number, number, number],
  },

  // 림 라이트
  rimLight: {
    enabled: true,
    color: '#445566',
    intensity: 0.2,
    position: [-5, 12, -15] as [number, number, number],
  },

  // Ambient Light
  ambientLight: {
    color: '#1a1a2e',  // 어두운 보라빛
    intensity: 0.2,
  },

  // Contact Shadows (동일)
  contactShadows: {
    enabled: false,
    opacity: 0.35,
    blur: 2.0,
    far: 10,
    resolution: 512,
    color: '#000000',
    position: [0, -0.01, 0] as [number, number, number],
    scale: 30,
  },
};

// ============================================================================
// 렌더러 설정 컴포넌트
// ============================================================================
interface RendererSetupProps {
  config?: typeof SCENE_CONFIG;
}

function RendererSetup({ config = SCENE_CONFIG }: RendererSetupProps) {
  const { gl } = useThree();

  useEffect(() => {
    // THREE 상수는 여기서 직접 사용 (TDZ 방지)
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = config.renderer.toneMappingExposure;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl, config]);

  return null;
}

// ============================================================================
// SceneEnvironment Props
// ============================================================================
interface SceneEnvironmentProps {
  /** Environment preset 오버라이드 */
  environmentPreset?: EnvironmentPreset;
  /** 커스텀 HDRI 파일 경로 */
  hdriPath?: string;
  /** 그림자 베이크 (정적 씬용) */
  bakeShadows?: boolean;
  /** 배경색 오버라이드 */
  backgroundColor?: string;
  /** 환경 강도 */
  environmentIntensity?: number;
  /** 환경 모델 목록 (baked, 레이어에 표시 안됨) */
  environmentModels?: EnvironmentModelData[];
  /** 낮/밤 모드 (true = 낮, false = 밤) */
  isDayMode?: boolean;
}

// ============================================================================
// SceneEnvironment 컴포넌트
// ============================================================================
export function SceneEnvironment({
  environmentPreset,
  hdriPath,
  bakeShadows = false,
  backgroundColor,
  environmentIntensity,
  environmentModels = [],
  isDayMode = true,  // 기본값: 낮
}: SceneEnvironmentProps) {
  // 낮/밤에 따른 설정 선택
  const CONFIG = isDayMode ? SCENE_CONFIG : NIGHT_SCENE_CONFIG;

  const preset = environmentPreset || CONFIG.environment.preset;
  const bgColor = backgroundColor || CONFIG.backgroundColor;
  const envIntensity = environmentIntensity ?? CONFIG.environment.intensity;

  return (
    <>
      {/* 렌더러 설정 */}
      <RendererSetup config={CONFIG} />

      {/* 배경색 */}
      <color attach="background" args={[bgColor]} />

      {/* Environment Map */}
      {hdriPath ? (
        <Environment files={hdriPath} background={CONFIG.environment.background} />
      ) : (
        <Environment
          preset={preset}
          background={CONFIG.environment.background}
          environmentIntensity={envIntensity}
        />
      )}

      {/* Ambient Light */}
      <ambientLight
        color={CONFIG.ambientLight.color}
        intensity={CONFIG.ambientLight.intensity}
      />

      {/* Main Directional Light */}
      <directionalLight
        color={CONFIG.mainLight.color}
        intensity={CONFIG.mainLight.intensity}
        position={CONFIG.mainLight.position}
        castShadow={CONFIG.mainLight.castShadow}
        shadow-mapSize-width={CONFIG.mainLight.shadow.mapSize}
        shadow-mapSize-height={CONFIG.mainLight.shadow.mapSize}
        shadow-bias={CONFIG.mainLight.shadow.bias}
        shadow-normalBias={CONFIG.mainLight.shadow.normalBias}
        shadow-camera-near={CONFIG.mainLight.shadow.camera.near}
        shadow-camera-far={CONFIG.mainLight.shadow.camera.far}
        shadow-camera-left={CONFIG.mainLight.shadow.camera.left}
        shadow-camera-right={CONFIG.mainLight.shadow.camera.right}
        shadow-camera-top={CONFIG.mainLight.shadow.camera.top}
        shadow-camera-bottom={CONFIG.mainLight.shadow.camera.bottom}
      />

      {/* Fill Light */}
      <directionalLight
        color={CONFIG.fillLight.color}
        intensity={CONFIG.fillLight.intensity}
        position={CONFIG.fillLight.position}
        castShadow={false}
      />

      {/* Rim Light */}
      {CONFIG.rimLight.enabled && (
        <directionalLight
          color={CONFIG.rimLight.color}
          intensity={CONFIG.rimLight.intensity}
          position={CONFIG.rimLight.position}
          castShadow={false}
        />
      )}

      {/* Contact Shadows */}
      {CONFIG.contactShadows.enabled && (
        <ContactShadows
          opacity={CONFIG.contactShadows.opacity}
          blur={CONFIG.contactShadows.blur}
          far={CONFIG.contactShadows.far}
          resolution={CONFIG.contactShadows.resolution}
          color={CONFIG.contactShadows.color}
          position={CONFIG.contactShadows.position}
          scale={CONFIG.contactShadows.scale}
        />
      )}

      {/* 그림자 베이크 */}
      {bakeShadows && <BakeShadows />}

      {/* 환경 모델 (baked, 레이어에 표시 안됨) */}
      {environmentModels.map((model, index) => (
        <StaticEnvironmentModel
          key={`env-model-${index}`}
          url={model.url}
          position={model.position}
          rotation={model.rotation}
          scale={model.scale}
          isBaked={model.isBaked}
        />
      ))}
    </>
  );
}

// ============================================================================
// 조명 프리셋
// ============================================================================
export const LIGHTING_PRESETS = {
  retail: {
    ...SCENE_CONFIG,
    backgroundColor: '#f5f5f7',
    environment: { ...SCENE_CONFIG.environment, preset: 'lobby' as const, intensity: 0.8 },
    mainLight: { ...SCENE_CONFIG.mainLight, intensity: 2.0 },
    ambientLight: { ...SCENE_CONFIG.ambientLight, color: '#ffffff', intensity: 0.5 },
  },

  showroom: {
    ...SCENE_CONFIG,
    backgroundColor: '#0d1117',
    environment: { ...SCENE_CONFIG.environment, preset: 'studio' as const, intensity: 1.2 },
    mainLight: { ...SCENE_CONFIG.mainLight, intensity: 1.2 },
    rimLight: { ...SCENE_CONFIG.rimLight, intensity: 0.8 },
  },

  warm: {
    ...SCENE_CONFIG,
    backgroundColor: '#1a1510',
    environment: { ...SCENE_CONFIG.environment, preset: 'sunset' as const, intensity: 0.9 },
    mainLight: { ...SCENE_CONFIG.mainLight, color: '#ffeedd', intensity: 1.3 },
    fillLight: { ...SCENE_CONFIG.fillLight, color: '#ffcc99', intensity: 0.5 },
  },

  cool: {
    ...SCENE_CONFIG,
    backgroundColor: '#0a0a12',
    environment: { ...SCENE_CONFIG.environment, preset: 'night' as const, intensity: 1.0 },
    mainLight: { ...SCENE_CONFIG.mainLight, color: '#e0e8ff', intensity: 1.4 },
    fillLight: { ...SCENE_CONFIG.fillLight, color: '#aaccff', intensity: 0.5 },
  },
};

// ============================================================================
// StaticEnvironmentModel 컴포넌트 (Baked 처리)
// ============================================================================
interface StaticEnvironmentModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isBaked?: boolean;
}

function StaticEnvironmentModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isBaked = true,
}: StaticEnvironmentModelProps) {
  const { scene } = useGLTF(url);

  // Baked 처리: MeshBasicMaterial로 변환, 조명/그림자 비활성화
  const processedScene = useMemo(() => {
    const cloned = scene.clone(true);

    if (isBaked) {
      cloned.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // 그림자 비활성화
          child.castShadow = false;
          child.receiveShadow = false;

          // 기존 material에서 텍스처 추출 후 MeshBasicMaterial로 변환
          const originalMaterial = child.material as THREE.MeshStandardMaterial;
          if (originalMaterial) {
            const basicMaterial = new THREE.MeshBasicMaterial({
              map: originalMaterial.map || null,
              color: originalMaterial.color || new THREE.Color(0xffffff),
              transparent: originalMaterial.transparent || false,
              opacity: originalMaterial.opacity ?? 1,
              side: originalMaterial.side || THREE.FrontSide,
            });

            // Baked 설정
            basicMaterial.toneMapped = false;
            basicMaterial.envMap = null;

            child.material = basicMaterial;
          }
        }
      });
    }

    return cloned;
  }, [scene, isBaked]);

  return (
    <primitive
      object={processedScene}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

export default SceneEnvironment;
