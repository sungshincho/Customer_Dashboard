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
    toneMapping: THREE.ACESFilmicToneMapping,
    toneMappingExposure: 1.1,                   // 🎛️ 약간 밝게 (매장 느낌)
    outputColorSpace: THREE.SRGBColorSpace,
    physicallyCorrectLights: true,
  },
  
  // Environment Map 설정 - 도시 리테일 매장
  environment: {
    preset: 'city' as const,      // 🎛️ 도시 환경 (천장 오픈에 적합)
    background: false,             
    intensity: 0.8,                // 🎛️ HDRI 강도 (천장 오픈이라 적당히)
  },
  
  // 배경색 - 아이보리 + 약간의 깊이감
  backgroundColor: '#f5f3ef',      // 🎛️ 따뜻한 아이보리 (순백보다 부드러움)
  
  // 주 광원 - 천장에서 내려오는 자연광 느낌
  mainLight: {
    color: '#fff8f0',              // 🎛️ 약간 따뜻한 백색 (자연광)
    intensity: 2.0,                // 🎛️ 밝은 매장 조명
    position: [8, 20, 8] as [number, number, number],  // 🎛️ 높은 위치 (천장)
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
  
  // 보조 광원 - 반대쪽에서 그림자 부드럽게
  fillLight: {
    color: '#e8f4fc',              // 🎛️ 시원한 하늘빛 반사
    intensity: 0.6,                // 🎛️ 적당한 보조광
    position: [-12, 8, -8] as [number, number, number],
  },
  
  // 림 라이트 - 물체 윤곽 살리기
  rimLight: {
    enabled: true,
    color: '#fff5e6',              // 🎛️ 따뜻한 역광
    intensity: 0.5,                // 🎛️ 은은하게
    position: [-5, 12, -15] as [number, number, number],
  },
  
  // Ambient Light - 전체적인 기본 밝기
  ambientLight: {
    color: '#f0ebe5',              // 🎛️ 아이보리 톤 환경광
    intensity: 0.4,                // 🎛️ 그림자가 너무 까맣지 않게
  },
  
  // Contact Shadows - 바닥 그림자 (입체감 핵심!)
  contactShadows: {
    enabled: true,
    opacity: 0.35,                 // 🎛️ 은은한 그림자
    blur: 2.0,                     // 🎛️ 부드러운 블러
    far: 10,
    resolution: 512,
    color: '#1a1510',              // 🎛️ 따뜻한 그림자 색
    position: [0, -0.01, 0] as [number, number, number],
    scale: 30,
  }

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
