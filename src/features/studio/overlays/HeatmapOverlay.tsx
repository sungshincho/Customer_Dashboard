/**
 * HeatmapOverlay.tsx
 *
 * 히트맵 오버레이 - 방문자 밀집도 시각화
 */

import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { HeatPoint, HeatmapOverlayProps } from '../types';

// ============================================================================
// HeatmapOverlay 컴포넌트
// ============================================================================
export function HeatmapOverlay({
  heatPoints,
  maxIntensity = 1,
  colorScale = 'thermal',
  opacity = 0.6,
  heightScale = 2,
  onPointClick,
}: HeatmapOverlayProps) {
  const [selectedPoint, setSelectedPoint] = useState<HeatPoint | null>(null);

  // 안전 체크: heatPoints가 없거나 비어있으면 렌더링하지 않음
  if (!heatPoints || !Array.isArray(heatPoints) || heatPoints.length === 0) {
    return null;
  }

  const { geometry, colors } = useMemo(() => {
    const gridSize = 20;
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 32, 32);
    const positions = geo.attributes.position.array as Float32Array;
    const colorArray = new Float32Array(positions.length);

    // Create height map and color based on heat intensity
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];

      // Find closest heat point and calculate intensity
      let totalIntensity = 0;
      heatPoints.forEach((point) => {
        const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        const influence = Math.max(0, 1 - distance / 3) * point.intensity;
        totalIntensity = Math.max(totalIntensity, influence);
      });

      // Normalize intensity
      const normalizedIntensity = Math.min(totalIntensity / maxIntensity, 1);

      // Set height based on intensity
      positions[i + 2] = normalizedIntensity * heightScale;

      // Set color based on intensity
      const color = getHeatColor(normalizedIntensity, colorScale);
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArray };
  }, [heatPoints, maxIntensity, heightScale, colorScale]);

  const handlePointClick = (point: HeatPoint) => {
    setSelectedPoint(point);
    onPointClick?.(point);
  };

  return (
    <group>
      {/* 히트맵 메시 */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          const p = e.point;
          // Find closest heat point
          let closest = heatPoints[0];
          let minDist = Infinity;
          heatPoints.forEach((hp) => {
            const dist = Math.sqrt(Math.pow(p.x - hp.x, 2) + Math.pow(p.z - hp.z, 2));
            if (dist < minDist) {
              minDist = dist;
              closest = hp;
            }
          });
          if (closest) handlePointClick(closest);
        }}
      >
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 히트 포인트 마커 */}
      {heatPoints.map((point, idx) => {
        const color = getHeatColor(point.intensity / maxIntensity, colorScale);
        return (
          <mesh
            key={idx}
            position={[point.x, (point.intensity / maxIntensity) * heightScale + 0.2, point.z]}
            onClick={(e) => {
              e.stopPropagation();
              handlePointClick(point);
            }}
          >
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color={color.hex}
              emissive={color.hex}
              emissiveIntensity={selectedPoint === point ? 0.8 : 0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}

      {/* 선택된 포인트 정보 */}
      {selectedPoint && (
        <Html
          position={[
            selectedPoint.x,
            (selectedPoint.intensity / maxIntensity) * heightScale + 1.5,
            selectedPoint.z,
          ]}
          center
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">히트맵 포인트</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoint(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">위치:</span>
                <span className="font-mono">
                  ({selectedPoint.x.toFixed(1)}, {selectedPoint.z.toFixed(1)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">밀집도:</span>
                <span
                  className="font-semibold"
                  style={{ color: getHeatColor(selectedPoint.intensity / maxIntensity, colorScale).hex }}
                >
                  {((selectedPoint.intensity / maxIntensity) * 100).toFixed(0)}%
                </span>
              </div>
              {selectedPoint.label && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">라벨:</span>
                  <span>{selectedPoint.label}</span>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 히트 색상 계산
// ============================================================================
type ColorScale = 'thermal' | 'viridis' | 'cool';

function getHeatColor(
  intensity: number,
  scale: ColorScale = 'thermal'
): { r: number; g: number; b: number; hex: string } {
  let r: number, g: number, b: number;

  if (scale === 'thermal') {
    // Blue -> Cyan -> Green -> Yellow -> Red
    if (intensity < 0.25) {
      const t = intensity / 0.25;
      r = 0;
      g = t;
      b = 1;
    } else if (intensity < 0.5) {
      const t = (intensity - 0.25) / 0.25;
      r = 0;
      g = 1;
      b = 1 - t;
    } else if (intensity < 0.75) {
      const t = (intensity - 0.5) / 0.25;
      r = t;
      g = 1;
      b = 0;
    } else {
      const t = (intensity - 0.75) / 0.25;
      r = 1;
      g = 1 - t;
      b = 0;
    }
  } else if (scale === 'viridis') {
    // Purple -> Blue -> Green -> Yellow
    r = Math.min(1, 0.267004 + intensity * 0.329415);
    g = Math.min(1, 0.004874 + intensity * 0.873449);
    b = Math.min(1, 0.329415 + (1 - intensity) * 0.670585);
  } else {
    // Cool: Blue -> Purple -> Pink
    r = intensity;
    g = 0.2 + intensity * 0.3;
    b = 1;
  }

  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  const hex = '#' + toHex(r) + toHex(g) + toHex(b);

  return { r, g, b, hex };
}

export default HeatmapOverlay;
