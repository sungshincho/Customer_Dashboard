/**
 * SceneEnvironment.tsx
 * 
 * 고품질 Three.js 씬 환경 설정
 * - 렌더러 설정 (Tone Mapping, 색공간)
 * - Environment Map (HDRI 조명)
 * - 기본 라이팅
 * - 그림자 설정
 * 
 * 🎛️ 조절 가능한 변수들은 SCENE_CONFIG 객체에서 수정
 */

import { useThree } from '@react-three/fiber';
import { Environment, ContactShadows, BakeShadows } from '@react-three/drei';
import { useEffect } from 'react';
import * as THREE from 'three';

// ============================================================================
// 🎛️ 씬 설정 - 이 값들을 조절하여 미세 조정 가능
// ============================================================================
export const SCENE_CONFIG = {
  // 렌더러 설정
  renderer: {
    toneMapping: THREE.ACESFilmicToneMapping,  // 옵션: THREE.NoToneMapping, THREE.LinearToneMapping, THREE.ReinhardToneMapping, THREE.CineonToneMapping, THREE.ACESFilmicToneMapping
    toneMappingExposure: 1.0,                   // 🎛️ 노출 (0.5 ~ 2.0) - 전체 밝기 조절
    outputColorSpace: THREE.SRGBColorSpace,    // 색공간
    physicallyCorrectLights: true,             // 물리 기반 조명
  },
  
  // Environment Map 설정
  environment: {
    preset: 'apartment' as const,  // 옵션: 'apartment', 'city', 'dawn', 'forest', 'lobby', 'night', 'park', 'studio', 'sunset', 'warehouse'
    background: false,              // HDRI 배경 표시 여부 (false = 배경 숨김, 조명만 사용)
    intensity: 1.0,                 // 🎛️ 환경광 강도 (0.5 ~ 2.0)
  },
  
  // 배경색 (environment.background가 false일 때 사용)
  backgroundColor: '#1a1a2e',  // 🎛️ 배경색 (어두운 네이비)
  
  // 주 광원 (Directional Light) 설정
  mainLight: {
    color: '#ffffff',
    intensity: 1.5,               // 🎛️ 주 광원 강도 (0.5 ~ 3.0)
    position: [10, 15, 10] as [number, number, number],
    castShadow: true,
    shadow: {
      mapSize: 2048,              // 🎛️ 그림자 해상도 (512, 1024, 2048, 4096)
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
  
  // 보조 광원 (Fill Light) 설정
  fillLight: {
    color: '#8ecae6',             // 🎛️ 보조광 색상 (하늘색 계열로 자연스러운 반사광)
    intensity: 0.4,               // 🎛️ 보조광 강도 (0.2 ~ 0.8)
    position: [-10, 5, -10] as [number, number, number],
  },
  
  // 림 라이트 (뒤에서 오는 빛, 물체 윤곽 강조)
  rimLight: {
    enabled: true,
    color: '#ffd166',             // 🎛️ 림 라이트 색상 (따뜻한 톤)
    intensity: 0.6,               // 🎛️ 림 라이트 강도 (0.2 ~ 1.0)
    position: [-5, 10, -15] as [number, number, number],
  },
  
  // Ambient Light 설정
  ambientLight: {
    color: '#404060',             // 🎛️ 환경광 색상 (약간 푸른 톤)
    intensity: 0.3,               // 🎛️ 환경광 강도 (0.1 ~ 0.5) - 너무 높으면 밋밋해짐
  },
  
  // Contact Shadows (바닥 그림자) 설정
  contactShadows: {
    enabled: true,
    opacity: 0.4,                 // 🎛️ 그림자 불투명도 (0.2 ~ 0.6)
    blur: 2.5,                    // 🎛️ 그림자 블러 (1 ~ 4)
    far: 10,
    resolution: 512,
    color: '#000000',
    position: [0, -0.01, 0] as [number, number, number],
    scale: 30,
  },
  
  // 안개 설정 (depth 느낌)
  fog: {
    enabled: false,               // 🎛️ 안개 활성화 여부
    color: '#1a1a2e',
    near: 20,
    far: 50,
  },
};

// ============================================================================
// 렌더러 설정 컴포넌트
// ============================================================================
export function RendererSetup() {
  const { gl } = useThree();
  
  useEffect(() => {
    // Tone Mapping
    gl.toneMapping = SCENE_CONFIG.renderer.toneMapping;
    gl.toneMappingExposure = SCENE_CONFIG.renderer.toneMappingExposure;
    
    // 색공간
    gl.outputColorSpace = SCENE_CONFIG.renderer.outputColorSpace;
    
    // 물리 기반 조명 (R3F에서는 기본적으로 활성화)
    // gl.physicallyCorrectLights는 Three.js r150+에서 deprecated
    // useLegacyLights = false가 기본값
    
    // 그림자 설정
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;  // 부드러운 그림자
    
  }, [gl]);
  
  return null;
}

// ============================================================================
// 메인 환경 컴포넌트
// ============================================================================
interface SceneEnvironmentProps {
  /** Environment preset 오버라이드 */
  environmentPreset?: typeof SCENE_CONFIG.environment.preset;
  /** 커스텀 HDRI 파일 경로 */
  hdriPath?: string;
  /** 그림자 베이크 (정적 씬용) */
  bakeShadows?: boolean;
}

export function SceneEnvironment({ 
  environmentPreset,
  hdriPath,
  bakeShadows = false 
}: SceneEnvironmentProps) {
  const preset = environmentPreset || SCENE_CONFIG.environment.preset;
  
  return (
    <>
      {/* 렌더러 설정 */}
      <RendererSetup />
      
      {/* 배경색 */}
      <color attach="background" args={[SCENE_CONFIG.backgroundColor]} />
      
      {/* 안개 (선택적) */}
      {SCENE_CONFIG.fog.enabled && (
        <fog attach="fog" args={[SCENE_CONFIG.fog.color, SCENE_CONFIG.fog.near, SCENE_CONFIG.fog.far]} />
      )}
      
      {/* Environment Map - HDRI 조명 (배경 숨김) */}
      {hdriPath ? (
        <Environment
          files={hdriPath}
          background={SCENE_CONFIG.environment.background}
        />
      ) : (
        <Environment
          preset={preset}
          background={SCENE_CONFIG.environment.background}
          environmentIntensity={SCENE_CONFIG.environment.intensity}
        />
      )}
      
      {/* Ambient Light - 기본 환경광 */}
      <ambientLight
        color={SCENE_CONFIG.ambientLight.color}
        intensity={SCENE_CONFIG.ambientLight.intensity}
      />
      
      {/* Main Directional Light - 주 광원 */}
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
      
      {/* Fill Light - 보조 광원 (그림자 없음) */}
      <directionalLight
        color={SCENE_CONFIG.fillLight.color}
        intensity={SCENE_CONFIG.fillLight.intensity}
        position={SCENE_CONFIG.fillLight.position}
        castShadow={false}
      />
      
      {/* Rim Light - 역광 (물체 윤곽 강조) */}
      {SCENE_CONFIG.rimLight.enabled && (
        <directionalLight
          color={SCENE_CONFIG.rimLight.color}
          intensity={SCENE_CONFIG.rimLight.intensity}
          position={SCENE_CONFIG.rimLight.position}
          castShadow={false}
        />
      )}
      
      {/* Contact Shadows - 바닥 그림자 */}
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
      
      {/* 그림자 베이크 (정적 씬용, 성능 향상) */}
      {bakeShadows && <BakeShadows />}
    </>
  );
}

// ============================================================================
// 프리셋 모음 (필요시 사용)
// ============================================================================
export const LIGHTING_PRESETS = {
  // 밝은 매장 느낌
  retail: {
    ...SCENE_CONFIG,
    backgroundColor: '#f5f5f7',
    environment: { ...SCENE_CONFIG.environment, preset: 'lobby' as const, intensity: 0.8 },
    mainLight: { ...SCENE_CONFIG.mainLight, intensity: 2.0 },
    ambientLight: { ...SCENE_CONFIG.ambientLight, color: '#ffffff', intensity: 0.5 },
  },
  
  // 고급스러운 쇼룸 느낌
  showroom: {
    ...SCENE_CONFIG,
    backgroundColor: '#0d1117',
    environment: { ...SCENE_CONFIG.environment, preset: 'studio' as const, intensity: 1.2 },
    mainLight: { ...SCENE_CONFIG.mainLight, intensity: 1.2 },
    rimLight: { ...SCENE_CONFIG.rimLight, intensity: 0.8 },
  },
  
  // 따뜻한 카페 느낌
  warm: {
    ...SCENE_CONFIG,
    backgroundColor: '#1a1510',
    environment: { ...SCENE_CONFIG.environment, preset: 'sunset' as const, intensity: 0.9 },
    mainLight: { ...SCENE_CONFIG.mainLight, color: '#ffeedd', intensity: 1.3 },
    fillLight: { ...SCENE_CONFIG.fillLight, color: '#ffcc99', intensity: 0.5 },
  },
  
  // 시원한 모던 느낌
  cool: {
    ...SCENE_CONFIG,
    backgroundColor: '#0a0a12',
    environment: { ...SCENE_CONFIG.environment, preset: 'night' as const, intensity: 1.0 },
    mainLight: { ...SCENE_CONFIG.mainLight, color: '#e0e8ff', intensity: 1.4 },
    fillLight: { ...SCENE_CONFIG.fillLight, color: '#aaccff', intensity: 0.5 },
  },
};

export default SceneEnvironment;
