# NEURALTWIN 기능 테스트 가이드 v1.0

## 테스트 환경
| 항목 | 값 |
|------|-----|
| Store ID | `d9830554-2688-4032-af40-acccda787ac4` |
| User ID | `e4200130-08e8-47da-8c92-3d0b90fafd77` |
| Supabase Project ID | `bdrvowacecxnraaivlhr` |
| 작성일 | 2026-01-05 |

---

## 프로젝트 아키텍처 개요

### 메인 라우트 (4개)
| 경로 | 페이지 | 파일 위치 |
|------|--------|----------|
| `/` or `/insights` | Insight Hub | `src/features/insights/InsightHubPage.tsx` |
| `/studio` | Digital Twin Studio | `src/features/studio/DigitalTwinStudioPage.tsx` |
| `/roi` | ROI 측정 | `src/features/roi/ROIMeasurementPage.tsx` |
| `/settings` | 설정 | `src/features/settings/SettingsPage.tsx` |

### Edge Functions (22개)
| 함수명 | 용도 |
|--------|------|
| `generate-optimization` | AI 레이아웃 최적화 (메인) |
| `environment-proxy` | 날씨/공휴일 API 프록시 |
| `aggregate-dashboard-kpis` | KPI 집계 |
| `aggregate-all-kpis` | 전체 KPI 집계 |
| `retail-ai-inference` | 리테일 AI 추론 |
| `unified-ai` | 통합 AI (추천/이상탐지) |
| `run-simulation` | 시뮬레이션 실행 |
| `graph-query` | 그래프 쿼리 |
| `smart-ontology-mapping` | 온톨로지 매핑 |
| `import-with-ontology` | 온톨로지 기반 임포트 |
| `integrated-data-pipeline` | 통합 데이터 파이프라인 |
| `unified-etl` | 통합 ETL |
| `sync-api-data` | 외부 API 동기화 |
| `process-wifi-data` | WiFi 데이터 처리 |
| `inventory-monitor` | 재고 모니터링 |
| `analyze-3d-model` | 3D 모델 분석 |
| `auto-process-3d-models` | 3D 모델 자동 처리 |
| `simulation-data-mapping` | 시뮬레이션 데이터 매핑 |
| `datasource-mapper` | 데이터소스 매핑 |
| `auto-map-etl` | 자동 ETL 매핑 |
| `etl-scheduler` | ETL 스케줄러 |
| `advanced-ai-inference` | 고급 AI 추론 |

---

# 1. Insight Hub (인사이트 허브)

## 1.1 개요 탭 (Overview)

### 파일 위치
- **메인:** `src/features/insights/tabs/OverviewTab.tsx`
- **훅:** `src/features/insights/hooks/useInsightMetrics.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `dashboard_kpis` | 일별 KPI 데이터 |
| `daily_kpis_agg` | 일별 집계 KPI |
| `stores` | 매장 정보 |

### 테스트 방법
1. `/insights` 또는 `/` 접속
2. "개요" 탭 선택 확인
3. 다음 위젯 렌더링 확인:
   - 총 매출 카드
   - 방문자 수 카드
   - 전환율 카드
   - 객단가 카드
   - 매출 트렌드 차트
   - 시간대별 방문자 차트

### 예상 결과
- 모든 KPI 카드에 숫자 표시
- 차트에 데이터 포인트 표시
- 전일 대비 변화율 표시 (▲/▼)

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| KPI 카드 렌더링 | | |
| 매출 트렌드 차트 | | |
| 시간대별 방문자 | | |
| 날짜 필터 동작 | | |

---

## 1.2 매장 탭 (Store)

### 파일 위치
- **메인:** `src/features/insights/tabs/StoreTab.tsx`
- **훅:** `src/hooks/useStoreData.ts`, `src/hooks/useZoneMetrics.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `zones_dim` | 구역 정보 |
| `zone_metrics` | 구역별 지표 |
| `zone_performance` | 구역 성과 |
| `zone_daily_metrics` | 일별 구역 지표 |

### 테스트 방법
1. "매장" 탭 선택
2. 구역별 성과 테이블 확인
3. 히트맵 시각화 확인
4. 동선 분석 차트 확인

### 예상 결과
- 구역 목록 표시 (입구, 진열대 A/B/C 등)
- 각 구역별 체류시간, 방문자 수 표시
- 히트맵 색상 표시

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 구역 목록 로딩 | | |
| 구역 성과 데이터 | | |
| 히트맵 렌더링 | | |
| 동선 분석 | | |

---

## 1.3 고객 탭 (Customer)

### 파일 위치
- **메인:** `src/features/insights/tabs/CustomerTab.tsx`
- **훅:** `src/hooks/useCustomerSegments.ts`, `src/hooks/useCustomerJourney.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `customer_segments` | 고객 세그먼트 |
| `customer_segments_agg` | 세그먼트 집계 |
| `visits` | 방문 이력 |
| `funnel_events` | 퍼널 이벤트 |
| `funnel_metrics` | 퍼널 지표 |

### 테스트 방법
1. "고객" 탭 선택
2. 고객 세그먼트 파이 차트 확인
3. 퍼널 분석 시각화 확인
4. 체류시간 분포 확인

### 예상 결과
- 세그먼트별 고객 비율 표시 (VIP, 일반, 신규 등)
- 퍼널 단계별 전환율 표시
- Browse → Engage → Purchase 흐름

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 세그먼트 차트 | | |
| 퍼널 시각화 | | |
| 체류시간 분포 | | |
| 재방문율 | | |

---

## 1.4 상품 탭 (Product)

### 파일 위치
- **메인:** `src/features/insights/tabs/ProductTab.tsx`
- **훅:** `src/hooks/useProductPerformance.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `products` | 상품 마스터 |
| `product_performance_agg` | 상품 성과 집계 |
| `inventory` | 재고 현황 |
| `realtime_inventory` | 실시간 재고 |

### 테스트 방법
1. "상품" 탭 선택
2. 상품 성과 테이블 확인
3. 카테고리별 매출 차트 확인
4. 베스트셀러 목록 확인

### 예상 결과
- 상품별 매출, 판매량, 전환율 표시
- 카테고리 필터 동작
- 정렬 기능 동작

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 상품 목록 로딩 | | |
| 성과 지표 표시 | | |
| 카테고리 필터 | | |
| 정렬 기능 | | |

---

## 1.5 예측 탭 (Prediction)

### 파일 위치
- **메인:** `src/features/insights/tabs/PredictionTab.tsx`
- **훅:** `src/features/insights/hooks/useAIPrediction.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `ai_inference_results` | AI 추론 결과 |
| `trend_signals` | 트렌드 신호 |
| `daily_kpis_agg` | 과거 KPI 데이터 |

### 테스트 방법
1. "예측" 탭 선택
2. 매출 예측 차트 확인
3. 방문자 예측 차트 확인
4. 신뢰 구간 표시 확인

### 예상 결과
- 7일/30일 예측 데이터 표시
- 과거 실제값 vs 예측값 비교
- 신뢰도 점수 표시

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 매출 예측 차트 | | |
| 방문자 예측 | | |
| 신뢰 구간 | | |
| 예측 정확도 | | |

---

## 1.6 AI 추천 탭

### 파일 위치
- **메인:** `src/features/insights/tabs/AIRecommendationTab.tsx`
- **훅:** `src/hooks/useAIRecommendations.ts`, `src/hooks/useUnifiedAI.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `ai_recommendations` | AI 추천 목록 |
| `ai_insights` | AI 인사이트 |
| `applied_strategies` | 적용된 전략 |

### API 호출
```bash
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/unified-ai" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_recommendations",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4"
  }'
```

### 테스트 방법
1. "AI추천" 탭 선택
2. 추천 카드 목록 확인
3. 우선순위별 분류 확인
4. 추천 적용 버튼 클릭

### 예상 결과
- 카테고리별 추천 카드 표시
- Critical/High/Medium/Low 우선순위 표시
- 예상 효과 수치 표시

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 추천 목록 로딩 | | |
| 우선순위 필터 | | |
| 카테고리 필터 | | |
| 추천 적용 기능 | | |

---

# 2. Digital Twin Studio (디지털트윈 스튜디오)

## 2.1 3D 뷰어

### 파일 위치
- **메인:** `src/features/studio/DigitalTwinStudioPage.tsx`
- **3D 컴포넌트:** `src/features/studio/core/`
- **훅:** `src/features/studio/hooks/`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `store_scenes` | 3D 씬 데이터 |
| `furniture` | 가구 정보 |
| `furniture_slots` | 슬롯 정보 |
| `product_placements` | 상품 배치 |
| `models` | 3D 모델 메타데이터 |

### 테스트 방법
1. `/studio` 접속
2. 3D 캔버스 로딩 확인
3. 마우스 드래그로 회전
4. 스크롤로 줌 인/아웃
5. 가구 클릭 시 선택

### 예상 결과
- 매장 3D 모델 렌더링
- 가구/상품 배치 표시
- 카메라 컨트롤 동작

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 3D 캔버스 로딩 | | |
| 모델 렌더링 | | |
| 카메라 회전 | | |
| 줌 인/아웃 | | |
| 오브젝트 선택 | | |

---

## 2.2 레이어 패널

### 파일 위치
- **메인:** `src/features/studio/panels/LayerPanel.tsx`

### 테스트 방법
1. 좌측 레이어 패널 확인
2. 레이어 토글 (가구/상품/고객 동선)
3. 레이어별 표시/숨김

### 예상 결과
- 레이어 목록 표시
- 체크박스로 표시/숨김 전환
- 3D 뷰에 즉시 반영

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 레이어 목록 | | |
| 토글 동작 | | |
| 3D 뷰 반영 | | |

---

## 2.3 오버레이 컨트롤

### 파일 위치
- **메인:** `src/features/studio/panels/OverlayControlPanel.tsx`
- **오버레이:** `src/features/studio/overlays/`

### 오버레이 종류
| 오버레이 | 설명 |
|----------|------|
| Heatmap | 방문자 밀도 히트맵 |
| FlowArrows | 고객 동선 화살표 |
| ZoneLabels | 구역 라벨 |
| ProductHighlight | 상품 하이라이트 |

### 테스트 방법
1. 오버레이 패널 열기
2. 각 오버레이 토글
3. 히트맵 색상 확인
4. 동선 화살표 방향 확인

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 히트맵 오버레이 | | |
| 동선 화살표 | | |
| 구역 라벨 | | |
| 상품 하이라이트 | | |

---

## 2.4 AI 최적화 탭

### 파일 위치
- **메인:** `src/features/studio/tabs/AIOptimizationTab.tsx`
- **훅:** `src/features/studio/hooks/useOptimization.ts`

### API 호출 (generate-optimization)
```bash
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/generate-optimization" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "mode": "ai",
    "options": {
      "include_predictions": true,
      "include_vmd": true
    }
  }'
```

### 테스트 방법
1. "AI 최적화" 탭 선택
2. "최적화 실행" 버튼 클릭
3. 로딩 상태 확인
4. 결과 패널 확인

### 예상 결과
- 가구 이동 추천 목록
- 상품 배치 변경 추천
- 예상 매출 증가율
- 추천 이유 (Chain-of-Thought)

### 응답 형식
```json
{
  "success": true,
  "data": {
    "furniture_changes": [...],
    "product_changes": [...],
    "summary": {
      "expectedRevenueIncrease": 15.2,
      "confidenceScore": 0.85
    },
    "reasoning": "..."
  }
}
```

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 최적화 요청 | | |
| 결과 수신 | | |
| 가구 추천 | | |
| 상품 추천 | | |
| 매출 예측 | | |

---

## 2.5 AI 시뮬레이션 탭

### 파일 위치
- **메인:** `src/features/studio/tabs/AISimulationTab.tsx`
- **훅:** `src/features/studio/hooks/useSceneSimulation.ts`

### 테스트 방법
1. "AI 시뮬레이션" 탭 선택
2. 시뮬레이션 설정 (방문자 수, 시간대)
3. "시뮬레이션 시작" 클릭
4. 고객 에이전트 움직임 확인

### 예상 결과
- 가상 고객 에이전트 표시
- 동선 애니메이션
- 실시간 지표 업데이트

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 시뮬레이션 설정 | | |
| 에이전트 생성 | | |
| 동선 애니메이션 | | |
| 지표 업데이트 | | |

---

## 2.6 환경 설정 (날씨/이벤트)

### 파일 위치
- **메인:** `src/features/studio/components/SimulationEnvironmentSettings.tsx`
- **서비스:** `src/features/studio/services/environmentDataService.ts`

### API 호출 (environment-proxy)
```bash
# 날씨 조회 + DB 저장
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weather",
    "lat": 37.5665,
    "lon": 126.9780,
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "save_to_db": true
  }'

# 공휴일 조회
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "holidays",
    "year": 2026,
    "month": 1
  }'
```

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `weather_data` | 날씨 데이터 |
| `holidays_events` | 공휴일/이벤트 |

### 테스트 방법
1. 환경 설정 패널 열기
2. 날씨 모드 선택 (실시간/과거/수동)
3. 날짜 선택 시 이벤트 로드 확인
4. 환경 영향도 계산 확인

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 실시간 날씨 로드 | | |
| 공휴일 데이터 | | |
| 환경 영향도 | | |
| DB 저장 | | |

---

## 2.7 씬 저장/불러오기

### 파일 위치
- **메인:** `src/features/studio/panels/SceneSavePanel.tsx`
- **훅:** `src/features/studio/hooks/useScenePersistence.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `store_scenes` | 저장된 씬 |

### 테스트 방법
1. 가구/상품 배치 변경
2. "씬 저장" 버튼 클릭
3. 씬 이름 입력
4. 저장 확인
5. 다른 씬 불러오기

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 씬 저장 | | |
| 씬 목록 | | |
| 씬 불러오기 | | |
| 씬 삭제 | | |

---

# 3. ROI 측정 페이지

## 3.1 ROI 요약

### 파일 위치
- **메인:** `src/features/roi/ROIMeasurementPage.tsx`
- **컴포넌트:** `src/features/roi/components/ROISummaryCards.tsx`
- **훅:** `src/hooks/useROITracking.ts`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `applied_strategies` | 적용된 전략 |
| `recommendation_applications` | 추천 적용 이력 |
| `daily_kpis_agg` | KPI 비교 |

### DB 함수
- `get_roi_summary()` - ROI 요약
- `get_roi_by_category()` - 카테고리별 ROI
- `get_strategy_roi_trend()` - ROI 트렌드

### 테스트 방법
1. `/roi` 접속
2. ROI 요약 카드 확인:
   - 총 ROI
   - 적용 전략 수
   - 성공률
3. 카테고리별 ROI 차트 확인

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| ROI 요약 카드 | | |
| 카테고리별 ROI | | |
| 트렌드 차트 | | |

---

## 3.2 적용 전략 테이블

### 파일 위치
- **메인:** `src/features/roi/components/AppliedStrategyTable.tsx`

### 테스트 방법
1. 적용 전략 테이블 확인
2. 각 전략의 상태 확인 (활성/완료/중단)
3. 측정된 효과 확인
4. 전략 상세 모달 열기

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 전략 목록 | | |
| 상태 표시 | | |
| 효과 측정 | | |
| 상세 모달 | | |

---

## 3.3 AI 인사이트

### 파일 위치
- **메인:** `src/features/roi/components/AIInsightsCard.tsx`

### 테스트 방법
1. AI 인사이트 카드 확인
2. 성공/실패 패턴 분석 확인
3. 개선 제안 확인

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 인사이트 로딩 | | |
| 패턴 분석 | | |
| 개선 제안 | | |

---

# 4. 설정 페이지

## 4.1 매장 설정

### 파일 위치
- **메인:** `src/features/settings/SettingsPage.tsx`

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `stores` | 매장 정보 |
| `organizations` | 조직 정보 |

### 테스트 방법
1. `/settings` 접속
2. 매장 목록 확인
3. 매장 선택/전환
4. 매장 정보 수정

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 매장 목록 | | |
| 매장 전환 | | |
| 정보 수정 | | |

---

## 4.2 데이터 관리

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `data_sources` | 데이터 소스 |
| `upload_sessions` | 업로드 세션 |
| `raw_imports` | 원시 임포트 |

### 테스트 방법
1. "데이터" 탭 선택
2. 데이터 소스 목록 확인
3. 파일 업로드 테스트
4. 매핑 설정 확인

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 데이터 소스 목록 | | |
| 파일 업로드 | | |
| 컬럼 매핑 | | |
| 임포트 실행 | | |

---

## 4.3 알림 설정

### 데이터 소스
| 테이블 | 용도 |
|--------|------|
| `notification_settings` | 알림 설정 |
| `alerts` | 알림 규칙 |

### 테스트 방법
1. "알림" 탭 선택
2. 알림 유형별 토글 확인
3. 임계값 설정 확인

### 테스트 결과 기록
| 항목 | 상태 | 비고 |
|------|------|------|
| 알림 설정 로드 | | |
| 토글 동작 | | |
| 임계값 설정 | | |

---

# 5. Edge Function API 테스트

## 5.1 generate-optimization (AI 최적화)

### 요청 형식
```bash
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/generate-optimization" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "mode": "ai",
    "options": {
      "include_predictions": true,
      "include_vmd": true,
      "include_flow_analysis": true,
      "include_association_analysis": true
    }
  }'
```

### 응답 확인 사항
- [ ] `success: true`
- [ ] `data.furniture_changes` 배열 존재
- [ ] `data.product_changes` 배열 존재
- [ ] `data.summary.expectedRevenueIncrease` 숫자
- [ ] `data.thinking` 또는 `data.reasoning` 존재
- [ ] `meta.processingTimeMs` 존재

### 에러 케이스 테스트
| 케이스 | 요청 | 예상 응답 |
|--------|------|----------|
| 잘못된 store_id | `{"store_id": "invalid"}` | 400/404 에러 |
| 누락된 store_id | `{}` | 400 에러 |
| 잘못된 mode | `{"mode": "invalid"}` | 400 에러 |

---

## 5.2 retail-ai-inference (리테일 AI)

### 요청 형식
```bash
# 레이아웃 최적화
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/retail-ai-inference" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "inference_type": "layout_optimization",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4"
  }'

# 수요 예측
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/retail-ai-inference" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "inference_type": "demand_forecast",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "parameters": {
      "forecast_days": 7
    }
  }'
```

### Inference Types 테스트
| Type | 설명 | 테스트 결과 |
|------|------|------------|
| `layout_optimization` | 레이아웃 최적화 | |
| `zone_analysis` | 구역 분석 | |
| `traffic_flow` | 고객 동선 | |
| `demand_forecast` | 수요 예측 | |
| `inventory_optimization` | 재고 최적화 | |
| `cross_sell` | 교차 판매 | |
| `customer_segmentation` | 고객 세분화 | |
| `anomaly_detection` | 이상 탐지 | |

---

## 5.3 unified-ai (통합 AI)

### 요청 형식
```bash
# 추천 생성
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/unified-ai" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_recommendations",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4"
  }'

# 이상 탐지
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/unified-ai" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "anomaly_detection",
    "store_id": "d9830554-2688-4032-af40-acccda787ac4"
  }'
```

### Action Types 테스트
| Action | 설명 | 테스트 결과 |
|--------|------|------------|
| `generate_recommendations` | 추천 생성 | |
| `ontology_recommendation` | 온톨로지 기반 추천 | |
| `anomaly_detection` | 이상 탐지 | |
| `pattern_analysis` | 패턴 분석 | |
| `infer_relations` | 관계 추론 | |

---

## 5.4 environment-proxy (환경 데이터)

### 날씨 API 테스트
```bash
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "weather",
    "lat": 37.5665,
    "lon": 126.9780,
    "store_id": "d9830554-2688-4032-af40-acccda787ac4",
    "save_to_db": true
  }'
```

### 공휴일 API 테스트
```bash
curl -X POST "https://bdrvowacecxnraaivlhr.supabase.co/functions/v1/environment-proxy" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "holidays",
    "year": 2026,
    "month": 1,
    "save_to_db": true
  }'
```

### 확인 사항
| 항목 | 상태 | 비고 |
|------|------|------|
| 날씨 API 응답 | | |
| weather_data 저장 | | |
| 공휴일 API 응답 | | |
| holidays_events 저장 | | |

---

# 6. 데이터베이스 테이블 검증

## 6.1 핵심 테이블 데이터 확인

```sql
-- 매장 확인
SELECT id, name, address FROM stores
WHERE id = 'd9830554-2688-4032-af40-acccda787ac4';

-- 구역 확인
SELECT id, zone_code, zone_name, zone_type FROM zones_dim
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4';

-- KPI 확인
SELECT date, total_revenue, total_visitors, conversion_rate
FROM daily_kpis_agg
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY date DESC LIMIT 7;

-- 상품 성과 확인
SELECT product_id, revenue, units_sold, conversion_rate
FROM product_performance_agg
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY revenue DESC LIMIT 10;

-- 날씨 데이터 확인
SELECT date, weather_condition, temperature, humidity
FROM weather_data
WHERE store_id = 'd9830554-2688-4032-af40-acccda787ac4'
ORDER BY date DESC LIMIT 7;

-- 공휴일 확인
SELECT date, event_name, event_type FROM holidays_events
WHERE date >= CURRENT_DATE
ORDER BY date LIMIT 10;
```

### 데이터 존재 여부
| 테이블 | 데이터 존재 | 건수 | 비고 |
|--------|------------|------|------|
| `stores` | | | |
| `zones_dim` | | | |
| `daily_kpis_agg` | | | |
| `product_performance_agg` | | | |
| `weather_data` | | | |
| `holidays_events` | | | |
| `furniture` | | | |
| `furniture_slots` | | | |
| `products` | | | |
| `customer_segments` | | | |

---

# 7. 통합 테스트 시나리오

## 7.1 시나리오 1: AI 최적화 → 적용 → ROI 측정

### 단계
1. **Studio에서 최적화 실행**
   - `/studio` 접속
   - AI 최적화 탭 선택
   - 최적화 실행

2. **추천 적용**
   - 추천 결과 확인
   - "적용" 버튼 클릭
   - 적용 확인 모달에서 확인

3. **ROI 확인**
   - `/roi` 이동
   - 적용된 전략 목록 확인
   - ROI 측정값 확인

### 테스트 결과
| 단계 | 상태 | 비고 |
|------|------|------|
| 최적화 실행 | | |
| 추천 결과 표시 | | |
| 전략 적용 | | |
| ROI 페이지 반영 | | |

---

## 7.2 시나리오 2: 환경 데이터 → 시뮬레이션 → 예측

### 단계
1. **환경 데이터 설정**
   - Studio 환경 설정 패널 열기
   - 날씨 모드: 실시간
   - 날씨 데이터 로드 확인

2. **시뮬레이션 실행**
   - AI 시뮬레이션 탭
   - 방문자 수 설정: 100
   - 시뮬레이션 시작

3. **예측 확인**
   - Insights → 예측 탭
   - 환경 영향 반영 확인

### 테스트 결과
| 단계 | 상태 | 비고 |
|------|------|------|
| 환경 데이터 로드 | | |
| 시뮬레이션 실행 | | |
| 예측 데이터 반영 | | |

---

## 7.3 시나리오 3: 데이터 임포트 → KPI 집계 → 인사이트

### 단계
1. **데이터 임포트**
   - Settings → 데이터 탭
   - CSV 파일 업로드
   - 컬럼 매핑 설정
   - 임포트 실행

2. **KPI 집계 실행**
   ```bash
   curl -X POST ".../functions/v1/aggregate-dashboard-kpis" \
     -d '{"store_id": "...", "date": "2026-01-05"}'
   ```

3. **인사이트 확인**
   - Insights → 개요 탭
   - KPI 업데이트 확인

### 테스트 결과
| 단계 | 상태 | 비고 |
|------|------|------|
| 데이터 임포트 | | |
| KPI 집계 | | |
| 인사이트 반영 | | |

---

# 8. 알려진 이슈 및 개선 사항

## 8.1 발견된 이슈

| ID | 영역 | 설명 | 심각도 | 상태 |
|----|------|------|--------|------|
| ISS-001 | | | | |
| ISS-002 | | | | |

## 8.2 개선 제안

| ID | 영역 | 제안 | 우선순위 |
|----|------|------|----------|
| IMP-001 | | | |
| IMP-002 | | | |

---

# 부록

## A. 환경 변수

```bash
# Supabase
VITE_SUPABASE_URL=https://bdrvowacecxnraaivlhr.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...

# 외부 API (필요시 설정)
VITE_OPENWEATHERMAP_API_KEY=
VITE_DATA_GO_KR_API_KEY=
```

## B. 테스트 데이터 시딩

```bash
# 시딩 스크립트 실행
psql -f scripts/seed_missing_data_v4.sql
```

## C. Edge Function 배포

```bash
# 전체 함수 배포
supabase functions deploy

# 개별 함수 배포
supabase functions deploy generate-optimization
supabase functions deploy environment-proxy
```

---

**작성자:** Claude AI
**버전:** 1.0
**최종 수정:** 2026-01-05
