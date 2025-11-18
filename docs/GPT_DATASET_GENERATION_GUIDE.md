# NEURALTWIN GPT 데이터셋 생성 가이드

> GPT를 활용한 데모 데이터 자동 생성을 위한 종합 가이드
> 최종 업데이트: 2025-11-18

---

## 📋 목차

1. [프로젝트 구조 및 작동 방식](#1-프로젝트-구조-및-작동-방식)
2. [온톨로지 시스템 이해](#2-온톨로지-시스템-이해)
3. [필수 데이터셋 목록](#3-필수-데이터셋-목록)
4. [CSV 데이터셋 상세 스펙](#4-csv-데이터셋-상세-스펙)
5. [WiFi 트래킹 데이터](#5-wifi-트래킹-데이터)
6. [3D 모델 메타데이터](#6-3d-모델-메타데이터)
7. [온톨로지 데이터](#7-온톨로지-데이터)
8. [GPT 프롬프트 템플릿](#8-gpt-프롬프트-템플릿)

---

## 1. 프로젝트 구조 및 작동 방식

### 1.1 NEURALTWIN 개요
오프라인 매장의 **디지털 트윈**을 구현하여:
- 3D 공간에서 실시간 고객 동선 시각화
- WiFi 센서 기반 위치 트래킹
- AI 기반 매장 분석 및 최적화 추천
- 온톨로지 기반 유연한 데이터 모델링

### 1.2 데이터 흐름

```
[CSV 업로드] → [Storage] → [ETL 처리] → [온톨로지 그래프]
                                              ↓
                                    [3D 디지털 트윈 시각화]
                                              ↓
                                       [AI 분석 & 인사이트]
```

#### 단계별 설명:
1. **데이터 임포트**: 사용자가 CSV/Excel/JSON 파일 업로드
2. **자동 분류**: AI가 파일 내용 분석하여 데이터 타입 자동 인식
3. **ETL 매핑**: 컬럼을 온톨로지 엔티티/관계에 자동 매핑
4. **그래프 생성**: PostgreSQL의 그래프 구조로 저장
5. **3D 시각화**: 온톨로지 데이터를 3D 공간에 렌더링
6. **실시간 분석**: WiFi 데이터와 결합하여 동적 인사이트 제공

### 1.3 핵심 테이블 구조

#### 데이터 저장소
| 테이블명 | 용도 | 주요 컬럼 |
|---------|------|----------|
| `stores` | 매장 기본 정보 | store_code, store_name, address |
| `user_data_imports` | 업로드된 원본 데이터 | file_name, data_type, raw_data (JSONB) |
| `graph_entities` | 온톨로지 엔티티 | entity_type_id, label, properties (JSONB) |
| `graph_relations` | 엔티티 간 관계 | source_entity_id, target_entity_id, relation_type_id |
| `wifi_tracking` | WiFi 위치 데이터 | session_id, x, z, timestamp |
| `wifi_zones` | 매장 Zone 좌표 | zone_id, x, y, z |

#### 온톨로지 정의
| 테이블명 | 용도 | 주요 컬럼 |
|---------|------|----------|
| `ontology_entity_types` | 엔티티 타입 정의 | name, label, properties (JSONB), model_3d_url |
| `ontology_relation_types` | 관계 타입 정의 | source_entity_type, target_entity_type, directionality |

---

## 2. 온톨로지 시스템 이해

### 2.1 온톨로지란?
유연한 데이터 모델링을 위한 **그래프 기반** 시스템:
- **엔티티**: 객체 (상품, 고객, 선반 등)
- **관계**: 엔티티 간 연결 (구매함, 진열됨, 소속됨 등)
- **속성**: 각 엔티티/관계의 메타데이터

### 2.2 핵심 엔티티 타입 (COMPREHENSIVE RETAIL SCHEMA)

#### 공간 구조 (Space Structure)
- **Zone**: 매장 구역 (입구, 체크아웃, 진열 공간 등)
- **Shelf**: 선반 유닛
- **DisplayTable**: 디스플레이 테이블
- **Rack**: 의류 랙
- **Counter**: 카운터 (POS, 상담 등)
- **Wall**: 벽면 진열대
- **Entrance**: 출입구
- **Checkout**: 계산대
- **FittingRoom**: 피팅룸
- **StorageRoom**: 창고

#### 상품 관련 (Product Related)
- **Product**: 상품
- **Category**: 카테고리
- **Brand**: 브랜드
- **SKU**: 재고 관리 단위
- **Supplier**: 공급업체
- **Inventory**: 재고

#### 고객 및 거래 (Customer & Transaction)
- **Customer**: 고객
- **Visit**: 방문 기록
- **Purchase**: 구매 거래
- **CustomerSegment**: 고객 세그먼트
- **LoyaltyProgram**: 로열티 프로그램

#### 운영 및 인력 (Operations & Staff)
- **Staff**: 직원
- **Shift**: 근무 시간
- **Task**: 업무
- **Department**: 부서
- **Role**: 역할

#### IoT 및 센서 (IoT & Sensors)
- **WiFiSensor**: WiFi 센서
- **Camera**: CCTV 카메라
- **PeopleCounter**: 인원 카운터
- **TemperatureSensor**: 온도 센서
- **LightingSensor**: 조도 센서

### 2.3 주요 관계 타입

| 관계명 | 설명 | Source → Target |
|-------|------|----------------|
| `displays` | 진열 관계 | Shelf/Table → Product |
| `purchases` | 구매 관계 | Customer → Product |
| `visits` | 방문 관계 | Customer → Zone |
| `located_in` | 위치 관계 | 모든 엔티티 → Zone |
| `works_at` | 근무 관계 | Staff → Zone/Department |
| `belongs_to` | 소속 관계 | Product → Category/Brand |
| `manages` | 관리 관계 | Staff → Zone/Product |
| `interacts_with` | 상호작용 | Customer → Product/Staff |
| `supplies` | 공급 관계 | Supplier → Product |
| `monitors` | 모니터링 | Sensor → Zone |

---

## 3. 필수 데이터셋 목록

### 3.1 우선순위별 데이터셋

#### ⭐ Priority 1 - 필수 (Core Demo)
| 파일명 | 최소 건수 | 설명 | 목적 |
|-------|----------|------|------|
| `stores.csv` | 1 | 매장 정보 | 기본 매장 설정 |
| `customers.csv` | 100+ | 고객 프로필 | 고객 분석 기반 |
| `products.csv` | 50+ | 상품 카탈로그 | 상품 데이터 |
| `purchases.csv` | 500+ | 구매 내역 | 거래 분석 |
| `visits.csv` | 1000+ | 방문 기록 | 동선 분석 |

#### ⭐ Priority 2 - 권장 (Enhanced Demo)
| 파일명 | 최소 건수 | 설명 | 목적 |
|-------|----------|------|------|
| `staff.csv` | 10+ | 직원 정보 | 인력 관리 |
| `brands.csv` | 20+ | 브랜드 정보 | 브랜드 분석 |
| `wifi_sensors.csv` | 3-5 | 센서 위치 | WiFi 트래킹 |
| `wifi_tracking.csv` | 5000+ | 위치 신호 | 실시간 동선 |
| `zones.csv` | 10+ | 구역 정의 | 공간 분석 |

#### ⭐ Priority 3 - 선택 (Full Demo)
| 파일명 | 최소 건수 | 설명 | 목적 |
|-------|----------|------|------|
| `inventory.csv` | 50+ | 재고 현황 | 재고 최적화 |
| `categories.csv` | 10+ | 카테고리 | 상품 분류 |
| `suppliers.csv` | 5+ | 공급업체 | 공급망 관리 |
| `shifts.csv` | 30+ | 근무 스케줄 | 인력 배치 |
| `promotions.csv` | 10+ | 프로모션 | 마케팅 분석 |

### 3.2 3D 및 메타데이터

#### 3D 모델 파일 (GLB)
- **명명 규칙**: `{EntityType}_{Identifier}_{Width}x{Height}x{Depth}.glb`
- **예시**: `Shelf_SH001_120x200x40.glb`, `DisplayTable_DT001_150x90x100.glb`
- **최소 필요**: 5-10개 (Shelf, DisplayTable, Rack, Counter, Zone)

#### JSON 메타데이터
- **명명 규칙**: `{EntityType}_{Identifier}_metadata.json`
- **예시**: `Shelf_SH001_metadata.json`
- **용도**: 3D 모델의 추가 속성 (재질, 용량, 조명 등)

---

## 4. CSV 데이터셋 상세 스펙

### 4.1 stores.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| store_id | string | ✅ | 매장 고유 ID | A001, GN001 |
| store_code | string | ✅ | 매장 코드 | A001 |
| store_name | string | ✅ | 매장명 | 강남점, 홍대점 |
| address | string | ❌ | 주소 | 서울 강남구 테헤란로 123 |
| area_sqm | number | ❌ | 면적(㎡) | 200, 150 |
| open_date | date | ❌ | 오픈일 | 2023-01-15 |
| manager_name | string | ❌ | 담당자명 | 김매니저 |
| phone | string | ❌ | 연락처 | 02-1234-5678 |
| email | string | ❌ | 이메일 | store@example.com |
| operating_hours | string | ❌ | 운영 시간 | 10:00-22:00 |
| latitude | number | ❌ | 위도 | 37.5012 |
| longitude | number | ❌ | 경도 | 127.0396 |

#### 데이터 생성 규칙
- **store_id**: 영문+숫자 조합, 고유값
- **area_sqm**: 100-500 사이 현실적인 값
- **open_date**: 최근 2년 이내
- **operating_hours**: 한국 소매점 일반적 시간대 (10:00-22:00)

#### 샘플 데이터
```csv
store_id,store_code,store_name,address,area_sqm,open_date,manager_name,phone,email,operating_hours,latitude,longitude
A001,A001,강남본점,서울 강남구 테헤란로 123,200,2023-01-15,김매니저,02-1234-5678,gangnam@neuraltwin.com,10:00-22:00,37.5012,127.0396
A002,A002,홍대점,서울 마포구 홍익로 45,150,2023-03-20,이매니저,02-2345-6789,hongdae@neuraltwin.com,11:00-23:00,37.5563,126.9236
A003,A003,신촌점,서울 서대문구 신촌로 67,180,2023-05-10,박매니저,02-3456-7890,sinchon@neuraltwin.com,10:00-22:00,37.5591,126.9389
```

---

### 4.2 customers.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| customer_id | string | ✅ | 고객 고유 ID | C0001, C0002 |
| name | string | ❌ | 고객명 (익명) | 고객A, Customer_001 |
| age_group | string | ❌ | 연령대 | 20대, 30대, 40대, 50대+ |
| gender | string | ❌ | 성별 | M, F |
| segment | string | ❌ | 세그먼트 | VIP, Regular, New |
| join_date | date | ❌ | 가입일 | 2023-01-01 |
| total_purchases | number | ❌ | 총 구매 횟수 | 15, 8, 3 |
| lifetime_value | number | ❌ | 생애 가치(원) | 1500000, 500000 |
| avg_purchase_amount | number | ❌ | 평균 구매액 | 85000, 120000 |
| last_visit_date | date | ❌ | 마지막 방문일 | 2024-03-10 |
| preferred_category | string | ❌ | 선호 카테고리 | Fashion, Electronics |
| loyalty_points | number | ❌ | 적립 포인트 | 5000, 12000 |

#### 데이터 생성 규칙
- **customer_id**: C0001부터 순차 증가
- **age_group 분포**: 20대(30%), 30대(35%), 40대(25%), 50대+(10%)
- **gender 분포**: M(45%), F(55%)
- **segment 분포**: VIP(10%), Regular(60%), New(30%)
- **total_purchases**: 1-50 사이, 세그먼트별 차등
  - VIP: 20-50
  - Regular: 5-19
  - New: 1-4
- **lifetime_value**: total_purchases * avg_purchase_amount
- **join_date**: 최근 2년 내 랜덤 분포

#### 샘플 데이터
```csv
customer_id,name,age_group,gender,segment,join_date,total_purchases,lifetime_value,avg_purchase_amount,last_visit_date,preferred_category,loyalty_points
C0001,고객A,30대,F,VIP,2023-02-15,42,3780000,90000,2024-03-10,Fashion,15600
C0002,고객B,20대,M,Regular,2023-06-20,12,840000,70000,2024-03-08,Electronics,4200
C0003,고객C,40대,F,Regular,2023-04-10,8,640000,80000,2024-03-05,Beauty,3200
C0004,고객D,20대,F,New,2024-01-15,2,120000,60000,2024-02-28,Fashion,600
C0005,고객E,50대+,M,VIP,2023-01-20,35,4200000,120000,2024-03-12,Electronics,21000
```

---

### 4.3 products.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| product_id | string | ✅ | 상품 고유 ID | P0001, PRD001 |
| sku | string | ✅ | SKU 코드 | SKU-001 |
| product_name | string | ✅ | 상품명 | 베이직 티셔츠 |
| category | string | ✅ | 카테고리 | Fashion, Electronics, Beauty |
| brand | string | ❌ | 브랜드 | Nike, Apple, Chanel |
| price | number | ✅ | 판매가(원) | 29000, 1200000 |
| cost | number | ❌ | 원가(원) | 15000, 600000 |
| stock_quantity | number | ❌ | 재고 수량 | 50, 10 |
| min_stock | number | ❌ | 최소 재고 | 5, 2 |
| supplier_id | string | ❌ | 공급업체 ID | SUP001 |
| weight_kg | number | ❌ | 무게(kg) | 0.2, 1.5 |
| size | string | ❌ | 사이즈 | S/M/L, 220/225/230 |
| color | string | ❌ | 색상 | Black, White, Navy |
| description | string | ❌ | 설명 | 편안한 착용감의 베이직 티셔츠 |
| image_url | string | ❌ | 이미지 URL | https://example.com/img.jpg |
| is_active | boolean | ❌ | 판매 여부 | true, false |

#### 데이터 생성 규칙
- **product_id**: P0001부터 순차 증가
- **category 분포**: Fashion(40%), Electronics(30%), Beauty(20%), Other(10%)
- **price 분포**:
  - Fashion: 20,000-200,000원
  - Electronics: 50,000-2,000,000원
  - Beauty: 15,000-150,000원
- **cost**: price의 50-60%
- **stock_quantity**: 0-100, 가격이 높을수록 적게
- **brand**: 카테고리별 실제 브랜드 사용

#### 샘플 데이터
```csv
product_id,sku,product_name,category,brand,price,cost,stock_quantity,min_stock,supplier_id,weight_kg,size,color,description,is_active
P0001,SKU-F001,베이직 티셔츠,Fashion,BasicWear,29000,15000,50,5,SUP001,0.2,M,White,편안한 착용감의 기본 티셔츠,true
P0002,SKU-E001,무선 이어폰,Electronics,SoundMax,89000,45000,30,3,SUP002,0.1,One Size,Black,노이즈 캔슬링 기능 무선 이어폰,true
P0003,SKU-B001,수분 크림,Beauty,GlowLab,45000,23000,40,5,SUP003,0.15,50ml,White,24시간 지속 수분 크림,true
P0004,SKU-F002,청바지,Fashion,DenimCo,79000,40000,25,3,SUP001,0.6,32,Blue,클래식 핏 데님 청바지,true
P0005,SKU-E002,스마트워치,Electronics,TechWear,299000,150000,15,2,SUP002,0.05,42mm,Silver,건강 모니터링 스마트워치,true
```

---

### 4.4 purchases.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| purchase_id | string | ✅ | 구매 고유 ID | PUR0001 |
| store_id | string | ✅ | 매장 ID | A001 |
| customer_id | string | ✅ | 고객 ID | C0001 |
| product_id | string | ✅ | 상품 ID | P0001 |
| staff_id | string | ❌ | 응대 직원 ID | ST001 |
| purchase_date | datetime | ✅ | 구매 일시 | 2024-03-10 14:30:00 |
| quantity | number | ✅ | 구매 수량 | 1, 2, 3 |
| unit_price | number | ✅ | 단가(원) | 29000 |
| total_amount | number | ✅ | 총액(원) | 58000 |
| discount_amount | number | ❌ | 할인액(원) | 5000 |
| final_amount | number | ✅ | 최종 결제액 | 53000 |
| payment_method | string | ❌ | 결제 수단 | Card, Cash, Mobile |
| transaction_id | string | ❌ | 거래 ID | TRX20240310001 |
| is_refunded | boolean | ❌ | 환불 여부 | false |

#### 데이터 생성 규칙
- **purchase_id**: PUR0001부터 순차 증가
- **purchase_date**: 최근 6개월-1년 데이터
  - 시간대 분포: 오전(10-12시) 10%, 점심(12-14시) 20%, 오후(14-18시) 40%, 저녁(18-22시) 30%
  - 요일 분포: 주중 60%, 주말 40%
- **quantity**: 대부분 1-3개, 가끔 5-10개 (프로모션)
- **discount_amount**: 총액의 0-20%
- **payment_method 분포**: Card(60%), Mobile(30%), Cash(10%)
- **고객별 구매 패턴**: 
  - VIP: 월 3-5회, 고가 상품 위주
  - Regular: 월 1-2회
  - New: 첫 구매 위주

#### 샘플 데이터
```csv
purchase_id,store_id,customer_id,product_id,staff_id,purchase_date,quantity,unit_price,total_amount,discount_amount,final_amount,payment_method,transaction_id,is_refunded
PUR0001,A001,C0001,P0001,ST001,2024-03-10 14:30:00,2,29000,58000,5000,53000,Card,TRX20240310001,false
PUR0002,A001,C0002,P0002,ST002,2024-03-10 15:15:00,1,89000,89000,0,89000,Mobile,TRX20240310002,false
PUR0003,A001,C0003,P0003,ST001,2024-03-10 16:45:00,1,45000,45000,4500,40500,Card,TRX20240310003,false
PUR0004,A002,C0004,P0001,ST003,2024-03-11 12:20:00,1,29000,29000,0,29000,Cash,TRX20240311001,false
PUR0005,A001,C0005,P0005,ST002,2024-03-11 18:30:00,1,299000,299000,29900,269100,Card,TRX20240311002,false
```

---

### 4.5 visits.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| visit_id | string | ✅ | 방문 고유 ID | V0001 |
| store_id | string | ✅ | 매장 ID | A001 |
| customer_id | string | ❌ | 고객 ID (식별 가능시) | C0001 |
| session_id | string | ✅ | 세션 ID (WiFi 매칭용) | SESS_001 |
| visit_date | datetime | ✅ | 방문 일시 | 2024-03-10 14:00:00 |
| entry_time | time | ✅ | 입장 시간 | 14:00:00 |
| exit_time | time | ❌ | 퇴장 시간 | 14:35:00 |
| duration_minutes | number | ❌ | 체류 시간(분) | 35 |
| zones_visited | string | ❌ | 방문 구역 (배열) | "1,3,5,7" |
| items_viewed | number | ❌ | 조회 상품 수 | 8 |
| made_purchase | boolean | ❌ | 구매 여부 | true |
| purchase_id | string | ❌ | 구매 ID (구매시) | PUR0001 |
| visit_purpose | string | ❌ | 방문 목적 | Browse, Purchase, Return |
| weather | string | ❌ | 날씨 | Sunny, Rainy, Cloudy |
| accompaniment | string | ❌ | 동반 여부 | Alone, With Friend, Family |

#### 데이터 생성 규칙
- **visit_id**: V0001부터 순차 증가
- **session_id**: SESS_001부터, WiFi 트래킹 데이터와 매칭
- **duration_minutes**: 평균 20-40분, 표준편차 15분
  - 구매함: 평균 30-50분
  - 구매 안 함: 평균 10-25분
- **zones_visited**: 평균 3-7개 구역
- **made_purchase**: 전체의 30-40%
- **visit_purpose 분포**: Browse(50%), Purchase(35%), Return(10%), Other(5%)
- **방문 대 구매 전환율**: 30-40%
- **재방문율**: 전체 방문의 60% (기존 고객)

#### 샘플 데이터
```csv
visit_id,store_id,customer_id,session_id,visit_date,entry_time,exit_time,duration_minutes,zones_visited,items_viewed,made_purchase,purchase_id,visit_purpose,weather,accompaniment
V0001,A001,C0001,SESS_001,2024-03-10 14:00:00,14:00:00,14:35:00,35,"1,3,5,7",8,true,PUR0001,Purchase,Sunny,Alone
V0002,A001,,SESS_002,2024-03-10 14:10:00,14:10:00,14:25:00,15,"1,2",3,false,,Browse,Sunny,With Friend
V0003,A001,C0002,SESS_003,2024-03-10 15:00:00,15:00:00,15:45:00,45,"1,2,3,4,6",12,true,PUR0002,Purchase,Sunny,Alone
V0004,A001,C0003,SESS_004,2024-03-10 16:30:00,16:30:00,17:05:00,35,"1,4,5",6,true,PUR0003,Purchase,Cloudy,Family
V0005,A002,,SESS_005,2024-03-11 12:00:00,12:00:00,12:18:00,18,"1,3",4,false,,Browse,Rainy,Alone
```

---

### 4.6 staff.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| staff_id | string | ✅ | 직원 고유 ID | ST001 |
| store_id | string | ✅ | 소속 매장 | A001 |
| name | string | ✅ | 직원명 | 김직원 |
| role | string | ✅ | 역할/직급 | Manager, Sales, Cashier |
| department | string | ❌ | 부서 | Sales, Operations, Management |
| hire_date | date | ❌ | 입사일 | 2023-02-01 |
| phone | string | ❌ | 연락처 | 010-1234-5678 |
| email | string | ❌ | 이메일 | staff@example.com |
| monthly_sales | number | ❌ | 월 매출(원) | 25000000 |
| customer_rating | number | ❌ | 고객 평점 | 4.5 |
| shift_pattern | string | ❌ | 근무 형태 | Morning, Evening, Full |
| is_active | boolean | ❌ | 재직 여부 | true |

#### 데이터 생성 규칙
- **staff_id**: ST001부터 순차 증가
- **role 분포**: Manager(10%), Sales(60%), Cashier(20%), Other(10%)
- **monthly_sales**: 역할별 차등
  - Manager: 30-50M
  - Sales: 15-35M
  - Cashier: 10-20M
- **customer_rating**: 3.5-5.0, 평균 4.2
- **shift_pattern 분포**: Morning(30%), Evening(30%), Full(40%)

#### 샘플 데이터
```csv
staff_id,store_id,name,role,department,hire_date,phone,email,monthly_sales,customer_rating,shift_pattern,is_active
ST001,A001,김매니저,Manager,Management,2023-01-15,010-1234-5678,kim.manager@neuraltwin.com,45000000,4.8,Full,true
ST002,A001,이판매,Sales,Sales,2023-03-10,010-2345-6789,lee.sales@neuraltwin.com,28000000,4.6,Morning,true
ST003,A001,박캐셔,Cashier,Operations,2023-05-20,010-3456-7890,park.cashier@neuraltwin.com,15000000,4.3,Evening,true
ST004,A002,최판매,Sales,Sales,2023-06-01,010-4567-8901,choi.sales@neuraltwin.com,22000000,4.5,Full,true
ST005,A002,정캐셔,Cashier,Operations,2023-07-15,010-5678-9012,jung.cashier@neuraltwin.com,12000000,4.2,Morning,true
```

---

### 4.7 brands.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| brand_id | string | ✅ | 브랜드 고유 ID | BR001 |
| brand_name | string | ✅ | 브랜드명 | Nike |
| category | string | ✅ | 주요 카테고리 | Fashion, Electronics |
| country | string | ❌ | 원산지 | USA, Korea, Japan |
| established_year | number | ❌ | 설립연도 | 1964 |
| price_range | string | ❌ | 가격대 | Low, Mid, High, Luxury |
| description | string | ❌ | 설명 | 글로벌 스포츠 브랜드 |
| logo_url | string | ❌ | 로고 URL | https://example.com/logo.png |
| is_premium | boolean | ❌ | 프리미엄 여부 | true |

#### 샘플 데이터
```csv
brand_id,brand_name,category,country,established_year,price_range,description,is_premium
BR001,Nike,Fashion,USA,1964,Mid,글로벌 스포츠 웨어 브랜드,false
BR002,Apple,Electronics,USA,1976,High,프리미엄 전자기기 브랜드,true
BR003,Chanel,Beauty,France,1910,Luxury,럭셔리 화장품 브랜드,true
BR004,Uniqlo,Fashion,Japan,1984,Low,실용적인 캐주얼 브랜드,false
BR005,Samsung,Electronics,Korea,1969,Mid,글로벌 전자 브랜드,false
```

---

## 5. WiFi 트래킹 데이터

### 5.1 wifi_sensors.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| sensor_id | string | ✅ | 센서 고유 ID | sensor_01 |
| x | number | ✅ | X 좌표 (m) | 0, 10, 20 |
| y | number | ✅ | Y 좌표 (높이, m) | 2.5 |
| z | number | ✅ | Z 좌표 (m) | 0, 10, 20 |
| coverage_radius | number | ✅ | 감지 반경 (m) | 10 |
| store_id | string | ❌ | 소속 매장 | A001 |
| zone_id | string | ❌ | 소속 구역 | Zone_01 |
| is_active | boolean | ❌ | 활성 여부 | true |

#### 데이터 생성 규칙
- **배치**: 매장 면적 기준 균등 배치
  - 200㎡ 매장: 4-6개 센서
  - 센서 간 거리: 10-15m
- **좌표 시스템**: 매장 입구를 (0,0,0) 기준
- **coverage_radius**: 일반적으로 10m (WiFi 신호 도달 범위)

#### 샘플 데이터
```csv
sensor_id,x,y,z,coverage_radius,store_id,zone_id,is_active
sensor_01,0,2.5,0,10,A001,Zone_01,true
sensor_02,10,2.5,0,10,A001,Zone_03,true
sensor_03,10,2.5,10,10,A001,Zone_05,true
sensor_04,0,2.5,10,10,A001,Zone_07,true
```

---

### 5.2 wifi_tracking.csv

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| timestamp | datetime | ✅ | 신호 수신 시간 | 2024-03-15 10:30:00 |
| mac_address | string | ✅ | 기기 MAC 주소 | AA:BB:CC:DD:EE:01 |
| sensor_id | string | ✅ | 센서 ID | sensor_01 |
| rssi | number | ✅ | 신호 강도 (dBm) | -45, -60 |
| x | number | ✅ | 추정 X 좌표 | 2.5 |
| z | number | ✅ | 추정 Z 좌표 | 3.0 |
| accuracy | number | ❌ | 정확도 (m) | 1.5 |
| session_id | string | ❌ | 방문 세션 ID | SESS_001 |

#### 데이터 생성 규칙
- **timestamp**: 1-5초 간격 샘플링
- **mac_address**: 각 방문자당 고유 MAC (익명화)
  - 형식: AA:BB:CC:DD:EE:XX
  - 매일 10-30% 랜덤화 (MAC randomization)
- **rssi**: -40 ~ -80 dBm
  - 센서에 가까울수록: -40 ~ -55 dBm
  - 중간 거리: -55 ~ -70 dBm
  - 먼 거리: -70 ~ -80 dBm
- **좌표 계산**: 삼변측량법 (Trilateration)
  - 최소 3개 센서 신호로 위치 추정
- **session_id**: visits.csv의 session_id와 매칭
- **세션 지속**: 평균 20-40분

#### 샘플 데이터
```csv
timestamp,mac_address,sensor_id,rssi,x,z,accuracy,session_id
2024-03-15 10:30:00,AA:BB:CC:DD:EE:01,sensor_01,-45,2.5,3.0,1.2,SESS_001
2024-03-15 10:30:01,AA:BB:CC:DD:EE:01,sensor_02,-55,2.5,3.0,1.5,SESS_001
2024-03-15 10:30:01,AA:BB:CC:DD:EE:01,sensor_03,-65,2.5,3.0,2.0,SESS_001
2024-03-15 10:30:02,AA:BB:CC:DD:EE:02,sensor_01,-50,5.0,7.0,1.3,SESS_002
2024-03-15 10:30:03,AA:BB:CC:DD:EE:02,sensor_02,-58,5.0,7.0,1.6,SESS_002
2024-03-15 10:30:03,AA:BB:CC:DD:EE:02,sensor_04,-62,5.0,7.0,1.8,SESS_002
```

---

### 5.3 zones.csv (WiFi Zone 매핑)

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 값 |
|--------|------|------|------|---------|
| zone_id | number | ✅ | Zone 고유 번호 | 1, 2, 3 |
| zone_name | string | ✅ | Zone 이름 | Entrance, Display Area |
| x | number | ✅ | 중심 X 좌표 | 2.5 |
| y | number | ✅ | 중심 Y 좌표 (높이) | 0 |
| z | number | ❌ | 중심 Z 좌표 | 2.5 |
| width | number | ❌ | 가로 길이 (m) | 5 |
| depth | number | ❌ | 세로 길이 (m) | 5 |
| zone_type | string | ❌ | Zone 유형 | entrance, display, checkout |
| store_id | string | ❌ | 소속 매장 | A001 |

#### 샘플 데이터
```csv
zone_id,zone_name,x,y,z,width,depth,zone_type,store_id
1,Entrance,2.5,0,2.5,5,5,entrance,A001
2,Display Area A,7.5,0,2.5,5,5,display,A001
3,Display Area B,12.5,0,2.5,5,5,display,A001
4,Checkout,7.5,0,7.5,5,5,checkout,A001
5,Fitting Room,2.5,0,7.5,5,5,fitting,A001
```

---

## 6. 3D 모델 메타데이터

### 6.1 JSON 메타데이터 구조

#### 파일명 규칙
`{EntityType}_{Identifier}_metadata.json`

#### 기본 구조
```json
{
  "entity_type": "Shelf",
  "identifier": "SH001",
  "label": "벽면 선반 A",
  "dimensions": {
    "width": 1.2,
    "height": 2.0,
    "depth": 0.4,
    "unit": "meter"
  },
  "position": {
    "x": 2.5,
    "y": 0,
    "z": 0.2,
    "rotation_y": 0
  },
  "properties": {
    "material": "metal",
    "color": "white",
    "max_weight_kg": 200,
    "num_levels": 5,
    "adjustable": true
  },
  "3d_model": {
    "file_name": "Shelf_SH001_120x200x40.glb",
    "file_size_mb": 2.5,
    "polygon_count": 15000,
    "has_texture": true
  },
  "zone_id": "Zone_03",
  "store_id": "A001"
}
```

### 6.2 엔티티별 메타데이터 예시

#### Shelf (선반)
```json
{
  "entity_type": "Shelf",
  "identifier": "SH001",
  "label": "벽면 선반 A",
  "dimensions": {
    "width": 1.2,
    "height": 2.0,
    "depth": 0.4,
    "unit": "meter"
  },
  "position": {
    "x": 2.5,
    "y": 0,
    "z": 0.2,
    "rotation_y": 0
  },
  "properties": {
    "shelf_type": "wall_mounted",
    "material": "metal",
    "color": "white",
    "num_levels": 5,
    "level_height_cm": [40, 40, 40, 40, 40],
    "max_weight_kg": 200,
    "adjustable_levels": true,
    "has_lighting": false
  },
  "zone_id": "Zone_03",
  "store_id": "A001"
}
```

#### DisplayTable (진열 테이블)
```json
{
  "entity_type": "DisplayTable",
  "identifier": "DT001",
  "label": "중앙 프로모션 테이블",
  "dimensions": {
    "width": 1.5,
    "height": 0.9,
    "depth": 1.0,
    "unit": "meter"
  },
  "position": {
    "x": 7.5,
    "y": 0,
    "z": 5.0,
    "rotation_y": 0
  },
  "properties": {
    "table_type": "promotional",
    "shape": "rectangular",
    "surface_area_sqm": 1.5,
    "material": "wood",
    "has_lighting": true,
    "lighting_type": "LED spotlight",
    "max_display_items": 20
  },
  "zone_id": "Zone_02",
  "store_id": "A001"
}
```

#### Counter (카운터)
```json
{
  "entity_type": "Counter",
  "identifier": "CT001",
  "label": "POS 카운터 1",
  "dimensions": {
    "width": 1.0,
    "height": 1.1,
    "depth": 0.6,
    "unit": "meter"
  },
  "position": {
    "x": 7.5,
    "y": 0,
    "z": 8.0,
    "rotation_y": 180
  },
  "properties": {
    "counter_type": "checkout",
    "has_pos": true,
    "has_cash_drawer": true,
    "has_card_reader": true,
    "material": "composite"
  },
  "zone_id": "Zone_04",
  "store_id": "A001"
}
```

---

## 7. 온톨로지 데이터

### 7.1 Entity Type (엔티티 타입) JSON

#### 구조
```json
{
  "name": "Product",
  "label": "상품",
  "description": "판매 중인 상품 아이템",
  "icon": "Package",
  "color": "#3b82f6",
  "model_3d_type": "product",
  "model_3d_dimensions": {
    "width": 0.1,
    "height": 0.2,
    "depth": 0.1
  },
  "model_3d_metadata": {
    "default_scale": 1.0,
    "supports_variants": true
  },
  "properties": [
    {
      "name": "product_name",
      "type": "string",
      "required": true,
      "description": "상품명"
    },
    {
      "name": "price",
      "type": "number",
      "required": true,
      "description": "판매가"
    },
    {
      "name": "category",
      "type": "string",
      "required": false,
      "description": "카테고리"
    }
  ]
}
```

#### 주요 엔티티 타입 목록
```json
[
  "Zone", "Shelf", "DisplayTable", "Rack", "Counter",
  "Product", "Customer", "Staff", "Purchase", "Visit",
  "WiFiSensor", "Category", "Brand", "Inventory"
]
```

---

### 7.2 Relation Type (관계 타입) JSON

#### 구조
```json
{
  "name": "displays",
  "label": "진열함",
  "description": "선반/테이블에 상품이 진열되는 관계",
  "source_entity_type": "Shelf",
  "target_entity_type": "Product",
  "directionality": "directed",
  "properties": [
    {
      "name": "quantity",
      "type": "number",
      "required": false,
      "description": "진열 수량"
    },
    {
      "name": "position_level",
      "type": "number",
      "required": false,
      "description": "진열 단 (1층, 2층 등)"
    }
  ]
}
```

#### 주요 관계 타입 목록
```json
[
  {
    "name": "displays",
    "source": "Shelf/DisplayTable",
    "target": "Product"
  },
  {
    "name": "purchases",
    "source": "Customer",
    "target": "Product"
  },
  {
    "name": "visits",
    "source": "Customer",
    "target": "Zone"
  },
  {
    "name": "located_in",
    "source": "ANY",
    "target": "Zone"
  },
  {
    "name": "works_at",
    "source": "Staff",
    "target": "Zone"
  },
  {
    "name": "belongs_to",
    "source": "Product",
    "target": "Category/Brand"
  },
  {
    "name": "manages",
    "source": "Staff",
    "target": "Product/Zone"
  }
]
```

---

## 8. GPT 프롬프트 템플릿

### 8.1 전체 데이터셋 생성 프롬프트

```
당신은 오프라인 리테일 매장의 디지털 트윈 시스템인 NEURALTWIN을 위한 데모 데이터를 생성하는 전문가입니다.

# 매장 설정
- 매장명: 강남 플래그십 스토어
- 매장 코드: A001
- 면적: 200㎡
- 카테고리: 복합 리테일 (패션 40%, 전자기기 30%, 뷰티 20%, 기타 10%)
- 데이터 기간: 2023년 1월 1일 ~ 2024년 3월 15일 (15개월)

# 생성할 데이터셋 목록
1. stores.csv - 1건
2. customers.csv - 200건
3. products.csv - 100건
4. brands.csv - 30건
5. purchases.csv - 3000건
6. visits.csv - 5000건
7. staff.csv - 15건
8. wifi_sensors.csv - 5건
9. wifi_tracking.csv - 50000건
10. zones.csv - 10건

# 데이터 품질 요구사항
- 현실적인 분포와 패턴 (요일별, 시간대별, 계절별)
- 고객 세그먼트별 행동 차이 반영
- 상품 카테고리별 가격대 및 재고 수준 다르게 설정
- WiFi 트래킹 데이터는 실제 매장 동선 패턴 반영
- 구매 전환율 30-40% 유지
- VIP 고객(10%), Regular(60%), New(30%) 비율

# 컬럼별 상세 스펙
{각 데이터셋의 컬럼 정의와 예시 데이터 참조}

# 출력 형식
- 각 CSV 파일을 개별적으로 생성
- 첫 줄은 헤더(컬럼명)
- UTF-8 인코딩
- 날짜 형식: YYYY-MM-DD 또는 YYYY-MM-DD HH:MM:SS
- 숫자: 천 단위 구분 없음

각 데이터셋을 순서대로 생성해주세요.
```

---

### 8.2 개별 데이터셋 프롬프트

#### customers.csv 생성
```
200명의 현실적인 고객 데이터를 생성해주세요.

# 세그먼트 분포
- VIP: 20명 (10%)
  - total_purchases: 20-50회
  - avg_purchase_amount: 100,000-200,000원
  - lifetime_value: 2,000,000-10,000,000원
  
- Regular: 120명 (60%)
  - total_purchases: 5-19회
  - avg_purchase_amount: 50,000-100,000원
  - lifetime_value: 250,000-1,900,000원
  
- New: 60명 (30%)
  - total_purchases: 1-4회
  - avg_purchase_amount: 30,000-80,000원
  - lifetime_value: 30,000-320,000원

# 인구통계 분포
- 연령대: 20대(30%), 30대(35%), 40대(25%), 50대+(10%)
- 성별: 남성(45%), 여성(55%)
- 가입일: 2023-01-01 ~ 2024-03-01 균등 분포

# 출력 형식
customer_id,name,age_group,gender,segment,join_date,total_purchases,lifetime_value,avg_purchase_amount,last_visit_date,preferred_category,loyalty_points

customer_id는 C0001부터 시작하여 순차 증가
```

---

#### purchases.csv 생성
```
3000건의 구매 내역을 생성해주세요.

# 기간 및 분포
- 기간: 2023-01-01 ~ 2024-03-15
- 시간대 분포:
  - 10-12시: 10%
  - 12-14시: 20%
  - 14-18시: 40%
  - 18-22시: 30%
- 요일 분포: 주중(60%), 주말(40%)

# 세그먼트별 구매 패턴
- VIP: 월 3-5회, 고가 상품(100,000원+) 위주
- Regular: 월 1-2회, 중가 상품(50,000-100,000원)
- New: 첫 구매 위주, 저가 상품(30,000-60,000원)

# 할인 패턴
- 평균 할인율: 5-15%
- 프로모션 기간(월말): 10-20%
- 정상 판매: 0-5%

# 결제 수단 분포
- Card: 60%
- Mobile: 30%
- Cash: 10%

# 출력 형식
purchase_id,store_id,customer_id,product_id,staff_id,purchase_date,quantity,unit_price,total_amount,discount_amount,final_amount,payment_method,transaction_id,is_refunded

purchase_id는 PUR0001부터 시작
모든 구매는 customers.csv와 products.csv의 ID 참조
```

---

#### wifi_tracking.csv 생성
```
50000건의 WiFi 트래킹 신호를 생성해주세요.

# 센서 배치 (wifi_sensors.csv 기준)
- sensor_01: (0, 2.5, 0) - 입구
- sensor_02: (10, 2.5, 0) - 중앙 A
- sensor_03: (10, 2.5, 10) - 중앙 B
- sensor_04: (0, 2.5, 10) - 후방
- 감지 반경: 각 10m

# 세션 패턴
- 총 500개 세션 (visits.csv의 session_id와 매칭)
- 세션당 평균 100개 신호 (1-5초 간격)
- 세션 지속: 평균 20-40분

# 동선 패턴
1. 입구(Zone 1) → 진열 구역(Zone 2-3) → 계산대(Zone 4) → 출구
2. 입구 → 피팅룸(Zone 5) → 진열 구역 → 계산대 → 출구
3. 입구 → 둘러보기(Zone 2-3-5) → 출구 (구매 없음)

# RSSI 값
- 센서 근처(0-5m): -40 ~ -55 dBm
- 중거리(5-10m): -55 ~ -70 dBm
- 원거리(10-15m): -70 ~ -80 dBm

# 출력 형식
timestamp,mac_address,sensor_id,rssi,x,z,accuracy,session_id

MAC 주소는 AA:BB:CC:DD:EE:XX 형식
timestamp는 2024-03-15 10:00:00부터 시작
```

---

### 8.3 일관성 검증 프롬프트

```
생성된 데이터셋의 일관성을 검증해주세요.

# 검증 항목
1. 외래키 참조 무결성
   - purchases.customer_id는 customers.customer_id에 존재
   - purchases.product_id는 products.product_id에 존재
   - visits.customer_id는 customers.customer_id에 존재 (NULL 가능)

2. 날짜 일관성
   - purchase_date는 customer의 join_date 이후
   - last_visit_date는 join_date 이후
   - visit_date는 매장 open_date 이후

3. 수량 일관성
   - customer.total_purchases = COUNT(purchases WHERE customer_id)
   - customer.lifetime_value = SUM(purchases.final_amount WHERE customer_id)

4. 논리적 일관성
   - visits에서 made_purchase=true인 경우 purchase_id 필수
   - wifi_tracking의 session_id는 visits의 session_id와 매칭
   - zones_visited의 zone 번호는 zones.csv에 존재

오류가 있으면 수정된 데이터를 제공해주세요.
```

---

## 9. 추가 팁 및 주의사항

### 9.1 데이터 생성 체크리스트
- [ ] 모든 필수(✅) 컬럼에 값이 있는가?
- [ ] 외래키 참조가 유효한가?
- [ ] 날짜 범위가 일관적인가?
- [ ] 숫자 범위가 현실적인가?
- [ ] 인코딩이 UTF-8인가?
- [ ] 첫 줄에 헤더가 있는가?

### 9.2 흔한 실수
1. **날짜 형식 불일치**: YYYY-MM-DD 형식 엄수
2. **외래키 누락**: customer_id, product_id 등이 존재하지 않는 값 참조
3. **NULL vs 빈 문자열**: 선택 컬럼은 NULL 또는 공백 가능
4. **수량 불일치**: total_purchases ≠ 실제 구매 건수
5. **시간대 오류**: 영업 시간 외 거래 발생

### 9.3 성능 최적화
- 대용량 데이터(50,000+)는 분할 생성 후 병합
- CSV 파일 크기: 개당 10MB 이하 권장
- WiFi 데이터는 세션별로 생성 후 통합

---

## 10. 참고 자료

### 10.1 관련 문서
- `DEMO_DATASET_REQUIREMENTS.md`: 기본 데이터셋 요구사항
- `DEMO_PROJECT_CONFIGURATION.md`: 프로젝트 구조 설명
- `comprehensiveRetailSchema.ts`: 전체 온톨로지 스키마

### 10.2 샘플 파일 위치
```
public/samples/
├── stores.csv
├── customers.csv
├── products.csv
├── purchases.csv
├── visits.csv
├── staff.csv
├── brands.csv
├── wifi_sensors.csv
├── wifi_tracking.csv
└── zones.csv
```

### 10.3 업로드 경로
- CSV/Excel: `store-data` 버킷 → `{userId}/{storeId}/`
- 3D 모델: `3d-models` 버킷 → `{userId}/{storeId}/`
- JSON 메타데이터: `store-data` 버킷 → `{userId}/{storeId}/metadata/`

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-11-18  
**작성자**: NEURALTWIN Team
