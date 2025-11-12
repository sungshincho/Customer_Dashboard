# NEURALTWIN 3D 디지털트윈 통합 가이드 (하이브리드 방식)

## 📋 목차
1. [개요](#개요)
2. [하이브리드 방식이란?](#하이브리드-방식이란)
3. [Phase 1: 하이브리드 구현](#phase-1-하이브리드-구현)
4. [언리얼 에셋 제작 워크플로우](#언리얼-에셋-제작-워크플로우)
5. [glTF 익스포트 및 최적화](#gltf-익스포트-및-최적화)
6. [Supabase Storage 에셋 관리](#supabase-storage-에셋-관리)
7. [Three.js 런타임 통합](#threejs-런타임-통합)
8. [실시간 데이터 동기화](#실시간-데이터-동기화)
9. [성능 최적화](#성능-최적화)
10. [구현 체크리스트](#구현-체크리스트)

---

## 개요

**전제 조건**: NEURALTWIN 팀에 언리얼 엔진 전문가가 있음  
**선택한 방식**: 하이브리드 (Unreal Engine 에셋 + Three.js 런타임)  
**목표**: Phase 1부터 프로덕션급 시각 품질 + 비용 효율 + 확장성

### 핵심 전략
```
🎨 언리얼 엔진 (Asset Production)
   ↓ glTF Export
📦 Supabase Storage (CDN)
   ↓ HTTPS
🌐 Three.js / R3F (Runtime)
   ↓ WebSocket
🔥 Real-time Data (Lovable Cloud)
```

### 예상 결과
- **시각적 품질**: ⭐⭐⭐⭐⭐ (포토리얼)
- **월 비용**: $10-30 (CDN + Storage만)
- **개발 기간**: 3-6개월
- **확장성**: 무제한 동시 사용자
- **모바일 지원**: ✅ 양호

---

## 하이브리드 방식이란?

### 아키텍처 개요

```
┌────────────────────────────────────────────────────────────┐
│                   언리얼 엔진 (Asset Creation)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ 3D Modeling  │→ │ PBR Material │→ │ Lighting Bake│    │
│  │ (Geometry)   │  │ (Textures)   │  │ (Lightmaps)  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                          ↓                                  │
│                    glTF Exporter                            │
│              (.glb, .bin, .ktx2 textures)                   │
└────────────────────────────────────────────────────────────┘
                           ↓ Upload
┌────────────────────────────────────────────────────────────┐
│              Supabase Storage (CDN)                         │
│  /3d-assets/                                                │
│    ├── store-base.glb (50MB)                               │
│    ├── store-base-lod1.glb (15MB)                          │
│    ├── store-base-lod2.glb (5MB)                           │
│    └── products/                                            │
│        ├── shelf-001.glb                                    │
│        └── product-*.glb                                    │
└────────────────────────────────────────────────────────────┘
                           ↓ HTTPS Load
┌────────────────────────────────────────────────────────────┐
│             React Three Fiber (Runtime)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Canvas (WebGL)                                       │  │
│  │  ├─ <primitive object={unrealModel} />  (Static)    │  │
│  │  ├─ <HeatmapMesh />                     (Dynamic)   │  │
│  │  ├─ <CustomerAvatars />                 (Dynamic)   │  │
│  │  └─ <OrbitControls />                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                    ↕ WebSocket (Realtime)                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Realtime (traffic_logs, visitors)         │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 왜 하이브리드인가?

| 요소 | 렌더링 방식 | 이유 |
|------|-------------|------|
| **매장 구조** (벽, 바닥, 기둥) | 🎨 언리얼 → Static GLB | 자주 안 바뀜, 최고 품질 필요 |
| **선반, 집기** | 🎨 언리얼 → Static GLB | 디테일 중요, 재사용 가능 |
| **히트맵 오버레이** | 🌐 Three.js (Dynamic) | 실시간 데이터 변경 |
| **고객 아바타** | 🌐 Three.js (Instanced) | 수백 명 실시간 렌더링 |
| **UI 레이블** | 🌐 Three.js (Text3D) | 데이터 기반 동적 생성 |

### 장점 Summary

✅ **언리얼 품질** - PBR, Lightmap, 고해상도 텍스처  
✅ **낮은 비용** - 서버 없음, CDN만 ($10-30/월)  
✅ **빠른 로딩** - Progressive Loading (3-5초)  
✅ **무제한 확장** - 클라이언트 렌더링  
✅ **실시간 데이터** - Three.js로 동적 레이어 처리  

---

## Phase 1: 하이브리드 구현 (3-6개월)

### 타임라인

```
Month 1-2: 언리얼 에셋 제작
├─ Week 1-2: 매장 구조 모델링 (50m × 30m)
├─ Week 3-4: PBR 머티리얼 적용
├─ Week 5-6: 라이팅 베이크 (Lightmass)
└─ Week 7-8: LOD 생성 + 최적화

Month 3-4: glTF 파이프라인 구축
├─ Week 9-10: Datasmith Exporter 설정
├─ Week 11-12: glTF-Transform 자동화
├─ Week 13-14: Supabase Storage 업로드
└─ Week 15-16: CDN 성능 테스트

Month 5-6: Three.js 통합 및 데이터 연동
├─ Week 17-18: GLTFLoader + 기본 씬 구성
├─ Week 19-20: 히트맵 오버레이 (TrafficHeatmap)
├─ Week 21-22: 아바타 Instancing (FootfallVisualizer)
└─ Week 23-24: 레이아웃 시뮬레이터 (Drag & Drop)
```

### 구현 우선순위

#### 🔥 High Priority

1. **TrafficHeatmap 3D** ⭐⭐⭐⭐⭐
   - 언리얼: 매장 바닥 + 벽면 (Week 1-4)
   - Three.js: 히트맵 오버레이 (Week 17-20)
   - 데이터: Supabase Realtime 연동

2. **LayoutSimulator 3D** ⭐⭐⭐⭐⭐
   - 언리얼: 선반 + 제품 모델 (Week 5-8)
   - Three.js: Drag & Drop (Week 23-24)
   - AI: 레이아웃 최적화 Edge Function

3. **FootfallVisualizer 3D** ⭐⭐⭐⭐
   - 언리얼: 간단한 아바타 모델 (Week 7-8)
   - Three.js: Instanced Rendering (Week 21-22)
   - 데이터: 2초마다 위치 업데이트

---

## 언리얼 에셋 제작 워크플로우

### 1. 프로젝트 설정

#### Unreal Engine 5.3+ 설치
```bash
# Epic Games Launcher에서 UE 5.3 설치
# 플러그인 활성화:
- Datasmith Exporter (glTF 익스포트용)
- Modeling Tools Editor Mode
```

#### 프로젝트 생성
```
Template: Blank
Project Settings:
├─ Target Platform: Desktop
├─ Quality Preset: Scalable 3D or 2D
├─ Starter Content: No (불필요)
└─ Raytracing: Disabled (글로벌 일루미네이션은 Lightmass 사용)
```

### 2. 매장 구조 모델링

#### 기본 치수 (실제 매장 기준)
```
매장 크기: 50m (Width) × 30m (Depth) × 4m (Height)
├─ 입구 구역: 10m × 30m
├─ 진열 구역: 30m × 30m
└─ 계산대 구역: 10m × 30m

모델링 가이드:
├─ 바닥: Plane (50 × 30), Subdivide 10×10
├─ 벽면: Cube (0.2m 두께), 창문 컷아웃
├─ 기둥: Cylinder (0.5m 반경), 간격 5m
└─ 천장: Plane + 조명 매입
```

#### 모델링 Best Practices
```cpp
// 언리얼 블루프린트 (매장 생성 자동화)
void AStoreGenerator::GenerateStore()
{
    // 바닥 생성
    UStaticMeshComponent* Floor = CreatePlane(5000, 3000); // cm 단위
    Floor->SetMaterial(0, LoadObject<UMaterial>(nullptr, TEXT("/Game/Materials/M_Floor_Tile")));
    
    // 벽면 생성 (4면)
    for (int i = 0; i < 4; i++)
    {
        UStaticMeshComponent* Wall = CreateWall(i);
        Wall->SetCastShadow(true);
    }
    
    // 선반 배치 (그리드)
    for (int x = 0; x < 5; x++)
    {
        for (int y = 0; y < 3; y++)
        {
            FVector Pos(x * 500, y * 500, 0); // 5m 간격
            SpawnShelf(Pos);
        }
    }
}
```

### 3. PBR 머티리얼 설정

#### Master Material 생성
```
Materials/M_Store_Master
├─ Base Color: Texture Parameter (T_BaseColor)
├─ Roughness: Scalar Parameter (0-1)
├─ Metallic: Scalar Parameter (0-1)
├─ Normal: Texture Parameter (T_Normal)
└─ Emissive: Optional (조명 효과)
```

#### Material Instances (실제 사용)
```
MI_Floor_Tile
├─ T_BaseColor: /Textures/Floor/T_Tile_Albedo (2048×2048)
├─ T_Normal: /Textures/Floor/T_Tile_Normal
├─ Roughness: 0.6
└─ Tiling: UV Scale (10, 10) → 5m당 1타일

MI_Shelf_Wood
├─ T_BaseColor: /Textures/Wood/T_Oak_Albedo (1024×1024)
├─ Roughness: 0.4
├─ Metallic: 0.0
└─ Normal: Subtle wood grain

MI_Product_Plastic
├─ Base Color: (R=1, G=0.8, B=0) Orange
├─ Roughness: 0.3
├─ Metallic: 0.1
└─ Emissive: None
```

#### 텍스처 해상도 가이드
```
대형 표면 (바닥, 벽): 2048×2048 (반복 타일링)
중형 오브젝트 (선반, 집기): 1024×1024
소형 오브젝트 (제품, 소품): 512×512
LOD1: 절반 해상도 (1024→512)
LOD2: 1/4 해상도 (1024→256)
```

### 4. 라이팅 베이크 (Lightmass)

#### 조명 배치
```
DirectionalLight (태양광)
├─ Intensity: 3.0
├─ Light Color: (R=1, G=0.98, B=0.95) Warm White
└─ Mobility: Stationary (그림자 베이크)

PointLight (매장 조명)
├─ 위치: 천장 5m 간격 그리드
├─ Intensity: 5000 (cd)
├─ Attenuation Radius: 10m
└─ Mobility: Stationary

SpotLight (포인트 조명)
├─ 제품 하이라이트용
├─ Outer Cone Angle: 45°
└─ Mobility: Stationary
```

#### Lightmass 설정
```
World Settings → Lightmass
├─ Static Lighting Level Scale: 0.5 (고품질)
├─ Num Indirect Lighting Bounces: 3
├─ Indirect Lighting Quality: 4.0
└─ Indirect Lighting Smoothness: 1.0

Static Mesh Settings
├─ Lightmap Resolution: 
│   ├─ 바닥: 512
│   ├─ 벽면: 256
│   ├─ 선반: 128
│   └─ 소품: 64
└─ Overridden Light Map Res: Check ✓
```

#### 베이크 실행
```
Build → Build Lighting Only
├─ Quality Level: Production
├─ 예상 시간: 30분 ~ 2시간 (매장 복잡도에 따라)
└─ 결과: Lightmap 텍스처 자동 생성
```

### 5. LOD (Level of Detail) 생성

#### LOD 전략
```
LOD0 (0-10m): 원본 품질
├─ Triangle Count: 100%
├─ Texture Resolution: 2048×2048
└─ 사용: 근거리 뷰

LOD1 (10-30m): 중간 품질
├─ Triangle Count: 50% (자동 간소화)
├─ Texture Resolution: 1024×1024
└─ 사용: 중거리 뷰

LOD2 (30m+): 저품질
├─ Triangle Count: 25%
├─ Texture Resolution: 512×512
└─ 사용: 원거리 뷰 (실루엣만)
```

#### 자동 LOD 생성
```
Static Mesh Editor
├─ LOD Settings → Auto Compute LOD Distances: Check ✓
├─ LOD Group: LargeProp
├─ Number of LODs: 3
└─ Build Settings:
    ├─ Reduction Settings:
    │   ├─ LOD1: Percent Triangles = 50%
    │   └─ LOD2: Percent Triangles = 25%
    └─ Build → Apply Changes
```

---

## glTF 익스포트 및 최적화

### 1. Datasmith glTF Exporter 설정

#### 플러그인 활성화
```
Edit → Plugins → Search "Datasmith"
├─ Datasmith Exporter → Enabled ✓
└─ Restart Editor
```

#### 익스포트 설정
```
File → Export → glTF Exporter
Settings:
├─ Export Format: Binary (.glb) ← 추천 (단일 파일)
├─ Texture Image Format: JPEG (고압축) or PNG (고품질)
├─ Bake Material Inputs: True ✓ (PBR → glTF 변환)
├─ Export Vertex Colors: False (불필요)
├─ Export Level of Details: True ✓ (LOD 포함)
├─ Export Collision: False
└─ Export Preview Mesh: False

Output:
└─ store-base.glb (예상 크기: 50-150MB)
```

### 2. glTF-Transform 최적화

#### 설치
```bash
npm install -g @gltf-transform/cli
```

#### 최적화 스크립트
```bash
#!/bin/bash
# scripts/optimize-gltf.sh

INPUT_FILE="exports/store-base.glb"
OUTPUT_DIR="optimized"

# 1. 기본 최적화 (중복 제거, 압축)
gltf-transform optimize $INPUT_FILE $OUTPUT_DIR/store-base-opt.glb \
  --texture-compress webp \
  --simplify \
  --weld \
  --dedup \
  --instance

# 2. Draco 지오메트리 압축 (선택적)
gltf-transform draco $OUTPUT_DIR/store-base-opt.glb $OUTPUT_DIR/store-base-draco.glb \
  --method edgebreaker

# 3. KTX2 텍스처 압축 (GPU 최적화)
gltf-transform etc1s $OUTPUT_DIR/store-base-opt.glb $OUTPUT_DIR/store-base-ktx2.glb \
  --quality 128

# 4. LOD별 분리 (옵션)
gltf-transform prune $INPUT_FILE $OUTPUT_DIR/store-base-lod0.glb --keep-extras "LOD0"
gltf-transform prune $INPUT_FILE $OUTPUT_DIR/store-base-lod1.glb --keep-extras "LOD1"
gltf-transform prune $INPUT_FILE $OUTPUT_DIR/store-base-lod2.glb --keep-extras "LOD2"

echo "✅ Optimization Complete!"
echo "Original: $(du -h $INPUT_FILE | cut -f1)"
echo "Optimized: $(du -h $OUTPUT_DIR/store-base-ktx2.glb | cut -f1)"
```

#### 예상 압축률
```
Original (Unreal Export): 150 MB
↓ optimize (webp)
70 MB (-53%)
↓ draco
40 MB (-73%)
↓ ktx2
25 MB (-83%)

모바일용 추가 압축:
└─ store-base-mobile.glb: 10 MB (Draco + 512px textures)
```

---

## Supabase Storage 에셋 관리

### 1. Storage Bucket 생성

#### Lovable Cloud UI에서
```
1. Cloud 탭 클릭
2. Storage → Create Bucket
   ├─ Name: "3d-assets"
   ├─ Public: ✓ (CDN 활성화)
   └─ File Size Limit: 100 MB
```

#### 또는 SQL로
```sql
-- Supabase Storage Bucket 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('3d-assets', '3d-assets', true);

-- RLS Policy (공개 읽기, 관리자만 쓰기)
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = '3d-assets');

CREATE POLICY "Admin write access" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = '3d-assets' AND
  auth.uid() IN (SELECT id FROM admin_users)
);
```

### 2. 에셋 업로드 스크립트

```typescript
// scripts/upload-3d-assets.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Admin key
);

const ASSETS_DIR = './optimized';
const BUCKET_NAME = '3d-assets';

async function uploadAsset(filePath: string, remotePath: string) {
  const fileBuffer = fs.readFileSync(filePath);
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(remotePath, fileBuffer, {
      contentType: 'model/gltf-binary',
      cacheControl: '31536000', // 1년 캐싱
      upsert: true // 덮어쓰기 허용
    });

  if (error) {
    console.error(`❌ Upload failed: ${remotePath}`, error);
  } else {
    console.log(`✅ Uploaded: ${remotePath}`);
  }
}

async function main() {
  const files = [
    { local: 'store-base-ktx2.glb', remote: 'models/store-base.glb' },
    { local: 'store-base-lod1.glb', remote: 'models/store-base-lod1.glb' },
    { local: 'store-base-lod2.glb', remote: 'models/store-base-lod2.glb' },
    { local: 'shelf-001.glb', remote: 'models/products/shelf-001.glb' }
  ];

  for (const file of files) {
    await uploadAsset(
      path.join(ASSETS_DIR, file.local),
      file.remote
    );
  }

  console.log('\n🎉 All assets uploaded!');
}

main();
```

#### 실행
```bash
# 환경 변수 설정 (.env)
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 업로드
npm run upload-assets
```

### 3. CDN URL 생성

```typescript
// src/utils/assetLoader.ts
import { supabase } from '@/integrations/supabase/client';

export const getAssetUrl = (path: string): string => {
  const { data } = supabase.storage
    .from('3d-assets')
    .getPublicUrl(path);
  
  return data.publicUrl;
};

// 사용 예시
const storeModelUrl = getAssetUrl('models/store-base.glb');
// → https://your-project.supabase.co/storage/v1/object/public/3d-assets/models/store-base.glb
```

### 4. Progressive Loading Hook

```typescript
// src/hooks/useProgressiveGLTF.ts
import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { getAssetUrl } from '@/utils/assetLoader';

export const useProgressiveGLTF = (baseUrl: string) => {
  const [currentLOD, setCurrentLOD] = useState(2); // 낮은 품질부터 시작
  
  // LOD2 (저품질) 먼저 로드
  const lod2 = useGLTF(getAssetUrl(`${baseUrl}-lod2.glb`));
  
  useEffect(() => {
    // LOD1 프리로드
    const timer1 = setTimeout(() => {
      useGLTF.preload(getAssetUrl(`${baseUrl}-lod1.glb`));
      setCurrentLOD(1);
    }, 1000);

    // LOD0 (최고품질) 프리로드
    const timer2 = setTimeout(() => {
      useGLTF.preload(getAssetUrl(`${baseUrl}.glb`));
      setCurrentLOD(0);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [baseUrl]);

  return currentLOD === 2 ? lod2 : useGLTF(getAssetUrl(`${baseUrl}.glb`));
};
```

---

## Three.js 런타임 통합

### 1. 패키지 설치

```bash
npm install @react-three/fiber@^8.18.0 three@^0.133.0
npm install @react-three/drei@^9.122.0
npm install @react-three/postprocessing@^2.16.0
npm install zustand@^4.5.0
npm install --save-dev @types/three
```

### 2. 언리얼 모델 로드 컴포넌트

```tsx
// src/features/digital-twin-3d/components/UnrealStoreModel.tsx
import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import { getAssetUrl } from '@/utils/assetLoader';
import * as THREE from 'three';

interface UnrealStoreModelProps {
  modelPath: string;
  receiveShadow?: boolean;
  castShadow?: boolean;
}

export const UnrealStoreModel = ({ 
  modelPath, 
  receiveShadow = true,
  castShadow = false
}: UnrealStoreModelProps) => {
  const { scene } = useGLTF(getAssetUrl(modelPath));

  useEffect(() => {
    // 모든 메시에 그림자 설정 적용
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
        
        // 언리얼 머티리얼 품질 향상
        if (child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          
          // Environment Map 강도 증가 (반사 품질)
          mat.envMapIntensity = 1.5;
          
          // 텍스처 Anisotropic Filtering (선명도)
          if (mat.map) mat.map.anisotropy = 16;
          if (mat.normalMap) mat.normalMap.anisotropy = 16;
          if (mat.roughnessMap) mat.roughnessMap.anisotropy = 16;
        }
      }
    });
  }, [scene, castShadow, receiveShadow]);

  return <primitive object={scene} />;
};

// Preload 유틸리티
useGLTF.preload(getAssetUrl('models/store-base.glb'));
```

### 3. TrafficHeatmap 3D (하이브리드)

```tsx
// src/features/digital-twin-3d/components/TrafficHeatmap3DHybrid.tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { UnrealStoreModel } from './UnrealStoreModel';
import { HeatmapOverlay } from './HeatmapOverlay';
import { useRealtimeTraffic } from '../hooks/useRealtimeTraffic';

export const TrafficHeatmap3DHybrid = ({ storeId }: { storeId: string }) => {
  const heatmapData = useRealtimeTraffic(storeId);

  return (
    <Canvas
      camera={{ position: [30, 40, 30], fov: 50 }}
      shadows="soft" // PCF Soft Shadows
    >
      {/* 조명 */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* 언리얼 에셋: 매장 구조 (Static) */}
      <UnrealStoreModel 
        modelPath="models/store-base.glb"
        receiveShadow
      />

      {/* Three.js: 히트맵 오버레이 (Dynamic) */}
      <HeatmapOverlay 
        data={heatmapData}
        storeWidth={50}
        storeDepth={30}
      />

      {/* 카메라 컨트롤 */}
      <OrbitControls
        maxPolarAngle={Math.PI / 2.2}
        minDistance={15}
        maxDistance={100}
      />

      {/* Environment (HDRI) */}
      <Environment 
        preset="warehouse" 
        background={false}
      />
    </Canvas>
  );
};
```

### 4. 동적 히트맵 오버레이

```tsx
// src/features/digital-twin-3d/components/HeatmapOverlay.tsx
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HeatmapPoint } from '../types';

interface HeatmapOverlayProps {
  data: HeatmapPoint[];
  storeWidth: number;
  storeDepth: number;
}

export const HeatmapOverlay = ({ 
  data, 
  storeWidth, 
  storeDepth 
}: HeatmapOverlayProps) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // 히트맵 텍스처 생성 (Canvas API)
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    const resolution = 512;
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d')!;

    // 배경 투명
    ctx.clearRect(0, 0, resolution, resolution);

    // 각 데이터 포인트를 그라디언트로 그리기
    data.forEach(point => {
      const x = (point.x / storeWidth) * resolution;
      const y = (point.y / storeDepth) * resolution;
      const radius = 40 * point.intensity;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 0, 0, ${point.intensity * 0.8})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 0, ${point.intensity * 0.4})`);
      gradient.addColorStop(1, 'rgba(0, 0, 255, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });

    // Three.js 텍스처로 변환
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [data, storeWidth, storeDepth]);

  // 실시간 업데이트 (텍스처 갱신)
  useFrame(() => {
    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      mat.map = texture;
      mat.needsUpdate = true;
    }
  });

  return (
    <mesh 
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.05, 0]} // 바닥 위 5cm
    >
      <planeGeometry args={[storeWidth, storeDepth]} />
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={0.7}
        emissive="#ffffff"
        emissiveIntensity={0.3}
        depthWrite={false} // 투명도 충돌 방지
      />
    </mesh>
  );
};
```

### 5. LOD 시스템 (성능 최적화)

```tsx
// src/features/digital-twin-3d/components/StoreModelWithLOD.tsx
import { Lod } from '@react-three/drei';
import { UnrealStoreModel } from './UnrealStoreModel';

export const StoreModelWithLOD = () => {
  return (
    <Lod distances={[0, 20, 50]}>
      {/* LOD0: 0-20m (고품질) */}
      <UnrealStoreModel modelPath="models/store-base.glb" />
      
      {/* LOD1: 20-50m (중품질) */}
      <UnrealStoreModel modelPath="models/store-base-lod1.glb" />
      
      {/* LOD2: 50m+ (저품질) */}
      <UnrealStoreModel modelPath="models/store-base-lod2.glb" />
    </Lod>
  );
};
```

---

## 실시간 데이터 동기화

### 1. Supabase Realtime Hook

```typescript
// src/features/digital-twin-3d/hooks/useRealtimeTraffic.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TrafficLog {
  id: string;
  zone_x: number;
  zone_y: number;
  dwell_time: number;
  timestamp: string;
}

export const useRealtimeTraffic = (storeId: string) => {
  const [logs, setLogs] = useState<TrafficLog[]>([]);

  useEffect(() => {
    // 초기 데이터 로드 (최근 1시간)
    const loadInitial = async () => {
      const { data } = await supabase
        .from('traffic_logs')
        .select('*')
        .eq('store_id', storeId)
        .gte('timestamp', new Date(Date.now() - 3600000).toISOString())
        .order('timestamp', { ascending: false })
        .limit(500);

      if (data) setLogs(data);
    };

    loadInitial();

    // 실시간 구독
    const channel = supabase
      .channel(`traffic-${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'traffic_logs',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          setLogs(prev => [payload.new as TrafficLog, ...prev].slice(0, 500));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return logs;
};
```

### 2. Zustand 상태 관리

```typescript
// src/features/digital-twin-3d/store/use3DStore.ts
import { create } from 'zustand';
import { HeatmapPoint } from '../types';

interface Store3DState {
  // 히트맵 데이터
  heatmapData: HeatmapPoint[];
  updateHeatmap: (data: HeatmapPoint[]) => void;

  // 카메라 프리셋
  cameraPreset: 'entrance' | 'overview' | 'checkout';
  setCameraPreset: (preset: 'entrance' | 'overview' | 'checkout') => void;

  // 시간대 필터
  timeOfDay: number; // 0-23
  setTimeOfDay: (hour: number) => void;

  // 성능 모니터링
  fps: number;
  setFps: (fps: number) => void;
}

export const use3DStore = create<Store3DState>((set) => ({
  heatmapData: [],
  updateHeatmap: (data) => set({ heatmapData: data }),

  cameraPreset: 'overview',
  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  timeOfDay: 12,
  setTimeOfDay: (hour) => set({ timeOfDay: hour }),

  fps: 60,
  setFps: (fps) => set({ fps })
}));
```

---

## 성능 최적화

### 1. Instanced Rendering (고객 아바타)

```tsx
// src/features/digital-twin-3d/components/CustomerAvatars.tsx
import { Instances, Instance } from '@react-three/drei';
import { useRealtimeVisitors } from '../hooks/useRealtimeVisitors';

export const CustomerAvatars = ({ storeId }: { storeId: string }) => {
  const visitors = useRealtimeVisitors(storeId);

  return (
    <Instances limit={1000}>
      {/* 공유 지오메트리 + 머티리얼 */}
      <cylinderGeometry args={[0.3, 0.3, 1.8, 8]} />
      <meshStandardMaterial color="blue" />

      {/* 각 방문객 인스턴스 */}
      {visitors.map(visitor => (
        <Instance 
          key={visitor.id}
          position={[visitor.x, 0.9, visitor.y]}
          color={visitor.type === 'new' ? 'green' : 'blue'}
        />
      ))}
    </Instances>
  );
};
```

### 2. Frustum Culling (자동 + 수동)

```tsx
// Three.js는 기본적으로 Frustum Culling을 수행하지만,
// 커스텀 로직이 필요한 경우:

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';

export const OptimizedModel = ({ children }) => {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (groupRef.current) {
      // 카메라 시야각 밖이면 렌더링 스킵
      groupRef.current.visible = isInFrustum(groupRef.current, camera);
    }
  });

  return <group ref={groupRef}>{children}</group>;
};
```

### 3. 텍스처 압축 (KTX2)

```tsx
// src/utils/ktx2Loader.ts
import { KTX2Loader } from 'three-stdlib';
import { useThree } from '@react-three/fiber';

export const useKTX2Loader = () => {
  const { gl } = useThree();
  
  const loader = new KTX2Loader();
  loader.setTranscoderPath('/basis/');
  loader.detectSupport(gl);
  
  return loader;
};

// 사용 예시
const ktx2Loader = useKTX2Loader();
const texture = ktx2Loader.load('/models/textures/floor.ktx2');
```

### 4. Performance Monitor

```tsx
// src/features/digital-twin-3d/components/PerformanceMonitor.tsx
import { useFrame } from '@react-three/fiber';
import { use3DStore } from '../store/use3DStore';
import { useRef } from 'react';

export const PerformanceMonitor = () => {
  const setFps = use3DStore(state => state.setFps);
  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());

  useFrame(() => {
    frameCount.current++;
    const now = Date.now();
    
    if (now - lastTime.current >= 1000) {
      setFps(frameCount.current);
      frameCount.current = 0;
      lastTime.current = now;
      
      // 30 FPS 이하면 경고
      if (frameCount.current < 30) {
        console.warn('⚠️ Low FPS detected:', frameCount.current);
      }
    }
  });

  return null;
};

// Canvas에 추가
<Canvas>
  <PerformanceMonitor />
  {/* ... */}
</Canvas>
```

---

## 구현 체크리스트

### Phase 1: 언리얼 에셋 제작 (Month 1-2)

- [ ] **Week 1-2: 매장 구조 모델링**
  - [ ] Unreal Engine 5.3 설치
  - [ ] 프로젝트 생성 (Blank Template)
  - [ ] 매장 바닥 모델링 (50m × 30m)
  - [ ] 벽면 + 기둥 배치
  - [ ] 천장 + 창문 디테일

- [ ] **Week 3-4: PBR 머티리얼**
  - [ ] Master Material 생성
  - [ ] Material Instances (바닥, 벽, 선반)
  - [ ] 텍스처 적용 (Albedo, Normal, Roughness)
  - [ ] UV 매핑 확인

- [ ] **Week 5-6: 라이팅 베이크**
  - [ ] Directional Light 배치 (태양)
  - [ ] Point Light 그리드 (매장 조명)
  - [ ] Lightmap Resolution 설정
  - [ ] Production Quality 베이크 (30분~2시간)

- [ ] **Week 7-8: LOD + 최적화**
  - [ ] LOD0, LOD1, LOD2 자동 생성
  - [ ] Triangle Count 확인 (50%, 25%)
  - [ ] 테스트 렌더링

### Phase 2: glTF 파이프라인 (Month 3-4)

- [ ] **Week 9-10: Datasmith Exporter**
  - [ ] 플러그인 활성화
  - [ ] 익스포트 설정 (Binary .glb)
  - [ ] 첫 번째 익스포트 테스트

- [ ] **Week 11-12: glTF-Transform**
  - [ ] CLI 도구 설치
  - [ ] 최적화 스크립트 작성
  - [ ] WebP/KTX2 압축 테스트
  - [ ] 파일 크기 비교 (150MB → 25MB)

- [ ] **Week 13-14: Supabase Storage**
  - [ ] `3d-assets` Bucket 생성
  - [ ] RLS Policy 설정
  - [ ] 업로드 스크립트 작성
  - [ ] CDN URL 테스트

- [ ] **Week 15-16: CDN 성능**
  - [ ] 로딩 속도 측정 (3-5초 목표)
  - [ ] Cloudflare 캐싱 확인
  - [ ] Preload 전략 수립

### Phase 3: Three.js 통합 (Month 5-6)

- [ ] **Week 17-18: 기본 씬 구성**
  - [ ] React Three Fiber 설치
  - [ ] `UnrealStoreModel` 컴포넌트
  - [ ] GLTFLoader + 그림자 설정
  - [ ] 카메라 컨트롤 (OrbitControls)

- [ ] **Week 19-20: TrafficHeatmap 3D**
  - [ ] `useRealtimeTraffic` Hook
  - [ ] `HeatmapOverlay` 컴포넌트
  - [ ] Canvas API로 텍스처 생성
  - [ ] Supabase Realtime 연동

- [ ] **Week 21-22: FootfallVisualizer 3D**
  - [ ] Instanced Mesh로 아바타 렌더링
  - [ ] 동선 트레일 (Line Geometry)
  - [ ] 필터링 UI (신규/재방문)

- [ ] **Week 23-24: LayoutSimulator 3D**
  - [ ] Raycasting Drag & Drop
  - [ ] 그리드 스냅 기능
  - [ ] AI 추천 레이아웃 API 연동

### 테스팅 & 배포

- [ ] **성능 테스트**
  - [ ] Desktop: 60 FPS (1080p)
  - [ ] Mobile: 30 FPS (720p)
  - [ ] 저사양 PC: 폴백 (LOD2)

- [ ] **크로스 브라우저**
  - [ ] Chrome ✓
  - [ ] Firefox ✓
  - [ ] Safari ✓
  - [ ] Edge ✓

- [ ] **배포**
  - [ ] Lovable Cloud 빌드
  - [ ] CDN 캐시 무효화
  - [ ] 사용자 피드백 수집

---

## 예상 비용 및 일정

### 비용 (월간)

| 항목 | 비용 | 비고 |
|------|------|------|
| Supabase Storage (500GB) | $25 | 언리얼 에셋 |
| CDN 트래픽 (1TB) | $10 | Cloudflare |
| Edge Functions | $0 | 무료 티어 |
| Lovable Cloud | $0 | 기존 플랜 |
| **총계** | **$35/월** | |

### 일정

- **Month 1-2**: 언리얼 에셋 제작 (2명 × 2개월 = 4 man-months)
- **Month 3-4**: glTF 파이프라인 (1명 × 2개월 = 2 man-months)
- **Month 5-6**: Three.js 통합 (2명 × 2개월 = 4 man-months)
- **총 10 man-months**

---

## 다음 단계

1. **즉시 실행** (Day 1)
   - Unreal Engine 5.3 설치
   - 프로젝트 생성 및 기본 씬 구성

2. **첫 주** (Week 1)
   - 매장 바닥 + 벽면 모델링
   - PBR Master Material 생성

3. **첫 달** (Month 1)
   - 전체 매장 구조 완성
   - 라이팅 베이크

4. **2개월 후** (Month 2)
   - 첫 glTF 익스포트
   - Supabase Storage 업로드

5. **3개월 후** (Month 3)
   - Three.js 첫 렌더링 성공
   - TrafficHeatmap 3D 프로토타입

---

**문서 버전**: 3.0 (Hybrid First)  
**최종 수정**: 2025-11-12  
**작성자**: NEURALTWIN Development Team

**권장 사항**: 언리얼 팀이 있으므로 하이브리드 방식으로 바로 시작하여 Phase 1부터 프로덕션급 시각 품질을 확보하세요. R3F는 동적 레이어(히트맵, 아바타)에만 사용하여 개발 속도와 품질을 모두 달성할 수 있습니다.
