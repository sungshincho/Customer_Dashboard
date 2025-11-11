# NEURALTWIN 프로젝트 구조 및 개발 로드맵

## 📋 목차
1. [데이터 관리](#1-데이터-관리)
2. [매장 현황 분석](#2-매장-현황-분석)
3. [Profit-Center (매출·이익 증대)](#3-profit-center-매출이익-증대)
4. [Cost-Center (비용 절감)](#4-cost-center-비용-절감)
5. [기술 스택](#5-기술-스택)
6. [데이터베이스 구조](#6-데이터베이스-구조)

---

## 1. 데이터 관리

### 1.1 데이터 임포트
**현재 구현 상태: ✅ 완료**

#### 구현된 기능
- **파일**: `src/pages/DataImport.tsx`
- CSV/Excel 파일 업로드
- 여러 시트 지원
- 자동 데이터 타입 감지
- 샘플 데이터 제공 (`public/samples/`)
  - brands.csv
  - customers.csv
  - products.csv
  - purchases.csv
  - purchases_extended.csv
  - social_states.csv
  - staff.csv
  - stores.csv
  - visits.csv
  - visits_extended.csv

#### 관련 컴포넌트
- `src/components/etl/SchemaMapper.tsx` - 스키마 매핑 UI

#### 데이터베이스
- `user_data_imports` 테이블 - 업로드된 데이터 저장

#### 향후 개발 필요
- [ ] 실시간 데이터 동기화 (API 연동)
- [ ] 데이터 검증 및 정제 자동화
- [ ] 대용량 파일 처리 최적화
- [ ] 데이터 버전 관리
- [ ] 스케줄링된 자동 임포트

---

### 1.2 데이터 분석 툴
**현재 구현 상태: ✅ 부분 완료**

#### 구현된 기능
- **파일**: `src/pages/Analytics.tsx`
- 기본 분석 대시보드
- 차트 및 시각화

#### 관련 컴포넌트
- `src/components/analysis/AIAnalysisButton.tsx` - AI 분석 트리거
- `src/components/analysis/AIInsights.tsx` - AI 인사이트 표시
- `src/components/analysis/AdvancedAIInference.tsx` - 고급 AI 추론
- `src/components/analysis/AdvancedFilters.tsx` - 필터링
- `src/components/analysis/AlertSettings.tsx` - 알림 설정
- `src/components/analysis/AnalysisHistory.tsx` - 분석 이력
- `src/components/analysis/ComparisonView.tsx` - 비교 분석
- `src/components/analysis/CorrelationAnalysis.tsx` - 상관관계 분석
- `src/components/analysis/EnhancedChart.tsx` - 차트 컴포넌트
- `src/components/analysis/ExportButton.tsx` - 데이터 내보내기
- `src/components/analysis/InsightsDashboard.tsx` - 인사이트 대시보드
- `src/components/analysis/StoreHeatmap.tsx` - 매장 히트맵
- `src/components/analysis/WTPAnalysisView.tsx` - WTP(지불의향가격) 분석
- `src/components/analysis/ZoneContribution.tsx` - 구역별 기여도

#### Edge Functions
- `supabase/functions/analyze-store-data/index.ts` - 매장 데이터 AI 분석
- `supabase/functions/analyze-retail-data/index.ts` - 리테일 데이터 분석
- `supabase/functions/advanced-ai-inference/index.ts` - 고급 AI 추론

#### 데이터베이스
- `analysis_history` 테이블 - 분석 이력 저장

#### 향후 개발 필요
- [ ] 예측 분석 고도화 (시계열 예측)
- [ ] 이상 탐지 시스템
- [ ] 다변량 분석 도구
- [ ] 커스텀 리포트 빌더
- [ ] 대시보드 템플릿 라이브러리
- [ ] 실시간 분석 스트리밍

---

### 1.3 온톨로지 스키마
**현재 구현 상태: ✅ 완료**

#### 구현된 기능
- **파일**: `src/pages/SchemaBuilder.tsx`
- 엔티티 타입 관리
- 관계 타입 정의
- 그래프 시각화
- 스키마 버전 관리
- 스키마 검증

#### 관련 컴포넌트
- `src/components/schema/EntityTypeManager.tsx` - 엔티티 타입 관리
- `src/components/schema/RelationTypeManager.tsx` - 관계 타입 관리
- `src/components/schema/SchemaGraphVisualization.tsx` - 그래프 시각화
- `src/components/schema/SchemaValidator.tsx` - 스키마 검증
- `src/components/schema/SchemaVersionManager.tsx` - 버전 관리

#### Edge Functions
- `supabase/functions/auto-map-etl/index.ts` - AI 기반 자동 매핑
- `supabase/functions/schema-etl/index.ts` - ETL 처리
- `supabase/functions/graph-query/index.ts` - 그래프 쿼리

#### 데이터베이스
- `ontology_entity_types` - 엔티티 타입 정의
- `ontology_relation_types` - 관계 타입 정의
- `ontology_schema_versions` - 스키마 버전
- `graph_entities` - 그래프 엔티티
- `graph_relations` - 그래프 관계
- `user_classification_patterns` - 분류 패턴 학습

#### 데이터 스키마 정의
- `src/utils/dataSchemas.ts` - 표준 데이터 스키마
- `src/utils/enterpriseSchemas.ts` - 엔터프라이즈 스키마
- `src/utils/dataNormalizer.ts` - 데이터 정규화
- `src/utils/classificationLearning.ts` - 분류 학습

#### 향후 개발 필요
- [ ] 스키마 마이그레이션 도구
- [ ] 스키마 충돌 해결 자동화
- [ ] 온톨로지 추천 시스템
- [ ] 다중 테넌트 스키마 관리
- [ ] 스키마 성능 최적화 분석

---

## 2. 매장 현황 분석

### 2.1 매장 관리
**현재 구현 상태: ✅ 완료**

#### 구현된 기능
- **파일**: `src/pages/Stores.tsx`
- 매장 목록 및 상세 정보
- 매장별 성과 모니터링

#### 관련 컴포넌트
- `src/components/features/HQStoreSync.tsx` - 본사-매장 동기화

#### 데이터
- `src/data/sampleData.ts` - 샘플 매장 데이터

#### 향후 개발 필요
- [ ] 다중 매장 실시간 비교 대시보드
- [ ] 매장별 KPI 목표 설정 및 추적
- [ ] 매장 간 벤치마킹 리포트
- [ ] 지역별/그룹별 매장 분석
- [ ] 매장 성과 순위 시스템

---

### 2.2 방문자 분석
**현재 구현 상태: ✅ 완료**

#### 구현된 기능
- **파일**: `src/pages/FootfallAnalysis.tsx`
- 방문자 트래픽 분석
- 시간대별 방문 패턴

#### 관련 컴포넌트
- `src/components/features/TrafficHeatmap.tsx` - 트래픽 히트맵
- `src/components/features/FootfallVisualizer.tsx` - 방문자 시각화
- `src/components/features/ConversionFunnel.tsx` - 전환 퍼널
- `src/components/features/CustomerJourney.tsx` - 고객 여정

#### 관련 페이지
- `src/pages/TrafficHeatmapPage.tsx` - 히트맵 전용 페이지
- `src/pages/ConversionFunnelPage.tsx` - 퍼널 분석 페이지
- `src/pages/CustomerJourneyPage.tsx` - 여정 분석 페이지

#### 향후 개발 필요
- [ ] 실시간 방문자 카운팅 (IoT 센서 연동)
- [ ] 방문자 동선 예측 모델
- [ ] 피크타임 자동 감지 및 알림
- [ ] 날씨/이벤트 영향 분석
- [ ] 경쟁 매장 비교 분석

---

### 2.3 기본 재고 관리
**현재 구현 상태: ✅ 완료**

#### 구현된 기능
- **파일**: `src/pages/Inventory.tsx`
- 재고 현황 조회
- 재고 레벨 모니터링

#### 관련 컴포넌트
- `src/components/features/InventoryOptimizer.tsx` - 재고 최적화

#### 데이터베이스
- `inventory_levels` - 재고 수준 데이터
- `products` - 상품 정보

#### Hooks
- `src/hooks/useRealtimeInventory.ts` - 실시간 재고 조회

#### 향후 개발 필요
- [ ] 바코드/RFID 스캐너 연동
- [ ] 재고 실사 모바일 앱
- [ ] 재고 이동 추적
- [ ] 유통기한 관리
- [ ] 로트 관리 시스템

---

## 3. Profit-Center (매출·이익 증대)

### 3.1 수요 예측 / 재고 관리 / 최적화
**현재 구현 상태: ⚠️ 부분 완료 - 통합 필요**

#### 구현된 기능

##### 수요 예측
- **파일**: `src/pages/DemandForecastPage.tsx`
- 시계열 예측
- 계절성 분석

#### 재고 최적화
- **파일**: `src/pages/InventoryOptimizerPage.tsx`
- 최적 재고 수준 제안
- 재발주점 계산

#### 통합 뷰
- **파일**: `src/pages/ProfitCenterPage.tsx` ⭐️ 핵심
- 수요-재고 통합 대시보드
- 재무 영향 시뮬레이션
- 자동 발주 제안

#### Edge Functions
- `supabase/functions/inventory-monitor/index.ts` - 재고 모니터링

#### 데이터베이스
- `inventory_levels` - 재고 수준
- `auto_order_suggestions` - 자동 발주 제안
- `products` - 상품 정보

#### 향후 개발 필요 ⭐️ 최우선 순위

##### 실시간 통합 파이프라인
- [ ] 수요 예측 → 자동 발주 → 재고 최적화 자동화
- [ ] 실시간 재고-수요 갭 분석 대시보드
- [ ] SKU별 수요 패턴 ML 학습 및 자동 조정

##### 재무 영향 분석
- [ ] 재고 부족/과잉의 기회비용 정량화
- [ ] 재고 회전율 최적화 시뮬레이션
- [ ] 재고 자산 효율성 분석
- [ ] ROI 계산기 (자동 발주 시)

##### 고급 알고리즘
- [ ] 공급업체 리드타임 고려 로직
- [ ] 계절성/프로모션 영향 반영
- [ ] 다중 제약 조건 최적화 (창고 용량, 예산 등)
- [ ] 안전 재고 자동 계산

##### 알림 및 자동화
- [ ] 재고 임계값 도달 시 자동 알림
- [ ] 자동 발주 승인 워크플로우
- [ ] 긴급 발주 우선순위 큐
- [ ] 이메일/슬랙 통합 알림

---

### 3.2 가격·프로모션 최적화
**현재 구현 상태: ⚠️ 기본 구조만 존재**

#### 구현된 기능
- **파일**: `src/pages/PricingOptimizerPage.tsx` (기본 UI)
- WTP 분석 기초 구조

#### 관련 컴포넌트
- `src/components/analysis/WTPAnalysisView.tsx` - WTP 분석 뷰

#### 향후 개발 필요 🆕 신규 구축

##### 동적 가격 제안 시스템
- [ ] WTP 분석 + 경쟁사 가격 + 재고 수준 통합 알고리즘
- [ ] 실시간 가격 제안 엔진
- [ ] 가격 변경 시뮬레이션 (매출/이익 영향)
- [ ] 세그먼트별 차별화 가격 전략

##### 프로모션 효과 측정
- [ ] A/B 테스트 프레임워크 구축
- [ ] 프로모션 ROI 계산
- [ ] 프로모션 타이밍 최적화
- [ ] 교차 판매/상향 판매 분석

##### 가격 탄력성 분석
- [ ] 가격 변동 시 수요 변화 예측
- [ ] 탄력성 계수 계산
- [ ] 최적 가격대 추천
- [ ] 경쟁사 가격 추적 시스템

##### 필요 신규 컴포넌트
```
src/components/pricing/
  ├── DynamicPricingEngine.tsx
  ├── PromotionSimulator.tsx
  ├── CompetitorPriceTracker.tsx
  ├── ElasticityAnalysis.tsx
  ├── SegmentPricingStrategy.tsx
  └── PriceChangeImpact.tsx
```

---

### 3.3 고객 개인화 경험
**현재 구현 상태: ⚠️ 부분 완료**

#### 구현된 기능
- **파일**: `src/pages/CustomerRecommendationsPage.tsx`
- 고객 세그먼트 분석
- 실시간 추천 기본 구조

#### 관련 컴포넌트
- `src/components/features/CustomerJourney.tsx` - 고객 여정 분석
- `src/components/features/LayoutSimulator.tsx` - 레이아웃 시뮬레이터

#### 관련 페이지
- `src/pages/CustomerJourneyPage.tsx`
- `src/pages/LayoutSimulatorPage.tsx`

#### 향후 개발 필요 🔧 확장

##### 행동 기반 추천 엔진
- [ ] 동선 패턴 → 상품 추천 ML 모델
- [ ] 구매 이력 기반 협업 필터링
- [ ] 실시간 추천 API
- [ ] 추천 효과 측정 시스템

##### 실시간 개인화
- [ ] 매장 내 위치 기반 프로모션 푸시
- [ ] 개인화된 쿠폰 발행 시스템
- [ ] 모바일 앱 연동
- [ ] 디지털 사이니지 개인화

##### 레이아웃 최적화
- [ ] 고객 동선 데이터 기반 매장 배치 최적화
- [ ] 히트존/콜드존 자동 감지
- [ ] 레이아웃 변경 효과 A/B 테스트
- [ ] 3D 매장 시뮬레이터

##### 고객 세그먼테이션
- [ ] RFM 분석 고도화
- [ ] 행동 패턴 클러스터링 (K-means, DBSCAN)
- [ ] 라이프사이클 스테이지 분류
- [ ] 이탈 예측 모델

##### 필요 신규 컴포넌트
```
src/components/personalization/
  ├── RecommendationEngine.tsx
  ├── RealTimePersonalization.tsx
  ├── LayoutOptimizer.tsx
  ├── CustomerSegmentation.tsx
  ├── RFMAnalysis.tsx
  └── ChurnPrediction.tsx
```

---

## 4. Cost-Center (비용 절감)

### 4.1 운영 프로세스 자동화
**현재 구현 상태: ⚠️ 기본 기능만 존재**

#### 구현된 기능
- **파일**: `src/pages/StaffEfficiencyPage.tsx`
- 직원 효율성 기본 분석

#### 관련 컴포넌트
- `src/components/features/StaffEfficiency.tsx` - 직원 효율성

#### 향후 개발 필요 🔧 확장

##### 자동 리포트 생성
- [ ] 일/주/월 성과 리포트 자동 생성
- [ ] 맞춤형 리포트 템플릿
- [ ] 이메일 자동 발송
- [ ] PDF/Excel 자동 내보내기
- [ ] 경영진 대시보드 (Executive Summary)

##### 작업 스케줄링 최적화
- [ ] 수요 예측 기반 직원 배치 최적화
- [ ] 시프트 자동 생성
- [ ] 초과근무 최소화 알고리즘
- [ ] 인건비 최적화 시뮬레이션

##### 이상 탐지 시스템
- [ ] 매출 이상 패턴 자동 감지
- [ ] 재고 이상 알림 (도난, 손실)
- [ ] 방문자 급증/급감 알림
- [ ] 시스템 장애 자동 감지

##### KPI 자동 추적
- [ ] 실시간 KPI 대시보드
- [ ] 목표 대비 실적 자동 계산
- [ ] 성과 추세 분석
- [ ] 알림 규칙 커스터마이징

##### 필요 신규 컴포넌트
```
src/components/automation/
  ├── AutoReportGenerator.tsx
  ├── StaffScheduler.tsx
  ├── AnomalyDetector.tsx
  ├── KPITracker.tsx
  ├── AlertConfigurer.tsx
  └── ExecutiveDashboard.tsx
```

##### 필요 신규 Edge Functions
```
supabase/functions/
  ├── generate-reports/
  ├── optimize-scheduling/
  ├── detect-anomalies/
  └── track-kpis/
```

---

## 5. 기술 스택

### Frontend
- **Framework**: React 18.3.1 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM 6.30.1
- **UI Library**: Radix UI + shadcn/ui
- **Styling**: Tailwind CSS + tailwindcss-animate
- **Charts**: Recharts 2.15.4
- **Forms**: React Hook Form 7.61.1 + Zod 4.1.12
- **State Management**: TanStack Query 5.83.0
- **Visualization**: 
  - react-force-graph-2d (그래프 시각화)
  - d3-force (물리 엔진)
- **Icons**: Lucide React 0.462.0
- **Theme**: next-themes 0.3.0
- **Date Handling**: date-fns 3.6.0
- **File Handling**: xlsx 0.18.5, jspdf 3.0.3

### Backend (Lovable Cloud / Supabase)
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth
- **Edge Functions**: Deno
- **Real-time**: Supabase Realtime
- **AI Integration**: Lovable AI Gateway
  - google/gemini-2.5-pro
  - google/gemini-2.5-flash
  - google/gemini-2.5-flash-lite
  - openai/gpt-5
  - openai/gpt-5-mini
  - openai/gpt-5-nano

---

## 6. 데이터베이스 구조

### 주요 테이블

#### 데이터 관리
- `user_data_imports` - 업로드된 데이터
- `analysis_history` - 분석 이력
- `user_classification_patterns` - 학습된 분류 패턴

#### 온톨로지
- `ontology_entity_types` - 엔티티 타입 정의
- `ontology_relation_types` - 관계 타입 정의
- `ontology_schema_versions` - 스키마 버전 관리

#### 그래프
- `graph_entities` - 그래프 엔티티
- `graph_relations` - 그래프 관계

#### 재고 & 상품
- `products` - 상품 정보
- `inventory_levels` - 재고 수준
- `auto_order_suggestions` - 자동 발주 제안

### RLS (Row Level Security)
- 모든 테이블에 사용자별 데이터 격리 정책 적용
- `auth.uid() = user_id` 조건으로 보안 유지

### 주요 Database Functions
- `graph_n_hop_query()` - N-홉 그래프 쿼리
- `graph_shortest_path()` - 최단 경로 탐색
- `update_updated_at_column()` - 자동 타임스탬프 업데이트
- `update_classification_patterns_updated_at()` - 분류 패턴 업데이트
- `update_ontology_updated_at()` - 온톨로지 업데이트

---

## 7. 우선순위 개발 로드맵

### Phase 1: Profit-Center 고도화 (최우선) ⭐️⭐️⭐️
**목표**: 매출 증대 직접 기여

1. **수요 예측 & 재고 관리 통합** (4-6주)
   - 실시간 연동 파이프라인 구축
   - 재무 영향 시뮬레이션
   - SKU별 자동 최적화
   - 자동 발주 워크플로우

2. **가격·프로모션 최적화 시스템** (3-4주)
   - 동적 가격 엔진
   - A/B 테스트 프레임워크
   - 가격 탄력성 분석
   - 경쟁사 가격 추적

3. **고객 개인화 경험** (3-4주)
   - 추천 엔진 고도화
   - RFM 세그먼테이션
   - 실시간 개인화 시스템

### Phase 2: Cost-Center 자동화 (중기) ⭐️⭐️
**목표**: 운영 비용 절감

4. **운영 프로세스 자동화** (3-4주)
   - 자동 리포트 생성
   - 직원 스케줄링 최적화
   - 이상 탐지 시스템
   - KPI 자동 추적

### Phase 3: 데이터 & 분석 고도화 (장기) ⭐️
**목표**: 인사이트 품질 향상

5. **데이터 관리 고도화** (2-3주)
   - 실시간 데이터 동기화
   - 대용량 처리 최적화
   - 데이터 품질 자동 검증

6. **분석 툴 고도화** (2-3주)
   - 예측 분석 강화
   - 커스텀 리포트 빌더
   - 실시간 분석 스트리밍

---

## 8. 성과 지표 (KPI)

### Profit-Center
- 매출 증가율 (YoY, MoM)
- 재고 회전율 개선
- 품절률 감소
- 마진율 개선
- 객단가 상승
- 전환율 증가

### Cost-Center
- 운영 비용 절감율
- 인건비 최적화율
- 재고 보유 비용 감소
- 자동화율 (자동 처리 작업 비율)
- 이상 탐지 정확도

### 데이터 품질
- 데이터 정확도
- 예측 정확도 (MAPE, RMSE)
- 시스템 가동률
- 응답 시간
- 사용자 만족도

---

## 9. 참고 문서

- `COLLABORATION_GUIDE.md` - 협업 가이드
- `ONBOARDING.md` - 온보딩 가이드
- `README.md` - 프로젝트 개요
- `src/utils/dataSchemas.ts` - 데이터 스키마 정의
- `src/utils/enterpriseSchemas.ts` - 엔터프라이즈 스키마

---

**문서 작성일**: 2025-11-11  
**버전**: 1.0  
**다음 업데이트 예정**: Phase 1 완료 후
