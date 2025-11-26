# 데이터 소스 매핑 문서

**최종 업데이트**: 2025년 1월 25일  
**버전**: 2.0 (코드 구조 개편 반영)

이 문서는 개편된 코드 구조(A/B/C/D 섹션)에 따라 모든 페이지와 기능이 어떤 데이터베이스 테이블과 연결되어 있는지, 어떤 데이터 소스를 사용하는지 정리합니다.

---

## 📚 목차
- [A. Overview 섹션](#a-overview-섹션)
- [B. 매장 현황 분석 섹션](#b-매장-현황-분석-섹션)
- [C. 시뮬레이션 섹션](#c-시뮬레이션-섹션)
- [D. 데이터 관리 섹션](#d-데이터-관리-섹션)
- [공통 Hooks](#공통-hooks)
- [Edge Functions](#edge-functions)

---

## A. Overview 섹션

### 1. 대시보드 (`/overview/dashboard`)
**파일**: `src/core/pages/DashboardPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `dashboard_kpis` | 일별 KPI 데이터 (방문자, 매출, 전환율 등) | Hook: `useDashboardKPI`, `useLatestKPIs` |
| `funnel_metrics` | 고객 퍼널 데이터 (Entry → Browse → Fitting → Purchase → Return) | Hook: `useDashboardKPI` |
| `ai_recommendations` | AI 기반 추천사항 | Hook: `useAIRecommendations` |
| `stores` | 매장 정보 (선택된 매장) | Hook: `useSelectedStore` |

#### 사용 Storage 버킷
| 버킷명 | 용도 |
|--------|------|
| `store-data` | 방문/구매/WiFi 등 CSV 파일 저장 |

#### 관련 Hooks
- `useDashboardKPI(storeId, dateStr)` - 특정 날짜의 KPI 데이터 조회
- `useLatestKPIs(storeId, days)` - 최근 N일간 KPI 트렌드 데이터
- `useAIRecommendations(storeId)` - AI 추천사항 조회/생성/Dismiss
- `useSelectedStore()` - 현재 선택된 매장 정보
- `useStoreDataset()` - Storage에서 CSV 데이터 로드

#### 관련 Edge Functions
- `aggregate-dashboard-kpis` - CSV 데이터를 집계하여 dashboard_kpis 테이블 생성
- `aggregate-all-kpis` - 모든 KPI 집계
- `generate-ai-recommendations` - AI 추천 생성

---

### 2. 매장 관리 (`/overview/stores`)
**파일**: `src/features/overview/pages/StoresPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `stores` | 매장 CRUD (생성/조회/수정/삭제) | Direct Supabase Query |
| `organization_members` | 사용자 조직 권한 확인 | RLS Policy |

#### 사용 Storage 버킷
없음

#### 관련 Hooks
- `useSelectedStore()` - 매장 목록 조회, 선택, 갱신
- `useAuth()` - 사용자 인증 정보

#### 관련 Edge Functions
없음 (직접 Supabase CRUD)

---

### 3. HQ-매장 커뮤니케이션 (`/overview/hq-communication`)
**파일**: `src/features/overview/pages/HQCommunicationPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `hq_store_messages` | 메시지 & 코멘트 송수신 | Hook: `useHQCommunication` |
| `hq_guidelines` | 가이드라인 생성/조회 | Direct Supabase Query (Components) |
| `hq_notifications` | 알림 조회/읽음 처리 | Direct Supabase Query (Components) |
| `stores` | 수신 대상 매장 선택 | Hook: `useSelectedStore` |

#### 사용 Storage 버킷
없음 (첨부파일은 JSONB로 저장)

#### 관련 Hooks
- `useHQCommunication()` - 메시지 송수신 관리
- `useAuth()` - 사용자 역할 확인 (HQ/Store)

#### 관련 Components
- `UnifiedMessageThread` - 메시지 스레드 표시
- `GuidelineForm` - 가이드라인 생성 폼
- `GuidelineList` - 가이드라인 목록
- `NotificationPanel` - 알림 패널

#### 관련 Edge Functions
없음 (DB Trigger로 자동 알림 생성)

---

### 4. 설정 (`/overview/settings`)
**파일**: `src/core/pages/SettingsPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `profiles` | 사용자 프로필 정보 | Direct Supabase Query |
| `organizations` | 조직 정보 | Direct Supabase Query |
| `organization_members` | 사용자 역할 및 권한 | Direct Supabase Query |
| `subscriptions` | 구독 및 라이선스 정보 | Direct Supabase Query |
| `licenses` | 라이선스 상세 정보 | Direct Supabase Query |
| `notification_settings` | 알림 설정 | Direct Supabase Query |
| `organization_settings` | 조직 설정 (브랜드, 통화, 타임존 등) | Direct Supabase Query |
| `report_schedules` | 리포트 스케줄 설정 | Direct Supabase Query |
| `invitations` | 사용자 초대 내역 | Direct Supabase Query |

#### 사용 Storage 버킷
없음

#### 관련 Hooks
- `useAuth()` - 사용자 정보 및 역할

#### 관련 Edge Functions
없음

---

## B. 매장 현황 분석 섹션

### 5. 매장 분석 (`/analysis/store`)
**파일**: `src/features/analysis/pages/StoreAnalysisPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `dashboard_kpis` | 방문자 통계, 전환율 | Hook: `useFootfallAnalysis` |
| `wifi_tracking` | WiFi 트래킹 데이터 → 히트맵 생성 | Hook: `useTrafficHeatmap` |
| `stores` | 매장 메타데이터 (zones, storeSpaceMetadata) | Hook: `useSelectedStore` |
| `holidays_events` | 외부 컨텍스트 (휴일, 이벤트) | Hook: `useTrafficContext` |
| `economic_indicators` | 경제 지표 | Hook: `useTrafficContext` |

#### 사용 Storage 버킷
| 버킷명 | 용도 |
|--------|------|
| `store-data` | visits.csv, wifi_tracking.csv |

#### 관련 Hooks
- `useFootfallAnalysis(storeId, startDate, endDate)` - 방문자 분석
- `useTrafficHeatmap(storeId, timeOfDay)` - 시간대별 히트맵 데이터
- `useZoneStatistics(heatPoints, metadata)` - 존별 통계
- `useTrafficContext(storeId)` - 외부 컨텍스트 인사이트

#### 3D 오버레이 컴포넌트
- `HeatmapOverlay3D` - 히트맵 3D 시각화
- `ZoneBoundaryOverlay` - 존 경계 표시

#### 관련 Edge Functions
- `process-wifi-data` - WiFi 트래킹 데이터 처리

---

### 6. 고객 분석 (`/analysis/customer`)
**파일**: `src/features/analysis/pages/CustomerAnalysisPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `wifi_tracking` | 고객 동선 경로 데이터 | Hook: `useCustomerJourney` |
| `customers` | 고객 세그먼트 (VIP/Regular/New) | Hook: `useCustomerSegments` |
| `purchases` | 구매 패턴 분석 | Hook: `usePurchasePatterns` |
| `stores` | 매장 메타데이터 (zones) | Hook: `useSelectedStore` |

#### 사용 Storage 버킷
| 버킷명 | 용도 |
|--------|------|
| `store-data` | visits.csv, purchases.csv, customers.csv, wifi_tracking.csv |

#### 관련 Hooks
- `useCustomerJourney(storeId, timeOfDay)` - 고객 동선 경로
- `useJourneyStatistics(paths)` - 경로 통계 분석
- `useCustomerSegments()` - 고객 세그먼트 분석
- `usePurchasePatterns()` - 구매 패턴 분석
- `useMultipleStoreDataFiles(['visits', 'purchases'])` - 여러 CSV 파일 동시 로드

#### 3D 오버레이 컴포넌트
- `CustomerPathOverlay` - 고객 동선 경로 표시
- `CustomerAvatarOverlay` - 고객 아바타 실시간 표시
- `ZoneBoundaryOverlay` - 존 경계 표시

#### 관련 Edge Functions
없음

---

### 7. 상품 분석 (`/analysis/product`)
**파일**: `src/features/analysis/pages/ProductAnalysisPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `products` | 상품 목록 및 가격 정보 | Direct Supabase Query |
| `inventory_levels` | 재고 수준 (현재/최소/최적) | Hook: `useRealtimeInventory` |
| `purchases` | 구매 데이터 → 매출/판매량 계산 | Hook: `useStoreDataset` |

#### 사용 Storage 버킷
| 버킷명 | 용도 |
|--------|------|
| `store-data` | purchases.csv, products.csv |

#### 관련 Hooks
- `useStoreDataset()` - 상품 및 구매 데이터 로드
- `useRealtimeInventory()` - 실시간 재고 레벨 조회

#### 관련 Edge Functions
없음

---

## C. 시뮬레이션 섹션

### 8. 디지털 트윈 3D (`/simulation/digital-twin`)
**파일**: `src/features/simulation/pages/DigitalTwin3DPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `ai_scene_analysis` | 3D 씬 레시피 저장/조회 | Hook: `useStoreScene` |
| `graph_entities` | 온톨로지 엔티티 (상품, 가구 등) | Direct Supabase Query |
| `ontology_entity_types` | 엔티티 타입 정의 (3D 모델 URL 포함) | Direct Supabase Query |

#### 사용 Storage 버킷
| 버킷명 | 용도 |
|--------|------|
| `3d-models` | GLB/FBX 3D 모델 파일 저장 |

#### 관련 Hooks
- `useStoreScene()` - 활성 씬 조회 및 저장
- `useOntologyData()` - 온톨로지 데이터 조회

#### 3D 컴포넌트
- `SceneComposer` - 3D 씬 렌더링 (Store/Furniture/Product/Lighting)
- `ModelLayerManager` - 레이어별 3D 모델 관리
- `ModelUploader` - 3D 모델 업로드
- `AutoModelMapper` - 자동 모델 매핑

#### 관련 Utils
- `modelStorageManager.ts` - Storage 3D 모델 관리
- `modelFilenameParser.ts` - 파일명 파싱 (Space/Furniture/Product)
- `modelLayerLoader.ts` - 레이어별 모델 로딩
- `sceneRecipeGenerator.ts` - SceneRecipe 생성
- `verifyAndCleanupModelUrls.ts` - 모델 URL 검증

#### 관련 Edge Functions
- `analyze-3d-model` - 3D 모델 분석
- `auto-process-3d-models` - 자동 3D 모델 처리

---

### 9. 시뮬레이션 허브 (`/simulation/hub`)
**파일**: `src/features/simulation/pages/SimulationHubPage.tsx`

이 페이지는 **5가지 시뮬레이션을 통합**합니다:
1. 레이아웃 최적화
2. 향후 수요 예측
3. 재고 최적화
4. 가격 최적화
5. 추천 마케팅/프로모션 전략

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `graph_entities` | 온톨로지 엔티티 (상품, 존 등) | Hook: `useStoreContext` |
| `graph_relations` | 엔티티 간 관계 | Hook: `useStoreContext` |
| `products` | 상품 정보 | Hook: `useStoreContext` |
| `inventory_levels` | 재고 레벨 | Hook: `useStoreContext` |
| `dashboard_kpis` | 최근 KPI 데이터 | Hook: `useStoreContext` |
| `ai_scene_analysis` | 3D 씬 데이터 (레이아웃 시뮬레이션) | Hook: `useStoreScene` |

#### 사용 Storage 버킷
없음 (모든 데이터는 DB 기반)

#### 관련 Hooks
- `useStoreContext(storeId)` - 시뮬레이션용 통합 컨텍스트 데이터
- `useAIInference()` - AI 추론 실행
- `useStoreScene()` - 레이아웃 시뮬레이션 씬 조회

#### 결과 컴포넌트
- `DemandForecastResult` - 수요 예측 결과 표시
- `InventoryOptimizationResult` - 재고 최적화 결과
- `PricingOptimizationResult` - 가격 최적화 결과
- `RecommendationStrategyResult` - 추천 전략 결과

#### 관련 Edge Functions
- `advanced-ai-inference` - AI 시뮬레이션 실행 (5가지 타입 지원)
  - `layout` - 레이아웃 최적화
  - `demand` - 수요 예측
  - `inventory` - 재고 최적화
  - `pricing` - 가격 최적화
  - `recommendation` - 추천 전략

---

## D. 데이터 관리 섹션

### 10. 통합 데이터 임포트 (`/data-management/import`)
**파일**: `src/features/data-management/import/pages/UnifiedDataManagementPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `user_data_imports` | 임포트 세션 메타데이터 | Hook: `useImportProgress` |
| `upload_sessions` | 업로드 세션 추적 | Hook: `useUploadSession` |
| `graph_entities` | 온톨로지 엔티티 (임포트된 데이터) | Direct Supabase Query |
| `graph_relations` | 엔티티 간 관계 | Direct Supabase Query |
| `ontology_entity_types` | 엔티티 타입 정의 | Component: `OntologyDataManagement` |
| `ontology_mapping_cache` | 자동 매핑 캐시 | Edge Function: `smart-ontology-mapping` |

#### 사용 Storage 버킷
| 버킷명 | 용도 |
|--------|------|
| `store-data` | CSV 파일 업로드 (visits, purchases, products 등) |
| `3d-models` | 3D 모델 업로드 |

#### 관련 Components
- `UnifiedDataUpload` - CSV 업로드 UI
- `OntologyDataManagement` - 온톨로지 기반 데이터 관리
- `SchemaMapper` - 스키마 매핑 UI
- `DataValidation` - 데이터 검증
- `DataStatistics` - 임포트 통계
- `DemoReadinessChecker` - 데모 준비 상태 확인
- `StorageManager` - 3D 모델 관리

#### 관련 Hooks
- `useImportProgress(sessionId)` - 임포트 진행률 추적
- `useUploadSession()` - 업로드 세션 관리
- `useDataReadiness()` - 데이터 준비 상태 확인

#### 관련 Edge Functions
- `integrated-data-pipeline` - 통합 데이터 파이프라인 (CSV → Ontology → DB)
- `smart-ontology-mapping` - AI 기반 자동 스키마 매핑
- `import-with-ontology` - 온톨로지 기반 임포트
- `validate-and-fix-csv` - CSV 검증 및 자동 수정
- `auto-fix-data` - 데이터 자동 수정
- `auto-map-etl` - ETL 자동 매핑
- `cleanup-integrated-data` - 데이터 정리

---

### 11. 스키마 빌더 (`/data-management/schema`)
**파일**: `src/features/data-management/ontology/pages/SchemaBuilderPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `ontology_entity_types` | 엔티티 타입 정의 (상품, 매장, 고객 등) | Component: `EntityTypeManager` |
| `ontology_relation_types` | 관계 타입 정의 (포함, 구매, 방문 등) | Component: `RelationTypeManager` |
| `ontology_schema_versions` | 스키마 버전 관리 | Component: `SchemaVersionManager` |
| `ontology_schemas` | 스키마 정의 저장 | Direct Supabase Query |

#### 사용 Storage 버킷
없음

#### 관련 Components
- `EntityTypeManager` - 엔티티 타입 생성/수정/삭제
- `RelationTypeManager` - 관계 타입 관리
- `SchemaGraphVisualization` - 스키마 그래프 시각화
- `SchemaValidator` - 스키마 검증
- `SchemaVersionManager` - 버전 관리
- `RetailSchemaPreset` - 리테일 스키마 프리셋
- `OntologyVariableCalculator` - 변수 계산기

#### 관련 Hooks
- `useOntologyData()` - 온톨로지 데이터 조회

#### 관련 Edge Functions
- `graph-query` - 그래프 쿼리 실행 (N-hop, Shortest Path 등)
- `schema-etl` - 스키마 ETL

---

### 12. API 연동 (`/data-management/api`)
**파일**: `src/features/data-management/api/pages/APIIntegrationPage.tsx`

#### 사용 데이터베이스 테이블
| 테이블명 | 용도 | 접근 방식 |
|---------|------|-----------|
| `api_connections` | API 연결 정보 (URL, 인증, 헤더 등) | Direct Supabase Query |
| `external_data_sources` | 외부 데이터 소스 정의 | Direct Supabase Query |
| `data_sync_schedules` | 자동 동기화 스케줄 (Cron 표현식) | Direct Supabase Query |
| `data_sync_logs` | 동기화 실행 로그 (성공/실패, 레코드 수 등) | Direct Supabase Query |

#### 사용 Storage 버킷
없음

#### 관련 Hooks
없음 (Direct Supabase Query 사용)

#### 주요 기능
- **API 연결 관리**: REST/GraphQL/Webhook API 등록, 테스트, 활성화/비활성화
- **스케줄 관리**: Cron 표현식으로 자동 동기화 스케줄 설정
- **동기화 로그**: 실행 이력, 성공/실패 상태, 동기화된 레코드 수 확인

#### 관련 Edge Functions
- `test-api-connection` - API 연결 테스트

---

## 공통 Hooks

### 데이터 로딩 Hooks
| Hook 이름 | 용도 | 사용하는 테이블/Storage |
|-----------|------|------------------------|
| `useStoreData.ts` | Storage에서 CSV 파일 로드 | Storage: `store-data` |
| `useStoreDataset()` | 전체 데이터셋 로드 | Storage: `store-data` |
| `useMultipleStoreDataFiles()` | 여러 CSV 동시 로드 | Storage: `store-data` |
| `useRealSampleData.ts` | 샘플 데이터 로드 | Storage: `store-data` |

### 분석 Hooks
| Hook 이름 | 용도 | 사용하는 테이블/Storage |
|-----------|------|------------------------|
| `useFootfallAnalysis.ts` | 방문자 분석 | `dashboard_kpis` |
| `useCustomerJourney.ts` | 고객 동선 | `wifi_tracking` |
| `useDwellTime.ts` | 체류 시간 | `wifi_tracking` |
| `useTrafficHeatmap.ts` | 트래픽 히트맵 | `wifi_tracking` |
| `useWiFiTracking.ts` | WiFi 트래킹 | `wifi_tracking` |
| `useZoneTransition.ts` | 존 전환 | `wifi_tracking` |
| `useCustomerSegments.ts` | 고객 세그먼트 | `customers`, `purchases` |
| `usePurchasePatterns.ts` | 구매 패턴 | `purchases`, `products` |

### 시뮬레이션 Hooks
| Hook 이름 | 용도 | 사용하는 테이블/Storage |
|-----------|------|------------------------|
| `useAIInference.ts` | AI 추론 실행 | Edge Function 호출 |
| `useStoreContext.ts` | 시뮬레이션 컨텍스트 데이터 | 여러 테이블 통합 |
| `useRealtimeTracking.ts` | 실시간 트래킹 | `wifi_tracking` |
| `useStoreScene.ts` | 3D 씬 관리 | `ai_scene_analysis` |

### 데이터 관리 Hooks
| Hook 이름 | 용도 | 사용하는 테이블/Storage |
|-----------|------|------------------------|
| `useImportProgress.ts` | 임포트 진행률 | `user_data_imports` |
| `useUploadSession.ts` | 업로드 세션 | `upload_sessions` |
| `useOntologyData.ts` | 온톨로지 데이터 | `graph_entities`, `ontology_*` |
| `useDataReadiness.ts` | 데이터 준비 상태 | Storage 파일 존재 확인 |

### UI/기타 Hooks
| Hook 이름 | 용도 | 사용하는 테이블/Storage |
|-----------|------|------------------------|
| `useAuth.tsx` | 사용자 인증/역할 | `auth.users`, `organization_members` |
| `useSelectedStore.tsx` | 매장 선택 관리 | `stores` |
| `useDashboardKPI.ts` | 대시보드 KPI | `dashboard_kpis` |
| `useAIRecommendations.ts` | AI 추천 | `ai_recommendations` |
| `useRealtimeInventory.ts` | 실시간 재고 | `inventory_levels` |
| `useHQCommunication.ts` | HQ-매장 커뮤니케이션 | `hq_store_messages` |
| `useClearCache.ts` | 캐시 무효화 | React Query 캐시 |

---

## Edge Functions

### 데이터 처리 Functions
| Function 이름 | 용도 | 입력 | 출력 |
|--------------|------|------|------|
| `integrated-data-pipeline` | 통합 데이터 파이프라인 | CSV 파일 경로 | 온톨로지 엔티티/관계 |
| `validate-and-fix-csv` | CSV 검증 및 수정 | CSV 파일 | 수정된 CSV |
| `auto-fix-data` | 데이터 자동 수정 | 문제 데이터 | 수정된 데이터 |
| `cleanup-integrated-data` | 데이터 정리 | 세션 ID | 정리 결과 |
| `process-wifi-data` | WiFi 데이터 처리 | WiFi CSV | wifi_tracking 레코드 |

### AI Functions
| Function 이름 | 용도 | 입력 | 출력 |
|--------------|------|------|------|
| `advanced-ai-inference` | AI 시뮬레이션 실행 | 시나리오 타입, 파라미터 | 시뮬레이션 결과 |
| `generate-ai-recommendations` | AI 추천 생성 | 매장 ID, 데이터 | AI 추천사항 |
| `analyze-3d-model` | 3D 모델 분석 | 모델 파일 | 모델 메타데이터 |
| `smart-ontology-mapping` | AI 스키마 매핑 | CSV 헤더 | 매핑 제안 |
| `auto-process-3d-models` | 자동 3D 모델 처리 | 모델 파일들 | 처리 결과 |

### 집계 Functions
| Function 이름 | 용도 | 입력 | 출력 |
|--------------|------|------|------|
| `aggregate-dashboard-kpis` | 대시보드 KPI 집계 | 날짜, 매장 ID | dashboard_kpis 레코드 |
| `aggregate-all-kpis` | 모든 KPI 집계 | 매장 ID | 전체 KPI 데이터 |

### 유틸리티 Functions
| Function 이름 | 용도 | 입력 | 출력 |
|--------------|------|------|------|
| `graph-query` | 그래프 쿼리 실행 | 쿼리 타입, 엔티티 ID | 쿼리 결과 |
| `schema-etl` | 스키마 ETL | 소스 스키마 | 변환된 데이터 |
| `auto-map-etl` | ETL 자동 매핑 | CSV 파일 | 매핑 정보 |
| `test-api-connection` | API 연결 테스트 | API 정보 | 테스트 결과 |
| `analyze-retail-data` | 리테일 데이터 분석 | 데이터셋 | 분석 결과 |
| `analyze-store-data` | 매장 데이터 분석 | 매장 ID | 분석 결과 |
| `inventory-monitor` | 재고 모니터링 | 없음 | 재고 알림 |

---

## Storage 버킷 상세

### `store-data` (Private)
**용도**: 사용자 업로드 CSV 데이터 저장

**파일 구조**:
```
store-data/
├── {user_id}/
│   ├── {store_id}/
│   │   ├── visits.csv          # 방문 데이터
│   │   ├── purchases.csv       # 구매 데이터
│   │   ├── products.csv        # 상품 데이터
│   │   ├── customers.csv       # 고객 데이터
│   │   ├── wifi_tracking.csv   # WiFi 트래킹
│   │   ├── zones.csv           # 존 정의
│   │   └── inventory.csv       # 재고 데이터
```

**접근 권한**: RLS Policy로 user_id 기반 접근 제어

### `3d-models` (Public)
**용도**: 3D 모델 파일 저장

**파일 구조**:
```
3d-models/
├── {user_id}/
│   ├── Space_{store_id}_{name}.glb        # 매장 공간 모델
│   ├── Furniture_{type}_{name}.glb        # 가구 모델
│   ├── Product_{category}_{sku}.glb       # 상품 모델
│   └── metadata_{model_id}.json           # 모델 메타데이터
```

**파일명 규칙**:
- `Space_` : 매장 공간 모델
- `Furniture_` : 가구 모델 (선반, 테이블 등)
- `Product_` : 상품 모델

**접근 권한**: Public 읽기, 로그인 사용자만 업로드

---

## 데이터 흐름 다이어그램

### 1. 데이터 임포트 흐름
```
CSV 업로드 (UnifiedDataUpload)
    ↓
Storage: store-data/{user_id}/{store_id}/
    ↓
Edge Function: integrated-data-pipeline
    ↓
- CSV 파싱
- 스키마 매핑 (smart-ontology-mapping)
- 데이터 검증 (validate-and-fix-csv)
- 온톨로지 변환
    ↓
DB 저장:
- graph_entities
- graph_relations
- products
- customers
- etc.
    ↓
user_data_imports (세션 완료)
```

### 2. 대시보드 KPI 집계 흐름
```
사용자가 날짜 선택 (DashboardPage)
    ↓
Storage에서 CSV 로드 (useStoreDataset)
    ↓
Edge Function: aggregate-dashboard-kpis
    ↓
CSV 데이터 집계:
- 방문자 수 계산
- 전환율 계산
- 퍼널 메트릭 계산
    ↓
DB 저장: dashboard_kpis
    ↓
Hook: useDashboardKPI로 조회
    ↓
UI에 표시
```

### 3. AI 시뮬레이션 흐름
```
사용자가 시뮬레이션 실행 (SimulationHubPage)
    ↓
Hook: useStoreContext로 컨텍스트 데이터 수집
- graph_entities
- products
- inventory_levels
- dashboard_kpis
    ↓
Edge Function: advanced-ai-inference
    ↓
AI 모델 실행 (시나리오 타입별)
    ↓
시뮬레이션 결과 반환
    ↓
결과 컴포넌트로 표시
- DemandForecastResult
- InventoryOptimizationResult
- PricingOptimizationResult
- RecommendationStrategyResult
```

### 4. 3D 씬 생성 흐름
```
사용자가 3D 모델 업로드 (DigitalTwin3DPage)
    ↓
Storage: 3d-models/{user_id}/
    ↓
ModelUploader → modelStorageManager
    ↓
파일명 파싱 (modelFilenameParser)
    ↓
온톨로지 매핑 (AutoModelMapper)
    ↓
SceneRecipe 생성 (sceneRecipeGenerator)
- space (매장 공간)
- furniture (가구 배치)
- products (상품 배치)
- lighting (조명)
    ↓
DB 저장: ai_scene_analysis
    ↓
SceneComposer로 3D 렌더링
```

---

## RLS (Row-Level Security) 정책 요약

### 조직 기반 RLS
대부분의 테이블은 `org_id` 기반 RLS 적용:
- `is_org_member(user_id, org_id)` - 조직 멤버 확인
- `is_org_admin(user_id, org_id)` - 조직 관리자 확인

### 사용자 기반 RLS
일부 테이블은 `user_id` 직접 확인:
- `stores`, `products`, `customers` 등

### 역할 기반 RLS
- `ORG_HQ` - 본사 관리자 (모든 권한)
- `ORG_STORE` - 매장 관리자 (매장 데이터만)
- `ORG_VIEWER` - 읽기 전용
- `NEURALTWIN_MASTER` - 시스템 관리자

---

## 마이그레이션 가이드

기존 코드에서 새 구조로 마이그레이션할 때 참고:

### 경로 변경 매핑
| 기존 경로 | 새 경로 |
|----------|---------|
| `@/features/store-analysis/stores/` | `@/features/overview/` |
| `@/features/store-analysis/pages/` | `@/features/analysis/pages/` |
| `@/features/digital-twin/` | `@/features/simulation/` |
| `@/features/cost-center/` | 삭제됨 (기능은 `@/features/analysis/pages/ProductAnalysisPage.tsx`에 통합) |

### Import 경로 업데이트
```typescript
// 기존
import { DigitalTwinScene } from '@/features/digital-twin/components';

// 새로운
import { SharedDigitalTwinScene } from '@/features/simulation/components/digital-twin';
```

---

## 추가 참고 문서
- `REFACTORING_SUMMARY.md` - 코드 구조 재정리 상세 내역
- `PROJECT_STRUCTURE.md` - 프로젝트 전체 구조
- `NEURALTWIN_COMPLETE_ARCHITECTURE.md` - 전체 아키텍처
- `docs/DATA_MANAGEMENT_GUIDE.md` - 데이터 관리 가이드
- `docs/INTEGRATED_ARCHITECTURE_GUIDE.md` - 통합 아키텍처

---

**문서 작성자**: NeuralTwin AI  
**최종 검토**: 2025년 1월 25일
