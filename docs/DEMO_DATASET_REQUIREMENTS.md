# NEURALTWIN 데모 데이터셋 요구사항

> 최종 업데이트: 2025-11-17

## 목차
1. [데이터셋 개요](#1-데이터셋-개요)
2. [CSV 데이터셋 형태](#2-csv-데이터셋-형태)
3. [데이터셋 구조](#3-데이터셋-구조)
4. [데이터셋 형식](#4-데이터셋-형식)
5. [3D 모델 데이터](#5-3d-모델-데이터)
6. [WiFi 트래킹 데이터](#6-wifi-트래킹-데이터)
7. [온톨로지 데이터](#7-온톨로지-데이터)
8. [데이터 검증 규칙](#8-데이터-검증-규칙)

---

## 1. 데이터셋 개요

### 1.1 필수 데이터셋 목록
NEURALTWIN 데모를 위해 필요한 최소 데이터셋:

| 데이터셋 | 파일명 | 최소 건수 | 우선순위 | 설명 |
|---------|--------|----------|---------|------|
| 매장 정보 | stores.csv | 1 | 필수 | 매장 기본 정보 |
| 고객 정보 | customers.csv | 100 | 필수 | 고객 프로필 데이터 |
| 상품 정보 | products.csv | 50 | 필수 | 상품 카탈로그 |
| 구매 내역 | purchases.csv | 500 | 필수 | 거래 데이터 |
| 방문 기록 | visits.csv | 1000 | 필수 | 고객 동선 데이터 |
| 직원 정보 | staff.csv | 10 | 권장 | 직원 정보 및 성과 |
| 브랜드 정보 | brands.csv | 20 | 선택 | 브랜드 메타데이터 |
| WiFi 센서 | wifi_sensors.csv | 3 | 선택 | 센서 위치 정보 |
| WiFi 신호 | wifi_tracking.csv | 5000 | 선택 | Raw signal 데이터 |
| Zone 정보 | zones.csv | 10 | 선택 | 매장 Zone 좌표 |

### 1.2 데이터셋 관계도
```
stores (매장)
  ├─ customers (고객)
  ├─ products (상품)
  │   ├─ brands (브랜드)
  │   └─ purchases (구매)
  │       └─ customers
  ├─ visits (방문)
  │   └─ customers
  ├─ staff (직원)
  ├─ zones (Zone)
  │   └─ wifi_sensors (센서)
  └─ wifi_tracking (WiFi 데이터)
      └─ zones
```

### 1.3 데이터 품질 기준
- **완전성**: 필수 컬럼은 NULL 값 없음
- **일관성**: 관계 데이터 간 참조 무결성 유지
- **정확성**: 날짜, 숫자 형식 정확
- **현실성**: 실제 비즈니스 데이터와 유사한 분포

---

## 2. CSV 데이터셋 형태

### 2.1 stores.csv (매장 정보)
**목적**: 매장 기본 정보 및 메타데이터

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| store_id | string | ✅ | 매장 고유 ID | GN001 |
| store_name | string | ✅ | 매장명 | 강남점 |
| store_code | string | ✅ | 매장 코드 | GN001 |
| address | string | ❌ | 주소 | 서울 강남구 테헤란로 123 |
| area | number | ❌ | 면적 (sqm) | 200 |
| open_date | date | ❌ | 오픈일 | 2023-01-15 |
| manager_name | string | ❌ | 담당자명 | 김매니저 |
| phone | string | ❌ | 연락처 | 02-1234-5678 |
| email | string | ❌ | 이메일 | gangnam@example.com |

#### 샘플 데이터
```csv
store_id,store_name,store_code,address,area,open_date,manager_name,phone,email
GN001,강남점,GN001,서울 강남구 테헤란로 123,200,2023-01-15,김매니저,02-1234-5678,gangnam@example.com
HD001,홍대점,HD001,서울 마포구 홍익로 45,150,2023-03-20,이매니저,02-2345-6789,hongdae@example.com
SC001,신촌점,SC001,서울 서대문구 신촌로 67,180,2023-05-10,박매니저,02-3456-7890,sinchon@example.com
```

---

### 2.2 customers.csv (고객 정보)
**목적**: 고객 프로필 및 세그먼트 정보

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| customer_id | string | ✅ | 고객 고유 ID | C001 |
| name | string | ❌ | 고객명 (익명화) | 고객A |
| age_group | string | ❌ | 연령대 | 20대, 30대, 40대 |
| gender | string | ❌ | 성별 | M, F |
| segment | string | ❌ | 고객 세그먼트 | VIP, Regular, New |
| join_date | date | ❌ | 가입일 | 2023-01-01 |
| total_purchases | number | ❌ | 총 구매 횟수 | 15 |
| lifetime_value | number | ❌ | 생애 가치 (원) | 1500000 |
| preferred_category | string | ❌ | 선호 카테고리 | 의류, 전자제품 |

#### 샘플 데이터
```csv
customer_id,name,age_group,gender,segment,join_date,total_purchases,lifetime_value,preferred_category
C001,고객A,30대,F,VIP,2023-01-15,25,2500000,의류
C002,고객B,20대,M,Regular,2023-02-20,10,800000,전자제품
C003,고객C,40대,F,New,2023-11-01,2,150000,의류
C004,고객D,30대,M,Regular,2023-03-10,15,1200000,신발
C005,고객E,20대,F,VIP,2023-01-20,30,3000000,의류
```

#### 데이터 분포 가이드
- **연령대**: 20대(30%), 30대(40%), 40대(20%), 50대+(10%)
- **성별**: 여성(60%), 남성(40%)
- **세그먼트**: VIP(10%), Regular(60%), New(30%)

---

### 2.3 products.csv (상품 정보)
**목적**: 상품 카탈로그 및 재고 정보

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| product_id | string | ✅ | 상품 고유 ID | P001 |
| product_name | string | ✅ | 상품명 | 청바지 |
| category | string | ✅ | 카테고리 | 의류, 신발, 액세서리 |
| brand | string | ❌ | 브랜드 | Nike, Adidas |
| price | number | ✅ | 판매 가격 | 89000 |
| cost_price | number | ❌ | 원가 | 45000 |
| sku | string | ❌ | SKU 코드 | JEANS-BL-32 |
| stock | number | ❌ | 재고 수량 | 50 |
| zone | string | ❌ | 진열 Zone | 의류구역 |
| x | number | ❌ | X 좌표 (m) | 5.2 |
| z | number | ❌ | Z 좌표 (m) | 3.8 |

#### 샘플 데이터
```csv
product_id,product_name,category,brand,price,cost_price,sku,stock,zone,x,z
P001,청바지,의류,Levi's,89000,45000,JEANS-BL-32,50,의류구역,5.2,3.8
P002,운동화,신발,Nike,129000,70000,SHOE-WH-260,30,신발구역,8.5,2.1
P003,티셔츠,의류,Uniqlo,29000,15000,SHIRT-WH-L,100,의류구역,6.0,4.5
P004,가방,액세서리,Coach,299000,150000,BAG-BR-M,20,액세서리구역,12.3,5.6
P005,모자,액세서리,New Era,45000,22000,CAP-BL-FR,60,액세서리구역,11.8,6.2
```

#### 데이터 분포 가이드
- **카테고리**: 의류(50%), 신발(25%), 액세서리(25%)
- **가격대**: 저가(30%, <50,000원), 중가(50%, 50,000-150,000원), 고가(20%, >150,000원)
- **재고**: 정규 분포, 평균 50개, 표준편차 20

---

### 2.4 purchases.csv (구매 내역)
**목적**: 거래 데이터 및 매출 분석

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| transaction_id | string | ✅ | 거래 고유 ID | T001 |
| store_id | string | ✅ | 매장 ID | GN001 |
| customer_id | string | ✅ | 고객 ID | C001 |
| product_id | string | ✅ | 상품 ID | P001 |
| timestamp | datetime | ✅ | 구매 시간 | 2024-11-15 14:35:00 |
| quantity | number | ✅ | 수량 | 2 |
| unit_price | number | ✅ | 단가 | 89000 |
| total_amount | number | ✅ | 총 금액 | 178000 |
| discount | number | ❌ | 할인 금액 | 10000 |
| payment_method | string | ❌ | 결제 수단 | 카드, 현금, 페이 |
| staff_id | string | ❌ | 판매 직원 ID | S001 |

#### 샘플 데이터
```csv
transaction_id,store_id,customer_id,product_id,timestamp,quantity,unit_price,total_amount,discount,payment_method,staff_id
T001,GN001,C001,P001,2024-11-15 14:35:00,2,89000,178000,10000,카드,S001
T002,GN001,C002,P002,2024-11-15 15:20:00,1,129000,129000,0,페이,S002
T003,HD001,C003,P003,2024-11-15 16:45:00,3,29000,87000,5000,카드,S003
T004,GN001,C001,P004,2024-11-15 17:10:00,1,299000,299000,20000,카드,S001
T005,SC001,C005,P005,2024-11-15 18:00:00,2,45000,90000,0,현금,S004
```

#### 데이터 분포 가이드
- **시간대**: 평일 오전(10%), 점심(20%), 오후(30%), 저녁(40%)
- **요일**: 평일(60%), 주말(40%)
- **결제 수단**: 카드(70%), 페이(25%), 현금(5%)
- **할인**: 30%의 거래에서 평균 10% 할인

---

### 2.5 visits.csv (방문 기록)
**목적**: 고객 동선 및 체류 시간 분석

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| visit_id | string | ✅ | 방문 고유 ID | V001 |
| store_id | string | ✅ | 매장 ID | GN001 |
| customer_id | string | ❌ | 고객 ID (추적 가능 시) | C001 |
| session_id | string | ✅ | 세션 ID (WiFi MAC) | MAC_001 |
| entry_time | datetime | ✅ | 입장 시간 | 2024-11-15 14:30:00 |
| exit_time | datetime | ✅ | 퇴장 시간 | 2024-11-15 15:15:00 |
| dwell_time | number | ✅ | 체류 시간 (분) | 45 |
| visited_zones | string | ❌ | 방문 Zone 순서 | 입구,의류구역,신발구역,계산대 |
| x_path | string | ❌ | X 좌표 경로 (JSON) | [0.5,2.3,5.2,8.1,10.0] |
| z_path | string | ❌ | Z 좌표 경로 (JSON) | [0.2,1.5,3.8,2.1,1.0] |
| timestamps | string | ❌ | 타임스탬프 경로 (JSON) | [14:30:00,14:35:00,14:42:00,14:50:00,15:15:00] |
| purchased | boolean | ❌ | 구매 여부 | true, false |

#### 샘플 데이터
```csv
visit_id,store_id,customer_id,session_id,entry_time,exit_time,dwell_time,visited_zones,x_path,z_path,timestamps,purchased
V001,GN001,C001,MAC_001,2024-11-15 14:30:00,2024-11-15 15:15:00,45,입구|의류구역|신발구역|계산대,"[0.5,2.3,5.2,8.1,10.0]","[0.2,1.5,3.8,2.1,1.0]","[14:30,14:35,14:42,14:50,15:15]",true
V002,GN001,,MAC_002,2024-11-15 14:45:00,2024-11-15 15:00:00,15,입구|의류구역|입구,"[0.5,5.0,0.5]","[0.2,4.0,0.2]","[14:45,14:52,15:00]",false
V003,HD001,C003,MAC_003,2024-11-15 15:00:00,2024-11-15 16:00:00,60,입구|전체순회|계산대,"[0.5,3.0,6.0,9.0,10.0]","[0.2,2.5,5.0,2.5,1.0]","[15:00,15:15,15:30,15:50,16:00]",true
```

#### 데이터 분포 가이드
- **체류 시간**: 평균 25분, 표준편차 15분
- **전환율**: 40% (구매한 방문 비율)
- **Zone 방문**: 평균 3-5개 Zone
- **좌표 포인트**: 5-20개 포인트 (1-3분 간격)

---

### 2.6 staff.csv (직원 정보)
**목적**: 직원 정보 및 성과 분석

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| staff_id | string | ✅ | 직원 고유 ID | S001 |
| staff_name | string | ✅ | 직원명 | 김직원 |
| store_id | string | ✅ | 소속 매장 ID | GN001 |
| position | string | ❌ | 직책 | 매니저, 직원, 아르바이트 |
| hire_date | date | ❌ | 입사일 | 2023-01-15 |
| salary_level | number | ❌ | 급여 레벨 | 3 |
| performance_score | number | ❌ | 성과 점수 (1-100) | 85 |
| sales_count_monthly | number | ❌ | 월 판매 건수 | 120 |
| customer_satisfaction | number | ❌ | 고객 만족도 (1-5) | 4.5 |

#### 샘플 데이터
```csv
staff_id,staff_name,store_id,position,hire_date,salary_level,performance_score,sales_count_monthly,customer_satisfaction
S001,김직원,GN001,매니저,2023-01-15,5,92,150,4.8
S002,이직원,GN001,직원,2023-03-20,3,85,120,4.5
S003,박직원,HD001,직원,2023-05-10,3,78,100,4.2
S004,최직원,SC001,아르바이트,2024-01-05,1,70,80,4.0
S005,정직원,GN001,직원,2023-06-15,3,88,130,4.6
```

---

### 2.7 brands.csv (브랜드 정보)
**목적**: 브랜드 메타데이터

#### 컬럼 정의
| 컬럼명 | 타입 | 필수 | 설명 | 예시 |
|--------|------|------|------|------|
| brand_id | string | ✅ | 브랜드 고유 ID | B001 |
| brand_name | string | ✅ | 브랜드명 | Nike |
| category | string | ❌ | 카테고리 | 스포츠, 패션, 럭셔리 |
| country | string | ❌ | 원산지 | USA, Korea, Italy |
| price_range | string | ❌ | 가격대 | Budget, Mid, Premium |

#### 샘플 데이터
```csv
brand_id,brand_name,category,country,price_range
B001,Nike,스포츠,USA,Mid
B002,Adidas,스포츠,Germany,Mid
B003,Levi's,패션,USA,Mid
B004,Coach,럭셔리,USA,Premium
B005,Uniqlo,패션,Japan,Budget
```

---

## 3. 데이터셋 구조

### 3.1 디렉토리 구조
```
project-root/
├── public/
│   └── samples/                    # 샘플 데이터
│       ├── stores.csv
│       ├── customers.csv
│       ├── products.csv
│       ├── purchases.csv
│       ├── visits.csv
│       ├── staff.csv
│       ├── brands.csv
│       ├── wifi_sensors.csv
│       ├── wifi_tracking.csv
│       └── zones.csv
│
├── supabase/
│   └── storage/
│       └── store-data/            # 사용자 업로드 데이터
│           └── {userId}/
│               └── {storeId}/
│                   ├── customers.csv
│                   ├── products.csv
│                   ├── purchases.csv
│                   ├── visits.csv
│                   └── staff.csv
```

### 3.2 Storage 저장 규칙
- **경로 형식**: `{userId}/{storeId}/{filename}.csv`
- **파일명**: 고정된 이름 사용 (customers.csv, products.csv 등)
- **인코딩**: UTF-8
- **줄바꿈**: LF (Unix style)
- **구분자**: 쉼표 (,)
- **따옴표**: 쌍따옴표 (") - 필드에 쉼표 포함 시 사용

### 3.3 데이터 저장소 매핑
| 데이터 타입 | 저장소 | 테이블/버킷 | 접근 방식 |
|------------|--------|------------|----------|
| CSV 원본 | Storage | store-data | storageDataLoader.ts |
| 매장 정보 | Database | stores | Supabase Client |
| 임포트 이력 | Database | user_data_imports | Supabase Client |
| 온톨로지 엔티티 | Database | graph_entities | Supabase Client |
| 3D 모델 | Storage | 3d-models | Store3DViewer.tsx |
| WiFi 데이터 | Database | wifi_tracking | useWiFiTracking.ts |

---

## 4. 데이터셋 형식

### 4.1 CSV 형식 규칙
```csv
# 헤더 (첫 줄 필수)
column1,column2,column3

# 데이터 행
value1,value2,value3
"value with, comma",value2,value3

# 주의사항
- BOM 없이 UTF-8 인코딩
- 헤더는 영문 소문자 + 언더스코어
- 빈 행 없음
- 마지막 행 줄바꿈 있음
```

### 4.2 날짜/시간 형식
| 타입 | 형식 | 예시 |
|------|------|------|
| 날짜 | YYYY-MM-DD | 2024-11-15 |
| 시간 | HH:MM:SS | 14:35:00 |
| 날짜시간 | YYYY-MM-DD HH:MM:SS | 2024-11-15 14:35:00 |
| ISO 8601 | YYYY-MM-DDTHH:MM:SS | 2024-11-15T14:35:00 |

### 4.3 숫자 형식
| 타입 | 형식 | 예시 |
|------|------|------|
| 정수 | 쉼표 없음 | 1000 |
| 소수 | 점(.) 구분자 | 1234.56 |
| 통화 | 원화, 쉼표 없음 | 89000 |
| 백분율 | 0-100 범위 | 85.5 |

### 4.4 배열/JSON 형식
```csv
# 배열 (파이프 구분)
visited_zones
입구|의류구역|신발구역|계산대

# JSON 배열 (문자열로 저장)
x_path
"[0.5,2.3,5.2,8.1,10.0]"

# JSON 객체 (문자열로 저장)
metadata
"{""wifi"":true,""sensor"":""NS001""}"
```

### 4.5 불리언 형식
| 값 | 의미 |
|----|------|
| true, TRUE, 1 | 참 |
| false, FALSE, 0 | 거짓 |
| (빈 값) | NULL |

---

## 5. 3D 모델 데이터

### 5.1 파일명 규칙
**형식**: `{EntityType}_{Identifier}_{Width}x{Height}x{Depth}.glb`

**규칙 설명**:
- `EntityType`: ontology_entity_types.name과 정확히 일치해야 함
- `Identifier`: 모델을 설명하는 식별자 (한글/영문 가능)
- `Dimensions`: 미터 단위 (Width x Height x Depth)

#### 예시
```
Store_A매장_20.0x10.0x4.0.glb          # 메인 매장 공간
Shelf_메인진열대_3.0x2.0x0.5.glb       # 벽면 진열대
Product_청바지_0.3x0.4x0.1.glb         # 제품 모델
Camera_천장카메라1_0.2x0.2x0.3.glb     # IoT 장비
WiFiSensor_입구센서_0.15x0.15x0.1.glb  # WiFi 센서
```

### 5.2 필수 3D 모델 리스트 (데모용)

#### 5.2.1 고정 구조물 (Fixed Structures) - 4개
```
Store_A매장_20.0x10.0x4.0.glb          # 메인 매장 공간 (20m x 10m x 4m)
Zone_입구구역_5.0x5.0x4.0.glb          # 입구 구역
Zone_계산대구역_3.0x3.0x4.0.glb        # 계산대 구역  
Zone_진열구역_12.0x7.0x4.0.glb         # 진열 구역
```

#### 5.2.2 이동 가능 가구 (Movable Furniture) - 8개
```
Shelf_메인진열대_3.0x2.0x0.5.glb       # 벽면 진열대
Shelf_사이드진열대_2.0x1.8x0.4.glb     # 측면 진열대
DisplayTable_중앙테이블_2.0x1.0x0.8.glb  # 중앙 진열 테이블
DisplayTable_원형테이블_1.5x1.5x0.9.glb  # 원형 테이블
Rack_옷걸이_1.5x1.5x1.8.glb           # 의류 랙
CheckoutCounter_계산대_2.5x1.0x1.1.glb  # 계산대
Mannequin_전신마네킹_0.6x0.6x1.8.glb   # 전신 마네킹
Mannequin_상반신_0.5x0.5x1.2.glb      # 상반신 마네킹
```

#### 5.2.3 제품 (Products) - 6개
```
Product_청바지_0.3x0.4x0.1.glb         # 청바지
Product_티셔츠_0.3x0.4x0.05.glb        # 티셔츠
Product_신발_0.3x0.3x0.15.glb          # 신발
Product_가방_0.4x0.3x0.2.glb           # 가방
Product_모자_0.25x0.25x0.15.glb        # 모자
Product_액세서리_0.2x0.2x0.1.glb       # 액세서리
```

#### 5.2.4 IoT 장비 (Sensors & Cameras) - 4개
```
Camera_천장카메라1_0.2x0.2x0.3.glb     # CCTV 카메라
Camera_천장카메라2_0.2x0.2x0.3.glb     # CCTV 카메라
WiFiSensor_입구센서_0.15x0.15x0.1.glb  # WiFi 센서
WiFiSensor_중앙센서_0.15x0.15x0.1.glb  # WiFi 센서
```

### 5.3 3D 모델 요구사항
| 항목 | 요구사항 | 권장 | 설명 |
|------|----------|------|------|
| **파일 형식** | GLB, GLTF | `.glb` | 압축된 단일 파일 (권장) |
| **단위** | 미터 (m) | Meters | 좌표계 통일 필수 |
| **폴리곤 수** | < 20,000 | 5,000-20,000 | 실시간 렌더링 최적화 |
| **파일 크기** | < 5MB | 1-2MB | 로딩 속도 최적화 |
| **텍스처** | 임베디드 | 내장 (embedded) | GLB 파일에 포함 |
| **좌표계** | Y-up | Y-up | Three.js 표준 |
| **원점** | 중심 또는 하단 | 하단 중심 | 배치 편의성 |

### 5.4 선택적 메타데이터 JSON

#### 5.4.1 기존 가구 (현재 위치 포함)
```json
// Shelf_메인진열대_3.0x2.0x0.5.json
{
  "entity_type": "Shelf",
  "movable": true,
  "dimensions": {
    "width": 3.0,
    "height": 2.0,
    "depth": 0.5
  },
  "current_position": { "x": -5.0, "y": 0, "z": -4.5 },
  "current_rotation": { "x": 0, "y": 0, "z": 0 },
  "properties": {
    "material": "wood",
    "color": "#8B4513",
    "capacity": 50,
    "manufacturer": "RetailFurniture Co."
  },
  "scale": { "x": 1, "y": 1, "z": 1 }
}
```

#### 5.4.2 신규 가구 (배치 힌트 포함)
```json
// DisplayTable_중앙테이블_2.0x1.0x0.8.json
{
  "entity_type": "DisplayTable",
  "movable": true,
  "dimensions": {
    "width": 2.0,
    "height": 1.0,
    "depth": 0.8
  },
  "position_hint": { "x": 0, "y": 0, "z": 0 },
  "rotation_hint": { "x": 0, "y": 0, "z": 0 },
  "properties": {
    "material": "glass",
    "color": "#FFFFFF",
    "weight_kg": 35
  }
}
```

#### 5.4.3 고정 구조물 (Store)
```json
// Store_A매장_20.0x10.0x4.0.json
{
  "entity_type": "Store",
  "movable": false,
  "dimensions": {
    "width": 20.0,
    "height": 10.0,
    "depth": 4.0
  },
  "current_position": { "x": 0, "y": 0, "z": 0 },
  "current_rotation": { "x": 0, "y": 0, "z": 0 },
  "properties": {
    "store_id": "GN001",
    "store_name": "강남점",
    "total_area_sqm": 200,
    "floor_type": "tile"
  }
}
```

### 5.5 데모 시나리오별 필수 모델

#### 시나리오 1: 기본 매장 구성 (최소 12개)
- **고정 구조물**: Store x1, Zone x2
- **가구**: Shelf x2, DisplayTable x1, CheckoutCounter x1
- **제품**: Product x3 (청바지, 티셔츠, 신발)
- **IoT**: Camera x2

**목적**: 기본 3D 매장 시각화 및 제품 배치 확인

#### 시나리오 2: AI 레이아웃 최적화 (18개)
- **기본 구성** + 추가 요소:
  - Rack x2 (의류 랙)
  - Mannequin x2 (마네킹)
  - WiFiSensor x2 (WiFi 센서)

**목적**: AI 기반 가구 재배치 시뮬레이션 및 최적화 제안

#### 시나리오 3: 완전한 데모 (22개)
- **전체 모델** 포함:
  - Fixed Structures: 4개
  - Movable Furniture: 8개
  - Products: 6개
  - IoT Devices: 4개

**목적**: 실제 매장 환경 재현 + WiFi 트래킹 + 히트맵 오버레이

### 5.6 AI 자동 인식 키워드

3D 모델 파일명에서 AI가 자동으로 EntityType을 추론할 수 있는 키워드:

| 키워드 (파일명) | 추론 EntityType | 비고 |
|----------------|----------------|------|
| shelf, 진열대 | Shelf | 벽면/독립형 진열대 |
| table, 테이블 | DisplayTable | 진열 테이블 |
| rack, 랙 | Rack | 의류 랙 |
| counter, 계산대 | CheckoutCounter | POS 계산대 |
| mannequin, 마네킹 | Mannequin | 전신/상반신 |
| camera, 카메라 | Camera | CCTV |
| sensor, 센서 | WiFiSensor | WiFi/IoT 센서 |
| store, 매장 | Store | 매장 공간 |
| zone, 구역 | Zone | 매장 내 구역 |
| product, 상품 | Product | 판매 제품 |

### 5.7 3D 모델 업로드 워크플로우

```
1. 파일명 검증
   ├─ EntityType 추출 → ontology_entity_types 조회
   ├─ Dimensions 파싱 → width, height, depth
   └─ Identifier 추출

2. AI 모델 분석 (선택)
   ├─ 폴리곤 수 확인
   ├─ 텍스처 크기 확인
   └─ 3D 구조 검증

3. 매핑 제안
   ├─ 파일명 기반 EntityType 매칭
   ├─ JSON 메타데이터 읽기 (있는 경우)
   └─ graph_entities 테이블 Insert 준비

4. 사용자 확인 및 저장
   ├─ 매핑 결과 UI 표시
   ├─ 사용자 승인
   └─ Storage 업로드 + DB 저장

5. 3D Scene 렌더링
   └─ SceneViewer에서 자동 로드
```

### 5.8 체크리스트

#### 파일명 검증
- [ ] `{EntityType}_{Identifier}_{Width}x{Height}x{Depth}.glb` 형식
- [ ] EntityType이 ontology_entity_types.name과 일치
- [ ] Dimensions가 숫자 형식 (예: 3.0x2.0x0.5)
- [ ] 파일 확장자가 `.glb` 또는 `.gltf`

#### 메타데이터 (선택사항)
- [ ] JSON 파일명이 GLB와 동일 (확장자만 .json)
- [ ] `entity_type` 필드가 파일명의 EntityType과 일치
- [ ] `movable` 필드가 true/false로 명시
- [ ] `dimensions` 필드가 파일명과 일치

#### 기존 가구 메타데이터
- [ ] `current_position` 필드 포함 (x, y, z)
- [ ] `current_rotation` 필드 포함 (x, y, z)

#### 신규 가구 메타데이터
- [ ] `position_hint` 필드 포함
- [ ] `rotation_hint` 필드 포함
```

---

## 6. WiFi 트래킹 데이터

### 6.1 wifi_sensors.csv (센서 정보)
```csv
sensor_id,sensor_name,x,y,z,range_meters,store_id
NS001,입구센서,0.5,2.5,0.2,10,GN001
NS002,중앙센서,10.0,2.5,5.0,10,GN001
NS003,계산대센서,19.5,2.5,9.8,10,GN001
```

### 6.2 wifi_tracking.csv (위치 데이터)
```csv
session_id,timestamp,x,z,accuracy,sensor_id,rssi,store_id
MAC_001,2024-11-15 14:30:00,0.5,0.2,0.8,NS001,-45,GN001
MAC_001,2024-11-15 14:31:00,1.2,0.5,0.9,NS001,-42,GN001
MAC_001,2024-11-15 14:32:00,2.3,1.5,0.85,NS002,-50,GN001
MAC_001,2024-11-15 14:33:00,3.5,2.0,0.9,NS002,-48,GN001
```

### 6.3 WiFi 데이터 생성 규칙
- **RSSI 범위**: -30 (가까움) ~ -90 (멀음) dBm
- **Accuracy**: 0.0 (부정확) ~ 1.0 (정확)
- **샘플링 간격**: 5-10초
- **세션 지속**: 평균 15-60분

---

## 7. 온톨로지 데이터

### 7.1 엔티티 타입 JSON
```json
{
  "name": "Product",
  "label": "상품",
  "description": "매장에서 판매하는 상품",
  "icon": "Box",
  "color": "#3b82f6",
  "properties": [
    { "name": "name", "type": "string", "required": true },
    { "name": "price", "type": "number", "required": true },
    { "name": "category", "type": "string", "required": true },
    { "name": "stock", "type": "number", "required": false }
  ],
  "model_3d_type": "glb",
  "model_3d_url": "Product_{identifier}_{dimensions}.glb",
  "model_3d_dimensions": { "width": 0.3, "height": 0.4, "depth": 0.1 }
}
```

### 7.2 관계 타입 JSON
```json
{
  "name": "displays",
  "label": "진열",
  "source_entity_type": "Shelf",
  "target_entity_type": "Product",
  "directionality": "directed",
  "properties": [
    { "name": "position", "type": "number" },
    { "name": "quantity", "type": "number" }
  ]
}
```

---

## 8. 데이터 검증 규칙

### 8.1 필수 검증 항목
✅ **파일 형식**
- UTF-8 인코딩 확인
- 헤더 존재 확인
- 컬럼 수 일치 확인

✅ **데이터 타입**
- 숫자 필드: 숫자 형식 검증
- 날짜 필드: 날짜 형식 검증
- 불리언 필드: true/false 검증

✅ **필수 값**
- 필수 컬럼: NULL 값 없음
- 외래키: 참조 무결성 확인

✅ **범위 검증**
- 숫자: 최소/최대 범위 확인
- 날짜: 과거/미래 범위 확인
- 좌표: 매장 범위 내 확인

### 8.2 데이터 품질 체크리스트
- [ ] 중복 데이터 없음
- [ ] 일관된 형식 사용
- [ ] 현실적인 값 범위
- [ ] 관계 데이터 무결성
- [ ] 충분한 데이터 양
- [ ] 균형잡힌 분포

### 8.3 자동 검증 도구
프로젝트의 `SchemaMapper` 컴포넌트가 다음을 자동 검증:
- 스키마 자동 분류
- 컬럼 매핑 제안
- 데이터 타입 검증
- 예외 데이터 필터링

---

## 9. 샘플 데이터 생성 가이드

### 9.1 데이터 생성 도구
프로젝트에 포함된 `scripts/generate-sample-data.js` 사용

### 9.2 생성 파라미터
```javascript
const config = {
  stores: 3,           // 매장 수
  customers: 500,      // 고객 수
  products: 100,       // 상품 수
  purchases: 2000,     // 구매 건수
  visits: 5000,        // 방문 건수
  staff: 30,           // 직원 수
  brands: 20,          // 브랜드 수
  duration: 90         // 데이터 기간 (일)
};
```

### 9.3 현실성 있는 데이터 패턴
- **시간 패턴**: 주말/주중, 시간대별 트래픽 차이
- **계절 패턴**: 계절별 카테고리 판매 비중
- **고객 패턴**: 충성 고객의 재방문율 높음
- **공간 패턴**: 입구-매장-계산대 동선 집중

---

## 10. 데이터 임포트 프로세스

### 10.1 자동 ETL 플로우
```
1. CSV 업로드
   ↓
2. 인코딩 검증 및 변환
   ↓
3. 헤더 파싱
   ↓
4. AI 스키마 분류 (auto-map-etl 함수)
   ↓
5. 컬럼 매핑 제안
   ↓
6. 사용자 확인 및 수정
   ↓
7. 데이터 검증
   ↓
8. Storage 저장
   ↓
9. 메타데이터 DB 저장
   ↓
10. 온톨로지 그래프 생성 (선택)
```

### 10.2 에러 처리
| 에러 타입 | 처리 방식 |
|----------|----------|
| 인코딩 오류 | 자동 UTF-8 변환 시도 |
| 컬럼 누락 | 경고 표시, 기본값 사용 |
| 타입 불일치 | 자동 형변환 시도 |
| 중복 데이터 | 덮어쓰기/건너뛰기 선택 |
| 참조 무결성 | 외래키 검증, 에러 표시 |

---

## 부록: 전체 데이터셋 예시 다운로드

모든 샘플 데이터는 다음 경로에서 확인:
- **경로**: `public/samples/*.csv`
- **사용법**: 앱 내 "샘플 데이터 다운로드" 버튼

**포함 파일**:
1. stores.csv
2. customers.csv
3. products.csv
4. purchases.csv
5. purchases_extended.csv (확장 구매 데이터)
6. visits.csv
7. visits_extended.csv (확장 방문 데이터)
8. staff.csv
9. brands.csv
10. wifi_sensors.csv
11. wifi_tracking.csv
12. social_states.csv (소셜 상태 - 개발 중)
