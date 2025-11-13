/**
 * 3D 오버레이 공통 타입 정의
 * Digital Twin 3D 시각화를 위한 데이터 구조
 */

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp?: number;
}

export interface HeatPoint {
  x: number;
  z: number;
  intensity: number; // 0-1 범위의 강도 값
}

export interface ProductInfo {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  stock: number;
  demand: number;
  status: 'normal' | 'low' | 'critical';
  price?: number;
}
