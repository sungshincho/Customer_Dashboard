# 3D 디지털트윈 모델 준비 가이드라인

**버전**: 2.4 (Implementation Complete)
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

### 1.2 NEURALTWIN v8.0 데이터셋 요약

```
┌─────────────────────────────────────────────────────────────────────┐
│ 마스터 데이터 (L2 DIM)                                              │
├─────────────────────────────────────────────────────────────────────┤
│ • stores: 1건                     • zones_dim: 7건                  │
│ • products: 25건                  • customers: 2,500건              │
│ • staff: 8건                      • store_goals: 10건               │
├─────────────────────────────────────────────────────────────────────┤
│ 트랜잭션 데이터 (L2 FACT)                                           │
├─────────────────────────────────────────────────────────────────────┤
│ • store_visits: ~3,500건          • purchases: ~490건               │
│ • transactions: ~490건            • line_items: ~980건              │
│ • funnel_events: ~6,000건         • zone_events: ~5,000건           │
├─────────────────────────────────────────────────────────────────────┤
│ 집계 데이터 (L3 AGG)                                                │
├─────────────────────────────────────────────────────────────────────┤
│ • daily_kpis_agg: 90건            • daily_sales: 90건               │
│ • zone_daily_metrics: 630건       • hourly_metrics: 1,080건         │
│ • product_performance_agg: 2,250건• customer_segments_agg: 540건    │
├─────────────────────────────────────────────────────────────────────┤
│ AI/전략 데이터 (L3)                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ • applied_strategies: 5건         • strategy_daily_metrics: ~50건   │
│ • strategy_feedback: 20건         • ai_inference_results: 50건      │
│ • ai_recommendations: ~8건        • inventory_levels: 25건          │
├─────────────────────────────────────────────────────────────────────┤
│ 온톨로지/그래프 데이터 (L1)                                         │
├─────────────────────────────────────────────────────────────────────┤
│ • ontology_entity_types: 30건     • ontology_relation_types: 15건   │
│ • graph_entities: 30건            • graph_relations: 30건           │
│ • store_scenes: 1건               • retail_concepts: 12건           │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 온톨로지 스키마 아키텍처

NEURALTWIN은 **계층적 온톨로지 아키텍처**를 사용합니다.

#### 마스터 온톨로지 vs 사용자/스토어 온톨로지

```
┌─────────────────────────────────────────────────────────────────────┐
│                    온톨로지 스키마 구조                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │            마스터 온톨로지 (Master Ontology)                   │  │
│  │            org_id IS NULL AND user_id IS NULL                 │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  • Entity Types: 185건 (리테일 산업 공통 개념)                 │  │
│  │  • Relation Types: 110건 (엔티티 간 관계 정의)                 │  │
│  │  • 용도: 모든 스토어에서 공유하는 기본 스키마                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                              ▼ 상속/확장                            │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │          사용자/스토어 온톨로지 (User/Store Ontology)          │  │
│  │          user_id = {specific_user_id}                         │  │
│  ├───────────────────────────────────────────────────────────────┤  │
│  │  • Entity Types: 30건 (v8.0 데모용 인스턴스)                   │  │
│  │  • Relation Types: 15건 (스토어별 커스텀 관계)                 │  │
│  │  • 용도: 특정 스토어에 맞춤화된 스키마                         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 스키마 병합 로직 (`useOntologySchema.ts`)

```typescript
// 마스터 + 사용자 타입 통합 조회
.or(`and(org_id.is.null,user_id.is.null),user_id.eq.${user.user.id}`)

// 중복 시 사용자 타입이 마스터보다 우선
function deduplicateByName(items) {
  // 이름이 같은 경우 user_id가 있는 항목이 우선
  if (item.user_id !== null && existing.user_id === null) {
    byName.set(item.name, item);
  }
}
```

#### v8.0 활용률 분석

| 구분 | Master | v8.0 User | 활용률 | 설명 |
|------|--------|-----------|--------|------|
| Entity Types | 185건 | 30건 | 16% | 의도된 MVP 범위 |
| Relation Types | 110건 | 15건 | 14% | 필수 관계만 구현 |

> **참고**: 16%의 활용률은 문제가 아닌 **의도된 설계**입니다.
> - 마스터 온톨로지 = 리테일 산업 전체 도메인 모델
> - v8.0 사용자 온톨로지 = 서울 플래그십 스토어 1개 데모용
> - 향후 다른 스토어/업종 추가 시 마스터 온톨로지 확장 가능

#### 데이터 삭제 시 주의사항

v8.0 시드 스크립트의 STEP 20/21은 **사용자별 타입만 삭제**합니다:

```sql
-- 마스터 온톨로지는 보존됨 (삭제되지 않음)
DELETE FROM ontology_entity_types WHERE user_id = v_user_id;
DELETE FROM ontology_relation_types WHERE user_id = v_user_id;
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
| **개별 상품 폴리곤** | 200-500 | 1,000 |
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

## 4. 필수 3D 모델 목록 (전체)

### 4.1 공간 모델 (Space Assets) - 2건

| # | 모델명 | 파일명 | 용도 | 포함 요소 | 크기 |
|---|--------|--------|------|-----------|------|
| 1 | 매장 전체 | `store_gangnam_main.glb` | 매장 기본 구조 | 바닥, 벽, 천장, 기둥, 조명 레일 | 20×16×3 m |
| 2 | 바닥 플레인 | `floor_250sqm.glb` | 히트맵 오버레이용 | 250m² 평면 메쉬 | 20×16 m |

---

### 4.2 존별 가구/집기 모델 (Furniture Assets) - 총 52건

#### Z001 입구 (entrance) - 4건

| # | 모델명 | 파일명 | 크기 (W×D×H) | 수량 | movable | 설명 |
|---|--------|--------|--------------|------|---------|------|
| 1 | 입구 게이트 | `gate_entrance_01.glb` | 3.0×0.3×2.5 m | 1 | ❌ | 보안 게이트/센서 |
| 2 | 환영 사인 | `sign_welcome_01.glb` | 1.5×0.1×0.8 m | 1 | ✅ | LED 환영 사인보드 |
| 3 | 안내 키오스크 | `kiosk_info_01.glb` | 0.6×0.6×1.5 m | 1 | ✅ | 터치스크린 안내대 |
| 4 | 쇼핑카트 거치대 | `cart_stand_01.glb` | 1.0×0.5×1.0 m | 1 | ❌ | 쇼핑카트/바구니 거치대 |

#### Z002 메인홀 (main) - 12건

| # | 모델명 | 파일명 | 크기 (W×D×H) | 수량 | movable | 설명 |
|---|--------|--------|--------------|------|---------|------|
| 1 | 중앙 디스플레이 테이블 | `table_display_center_01.glb` | 2.0×1.2×0.9 m | 2 | ✅ | 시즌 상품 전시 |
| 2 | 원형 디스플레이 | `display_round_01.glb` | 1.5×1.5×1.2 m | 1 | ✅ | 360도 회전 전시대 |
| 3 | 프로모션 스탠드 | `stand_promo_01.glb` | 0.6×0.4×1.8 m | 4 | ✅ | 세일/프로모션 안내 |
| 4 | 마네킹 (전신) | `mannequin_full_01.glb` | 0.5×0.3×1.8 m | 4 | ✅ | 코디네이션 전시 |
| 5 | 천장 배너 행거 | `banner_hanger_01.glb` | 2.0×0.1×0.5 m | 2 | ❌ | 시즌 배너 |

#### Z003 의류존 (display - 여성/남성 의류) - 14건

| # | 모델명 | 파일명 | 크기 (W×D×H) | 수량 | movable | 설명 |
|---|--------|--------|--------------|------|---------|------|
| 1 | 의류 행거 랙 (더블) | `rack_clothing_double_01.glb` | 1.5×0.6×1.8 m | 4 | ✅ | 아우터/상의 전시 |
| 2 | 의류 행거 랙 (싱글) | `rack_clothing_single_01.glb` | 1.2×0.4×1.8 m | 4 | ✅ | 팬츠/스커트 전시 |
| 3 | 선반형 진열대 | `shelf_display_01.glb` | 1.2×0.4×2.0 m | 2 | ✅ | 접힌 의류 전시 |
| 4 | 테이블 디스플레이 | `table_display_01.glb` | 1.0×0.8×0.9 m | 2 | ✅ | 신상품 전시 |
| 5 | 마네킹 (상반신) | `mannequin_torso_01.glb` | 0.4×0.3×0.9 m | 4 | ✅ | 상의 전시용 |
| 6 | 전신 거울 | `mirror_full_01.glb` | 0.8×0.05×1.8 m | 2 | ✅ | 고객용 거울 |
| 7 | 사이즈 표시판 | `sign_size_01.glb` | 0.3×0.05×0.2 m | 8 | ✅ | S/M/L/XL 표시 |

#### Z004 액세서리존 (display) - 10건

| # | 모델명 | 파일명 | 크기 (W×D×H) | 수량 | movable | 설명 |
|---|--------|--------|--------------|------|---------|------|
| 1 | 쇼케이스 (잠금형) | `showcase_locked_01.glb` | 1.0×0.5×1.2 m | 2 | ❌ | 고가 액세서리 |
| 2 | 오픈 쇼케이스 | `showcase_open_01.glb` | 1.2×0.4×1.0 m | 2 | ✅ | 일반 액세서리 |
| 3 | 가방 진열대 | `display_bag_01.glb` | 1.5×0.5×1.5 m | 2 | ✅ | 토트백/핸드백 |
| 4 | 스카프 행거 | `hanger_scarf_01.glb` | 0.6×0.3×1.6 m | 2 | ✅ | 스카프/머플러 |
| 5 | 회전형 악세서리 스탠드 | `stand_accessory_01.glb` | 0.4×0.4×1.4 m | 2 | ✅ | 벨트/목걸이 |
| 6 | 신발 진열대 | `shelf_shoes_01.glb` | 1.2×0.4×1.8 m | 3 | ✅ | 신발 전시 |

#### Z005 피팅룸 (fitting) - 6건

| # | 모델명 | 파일명 | 크기 (W×D×H) | 수량 | movable | 설명 |
|---|--------|--------|--------------|------|---------|------|
| 1 | 피팅룸 부스 | `fitting_booth_01.glb` | 1.2×1.2×2.2 m | 4 | ❌ | 탈의실 (커튼 포함) |
| 2 | 피팅룸 내부 거울 | `mirror_fitting_01.glb` | 0.6×0.05×1.5 m | 4 | ❌ | 부스 내부 거울 |
| 3 | 피팅룸 의자 | `stool_fitting_01.glb` | 0.4×0.4×0.45 m | 4 | ✅ | 착석용 스툴 |
| 4 | 옷걸이 훅 | `hook_clothes_01.glb` | 0.15×0.1×0.1 m | 8 | ❌ | 벽면 옷걸이 |
| 5 | 대기 벤치 | `bench_waiting_01.glb` | 1.5×0.5×0.45 m | 1 | ✅ | 피팅 대기용 |
| 6 | 번호표 디스플레이 | `display_queue_01.glb` | 0.3×0.1×0.4 m | 1 | ❌ | 대기 순번 표시 |

#### Z006 계산대 (checkout) - 8건

| # | 모델명 | 파일명 | 크기 (W×D×H) | 수량 | movable | 설명 |
|---|--------|--------|--------------|------|---------|------|
| 1 | 계산대 카운터 | `counter_checkout_01.glb` | 2.0×0.6×1.1 m | 2 | ❌ | 메인 계산대 |
| 2 | POS 단말기 | `pos_terminal_01.glb` | 0.3×0.3×0.4 m | 2 | ❌ | 결제 단말기 |
| 3 | 카드 리더기 | `card_reader_01.glb` | 0.15×0.1×0.2 m | 2 | ❌ | 카드/모바일 결제 |
| 4 | 포장대 | `table_packing_01.glb` | 1.5×0.6×0.9 m | 1 | ✅ | 상품 포장 |
| 5 | 쇼핑백 거치대 | `stand_bag_01.glb` | 0.5×0.3×0.8 m | 2 | ✅ | 쇼핑백 보관 |
| 6 | 영수증 프린터 | `printer_receipt_01.glb` | 0.15×0.2×0.15 m | 2 | ❌ | 영수증 출력 |
| 7 | 고객 서명패드 | `signpad_01.glb` | 0.2×0.15×0.05 m | 2 | ❌ | 전자 서명 |
| 8 | 대기선 스탠드 | `stand_queue_01.glb` | 0.3×0.3×1.0 m | 4 | ✅ | 줄서기 안내 |

#### Z007 휴식공간 (lounge) - 6건

| # | 모델명 | 파일명 | 크기 (W×D×H) | 수량 | movable | 설명 |
|---|--------|--------|--------------|------|---------|------|
| 1 | 라운지 소파 (2인) | `sofa_2seat_01.glb` | 1.5×0.8×0.85 m | 2 | ✅ | 2인용 소파 |
| 2 | 라운지 의자 | `chair_lounge_01.glb` | 0.6×0.6×0.8 m | 2 | ✅ | 1인용 의자 |
| 3 | 커피 테이블 | `table_coffee_01.glb` | 0.8×0.5×0.45 m | 2 | ✅ | 소파 앞 테이블 |
| 4 | 잡지 꽂이 | `rack_magazine_01.glb` | 0.4×0.3×0.5 m | 1 | ✅ | 카탈로그/잡지 |
| 5 | 화분 (장식) | `plant_pot_01.glb` | 0.4×0.4×1.2 m | 2 | ✅ | 인테리어 식물 |
| 6 | 음료 자판기 | `vending_drink_01.glb` | 0.8×0.6×1.8 m | 1 | ❌ | 음료 자판기 |

---

### 4.3 상품 모델 (Product Assets) - 25건 (전체 목록)

NEURALTWIN v8.0 시드에 정의된 모든 상품:

#### 아우터 (5건) - SKU-OUT-001 ~ 005

| # | SKU | 상품명 | 파일명 | 초기 배치 가구 | 슬롯 | 3D 좌표 |
|---|-----|--------|--------|---------------|------|---------|
| 1 | SKU-OUT-001 | 프리미엄 캐시미어 코트 | `product_coat_cashmere_01.glb` | `rack_clothing_double_01` | A1 | (-6.0, 1.2, 1.0) |
| 2 | SKU-OUT-002 | 울 테일러드 재킷 | `product_jacket_tailored_01.glb` | `rack_clothing_double_01` | A2 | (-6.0, 1.2, 1.3) |
| 3 | SKU-OUT-003 | 다운 패딩 | `product_padding_down_01.glb` | `rack_clothing_double_02` | A1 | (-6.0, 1.2, 2.0) |
| 4 | SKU-OUT-004 | 트렌치 코트 | `product_coat_trench_01.glb` | `rack_clothing_double_02` | A2 | (-6.0, 1.2, 2.3) |
| 5 | SKU-OUT-005 | 레더 자켓 | `product_jacket_leather_01.glb` | `rack_clothing_double_03` | A1 | (-4.5, 1.2, 1.0) |

#### 상의 (5건) - SKU-TOP-001 ~ 005

| # | SKU | 상품명 | 파일명 | 초기 배치 가구 | 슬롯 | 3D 좌표 |
|---|-----|--------|--------|---------------|------|---------|
| 6 | SKU-TOP-001 | 실크 블라우스 | `product_blouse_silk_01.glb` | `rack_clothing_single_01` | B1 | (-4.5, 1.0, 2.0) |
| 7 | SKU-TOP-002 | 캐주얼 니트 스웨터 | `product_sweater_knit_01.glb` | `shelf_display_01` | C1 | (-5.5, 1.5, 3.5) |
| 8 | SKU-TOP-003 | 옥스포드 셔츠 | `product_shirt_oxford_01.glb` | `rack_clothing_single_02` | B1 | (-4.0, 1.0, 3.0) |
| 9 | SKU-TOP-004 | 린넨 탑 | `product_top_linen_01.glb` | `table_display_01` | D1 | (-5.0, 0.95, 4.0) |
| 10 | SKU-TOP-005 | 폴로 셔츠 | `product_shirt_polo_01.glb` | `shelf_display_01` | C2 | (-5.5, 1.2, 3.5) |

#### 하의 (5건) - SKU-BTM-001 ~ 005

| # | SKU | 상품명 | 파일명 | 초기 배치 가구 | 슬롯 | 3D 좌표 |
|---|-----|--------|--------|---------------|------|---------|
| 11 | SKU-BTM-001 | 리넨 와이드 팬츠 | `product_pants_wide_01.glb` | `rack_clothing_single_03` | B1 | (-4.0, 1.0, 4.5) |
| 12 | SKU-BTM-002 | 슬림핏 데님 | `product_jeans_slim_01.glb` | `rack_clothing_single_03` | B2 | (-4.0, 1.0, 4.8) |
| 13 | SKU-BTM-003 | 치노 팬츠 | `product_pants_chino_01.glb` | `rack_clothing_single_04` | B1 | (-3.5, 1.0, 5.0) |
| 14 | SKU-BTM-004 | 조거 팬츠 | `product_pants_jogger_01.glb` | `shelf_display_02` | C1 | (-5.0, 1.5, 5.5) |
| 15 | SKU-BTM-005 | A라인 스커트 | `product_skirt_aline_01.glb` | `table_display_02` | D1 | (-4.5, 0.95, 5.0) |

#### 액세서리 (5건) - SKU-ACC-001 ~ 005

| # | SKU | 상품명 | 파일명 | 초기 배치 가구 | 슬롯 | 3D 좌표 |
|---|-----|--------|--------|---------------|------|---------|
| 16 | SKU-ACC-001 | 가죽 토트백 | `product_bag_tote_01.glb` | `display_bag_01` | E1 | (5.0, 1.2, 1.5) |
| 17 | SKU-ACC-002 | 실버 목걸이 | `product_necklace_silver_01.glb` | `showcase_locked_01` | F1 | (4.5, 1.0, 2.0) |
| 18 | SKU-ACC-003 | 가죽 벨트 | `product_belt_leather_01.glb` | `stand_accessory_01` | G1 | (5.5, 1.1, 2.5) |
| 19 | SKU-ACC-004 | 스카프 세트 | `product_scarf_set_01.glb` | `hanger_scarf_01` | H1 | (6.0, 1.3, 3.0) |
| 20 | SKU-ACC-005 | 울 머플러 | `product_muffler_wool_01.glb` | `hanger_scarf_02` | H2 | (6.0, 1.3, 3.5) |

#### 신발 (3건) - SKU-SHO-001 ~ 003

| # | SKU | 상품명 | 파일명 | 초기 배치 가구 | 슬롯 | 3D 좌표 |
|---|-----|--------|--------|---------------|------|---------|
| 21 | SKU-SHO-001 | 프리미엄 로퍼 | `product_shoes_loafer_01.glb` | `shelf_shoes_01` | I1 | (5.5, 0.8, 4.0) |
| 22 | SKU-SHO-002 | 하이힐 펌프스 | `product_shoes_heels_01.glb` | `shelf_shoes_01` | I2 | (5.5, 0.5, 4.0) |
| 23 | SKU-SHO-003 | 스니커즈 | `product_shoes_sneakers_01.glb` | `shelf_shoes_02` | I1 | (5.5, 0.8, 4.5) |

#### 화장품 (2건) - SKU-COS-001 ~ 002

| # | SKU | 상품명 | 파일명 | 초기 배치 가구 | 슬롯 | 3D 좌표 |
|---|-----|--------|--------|---------------|------|---------|
| 24 | SKU-COS-001 | 프리미엄 스킨케어 세트 | `product_skincare_set_01.glb` | `showcase_open_01` | J1 | (4.0, 0.9, 5.0) |
| 25 | SKU-COS-002 | 립스틱 컬렉션 | `product_lipstick_set_01.glb` | `showcase_open_01` | J2 | (4.0, 0.9, 5.2) |

#### 상품 배치 메타데이터 스키마

```typescript
interface ProductPlacement {
  // 기본 정보
  product_id: string;
  sku: string;
  model_url: string;

  // 초기 배치 정보 (필수)
  initial_placement: {
    zone_id: string;              // 배치 존 ID
    furniture_id: string;         // 배치 가구 ID
    furniture_type: string;       // 가구 타입 (rack, shelf, display, etc.)
    slot_id: string;              // 가구 내 슬롯 ID (A1, B2, C3...)
    position: Vector3D;           // 절대 3D 좌표
    rotation: Vector3D;           // 회전 (라디안)
    relative_position?: Vector3D; // 가구 기준 상대 좌표
  };

  // 시뮬레이션/최적화 결과 (선택)
  optimization_result?: {
    suggested_zone_id?: string;
    suggested_furniture_id?: string;
    suggested_slot_id?: string;
    suggested_position: Vector3D;
    suggested_rotation?: Vector3D;
    optimization_reason: string;      // AI 추천 이유
    expected_impact: {
      revenue_change_pct: number;     // 예상 매출 변화 %
      visibility_score: number;       // 노출도 점수 (0-1)
      accessibility_score: number;    // 접근성 점수 (0-1)
    };
    confidence: number;               // 신뢰도 (0-1)
  };

  // 이동 가능 여부
  movable: boolean;  // 상품은 기본적으로 true
}
```

#### 가구-상품 슬롯 매핑

| 가구 타입 | 슬롯 ID 패턴 | 설명 | 최대 수용 |
|----------|-------------|------|----------|
| `rack_clothing_double` | A1, A2, A3... | 행거 위치 (좌→우) | 8개 |
| `rack_clothing_single` | B1, B2, B3... | 행거 위치 (좌→우) | 6개 |
| `shelf_display` | C1, C2, C3... | 선반 층 (상→하) | 4층×3개 |
| `table_display` | D1, D2, D3, D4 | 테이블 4분면 | 4개 |
| `display_bag` | E1, E2, E3... | 가방 스탠드 | 6개 |
| `showcase_locked` | F1, F2, F3... | 쇼케이스 칸 | 9개 |
| `stand_accessory` | G1, G2, G3... | 회전 스탠드 층 | 4개 |
| `hanger_scarf` | H1, H2, H3... | 스카프 훅 | 6개 |
| `shelf_shoes` | I1, I2, I3... | 신발 선반 (상→하) | 3층×4개 |
| `showcase_open` | J1, J2, J3... | 오픈 쇼케이스 칸 | 6개 |

---

### 4.4 가구/상품 배치 최적화 시스템

#### 4.4.1 AI 레이아웃 최적화 결과 스키마

```typescript
interface AILayoutOptimizationResult {
  // 메타정보
  optimization_id: string;
  store_id: string;
  created_at: string;
  optimization_type: 'furniture' | 'product' | 'both';

  // 가구 배치 변경 제안
  furniture_changes: Array<{
    furniture_id: string;
    furniture_type: string;
    movable: boolean;           // movable=false면 변경 제안 안함

    current: {
      zone_id: string;
      position: Vector3D;
      rotation: Vector3D;
    };

    suggested: {
      zone_id: string;
      position: Vector3D;
      rotation: Vector3D;
    };

    reason: string;
    priority: 'high' | 'medium' | 'low';
    expected_impact: number;    // % 개선
  }>;

  // 상품 배치 변경 제안
  product_changes: Array<{
    product_id: string;
    sku: string;

    current: {
      zone_id: string;
      furniture_id: string;
      slot_id: string;
      position: Vector3D;
    };

    suggested: {
      zone_id: string;
      furniture_id: string;
      slot_id: string;
      position: Vector3D;
    };

    reason: string;
    priority: 'high' | 'medium' | 'low';
    expected_revenue_impact: number;
    expected_visibility_impact: number;
  }>;

  // 전체 최적화 요약
  summary: {
    total_furniture_changes: number;
    total_product_changes: number;
    expected_revenue_improvement: number;     // %
    expected_traffic_improvement: number;     // %
    expected_conversion_improvement: number;  // %
  };
}
```

#### 4.4.2 시뮬레이션 시각화 모드

| 모드 | 설명 | 시각적 표현 |
|------|------|------------|
| **Current** | 현재 배치 상태 | 실제 위치 렌더링 |
| **Suggested** | AI 추천 배치 | 반투명 고스트 오버레이 |
| **Comparison** | 현재 vs 추천 | 현재(실선) + 추천(점선) + 이동 화살표 |
| **Heatmap** | 성과 기반 히트맵 | 매출/노출도 기준 색상 코딩 |
| **Animation** | 이동 애니메이션 | 현재→추천 위치 이동 모션 |

#### 4.4.3 배치 변경 시각화 컴포넌트

```typescript
interface PlacementChangeVisualization {
  // 이동 경로 표시
  showMovementPath: boolean;
  pathColor: string;           // 기본: '#3b82f6'
  pathWidth: number;           // 기본: 0.05m
  pathAnimated: boolean;       // 애니메이션 여부

  // 고스트 모델 (추천 위치)
  showGhostModel: boolean;
  ghostOpacity: number;        // 기본: 0.5
  ghostColor: string;          // 기본: '#22c55e'

  // 영향도 표시
  showImpactIndicator: boolean;
  impactBadgePosition: 'top' | 'side';

  // 비교 모드
  comparisonMode: 'side-by-side' | 'overlay' | 'toggle';
}
```

---

### 4.5 직원 모델 (Staff Assets) - 8건

직원 시각화용 3D 아바타 모델:

| # | Staff ID | 이름 | 직책 | 담당 구역 | 파일명 | 특징 |
|---|----------|------|------|-----------|--------|------|
| 1 | `e0000001-...` | 김민준 | 매장 매니저 | 전체 (all) | `staff_manager_male_01.glb` | 정장, 명찰 |
| 2 | `e0000002-...` | 이서연 | 시니어 판매 | 여성의류 (WOM) | `staff_senior_female_01.glb` | 유니폼, 여성 |
| 3 | `e0000003-...` | 박도윤 | 시니어 판매 | 남성의류 (MEN) | `staff_senior_male_01.glb` | 유니폼, 남성 |
| 4 | `e0000004-...` | 최하은 | 판매 | 액세서리 (ACC) | `staff_sales_female_01.glb` | 유니폼, 여성 |
| 5 | `e0000005-...` | 정시우 | 판매 | 신발 (SHO) | `staff_sales_male_01.glb` | 유니폼, 남성 |
| 6 | `e0000006-...` | 강유진 | 판매 | 피팅룸 (FIT) | `staff_sales_female_02.glb` | 유니폼, 여성 |
| 7 | `e0000007-...` | 조지호 | 캐셔 | 계산대 (CHK) | `staff_cashier_male_01.glb` | 캐셔 유니폼 |
| 8 | `e0000008-...` | 윤수빈 | 캐셔 | 계산대 (CHK) | `staff_cashier_female_01.glb` | 캐셔 유니폼 |

**직원 모델 요구사항:**
- 크기: 0.5×0.3×1.7 m (서 있는 자세)
- T-Pose 또는 서 있는 자세
- 로우폴리 (1,000-2,000 폴리곤)
- 담당 구역 색상 배지 포함

---

### 4.6 고객 아바타 모델 (Customer Assets) - 선택사항

고객 시뮬레이션용 제네릭 아바타:

| # | 세그먼트 | 파일명 | 수량 | 설명 |
|---|---------|--------|------|------|
| 1 | VIP 고객 | `customer_vip_01.glb` ~ `_03.glb` | 3종 | 고급스러운 의상 |
| 2 | 일반 고객 | `customer_regular_01.glb` ~ `_05.glb` | 5종 | 캐주얼 의상 |
| 3 | 신규 고객 | `customer_new_01.glb` ~ `_03.glb` | 3종 | 다양한 연령대 |

---

### 4.7 직원/고객 아바타 시스템 통합 가이드

#### 현재 상태 분석 (Gap)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    아바타 시스템 통합 현황                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ✅ 지원됨 (바로 사용 가능)                                          │
│  ├── Space Models      → ontology_entity_types.model_3d_url        │
│  ├── Furniture Models  → ontology_entity_types.model_3d_url        │
│  └── Product Models    → ontology_entity_types.model_3d_url        │
│                                                                     │
│  ⚠️ 미지원 (확장 필요)                                               │
│  ├── Staff Avatars     → staff 테이블에 avatar_url 없음             │
│  └── Customer Avatars  → customers 테이블에 avatar_url 없음         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 문제점

| 구성요소 | 현재 상태 | 필요한 변경 |
|----------|----------|------------|
| `staff` 테이블 | `avatar_url` 컬럼 없음 | 컬럼 추가 필요 |
| `Staff` 온톨로지 | `model_3d_type: null` | `'avatar'`로 변경 |
| `sceneRecipeGenerator.ts` | Staff/Customer 미처리 | 아바타 렌더링 추가 |
| `scene3d.ts` 타입 | StaffAsset 없음 | 타입 정의 추가 |

#### 해결 방안 A: staff 테이블 확장 (권장)

**1단계: 마이그레이션 스크립트**

```sql
-- staff 테이블에 아바타 관련 컬럼 추가
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_position JSONB DEFAULT '{"x":0,"y":0,"z":0}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS avatar_scale JSONB DEFAULT '{"x":1,"y":1,"z":1}';

-- customers 테이블에 아바타 관련 컬럼 추가
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS avatar_type TEXT; -- 'vip', 'regular', 'new'
```

**2단계: 타입 정의 추가 (`scene3d.ts`)**

```typescript
export interface StaffAsset extends SceneAsset {
  type: 'staff';
  staff_id: string;
  staff_name: string;
  role: string;
  assigned_zone_id?: string;
  shift_start?: string;
  shift_end?: string;
}

export interface CustomerAsset extends SceneAsset {
  type: 'customer';
  customer_segment: 'vip' | 'regular' | 'new';
  is_animated?: boolean;
  path_points?: Vector3D[];  // 동선 애니메이션용
}
```

**3단계: SceneRecipe 확장**

```typescript
export interface SceneRecipe {
  space: SpaceAsset;
  furniture: FurnitureAsset[];
  products: ProductAsset[];
  staff?: StaffAsset[];       // 추가
  customers?: CustomerAsset[]; // 추가
  lighting: LightingPreset;
  effects?: EffectLayer[];
  camera?: { ... };
}
```

**4단계: sceneRecipeGenerator.ts 확장**

```typescript
// 4. Load Staff Avatars
const { data: staffData } = await supabase
  .from('staff')
  .select('*')
  .eq('store_id', storeId);

const staffAssets: StaffAsset[] = (staffData || [])
  .filter(s => s.avatar_url)
  .map(s => ({
    id: s.id,
    type: 'staff',
    model_url: s.avatar_url,
    position: s.avatar_position || { x: 0, y: 0, z: 0 },
    rotation: s.avatar_rotation || { x: 0, y: 0, z: 0 },
    scale: s.avatar_scale || { x: 1, y: 1, z: 1 },
    staff_id: s.id,
    staff_name: s.staff_name,
    role: s.role,
    assigned_zone_id: s.department
  }));
```

#### 해결 방안 B: 온톨로지 시스템 활용

**온톨로지를 통한 아바타 관리:**

```sql
-- Staff 엔티티 타입에 model_3d_type 설정
UPDATE ontology_entity_types
SET model_3d_type = 'avatar',
    model_3d_url = NULL  -- 기본 URL, 개별 엔티티에서 오버라이드
WHERE name = 'Staff';

-- 각 직원을 graph_entities로 생성 (개별 아바타 URL 지정)
INSERT INTO graph_entities (
  id, entity_type_id, label, user_id,
  model_3d_position, model_3d_rotation, model_3d_scale,
  properties
) VALUES (
  'e0000001-...',
  (SELECT id FROM ontology_entity_types WHERE name = 'Staff'),
  '김민준',
  v_user_id,
  '{"x": 0, "y": 0, "z": -5}'::jsonb,
  '{"x": 0, "y": 0, "z": 0}'::jsonb,
  '{"x": 1, "y": 1, "z": 1}'::jsonb,
  '{"avatar_url": "https://storage.../staff_manager_male_01.glb", "role": "manager"}'::jsonb
);
```

#### 스토리지 업로드 후 적용 플로우

```
┌─────────────────────────────────────────────────────────────────────┐
│                    아바타 적용 플로우                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. 모델 업로드                                                      │
│     └── Supabase Storage: 3d-models/{user_id}/{store_id}/staff/     │
│                                                                     │
│  2. URL 획득                                                        │
│     └── supabase.storage.from('3d-models').getPublicUrl(path)       │
│                                                                     │
│  3-A. staff 테이블 업데이트 (방안 A)                                  │
│     └── UPDATE staff SET avatar_url = '{url}' WHERE id = '...'      │
│                                                                     │
│  3-B. graph_entities 업데이트 (방안 B)                                │
│     └── UPDATE graph_entities SET properties = properties ||        │
│         '{"avatar_url": "{url}"}'::jsonb WHERE id = '...'           │
│                                                                     │
│  4. SceneRecipe 재생성                                               │
│     └── generateSceneRecipe() 호출 → 아바타 포함된 씬 렌더링          │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 권장 구현 우선순위

| 우선순위 | 작업 | 영향 범위 | 예상 공수 |
|---------|------|----------|----------|
| 1 | `staff` 테이블 마이그레이션 | DB만 변경 | 0.5일 |
| 2 | `StaffAsset` 타입 정의 | 타입 파일 | 0.5일 |
| 3 | `sceneRecipeGenerator` 확장 | 유틸리티 | 1일 |
| 4 | `Store3DViewer`에 아바타 렌더링 | 컴포넌트 | 1일 |
| 5 | 고객 아바타 (동선 애니메이션) | 전체 | 2일 |

> **결론**: 현재는 모델 파일 업로드만으로 **자동 적용되지 않습니다**.
> 위 구현 가이드에 따라 스키마 확장 및 코드 수정이 필요합니다.

---

## 5. 조명 시스템 (Lighting)

### 5.1 전역 조명 프리셋

```typescript
const globalLighting: LightingPreset = {
  name: 'retail_flagship',
  description: '플래그십 매장 기본 조명',
  lights: [
    // 환경광 - 전체 기본 밝기
    {
      type: 'ambient',
      color: '#f5f5f5',
      intensity: 0.35
    },
    // 메인 조명 - 천장 중앙
    {
      type: 'directional',
      color: '#ffffff',
      intensity: 0.9,
      position: { x: 0, y: 10, z: 0 },
      target: { x: 0, y: 0, z: 0 },
      castShadow: true
    },
    // 보조 조명 - 그림자 완화
    {
      type: 'directional',
      color: '#e8e8ff',
      intensity: 0.3,
      position: { x: -10, y: 8, z: 10 },
      target: { x: 0, y: 0, z: 0 },
      castShadow: false
    }
  ],
  environment: {
    background: '#f8f9fa',
    fog: {
      color: '#f8f9fa',
      near: 20,
      far: 50
    }
  }
};
```

### 5.2 존별 스폿 조명 (Zone Spot Lights) - 7건

| Zone | 조명 타입 | 색상 | 강도 | 위치 (x, y, z) | 대상 | 설명 |
|------|----------|------|------|----------------|------|------|
| Z001 입구 | Spot | `#ffffff` | 1.2 | (2.5, 3, -7.5) | 바닥 | 환영 스폿 |
| Z002 메인홀 | Point×4 | `#fff8e7` | 0.8 | 분산 배치 | - | 따뜻한 매장 조명 |
| Z003 의류존 | Spot×6 | `#fffaf0` | 1.0 | 랙 상단 | 의류 랙 | 상품 강조 |
| Z004 액세서리존 | Spot×4 | `#fff5ee` | 1.2 | 쇼케이스 위 | 쇼케이스 | 반짝임 강조 |
| Z005 피팅룸 | Point×4 | `#fff0f5` | 0.9 | 부스 천장 | - | 피팅 조명 |
| Z006 계산대 | Spot×2 | `#ffffff` | 1.1 | 카운터 위 | 계산대 | 작업 조명 |
| Z007 휴식공간 | Point×2 | `#ffe4c4` | 0.6 | 소파 위 | - | 편안한 조명 |

### 5.3 조명 프리셋 상세 설정

```typescript
const zoneLights: Record<string, LightConfig[]> = {
  'Z001_entrance': [
    { type: 'spot', color: '#ffffff', intensity: 1.2,
      position: { x: 2.5, y: 3, z: -7.5 },
      target: { x: 2.5, y: 0, z: -7.5 }, angle: 0.6 }
  ],
  'Z002_main': [
    { type: 'point', color: '#fff8e7', intensity: 0.8, position: { x: -3, y: 2.8, z: -2 } },
    { type: 'point', color: '#fff8e7', intensity: 0.8, position: { x: 3, y: 2.8, z: -2 } },
    { type: 'point', color: '#fff8e7', intensity: 0.8, position: { x: -3, y: 2.8, z: 2 } },
    { type: 'point', color: '#fff8e7', intensity: 0.8, position: { x: 3, y: 2.8, z: 2 } }
  ],
  'Z003_clothing': [
    { type: 'spot', color: '#fffaf0', intensity: 1.0, position: { x: -6, y: 2.5, z: 1 }, target: { x: -6, y: 0, z: 1 } },
    { type: 'spot', color: '#fffaf0', intensity: 1.0, position: { x: -6, y: 2.5, z: 3 }, target: { x: -6, y: 0, z: 3 } },
    { type: 'spot', color: '#fffaf0', intensity: 1.0, position: { x: -6, y: 2.5, z: 5 }, target: { x: -6, y: 0, z: 5 } },
    { type: 'spot', color: '#fffaf0', intensity: 1.0, position: { x: -4, y: 2.5, z: 1 }, target: { x: -4, y: 0, z: 1 } },
    { type: 'spot', color: '#fffaf0', intensity: 1.0, position: { x: -4, y: 2.5, z: 3 }, target: { x: -4, y: 0, z: 3 } },
    { type: 'spot', color: '#fffaf0', intensity: 1.0, position: { x: -4, y: 2.5, z: 5 }, target: { x: -4, y: 0, z: 5 } }
  ],
  'Z004_accessory': [
    { type: 'spot', color: '#fff5ee', intensity: 1.2, position: { x: 4, y: 2.5, z: 1 }, target: { x: 4, y: 0, z: 1 } },
    { type: 'spot', color: '#fff5ee', intensity: 1.2, position: { x: 4, y: 2.5, z: 3 }, target: { x: 4, y: 0, z: 3 } },
    { type: 'spot', color: '#fff5ee', intensity: 1.2, position: { x: 6, y: 2.5, z: 1 }, target: { x: 6, y: 0, z: 1 } },
    { type: 'spot', color: '#fff5ee', intensity: 1.2, position: { x: 6, y: 2.5, z: 3 }, target: { x: 6, y: 0, z: 3 } }
  ],
  'Z005_fitting': [
    { type: 'point', color: '#fff0f5', intensity: 0.9, position: { x: -5.5, y: 2.2, z: -5.5 } },
    { type: 'point', color: '#fff0f5', intensity: 0.9, position: { x: -4.5, y: 2.2, z: -5.5 } },
    { type: 'point', color: '#fff0f5', intensity: 0.9, position: { x: -5.5, y: 2.2, z: -4.5 } },
    { type: 'point', color: '#fff0f5', intensity: 0.9, position: { x: -4.5, y: 2.2, z: -4.5 } }
  ],
  'Z006_checkout': [
    { type: 'spot', color: '#ffffff', intensity: 1.1, position: { x: 4, y: 2.5, z: 5.5 }, target: { x: 4, y: 1, z: 5.5 } },
    { type: 'spot', color: '#ffffff', intensity: 1.1, position: { x: 5, y: 2.5, z: 5.5 }, target: { x: 5, y: 1, z: 5.5 } }
  ],
  'Z007_lounge': [
    { type: 'point', color: '#ffe4c4', intensity: 0.6, position: { x: -1, y: 2.5, z: 7 } },
    { type: 'point', color: '#ffe4c4', intensity: 0.6, position: { x: 1, y: 2.5, z: 7 } }
  ]
};
```

### 5.4 특수 조명 효과

| 효과 | 적용 위치 | 트리거 | 설명 |
|------|----------|--------|------|
| 하이라이트 스폿 | 신상품 디스플레이 | AI 추천 상품 | 추천 상품 강조 |
| 혼잡도 표시 | 존 전체 | zone_daily_metrics | 빨강(혼잡) → 녹색(여유) |
| 경로 안내 | 바닥 | AI 동선 추천 | 최적 동선 LED 표시 |
| 알림 깜빡임 | 계산대 | 대기줄 초과 | 직원 호출 신호 |

---

## 6. 시각화 오버레이 (Effect Layers)

### 6.1 히트맵 오버레이 (zone_daily_metrics 기반)

```typescript
interface HeatmapEffect {
  type: 'heatmap';
  data: {
    zone_id: string;
    intensity: number;      // 0.0 ~ 1.0
    visitors: number;       // 실제 방문자 수
    avg_dwell: number;      // 평균 체류시간 (초)
  }[];
  colorScale: {
    low: '#22c55e';         // 녹색 (여유)
    medium: '#eab308';      // 노랑 (보통)
    high: '#ef4444';        // 빨강 (혼잡)
  };
  opacity: 0.5;
  height: 0.05;             // 바닥에서 5cm 위
}
```

**데이터 소스**: `zone_daily_metrics` (630건, 7존 × 90일)

### 6.2 고객 동선 오버레이 (zone_events 기반)

```typescript
interface PathFlowEffect {
  type: 'pathflow';
  data: {
    from_zone: string;
    to_zone: string;
    flow_count: number;
    avg_transition_time: number;
  }[];
  lineWidth: 2;
  arrowSize: 0.3;
  colorByVolume: true;
  animated: true;
  animationSpeed: 1.0;
}
```

**데이터 소스**: `zone_events` (~5,000건)

### 6.3 상품 성과 오버레이 (product_performance_agg 기반)

```typescript
interface ProductHighlightEffect {
  type: 'product_highlight';
  data: {
    product_id: string;
    position: Vector3D;
    metric: 'revenue' | 'units_sold' | 'conversion_rate';
    value: number;
    rank: number;           // 1 = 최고
  }[];
  highlightType: 'glow' | 'badge' | 'particle';
  showTopN: 5;
}
```

**데이터 소스**: `product_performance_agg` (2,250건, 25상품 × 90일)

### 6.4 AI 추천 시각화 (ai_recommendations 기반)

```typescript
interface AIRecommendationEffect {
  type: 'ai_suggestion';
  data: {
    recommendation_id: string;
    category: 'staffing' | 'layout' | 'inventory' | 'pricing' | 'promotion';
    title: string;
    target_zone?: string;
    target_products?: string[];
    priority: 'high' | 'medium' | 'low';
    expected_impact: number;  // % 개선
    confidence: number;       // 0.0 ~ 1.0
  }[];
  showAsOverlay: true;
  showAsMarkers: true;
  markerScale: 1.0;
}
```

**데이터 소스**: `ai_recommendations` (~8건)

### 6.5 시간대별 트래픽 애니메이션 (hourly_metrics 기반)

```typescript
interface HourlyTrafficEffect {
  type: 'hourly_animation';
  data: {
    hour: number;           // 0-23
    zone_id: string;
    visitors: number;
    transactions: number;
    revenue: number;
  }[];
  animationMode: 'timeline' | 'replay' | 'heatmap';
  speed: 1.0;               // 1초 = 1시간
  showTimeline: true;
}
```

**데이터 소스**: `hourly_metrics` (1,080건, 12시간 × 90일)

---

## 7. 그래프 시각화 (Graph Visualization)

### 7.1 그래프 엔티티 (30건)

NEURALTWIN v8.0에서 정의된 온톨로지 그래프 노드:

| 카테고리 | 엔티티 타입 | 수량 | 3D 표현 | 색상 |
|----------|------------|------|---------|------|
| 매장/구역 | Store, Zone | 6 | 3D 박스 (구역 형태) | 블루 계열 |
| 상품 | Product | 4 | 상품 아이콘 | 오렌지 |
| 고객 | CustomerSegment | 3 | 인물 아이콘 | 핑크 |
| KPI | DailyKPI | 3 | 차트 아이콘 | 청록 |
| 전략 | Strategy | 3 | 전구 아이콘 | 보라 |
| 인사이트 | Insight | 3 | 눈 아이콘 | 초록 |
| 외부요인 | ExternalFactor | 3 | 구름 아이콘 | 회색 |
| 목표 | Goal | 2 | 깃발 아이콘 | 남색 |
| 시뮬레이션 | Simulation | 3 | 재생 아이콘 | 마젠타 |

### 7.2 그래프 관계 (30건)

| 관계 타입 | 소스 → 타겟 | 수량 | 시각화 |
|----------|------------|------|--------|
| CONTAINS | Store → Zone | 5 | 점선 포함 |
| ADJACENT_TO | Zone → Zone | 5 | 양방향 화살표 |
| LOCATED_IN | Product → Zone | 4 | 위치 마커 |
| GENERATES | CustomerSegment → KPI | 3 | 흐름 화살표 |
| RECOMMENDS | Insight → Strategy | 3 | 추천 화살표 |
| TARGETS | Strategy → Goal | 3 | 목표 화살표 |
| AFFECTS | ExternalFactor → KPI | 3 | 영향 표시 |
| SIMULATES | Scenario → Simulation | 2 | 시뮬 연결 |
| 기타 | 다양한 관계 | 2 | 기본 연결선 |

### 7.3 그래프 3D 시각화 옵션

```typescript
interface Graph3DVisualization {
  layout: 'force-directed' | 'hierarchical' | 'radial' | 'spatial';
  nodeSize: {
    base: 0.3,
    scaleByImportance: true
  };
  edgeStyle: {
    width: 0.05,
    animated: true,
    showArrows: true
  };
  interaction: {
    hoverable: true,
    selectable: true,
    draggable: true
  };
  labels: {
    show: true,
    billboarding: true,
    fontSize: 14
  };
}
```

---

## 8. 전략/시뮬레이션 시각화

### 8.1 적용 전략 (applied_strategies) - 5건

| # | 전략 유형 | 전략명 | 상태 | 시각화 |
|---|----------|--------|------|--------|
| 1 | pricing | 가격 최적화 전략 | completed | 가격 태그 강조 |
| 2 | staffing | 피크타임 인력 배치 | completed | 직원 위치 표시 |
| 3 | promotion | VIP 전용 프로모션 | completed | VIP 존 표시 |
| 4 | layout | 레이아웃 재배치 | in_progress | 이동 화살표 |
| 5 | inventory | 재고 최적화 | planned | 재고 레벨 표시 |

### 8.2 전략 효과 시각화

```typescript
interface StrategyVisualization {
  strategy_id: string;
  type: 'pricing' | 'staffing' | 'promotion' | 'layout' | 'inventory';

  // 레이아웃 전략용
  layoutChanges?: {
    furniture_id: string;
    from_position: Vector3D;
    to_position: Vector3D;
    showPath: boolean;
  }[];

  // 인력 배치 전략용
  staffingChanges?: {
    staff_id: string;
    zone_id: string;
    shift_start: string;
    shift_end: string;
  }[];

  // 프로모션 전략용
  promotionHighlights?: {
    zone_id?: string;
    product_ids?: string[];
    discount_rate: number;
  };

  // 성과 표시
  metrics: {
    before: { revenue: number; conversion: number };
    after: { revenue: number; conversion: number };
    improvement: number;
  };
}
```

---

## 9. 목표 및 KPI 대시보드 (3D 오버레이)

### 9.1 매장 목표 (store_goals) - 10건

| 기간 | 목표 유형 | 목표값 | 진행률 표시 |
|------|----------|--------|------------|
| 일간 | 매출 | ₩4,000,000 | 프로그레스 바 |
| 일간 | 방문자 | 180명 | 프로그레스 바 |
| 주간 | 매출 | ₩25,000,000 | 프로그레스 링 |
| 주간 | 방문자 | 1,200명 | 프로그레스 링 |
| 월간 | 매출 | ₩100,000,000 | 3D 차트 |
| 월간 | 방문자 | 5,000명 | 3D 차트 |
| 월간 | 전환율 | 15% | 게이지 |
| 월간 | 객단가 | ₩250,000 | 게이지 |
| 분기 | 매출 | ₩300,000,000 | 3D 막대 그래프 |
| 분기 | 방문자 | 15,000명 | 3D 막대 그래프 |

### 9.2 실시간 KPI 오버레이

```typescript
interface KPIDashboardOverlay {
  position: 'top-right' | 'floating' | 'integrated';
  metrics: {
    current_visitors: number;       // 현재 매장 내 방문자
    today_revenue: number;          // 오늘 매출
    conversion_rate: number;        // 실시간 전환율
    avg_dwell_time: number;         // 평균 체류시간
    goal_progress: number;          // 목표 달성률
  };
  visualization: '2d-panel' | '3d-hologram' | 'zone-integrated';
}
```

---

## 10. 재고 시각화 (inventory_levels)

### 10.1 재고 상태 표시 (25건)

```typescript
interface InventoryVisualization {
  product_id: string;
  position: Vector3D;           // 상품 위치
  current_stock: number;
  min_stock: number;
  max_stock: number;
  reorder_point: number;

  // 시각적 표현
  stockLevel: 'critical' | 'low' | 'normal' | 'high';
  showIndicator: boolean;
  indicatorColor: string;       // 빨강/노랑/녹색/파랑
  showQuantity: boolean;
}
```

### 10.2 재고 레벨 색상 코드

| 상태 | 조건 | 색상 | 표시 |
|------|------|------|------|
| Critical | current < min | `#ef4444` (빨강) | 깜빡이는 경고 |
| Low | current < reorder | `#f59e0b` (노랑) | 경고 아이콘 |
| Normal | reorder ≤ current < max×0.8 | `#22c55e` (녹색) | 정상 표시 |
| High | current ≥ max×0.8 | `#3b82f6` (파랑) | 과잉 표시 |

---

## 11. 리테일 컨셉 시각화 (retail_concepts)

### 11.1 핵심 지표 (12건)

| 카테고리 | 지표명 | 공식 | 벤치마크 | 3D 시각화 |
|----------|--------|------|----------|-----------|
| traffic | Foot Traffic | COUNT(store_visits) | 40명/일 | 존별 밀도 |
| traffic | Traffic Density | visitors / sqm | 0.2명/㎡ | 히트맵 |
| traffic | Peak Hour Ratio | peak / total | 25% | 시간 차트 |
| conversion | Conversion Rate | purchases / visitors | 15% | 퍼널 |
| conversion | Try-on Rate | fitting / visitors | 25% | 피팅룸 표시 |
| conversion | Browse-to-Buy | buyers / browsers | 20% | 동선 표시 |
| revenue | Average Basket | revenue / transactions | ₩65,000 | 가격 표시 |
| revenue | Revenue per Visitor | revenue / visitors | ₩10,000 | 고객당 표시 |
| revenue | Sales per SQM | revenue / sqm | ₩50,000 | 면적 차트 |
| customer | Customer LTV | SUM(purchases) | ₩500,000 | VIP 표시 |
| customer | Repeat Visit Rate | returning / total | 35% | 재방문 표시 |
| customer | Churn Rate | churned / total | 5% | 이탈 경고 |

---

## 12. 스토리지 구조

### 12.1 Supabase Storage 전체 경로

```
3d-models/
├── {user_id}/
│   └── {store_id}/
│       └── 3d-models/
│           │
│           ├── space/                       # 공간 모델
│           │   ├── store_gangnam_main.glb
│           │   └── floor_250sqm.glb
│           │
│           ├── furniture/                   # 가구 모델
│           │   ├── Z001_entrance/
│           │   │   ├── gate_entrance_01.glb
│           │   │   ├── sign_welcome_01.glb
│           │   │   └── kiosk_info_01.glb
│           │   ├── Z002_main/
│           │   │   ├── table_display_center_01.glb
│           │   │   └── ...
│           │   ├── Z003_clothing/
│           │   │   └── ...
│           │   ├── Z004_accessory/
│           │   │   └── ...
│           │   ├── Z005_fitting/
│           │   │   └── ...
│           │   ├── Z006_checkout/
│           │   │   └── ...
│           │   └── Z007_lounge/
│           │       └── ...
│           │
│           ├── products/                    # 상품 모델 (25건)
│           │   ├── outerwear/              # 아우터 (5)
│           │   │   └── product_coat_*.glb
│           │   ├── tops/                   # 상의 (5)
│           │   │   └── product_blouse_*.glb
│           │   ├── bottoms/                # 하의 (5)
│           │   │   └── product_pants_*.glb
│           │   ├── accessories/            # 액세서리 (5)
│           │   │   └── product_bag_*.glb
│           │   ├── shoes/                  # 신발 (3)
│           │   │   └── product_shoes_*.glb
│           │   └── cosmetics/              # 화장품 (2)
│           │       └── product_skincare_*.glb
│           │
│           ├── staff/                       # 직원 아바타 (8건)
│           │   ├── staff_manager_*.glb
│           │   ├── staff_senior_*.glb
│           │   ├── staff_sales_*.glb
│           │   └── staff_cashier_*.glb
│           │
│           └── customers/                   # 고객 아바타 (선택)
│               ├── customer_vip_*.glb
│               ├── customer_regular_*.glb
│               └── customer_new_*.glb
```

---

## 13. 전체 체크리스트

### 13.1 공간 모델 (2건)
- [ ] `store_gangnam_main.glb` - 매장 전체 구조
- [ ] `floor_250sqm.glb` - 바닥 플레인 (오버레이용)

### 13.2 존별 가구 모델 (52건)
- [ ] Z001 입구 (4건): 게이트, 사인, 키오스크, 카트거치대
- [ ] Z002 메인홀 (12건): 디스플레이, 마네킹, 배너
- [ ] Z003 의류존 (14건): 랙, 선반, 거울, 사이즈표
- [ ] Z004 액세서리존 (10건): 쇼케이스, 스탠드, 신발대
- [ ] Z005 피팅룸 (6건): 부스, 거울, 의자, 훅, 벤치
- [ ] Z006 계산대 (8건): 카운터, POS, 포장대, 대기선
- [ ] Z007 휴식공간 (6건): 소파, 테이블, 화분, 자판기

### 13.3 상품 모델 (25건)
- [ ] 아우터 (5건): 코트, 재킷, 패딩, 트렌치, 레더
- [ ] 상의 (5건): 블라우스, 니트, 셔츠, 탑, 폴로
- [ ] 하의 (5건): 와이드팬츠, 데님, 치노, 조거, 스커트
- [ ] 액세서리 (5건): 토트백, 목걸이, 벨트, 스카프, 머플러
- [ ] 신발 (3건): 로퍼, 하이힐, 스니커즈
- [ ] 화장품 (2건): 스킨케어, 립스틱

### 13.4 직원 아바타 (8건)
- [ ] 매니저 (1): 김민준
- [ ] 시니어 판매 (2): 이서연, 박도윤
- [ ] 판매 (3): 최하은, 정시우, 강유진
- [ ] 캐셔 (2): 조지호, 윤수빈

### 13.5 조명 설정
- [ ] 전역 조명 프리셋
- [ ] Z001 ~ Z007 존별 스폿 조명

### 13.6 시각화 오버레이
- [ ] 히트맵 (zone_daily_metrics)
- [ ] 동선 흐름 (zone_events)
- [ ] 상품 성과 (product_performance_agg)
- [ ] AI 추천 (ai_recommendations)
- [ ] 시간대별 트래픽 (hourly_metrics)

### 13.7 그래프 시각화
- [ ] 30개 엔티티 노드
- [ ] 30개 관계 엣지

### 13.8 전략/목표 시각화
- [ ] 5개 전략 시각화
- [ ] 10개 목표 프로그레스

### 13.9 재고/컨셉 시각화
- [ ] 25개 상품 재고 표시
- [ ] 12개 리테일 컨셉 지표

---

## 14. 모델 제작 총 수량 요약

| 카테고리 | 수량 | 우선순위 |
|----------|------|----------|
| 공간 모델 | 2 | ★★★ 필수 |
| 가구/집기 모델 | 52 | ★★★ 필수 |
| 상품 모델 | 25 | ★★☆ 권장 |
| 직원 아바타 | 8 | ★★☆ 권장 |
| 고객 아바타 | 11 | ★☆☆ 선택 |
| **총계** | **98** | - |

---

## 15. 문의 및 지원

- **기술 문의**: 개발팀
- **3D 모델링 문의**: 디지털트윈 팀
- **데이터 구조 문의**: DATA_FLOW_ARCHITECTURE.md 참조

---

*문서 버전: 2.3 (Avatar Integration Guide)*
*최종 업데이트: 2025-12-16*
*NEURALTWIN v8.0 ULTIMATE SEED 기준*
