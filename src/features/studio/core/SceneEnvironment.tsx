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
import { Environment, ContactShadows, BakeShadows } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { EnvironmentPreset } from '../types';

// ============================================================================
// 씬 설정
// ============================================================================
export const SCENE_CONFIG = {
  // 렌더러 설정
  renderer: {
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.1,
    outputColorSpace: THREE.SRGBColorSpace,
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
    color: '#fff8f0',
    intensity: 2.0,
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
// 렌더러 설정 컴포넌트
// ============================================================================
function RendererSetup() {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = SCENE_CONFIG.renderer.toneMapping;
    gl.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure;
    gl.outputColorSpace = SCENE_CONFIG.renderer.outputColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);

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
}: SceneEnvironmentProps) {
  const preset = environmentPreset || SCENE_CONFIG.environment.preset;
  const bgColor = backgroundColor || SCENE_CONFIG.backgroundColor;
  const envIntensity = environmentIntensity ?? SCENE_CONFIG.environment.intensity;

  return (
    <>
      {/* 렌더러 설정 */}
      <RendererSetup />

      {/* 배경색 */}
      <color attach="background" args={[bgColor]} />

      {/* Environment Map */}
      {hdriPath ? (
        <Environment files={hdriPath} background={SCENE_CONFIG.environment.background} />
      ) : (
        <Environment
          preset={preset}
          background={SCENE_CONFIG.environment.background}
          environmentIntensity={envIntensity}
        />
      )}

      {/* Ambient Light */}
      <ambientLight
        color={SCENE_CONFIG.ambientLight.color}
        intensity={SCENE_CONFIG.ambientLight.intensity}
      />

      {/* Main Directional Light */}
      <directionalLight
        color={SCENE_CONFIG.mainLight.color}
        intensity={SCENE_CONFIG.mainLight.intensity}
        position={SCENE_CONFIG.mainLight.position}
        castShadow={SCENE_CONFIG.mainLight.castShadow}
        shadow-mapSize-width={SCENE_CONFIG.mainLight.shadow.mapSize}
        shadow-mapSize-height={SCENE_CONFIG.mainLight.shadow.mapSize}
        shadow-bias={SCENE_CONFIG.mainLight.shadow.bias}
        shadow-normalBias={SCENE_CONFIG.mainLight.shadow.normalBias}
        shadow-camera-near={SCENE_CONFIG.mainLight.shadow.camera.near}
        shadow-camera-far={SCENE_CONFIG.mainLight.shadow.camera.far}
        shadow-camera-left={SCENE_CONFIG.mainLight.shadow.camera.left}
        shadow-camera-right={SCENE_CONFIG.mainLight.shadow.camera.right}
        shadow-camera-top={SCENE_CONFIG.mainLight.shadow.camera.top}
        shadow-camera-bottom={SCENE_CONFIG.mainLight.shadow.camera.bottom}
      />

      {/* Fill Light */}
      <directionalLight
        color={SCENE_CONFIG.fillLight.color}
        intensity={SCENE_CONFIG.fillLight.intensity}
        position={SCENE_CONFIG.fillLight.position}
        castShadow={false}
      />

      {/* Rim Light */}
      {SCENE_CONFIG.rimLight.enabled && (
        <directionalLight
          color={SCENE_CONFIG.rimLight.color}
          intensity={SCENE_CONFIG.rimLight.intensity}
          position={SCENE_CONFIG.rimLight.position}
          castShadow={false}
        />
      )}

      {/* Contact Shadows */}
      {SCENE_CONFIG.contactShadows.enabled && (
        <ContactShadows
          opacity={SCENE_CONFIG.contactShadows.opacity}
          blur={SCENE_CONFIG.contactShadows.blur}
          far={SCENE_CONFIG.contactShadows.far}
          resolution={SCENE_CONFIG.contactShadows.resolution}
          color={SCENE_CONFIG.contactShadows.color}
          position={SCENE_CONFIG.contactShadows.position}
          scale={SCENE_CONFIG.contactShadows.scale}
        />
      )}

      {/* 그림자 베이크 */}
      {bakeShadows && <BakeShadows />}
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

export default SceneEnvironment;
