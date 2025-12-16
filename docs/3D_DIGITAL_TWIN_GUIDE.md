# 3D 디지털트윈 모델 준비 가이드라인

**버전**: 1.0
**작성일**: 2025-12-16
**기준 시드**: NEURALTWIN v8.0 ULTIMATE SEED

---

## 1. 개요

이 문서는 NEURALTWIN 디지털트윈 시뮬레이션 플랫폼에서 사용할 **3D 모델 파일** 및 **메타데이터** 준비를 위한 가이드라인입니다.

### 1.1 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NEURALTWIN 3D 디지털트윈 시스템                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   3D 모델    │───▶│  메타데이터   │───▶│  시뮬레이션  │          │
│  │  (GLB/GLTF)  │    │  (zones_dim) │    │   (AI 추론)  │          │
│  └──────────────┘    └──────────────┘    └──────────────┘          │
│         │                   │                   │                   │
│         ▼                   ▼                   ▼                   │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    store_scenes (씬 레시피)               │      │
│  │  • 공간 에셋 (SpaceAsset)                                │      │
│  │  • 가구 에셋 (FurnitureAsset)                            │      │
│  │  • 상품 에셋 (ProductAsset)                              │      │
│  │  • 조명 프리셋 (LightingPreset)                          │      │
│  │  • 이펙트 레이어 (히트맵, 동선, AI 추천)                  │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 기준 매장 레이아웃 (A매장 - 강남점)

### 2.1 매장 기본 정보

| 항목 | 값 |
|------|-----|
| **Store ID** | `d9830554-2688-4032-af40-acccda787ac4` |
| **매장명** | A매장 (TCAG 강남점 1F) |
| **주소** | 서울특별시 강남구 테헤란로 123 |
| **면적** | 250 m² |
| **최대 수용 인원** | 100명 |
| **직원 수** | 8명 |

### 2.2 존(Zone) 구성 - 7개 구역

| Zone ID | 코드 | 이름 | 타입 | 면적 | 3D 좌표 (x, y, z) | 크기 (W×D×H) | 색상 | 수용 |
|---------|------|------|------|------|-------------------|--------------|------|------|
| `a0000001-...` | Z001 | 입구 | `entrance` | 3 m² | (2.5, 0, -7.5) | 3×1×3 m | `#4CAF50` | 3명 |
| `a0000002-...` | Z002 | 메인홀 | `main` | 80 m² | (0, 0, 0) | 10×8×3 m | `#2196F3` | 40명 |
| `a0000003-...` | Z003 | 의류존 | `display` | 36 m² | (-5, 0, 3) | 6×6×3 m | `#9C27B0` | 18명 |
| `a0000004-...` | Z004 | 액세서리존 | `display` | 36 m² | (5, 0, 3) | 6×6×3 m | `#FF9800` | 18명 |
| `a0000005-...` | Z005 | 피팅룸 | `fitting` | 16 m² | (-5, 0, -5) | 4×4×3 m | `#E91E63` | 4명 |
| `a0000006-...` | Z006 | 계산대 | `checkout` | 9 m² | (4.5, 0, 5.5) | 3×3×3 m | `#00BCD4` | 4명 |
| `a0000007-...` | Z007 | 휴식공간 | `lounge` | 16 m² | (0, 0, 7) | 8×2×3 m | `#8BC34A` | 8명 |

### 2.3 존 배치 평면도 (상단에서 바라본 뷰)

```
                        Z (깊이 방향 +)
                              ▲
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    │   ┌───────────┐        │        ┌───────────┐   │
    │   │  Z007     │        │        │           │   │
    │   │ 휴식공간   │        │        │           │   │  z=7
    │   └───────────┘        │        └───────────┘   │
    │                         │                         │
    │   ┌───────────┐        │        ┌───────────┐   │
    │   │  Z003     │        │        │  Z006     │   │
    │   │  의류존    │        │        │  계산대   │   │  z=5.5
    │   │           │        │        │           │   │
    │   │  6×6 m    │   ┌────┴────┐   │  3×3 m    │   │  z=3
    │   │           │   │  Z002   │   │           │   │
    │   └───────────┘   │ 메인홀   │   └───────────┘   │
    │                    │         │                    │
    │                    │  10×8   │   ┌───────────┐   │
    │   ┌───────────┐   │         │   │  Z004     │   │
    │   │  Z005     │   │         │   │액세서리존  │   │  z=0
    │   │  피팅룸    │   └────┬────┘   │  6×6 m    │   │
    │   │  4×4 m    │        │        │           │   │
    │   └───────────┘        │        └───────────┘   │
    │                         │                         │  z=-5
    │       ┌─────────────────┼─────────────────┐      │
    │       │      Z001 입구   │   3×1 m        │      │  z=-7.5
    │       └─────────────────┼─────────────────┘      │
    │                         │                         │
    └─────────────────────────┼─────────────────────────┘
                              │
  ◀─────────────────────────────────────────────────────────▶ X
   x=-5                     x=0                        x=5
```

---

## 3. 3D 모델 파일 요구사항

### 3.1 파일 형식

| 형식 | 확장자 | 용도 | 우선순위 |
|------|--------|------|----------|
| **GLB** | `.glb` | 바이너리 glTF (권장) | ★★★ |
| **glTF** | `.gltf` + `.bin` | JSON glTF | ★★☆ |

> **권장**: GLB 형식 (단일 파일, 더 빠른 로딩)

### 3.2 폴리곤 및 텍스처 제한

| 항목 | 권장 | 최대 |
|------|------|------|
| **매장 전체 폴리곤** | 50,000 | 100,000 |
| **개별 가구 폴리곤** | 1,000-3,000 | 5,000 |
| **텍스처 해상도** | 1024×1024 | 2048×2048 |
| **텍스처 형식** | PNG, JPG | - |
| **파일 크기** | 10MB 미만 | 30MB |

### 3.3 좌표계 및 단위

```
        Y (높이 방향 +)
        │
        │
        │
        │
        │
        └───────────────▶ X (좌우 방향)
       /
      /
     /
    ▼
    Z (깊이 방향 -)
```

| 항목 | 설정 |
|------|------|
| **단위** | 미터 (m) |
| **좌표계** | 오른손 좌표계 (Y-up) |
| **원점** | 매장 중앙 바닥 (0, 0, 0) |
| **회전** | 라디안 (radians) |

### 3.4 모델 원점 설정

```
     ┌──────────────┐
     │              │
     │    모델      │
     │              │
     └──────────────┘
            ●  ◀── 원점: 바닥 중앙
```

- **원점 위치**: 모델 바닥면 중앙
- **Y=0**: 바닥면과 일치
- **회전 기준**: Y축 기준 회전

---

## 4. 필수 3D 모델 목록

### 4.1 공간 모델 (Space Assets)

| 모델명 | 파일명 (권장) | 용도 | 포함 요소 |
|--------|---------------|------|-----------|
| **매장 전체** | `store_gangnam_main.glb` | 매장 기본 구조 | 바닥, 벽, 천장, 기둥 |
| **바닥 플레인** | `floor_250sqm.glb` | 바닥 (히트맵 오버레이용) | 250m² 바닥면 |

### 4.2 가구/집기 모델 (Furniture Assets)

| 엔티티 타입 | 파일명 (권장) | 크기 (W×D×H) | movable | 배치 존 |
|-------------|---------------|--------------|---------|---------|
| `Rack` | `rack_clothing_01.glb` | 1.5×0.6×1.8 m | ✅ true | Z003, Z004 |
| `Shelf` | `shelf_display_01.glb` | 1.2×0.4×2.0 m | ✅ true | Z003, Z004 |
| `DisplayTable` | `table_display_01.glb` | 1.0×0.8×0.9 m | ✅ true | Z002, Z003, Z004 |
| `CheckoutCounter` | `counter_checkout_01.glb` | 2.0×0.6×1.1 m | ❌ false | Z006 |
| `FittingRoom` | `fitting_room_01.glb` | 1.2×1.2×2.2 m | ❌ false | Z005 |
| `Bench` | `bench_lounge_01.glb` | 1.5×0.5×0.5 m | ✅ true | Z007 |
| `Mannequin` | `mannequin_01.glb` | 0.5×0.3×1.8 m | ✅ true | Z002, Z003 |
| `Mirror` | `mirror_full_01.glb` | 0.8×0.05×1.8 m | ✅ true | Z005 |
| `Kiosk` | `kiosk_info_01.glb` | 0.6×0.6×1.5 m | ✅ true | Z001, Z002 |

### 4.3 상품 모델 (Product Assets)

상품 모델은 선택적이며, 없을 경우 기본 박스로 대체됩니다.

| 카테고리 | 파일명 (권장) | 크기 | 예시 |
|----------|---------------|------|------|
| 의류 | `product_clothing_*.glb` | 0.4×0.3×0.6 m | 접힌 셔츠, 팬츠 |
| 신발 | `product_shoes_*.glb` | 0.3×0.1×0.15 m | 운동화, 구두 |
| 액세서리 | `product_accessory_*.glb` | 0.1×0.1×0.1 m | 벨트, 가방 |

---

## 5. 메타데이터 연동

### 5.1 zones_dim 테이블 스키마

```typescript
interface ZoneDim {
  id: UUID;
  store_id: UUID;
  zone_code: string;      // 'Z001', 'Z002', ...
  zone_name: string;      // '입구', '메인홀', ...
  zone_type: ZoneType;    // 'entrance' | 'main' | 'display' | 'fitting' | 'checkout' | 'lounge'
  area_sqm: number;

  // 3D 좌표 (미터)
  position_x: number;
  position_y: number;
  position_z: number;

  // 크기 (미터)
  size_width: number;
  size_depth: number;
  size_height: number;

  // 시각화
  color: string;          // HEX 색상 '#RRGGBB'
  capacity: number;       // 최대 수용 인원

  // JSONB 좌표 (2D 호환)
  coordinates: {
    x: number;
    y: number;
    z: number;
    width: number;
    depth: number;
  };
}
```

### 5.2 store_scenes 테이블 스키마

```typescript
interface StoreScene {
  id: UUID;
  store_id: UUID;
  name: string;
  description: string;

  scene_data: {
    version: string;        // '1.0'
    viewport: {
      width: number;
      height: number;
      zoom: number;
    };
    zones: Array<{
      id: string;           // zones_dim.id 참조
      name: string;
      x: number;            // 2D 뷰포트 좌표
      y: number;
      width: number;
      height: number;
      color: string;
    }>;
    connections: Array<{
      from: string;         // zone_id
      to: string;           // zone_id
    }>;
  };

  is_active: boolean;
  thumbnail_url?: string;
}
```

### 5.3 SceneRecipe 타입 (프론트엔드)

```typescript
interface SceneRecipe {
  space: SpaceAsset;              // 매장 공간 모델
  furniture: FurnitureAsset[];    // 가구 배치
  products: ProductAsset[];       // 상품 배치
  lighting: LightingPreset;       // 조명 설정
  effects?: EffectLayer[];        // 오버레이 (히트맵 등)
  camera?: {
    position: Vector3D;
    target: Vector3D;
    fov?: number;
  };
}

interface SpaceAsset {
  id: string;
  type: 'space';
  model_url: string;              // Supabase Storage URL
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  zone_name?: string;
  isBaked?: boolean;              // Blender combined bake 여부
}

interface FurnitureAsset {
  id: string;
  type: 'furniture';
  model_url: string;
  position: Vector3D;
  rotation: Vector3D;
  scale: Vector3D;
  furniture_type?: string;
  movable?: boolean;              // AI 레이아웃 최적화 대상 여부
  suggested_position?: Vector3D;  // AI 제안 위치
  optimization_reason?: string;   // AI 제안 이유
}
```

---

## 6. 스토리지 구조

### 6.1 Supabase Storage 경로

```
3d-models/
├── {user_id}/
│   └── {store_id}/
│       └── 3d-models/
│           ├── store_gangnam_main.glb      # 매장 전체 모델
│           ├── rack_clothing_01.glb         # 의류 랙
│           ├── shelf_display_01.glb         # 진열대
│           ├── counter_checkout_01.glb      # 계산대
│           └── ...
```

### 6.2 파일 업로드 API

```typescript
// 모델 업로드
const { data, error } = await supabase.storage
  .from('3d-models')
  .upload(`${userId}/${storeId}/3d-models/${fileName}`, file);

// 공개 URL 획득
const { data: { publicUrl } } = supabase.storage
  .from('3d-models')
  .getPublicUrl(`${userId}/${storeId}/3d-models/${fileName}`);
```

---

## 7. AI 모델 분석 연동

### 7.1 자동 분석 플로우

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  3D 모델     │────▶│ analyze-3d-model │────▶│ ontology_entity_ │
│  업로드      │     │   Edge Function  │     │ types 매칭       │
└──────────────┘     └──────────────────┘     └──────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  분석 결과       │
                     │  • entity_type   │
                     │  • dimensions    │
                     │  • movable       │
                     │  • confidence    │
                     └──────────────────┘
```

### 7.2 온톨로지 엔티티 타입 (30개)

시스템에서 지원하는 엔티티 타입:

**핵심 비즈니스 엔티티 (1-10)**
- `Store`, `Zone`, `Product`, `Customer`, `Staff`
- `Transaction`, `Visit`, `Purchase`, `Promotion`, `Category`

**분석/메트릭 엔티티 (11-20)**
- `DailyKPI`, `HourlyMetric`, `ZoneMetric`, `ProductPerformance`, `CustomerSegment`
- `FunnelStage`, `Heatmap`, `Trend`, `Anomaly`, `Forecast`

**전략/AI 엔티티 (21-30)**
- `Strategy`, `Recommendation`, `Insight`, `Alert`, `Goal`
- `Scenario`, `Simulation`, `ExternalFactor`, `Event`, `Inventory`

### 7.3 Movability 규칙

| movable=true | movable=false |
|--------------|---------------|
| Rack, Shelf, DisplayTable | Store, Zone |
| Mannequin, Bench, Mirror | Camera, Beacon, POS |
| Kiosk, Product | 벽, 기둥, 천장 |

---

## 8. 조명 프리셋

### 8.1 기본 조명 설정

```typescript
const defaultLighting: LightingPreset = {
  name: 'retail_standard',
  description: '소매 매장 표준 조명',
  lights: [
    {
      type: 'ambient',
      color: '#ffffff',
      intensity: 0.4
    },
    {
      type: 'directional',
      color: '#ffffff',
      intensity: 0.8,
      position: { x: 10, y: 15, z: 10 },
      target: { x: 0, y: 0, z: 0 }
    },
    {
      type: 'point',
      color: '#fff5e6',  // 따뜻한 톤
      intensity: 0.6,
      position: { x: -5, y: 3, z: 3 }  // 의류존 위
    }
  ]
};
```

### 8.2 Baked 모델 처리

Blender에서 조명을 베이크한 모델의 경우:

```typescript
const bakedSpaceAsset: SpaceAsset = {
  // ...
  isBaked: true  // 실시간 조명 영향 제외
};
```

---

## 9. 데이터 연동 예시

### 9.1 히트맵 오버레이

```typescript
// zone_daily_metrics → 히트맵 데이터
const heatmapData = zoneMetrics.map(zone => ({
  zone_id: zone.zone_id,
  intensity: zone.total_visitors / maxVisitors,  // 0~1 정규화
  color: getHeatmapColor(zone.total_visitors)
}));

// 3D 씬에 오버레이
const effects: EffectLayer[] = [{
  type: 'heatmap',
  data: heatmapData,
  opacity: 0.7
}];
```

### 9.2 AI 레이아웃 추천

```typescript
// AI가 분석한 결과
const aiLayoutResult: AILayoutResult = {
  zones: [{
    zone_id: 'a0000003-...',  // 의류존
    zone_type: 'display',
    furniture: [{
      furniture_id: 'rack-001',
      entity_type: 'Rack',
      current_position: { x: -5, y: 0, z: 3 },
      suggested_position: { x: -4, y: 0, z: 2 },
      optimization_reason: '동선 개선: 입구에서 접근성 15% 향상'
    }]
  }],
  optimization_summary: '전체 고객 체류시간 8% 증가 예상'
};
```

---

## 10. 체크리스트

### 10.1 모델 제작 체크리스트

- [ ] GLB 형식으로 내보내기
- [ ] Y-up 좌표계 확인
- [ ] 단위: 미터(m) 설정
- [ ] 원점: 바닥 중앙 설정
- [ ] 폴리곤 수 최적화 (가구 3,000 이하)
- [ ] 텍스처 해상도 확인 (1024×1024)
- [ ] 파일명 규칙 준수 (`type_category_##.glb`)

### 10.2 메타데이터 체크리스트

- [ ] zones_dim 좌표와 3D 모델 위치 일치
- [ ] store_scenes.scene_data에 모든 zone 포함
- [ ] 가구별 movable 속성 정의
- [ ] 엔티티 타입 매칭 확인

### 10.3 통합 테스트 체크리스트

- [ ] Store3DViewer에서 모델 로드 확인
- [ ] SceneComposer에서 가구 배치 확인
- [ ] 히트맵 오버레이 정상 표시
- [ ] AI 추천 결과 시각화 확인

---

## 11. 문의 및 지원

- **기술 문의**: 개발팀
- **3D 모델링 문의**: 디지털트윈 팀
- **데이터 구조 문의**: DATA_FLOW_ARCHITECTURE.md 참조

---

*문서 버전: 1.0*
*최종 업데이트: 2025-12-16*
