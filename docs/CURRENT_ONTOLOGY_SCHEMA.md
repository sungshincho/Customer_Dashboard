# NEURALTWIN 온톨로지 스키마 전체 정의서

> **생성일**: 2025-11-21  
> **엔티티 타입**: 43개  
> **관계 타입**: 89개  
> **용도**: 데이터셋 생성 및 온톨로지 기반 데이터 모델링

---

## 📋 목차

1. [엔티티 타입 (Entity Types)](#엔티티-타입-entity-types)
2. [관계 타입 (Relation Types)](#관계-타입-relation-types)
3. [엔티티별 속성 상세](#엔티티별-속성-상세)

---

## 엔티티 타입 (Entity Types)

### 1. 공간 구조 (Space Structure) - 11개

#### 1.1 Store (매장)
- **Label**: 매장
- **Color**: `#3b82f6` (파랑)
- **Icon**: Store
- **Description**: 오프라인 리테일 매장
- **3D Type**: building
- **3D Dimensions**: { width: 20, height: 4, depth: 30 }
- **Properties**:
  - `store_code` (string, required): 매장 코드
  - `store_name` (string, required): 매장명
  - `address` (string, required): 주소
  - `area_sqm` (number, required): 면적 (㎡)
  - `opening_date` (string): 개점일
  - `store_format` (string): 매장 포맷 (flagship/standard/compact)
  - `region` (string): 권역
  - `district` (string): 상권
  - `manager_name` (string): 매장 책임자

#### 1.2 Zone (구역)
- **Label**: 구역
- **Color**: `#10b981` (초록)
- **Icon**: Grid3x3
- **Description**: 매장 내 논리적/물리적 구역
- **3D Type**: zone
- **3D Dimensions**: { width: 5, height: 3, depth: 5 }
- **Properties**:
  - `zone_id` (string, required): 구역 ID
  - `zone_type` (string, required): 구역 유형
  - `zone_name` (string, required): 구역명
  - `area_sqm` (number): 면적 (㎡)
  - `purpose` (string): 용도
  - `traffic_level` (string): 통행량 수준

#### 1.3 Entrance (입구)
- **Label**: 입구
- **Color**: `#f59e0b` (주황)
- **Icon**: DoorOpen
- **Description**: 매장 출입구
- **3D Type**: zone
- **3D Dimensions**: { width: 3, height: 3, depth: 0.5 }
- **Properties**:
  - `entrance_id` (string, required): 입구 ID
  - `entrance_type` (string): 입구 유형 (main/side/emergency)
  - `width_m` (number): 너비 (미터)
  - `has_automatic_door` (boolean): 자동문 여부
  - `is_primary` (boolean): 주출입구 여부

#### 1.4 Window (창문)
- **Label**: 창문
- **Color**: `#06b6d4` (청록)
- **Icon**: Square
- **Description**: 매장 외벽 창문
- **3D Type**: furniture
- **3D Dimensions**: { width: 2, height: 2.5, depth: 0.1 }
- **Properties**:
  - `window_id` (string, required): 창문 ID
  - `window_type` (string): 창문 유형 (display/ventilation/skylight)
  - `width_m` (number): 너비
  - `height_m` (number): 높이
  - `is_display_window` (boolean): 디스플레이 창 여부

#### 1.5 Wall (벽)
- **Label**: 벽
- **Color**: `#64748b` (회색)
- **Icon**: Minus
- **Description**: 매장 내/외부 벽체
- **3D Type**: furniture
- **3D Dimensions**: { width: 10, height: 3, depth: 0.2 }
- **Properties**:
  - `wall_id` (string, required): 벽 ID
  - `wall_type` (string): 벽 유형 (exterior/interior/partition)
  - `length_m` (number): 길이
  - `height_m` (number): 높이
  - `material` (string): 재질

#### 1.6 Aisle (통로)
- **Label**: 통로
- **Color**: `#22c55e` (연두)
- **Icon**: MoveHorizontal
- **Description**: 고객 이동 통로
- **3D Type**: zone
- **3D Dimensions**: { width: 1.5, height: 3, depth: 10 }
- **Properties**:
  - `aisle_code` (string, required): 통로 코드
  - `aisle_type` (string): 통로 유형 (main/secondary/crossover)
  - `width_m` (number, required): 통로 너비 (미터)
  - `length_m` (number, required): 통로 길이 (미터)
  - `direction` (string): 통행 방향 (bidirectional/oneway)
  - `flooring_type` (string): 바닥재 유형

#### 1.7 StaffZone (직원 구역)
- **Label**: 직원 구역
- **Color**: `#a855f7` (보라)
- **Icon**: Users
- **Description**: 직원 전용 공간
- **3D Type**: zone
- **3D Dimensions**: { width: 3, height: 3, depth: 4 }
- **Properties**:
  - `staff_zone_id` (string, required): 직원구역 ID
  - `zone_type` (string): 구역 유형 (office/breakroom/storage)
  - `capacity` (number): 수용 인원
  - `access_level` (string): 접근 권한 수준

#### 1.8 StorageRoom (창고)
- **Label**: 창고
- **Color**: `#78716c` (갈색)
- **Icon**: Package
- **Description**: 재고 보관 공간
- **3D Type**: zone
- **3D Dimensions**: { width: 4, height: 3, depth: 6 }
- **Properties**:
  - `storage_id` (string, required): 창고 ID
  - `storage_type` (string): 창고 유형 (backstock/cold/hazmat)
  - `capacity_cbm` (number): 용량 (㎥)
  - `current_utilization` (number): 현재 사용률 (%)
  - `has_climate_control` (boolean): 온습도 관리 여부

#### 1.9 Restroom (화장실)
- **Label**: 화장실
- **Color**: `#06b6d4` (청록)
- **Icon**: DoorClosed
- **Description**: 고객/직원 화장실
- **3D Type**: zone
- **3D Dimensions**: { width: 3, height: 3, depth: 4 }
- **Properties**:
  - `restroom_id` (string, required): 화장실 ID
  - `restroom_type` (string): 화장실 유형 (customer/staff/family)
  - `num_stalls` (number): 칸 개수
  - `is_accessible` (boolean): 장애인 접근 가능

#### 1.10 FittingRoom (피팅룸)
- **Label**: 피팅룸
- **Color**: `#ec4899` (핑크)
- **Icon**: Shirt
- **Description**: 고객 착용실
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.5, height: 2.5, depth: 1.5 }
- **3D Metadata**: { has_mirror: true, has_lighting: true, privacy_level: "high" }
- **Properties**:
  - `fitting_room_id` (string, required): 피팅룸 ID
  - `size_category` (string): 크기 분류 (small/medium/large)
  - `has_mirror` (boolean): 거울 유부
  - `has_seating` (boolean): 좌석 여부
  - `occupancy_sensor` (boolean): 점유 센서

#### 1.11 CheckoutCounter (계산대)
- **Label**: 계산대
- **Color**: `#eab308` (노랑)
- **Icon**: CreditCard
- **Description**: 결제 카운터
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.2, height: 1, depth: 0.6 }
- **3D Metadata**: { has_pos: true, num_lanes: 1, supports_mobile_pay: true }
- **Properties**:
  - `counter_id` (string, required): 계산대 ID
  - `counter_number` (number, required): 계산대 번호
  - `has_pos_terminal` (boolean): POS 단말 여부
  - `has_card_reader` (boolean): 카드 리더기
  - `has_barcode_scanner` (boolean): 바코드 스캐너
  - `supports_mobile_payment` (boolean): 모바일 결제
  - `is_express_lane` (boolean): 간편 계산대 여부

---

### 2. 가구 및 집기 (Furniture & Fixtures) - 4개

#### 2.1 Shelf (선반)
- **Label**: 선반
- **Color**: `#f97316` (주황)
- **Icon**: Layers
- **Description**: 제품 진열 선반
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.2, height: 2, depth: 0.4 }
- **3D Metadata**: { num_shelves: 5, adjustable: true, max_load_kg: 50 }
- **Properties**:
  - `shelf_id` (string, required): 선반 ID
  - `shelf_type` (string): 선반 유형 (wall/gondola/endcap)
  - `num_levels` (number): 단 수
  - `width_m` (number): 너비
  - `height_m` (number): 높이
  - `depth_m` (number): 깊이
  - `material` (string): 재질
  - `max_load_kg` (number): 최대 적재 중량

#### 2.2 Rack (랙)
- **Label**: 랙
- **Color**: `#14b8a6` (청록)
- **Icon**: Grid
- **Description**: 의류/소품 진열 랙
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.5, height: 1.8, depth: 0.5 }
- **3D Metadata**: { rack_style: "round", has_wheels: true, adjustable_height: true }
- **Properties**:
  - `rack_id` (string, required): 랙 ID
  - `rack_type` (string): 랙 유형 (round/straight/4way)
  - `capacity_units` (number): 수용 수량
  - `has_casters` (boolean): 바퀴 여부
  - `is_adjustable` (boolean): 높이 조절 가능

#### 2.3 DisplayTable (디스플레이 테이블)
- **Label**: 디스플레이 테이블
- **Color**: `#8b5cf6` (보라)
- **Icon**: Table
- **Description**: 제품 진열 테이블
- **3D Type**: furniture
- **3D Dimensions**: { width: 1.5, height: 0.9, depth: 1 }
- **3D Metadata**: { shape: "rectangular", has_storage: false, surface_finish: "wood" }
- **Properties**:
  - `table_id` (string, required): 테이블 ID
  - `table_shape` (string): 형태 (rectangular/round/square)
  - `width_m` (number): 너비
  - `length_m` (number): 길이
  - `height_m` (number): 높이
  - `surface_material` (string): 표면 재질

#### 2.4 Mannequin (마네킹)
- **Label**: 마네킹
- **Color**: `#f43f5e` (빨강)
- **Icon**: User
- **Description**: 의상 전시 마네킹
- **3D Type**: furniture
- **3D Dimensions**: { width: 0.5, height: 1.8, depth: 0.4 }
- **3D Metadata**: { mannequin_type: "full_body", pose: "standing", articulated: false }
- **Properties**:
  - `mannequin_id` (string, required): 마네킹 ID
  - `mannequin_type` (string): 마네킹 유형 (full/torso/head)
  - `pose` (string): 포즈 (standing/sitting/dynamic)
  - `is_articulated` (boolean): 관절 가동 여부
  - `gender_display` (string): 성별 표현 (male/female/neutral)

---

### 3. 제품 관련 (Product Related) - 5개

#### 3.1 Product (제품)
- **Label**: 제품
- **Color**: `#06b6d4` (청록)
- **Icon**: ShoppingBag
- **Description**: 판매 제품
- **3D Type**: product
- **3D Dimensions**: { width: 0.3, height: 0.4, depth: 0.1 }
- **Properties**:
  - `sku` (string, required): SKU 코드
  - `product_name` (string, required): 제품명
  - `category` (string, required): 카테고리
  - `brand` (string): 브랜드
  - `selling_price` (number, required): 판매가
  - `cost_price` (number): 원가
  - `supplier` (string): 공급업체
  - `lead_time_days` (number): 리드타임 (일)

#### 3.2 Inventory (재고)
- **Label**: 재고
- **Color**: `#84cc16` (연두)
- **Icon**: Package
- **Description**: 제품 재고 현황
- **Properties**:
  - `inventory_id` (string, required): 재고 ID
  - `current_stock` (number, required): 현재 재고
  - `minimum_stock` (number, required): 최소 재고
  - `optimal_stock` (number, required): 적정 재고
  - `weekly_demand` (number): 주간 수요
  - `last_updated` (string): 마지막 업데이트

#### 3.3 Brand (브랜드)
- **Label**: 브랜드
- **Color**: `#a855f7` (보라)
- **Icon**: Award
- **Description**: 제품 브랜드
- **Properties**:
  - `brand_id` (string, required): 브랜드 ID
  - `brand_name` (string, required): 브랜드명
  - `brand_category` (string): 브랜드 카테고리
  - `brand_tier` (string): 브랜드 등급 (luxury/premium/standard/value)
  - `origin_country` (string): 원산지

#### 3.4 Promotion (프로모션)
- **Label**: 프로모션
- **Color**: `#f59e0b` (주황)
- **Icon**: Tag
- **Description**: 판매 촉진 이벤트
- **Properties**:
  - `promotion_id` (string, required): 프로모션 ID
  - `promotion_name` (string, required): 프로모션명
  - `promotion_type` (string): 프로모션 유형 (discount/bogo/bundle)
  - `start_date` (string, required): 시작일
  - `end_date` (string, required): 종료일
  - `discount_rate` (number): 할인율 (%)
  - `applicable_products` (array): 대상 제품

#### 3.5 Supplier (공급업체)
- **Label**: 공급업체
- **Color**: `#0ea5e9` (파랑)
- **Icon**: Truck
- **Description**: 제품 공급사
- **Properties**:
  - `supplier_id` (string, required): 공급업체 ID
  - `supplier_name` (string, required): 공급업체명
  - `contact_person` (string): 담당자
  - `email` (string): 이메일
  - `phone` (string): 전화번호
  - `lead_time_days` (number): 평균 리드타임

---

### 4. 고객 및 거래 (Customer & Transaction) - 5개

#### 4.1 Customer (고객)
- **Label**: 고객
- **Color**: `#8b5cf6` (보라)
- **Icon**: User
- **Description**: 매장 방문 고객
- **Properties**:
  - `customer_id` (string, required): 고객 ID
  - `age_group` (string): 연령대
  - `gender` (string): 성별
  - `customer_segment` (string): 고객 세그먼트 (VIP/regular/new)
  - `signup_date` (string): 가입일
  - `loyalty_tier` (string): 멤버십 등급

#### 4.2 Visit (방문)
- **Label**: 방문
- **Color**: `#06b6d4` (청록)
- **Icon**: MapPin
- **Description**: 고객 매장 방문 기록
- **Properties**:
  - `visit_id` (string, required): 방문 ID
  - `visit_date` (string, required): 방문 날짜
  - `visit_time` (string, required): 방문 시간
  - `duration_minutes` (number): 체류 시간 (분)
  - `zones_visited` (array): 방문 구역 목록
  - `did_purchase` (boolean): 구매 여부

#### 4.3 Sale (매출)
- **Label**: 매출
- **Color**: `#10b981` (초록)
- **Icon**: DollarSign
- **Description**: 제품 판매 거래
- **Properties**:
  - `sale_id` (string, required): 판매 ID
  - `sale_date` (string, required): 판매 날짜
  - `sale_time` (string, required): 판매 시간
  - `total_amount` (number, required): 총 금액
  - `payment_method` (string): 결제 수단
  - `discount_amount` (number): 할인 금액
  - `num_items` (number): 구매 품목 수

#### 4.4 PurchaseConversion (구매 전환)
- **Label**: 구매 전환
- **Color**: `#22c55e` (연두)
- **Icon**: TrendingUp
- **Description**: 방문에서 구매로의 전환
- **Properties**:
  - `conversion_id` (string, required): 전환 ID
  - `conversion_date` (string, required): 전환 날짜
  - `time_to_purchase_minutes` (number): 구매까지 소요 시간
  - `conversion_funnel_stage` (string): 전환 퍼널 단계
  - `touchpoints` (array): 접촉점 목록

#### 4.5 CustomerWTP (고객 지불의향가격)
- **Label**: 지불의향가격
- **Color**: `#f59e0b` (주황)
- **Icon**: DollarSign
- **Description**: 고객별 가격 민감도
- **Properties**:
  - `wtp_id` (string, required): WTP ID
  - `estimated_wtp` (number, required): 예상 WTP
  - `price_sensitivity` (string): 가격 민감도 (high/medium/low)
  - `elasticity_score` (number): 가격 탄력성
  - `inferred_from` (string): 추론 근거

---

### 5. 운영 및 직원 (Operations & Staff) - 3개

#### 5.1 Staff (직원)
- **Label**: 직원
- **Color**: `#6366f1` (인디고)
- **Icon**: UserCheck
- **Description**: 매장 근무 직원
- **Properties**:
  - `staff_id` (string, required): 직원 ID
  - `staff_name` (string, required): 직원명
  - `role` (string, required): 역할 (manager/sales/stockist)
  - `hire_date` (string): 입사일
  - `shift_schedule` (string): 근무 시간대

#### 5.2 Shift (근무 교대)
- **Label**: 근무 교대
- **Color**: `#14b8a6` (청록)
- **Icon**: Clock
- **Description**: 직원 근무 시프트
- **Properties**:
  - `shift_id` (string, required): 시프트 ID
  - `shift_date` (string, required): 근무 날짜
  - `start_time` (string, required): 시작 시간
  - `end_time` (string, required): 종료 시간
  - `shift_type` (string): 시프트 유형 (morning/afternoon/evening)

#### 5.3 Task (업무)
- **Label**: 업무
- **Color**: `#8b5cf6` (보라)
- **Icon**: CheckSquare
- **Description**: 직원 수행 업무
- **Properties**:
  - `task_id` (string, required): 업무 ID
  - `task_name` (string, required): 업무명
  - `task_type` (string): 업무 유형 (restock/cleaning/display)
  - `priority` (string): 우선순위 (high/medium/low)
  - `status` (string): 상태 (pending/in_progress/completed)
  - `due_time` (string): 완료 기한

---

### 6. IoT 및 센서 (IoT & Sensors) - 9개

#### 6.1 WiFiSensor (WiFi 센서)
- **Label**: WiFi 센서
- **Color**: `#2563eb` (파랑)
- **Icon**: Wifi
- **Description**: WiFi 기반 위치 추적 센서
- **3D Type**: device
- **3D Dimensions**: { width: 0.2, height: 0.2, depth: 0.05 }
- **3D Metadata**: { protocol: "802.11ac", range_meters: 30, power_source: "PoE" }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `mac_address` (string): MAC 주소
  - `ip_address` (string): IP 주소
  - `ssid` (string): SSID
  - `channel` (number): WiFi 채널
  - `tx_power_dbm` (number): 송신 출력
  - `detection_range_m` (number): 탐지 범위

#### 6.2 Beacon (비콘)
- **Label**: 비콘
- **Color**: `#2563eb` (파랑)
- **Icon**: Wifi
- **Description**: Bluetooth 비콘 장치
- **3D Type**: device
- **3D Dimensions**: { width: 0.05, height: 0.05, depth: 0.02 }
- **3D Metadata**: { protocol: "BLE", range_meters: 30, battery_life_months: 12 }
- **Properties**:
  - `beacon_id` (string, required): 비콘 ID
  - `uuid` (string): UUID
  - `major` (number): Major 값
  - `minor` (number): Minor 값
  - `tx_power` (number): 송신 출력 (dBm)
  - `advertising_interval_ms` (number): 광고 주기 (ms)
  - `battery_level` (number): 배터리 잔량 (%)

#### 6.3 Camera (카메라)
- **Label**: 카메라
- **Color**: `#dc2626` (빨강)
- **Icon**: Video
- **Description**: CCTV 및 비전 분석 카메라
- **3D Type**: device
- **3D Dimensions**: { width: 0.15, height: 0.15, depth: 0.2 }
- **3D Metadata**: { resolution: "4K", field_of_view_degrees: 110, has_ai: true }
- **Properties**:
  - `camera_id` (string, required): 카메라 ID
  - `camera_type` (string, required): 카메라 유형 (fixed/ptz/dome/bullet)
  - `resolution` (string): 해상도 (1080p/4K/8K)
  - `fps` (number): 프레임 레이트
  - `field_of_view` (number): 화각 (도)
  - `has_night_vision` (boolean): 야간 촬영 기능
  - `ai_features` (array): AI 기능 목록

#### 6.4 DoorSensor (문 센서)
- **Label**: 문 센서
- **Color**: `#f59e0b` (주황)
- **Icon**: DoorOpen
- **Description**: 출입 감지 센서
- **3D Type**: device
- **3D Dimensions**: { width: 0.08, height: 0.08, depth: 0.03 }
- **3D Metadata**: { sensor_type: "magnetic", battery_powered: true, wireless: true }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `sensor_type` (string): 센서 유형 (magnetic/infrared)
  - `is_wireless` (boolean): 무선 여부
  - `battery_level` (number): 배터리 잔량 (%)
  - `last_triggered` (string): 마지막 감지 시간

#### 6.5 PeopleCounter (인원 계수기)
- **Label**: 인원 계수기
- **Color**: `#10b981` (초록)
- **Icon**: Users
- **Description**: 입장/퇴장 인원 카운터
- **3D Type**: device
- **3D Dimensions**: { width: 0.3, height: 0.1, depth: 0.1 }
- **3D Metadata**: { technology: "thermal", accuracy: 0.98, bidirectional: true }
- **Properties**:
  - `counter_id` (string, required): 계수기 ID
  - `technology` (string): 기술 방식 (thermal/stereo/3D)
  - `accuracy_rate` (number): 정확도 (%)
  - `bidirectional` (boolean): 양방향 감지
  - `height_range_cm` (string): 감지 높이 범위

#### 6.6 TemperatureSensor (온도 센서)
- **Label**: 온도 센서
- **Color**: `#ef4444` (빨강)
- **Icon**: Thermometer
- **Description**: 온도 측정 센서
- **3D Type**: device
- **3D Dimensions**: { width: 0.1, height: 0.1, depth: 0.05 }
- **3D Metadata**: { range_celsius: [-20, 60], accuracy: 0.5, wireless: true }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `current_temp_c` (number): 현재 온도 (°C)
  - `min_range_c` (number): 최소 측정 범위
  - `max_range_c` (number): 최대 측정 범위
  - `accuracy` (number): 정확도 (±°C)

#### 6.7 HumiditySensor (습도 센서)
- **Label**: 습도 센서
- **Color**: `#06b6d4` (청록)
- **Icon**: Droplets
- **Description**: 습도 측정 센서
- **3D Type**: device
- **3D Dimensions**: { width: 0.1, height: 0.1, depth: 0.05 }
- **3D Metadata**: { range_percent: [0, 100], accuracy: 2, wireless: true }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `current_humidity` (number): 현재 습도 (%)
  - `accuracy` (number): 정확도 (±%)
  - `battery_level` (number): 배터리 잔량

#### 6.8 LightingSensor (조명 센서)
- **Label**: 조명 센서
- **Color**: `#fbbf24` (노랑)
- **Icon**: Sun
- **Description**: 조도 측정 센서
- **3D Type**: device
- **3D Dimensions**: { width: 0.08, height: 0.08, depth: 0.04 }
- **3D Metadata**: { range_lux: [0, 100000], auto_adjust: true, wireless: true }
- **Properties**:
  - `sensor_id` (string, required): 센서 ID
  - `current_lux` (number): 현재 조도 (lux)
  - `min_lux` (number): 최소 측정 범위
  - `max_lux` (number): 최대 측정 범위

#### 6.9 HVAC (냉난방 시스템)
- **Label**: 냉난방 시스템
- **Color**: `#0ea5e9` (파랑)
- **Icon**: Wind
- **Description**: 공조 시스템
- **3D Type**: device
- **3D Dimensions**: { width: 1, height: 0.6, depth: 0.4 }
- **3D Metadata**: { cooling_capacity_kw: 10, heating_capacity_kw: 12, energy_rating: "A++" }
- **Properties**:
  - `hvac_id` (string, required): HVAC ID
  - `system_type` (string): 시스템 유형 (central/split/vrf)
  - `cooling_capacity_kw` (number): 냉방 용량
  - `heating_capacity_kw` (number): 난방 용량
  - `current_mode` (string): 현재 모드 (cooling/heating/auto/off)
  - `target_temp_c` (number): 목표 온도
  - `energy_efficiency_rating` (string): 에너지 효율 등급

---

### 7. 기타 시스템 (Other Systems) - 6개

#### 7.1 AudioSystem (음향 시스템)
- **Label**: 음향 시스템
- **Color**: `#8b5cf6` (보라)
- **Icon**: Music
- **Description**: 매장 음향 재생 시스템
- **3D Type**: device
- **3D Dimensions**: { width: 0.4, height: 0.3, depth: 0.3 }
- **3D Metadata**: { max_zones: 4, supports_streaming: true, audio_format: "stereo" }
- **Properties**:
  - `audio_system_id` (string, required): 음향 시스템 ID
  - `system_type` (string): 시스템 유형 (zone/distributed/pa)
  - `num_speakers` (number): 스피커 개수
  - `total_power_watts` (number): 총 출력 (W)
  - `current_volume` (number): 현재 볼륨 (%)
  - `supports_zones` (boolean): 구역별 제어 지원
  - `audio_sources` (array): 오디오 소스
  - `currently_playing` (string): 현재 재생 중인 콘텐츠

#### 7.2 DigitalSignage (디지털 사이니지)
- **Label**: 디지털 사이니지
- **Color**: `#f97316` (주황)
- **Icon**: Monitor
- **Description**: 디지털 광고/안내판
- **3D Type**: device
- **3D Dimensions**: { width: 1.2, height: 0.7, depth: 0.1 }
- **3D Metadata**: { screen_size_inches: 55, resolution: "4K", orientation: "landscape" }
- **Properties**:
  - `signage_id` (string, required): 사이니지 ID
  - `screen_size_inches` (number): 화면 크기 (인치)
  - `resolution` (string): 해상도
  - `orientation` (string): 방향 (landscape/portrait)
  - `content_type` (string): 콘텐츠 유형 (ad/info/wayfinding)
  - `is_interactive` (boolean): 터치 인터랙션
  - `current_content` (string): 현재 표시 콘텐츠

#### 7.3 POS (판매 시점 시스템)
- **Label**: POS 시스템
- **Color**: `#eab308` (노랑)
- **Icon**: ShoppingCart
- **Description**: 판매 시점 관리 시스템
- **3D Type**: device
- **3D Dimensions**: { width: 0.4, height: 0.3, depth: 0.3 }
- **3D Metadata**: { has_touchscreen: true, printer_type: "thermal", card_reader: true }
- **Properties**:
  - `pos_id` (string, required): POS ID
  - `pos_type` (string): POS 유형 (fixed/mobile/kiosk)
  - `has_touchscreen` (boolean): 터치스크린
  - `has_barcode_scanner` (boolean): 바코드 스캐너
  - `has_card_reader` (boolean): 카드 리더기
  - `printer_type` (string): 프린터 유형
  - `os_version` (string): 운영체제 버전

#### 7.4 Alert (알림)
- **Label**: 알림
- **Color**: `#dc2626` (빨강)
- **Icon**: AlertTriangle
- **Description**: 비즈니스 알림 및 경고
- **Properties**:
  - `alert_id` (string, required): 알림 ID
  - `type` (string, required): 알림 유형
  - `severity` (string, required): 심각도
  - `message` (string, required): 메시지
  - `triggered_at` (string, required): 발생 시간
  - `resolved` (boolean): 해결 여부

#### 7.5 DemandForecast (수요 예측)
- **Label**: 수요 예측
- **Color**: `#14b8a6` (청록)
- **Icon**: TrendingUp
- **Description**: AI 기반 수요 예측
- **Properties**:
  - `forecast_id` (string, required): 예측 ID
  - `forecast_date` (string, required): 예측 날짜
  - `forecast_period` (string): 예측 기간
  - `predicted_demand` (number): 예측 수요량
  - `confidence_level` (number): 신뢰도 (%)
  - `model_version` (string): 모델 버전

#### 7.6 PriceOptimization (가격 최적화)
- **Label**: 가격 최적화
- **Color**: `#f59e0b` (주황)
- **Icon**: DollarSign
- **Description**: 동적 가격 최적화
- **Properties**:
  - `optimization_id` (string, required): 최적화 ID
  - `optimized_price` (number, required): 최적화된 가격
  - `original_price` (number): 원래 가격
  - `price_change_percent` (number): 가격 변동률 (%)
  - `expected_revenue_impact` (number): 예상 매출 영향
  - `optimization_reason` (string): 최적화 근거

---

## 관계 타입 (Relation Types)

### 1. 공간 관계 (Spatial Relations) - 15개

1. **contains** (포함함)
   - Source: Store → Target: Zone
   - Directionality: directed
   - Description: A가 B를 포함함

2. **contains** (포함함)
   - Source: Zone → Target: Shelf
   - Directionality: directed

3. **contains** (포함함)
   - Source: Zone → Target: Rack
   - Directionality: directed

4. **contains** (포함함)
   - Source: Zone → Target: DisplayTable
   - Directionality: directed

5. **contains** (포함함)
   - Source: Zone → Target: CheckoutCounter
   - Directionality: directed

6. **contains** (포함함)
   - Source: Zone → Target: FittingRoom
   - Directionality: directed

7. **adjacent_to** (인접함)
   - Source: Zone → Target: Zone
   - Directionality: undirected
   - Description: A가 B와 인접함

8. **connects_to** (연결됨)
   - Source: Zone → Target: Aisle
   - Directionality: undirected
   - Description: A가 B와 연결됨

9. **bounded_by** (경계됨)
   - Source: Zone → Target: Wall
   - Directionality: directed
   - Description: A가 B에 의해 경계됨

10. **leads_to** (연결함)
    - Source: Entrance → Target: Zone
    - Directionality: directed
    - Description: A가 B로 연결됨

11. **overlooks** (바라봄)
    - Source: Window → Target: Zone
    - Directionality: directed
    - Description: A가 B를 바라봄

12. **accesses** (접근함)
    - Source: Entrance → Target: StorageRoom
    - Directionality: directed
    - Description: A가 B에 접근함

13. **positioned_in** (위치함)
    - Source: Mannequin → Target: Zone
    - Directionality: directed
    - Description: A가 B에 위치함

14. **mounted_on** (설치됨)
    - Source: DigitalSignage → Target: Wall
    - Directionality: directed
    - Description: A가 B에 설치됨

15. **monitors** (감시함)
    - Source: Camera → Target: Zone
    - Directionality: directed
    - Description: A가 B를 감시함

---

### 2. 제품 관계 (Product Relations) - 18개

16. **displays** (진열함)
    - Source: Shelf → Target: Product
    - Directionality: directed
    - Description: A가 B를 진열함

17. **displays** (진열함)
    - Source: Rack → Target: Product
    - Directionality: directed

18. **displays** (진열함)
    - Source: DisplayTable → Target: Product
    - Directionality: directed

19. **showcases** (전시함)
    - Source: Mannequin → Target: Product
    - Directionality: directed
    - Description: A가 B를 전시함

20. **has_inventory** (재고 보유)
    - Source: Product → Target: Inventory
    - Directionality: directed
    - Description: A가 B의 재고를 보유함

21. **supplied_by** (공급받음)
    - Source: Product → Target: Supplier
    - Directionality: directed
    - Description: A가 B로부터 공급받음

22. **belongs_to_brand** (브랜드 소속)
    - Source: Product → Target: Brand
    - Directionality: directed
    - Description: A가 B 브랜드에 소속됨

23. **included_in_promotion** (프로모션 포함)
    - Source: Product → Target: Promotion
    - Directionality: directed
    - Description: A가 B 프로모션에 포함됨

24. **affects_sales** (매출 영향)
    - Source: Promotion → Target: Sale
    - Directionality: directed
    - Description: 프로모션이 매출에 영향

25. **purchased_in** (구매됨)
    - Source: Product → Target: Sale
    - Directionality: directed
    - Description: A가 B에서 구매됨

26. **replenished_from** (보충됨)
    - Source: Inventory → Target: StorageRoom
    - Directionality: directed
    - Description: A가 B에서 보충됨

27. **stored_in** (저장됨)
    - Source: Product → Target: StorageRoom
    - Directionality: directed
    - Description: A가 B에 저장됨

28. **alert_for_inventory** (재고 알림)
    - Source: Alert → Target: Inventory
    - Directionality: directed
    - Description: 재고 관련 알림

29. **alert_for_product** (제품 알림)
    - Source: Alert → Target: Product
    - Directionality: directed
    - Description: 제품 관련 알림

30. **recommends** (추천함)
    - Source: Product → Target: Product
    - Directionality: directed
    - Description: A가 B를 추천함 (연관 상품)

31. **substitutes** (대체함)
    - Source: Product → Target: Product
    - Directionality: directed
    - Description: A가 B를 대체할 수 있음

32. **complements** (보완함)
    - Source: Product → Target: Product
    - Directionality: directed
    - Description: A가 B와 함께 구매됨

33. **forecast_for_product** (제품 수요 예측)
    - Source: DemandForecast → Target: Product
    - Directionality: directed
    - Description: A가 B의 수요를 예측함

---

### 3. 고객 관계 (Customer Relations) - 20개

34. **visited_by** (방문받음)
    - Source: Store → Target: Customer
    - Directionality: directed
    - Description: A가 B에게 방문받음

35. **visits** (방문함)
    - Source: Customer → Target: Visit
    - Directionality: directed
    - Description: A가 B를 방문함

36. **visited_zone** (구역 방문)
    - Source: Visit → Target: Zone
    - Directionality: directed
    - Description: A가 B 구역을 방문함

37. **purchased_by** (구매함)
    - Source: Sale → Target: Customer
    - Directionality: directed
    - Description: A가 B에 의해 구매됨

38. **conversion_from_visit** (방문 전환)
    - Source: PurchaseConversion → Target: Visit
    - Directionality: directed
    - Description: 방문에서의 전환 분석

39. **conversion_to_sale** (매출 전환)
    - Source: PurchaseConversion → Target: Sale
    - Directionality: directed
    - Description: 매출로의 전환

40. **dwelled_in** (체류함)
    - Source: Visit → Target: Zone
    - Directionality: directed
    - Description: A가 B에 체류함

41. **entered_via** (입장함)
    - Source: Visit → Target: Entrance
    - Directionality: directed
    - Description: A가 B를 통해 입장함

42. **checked_out_at** (계산함)
    - Source: Sale → Target: CheckoutCounter
    - Directionality: directed
    - Description: A가 B에서 계산함

43. **used_fitting_room** (피팅룸 사용)
    - Source: Visit → Target: FittingRoom
    - Directionality: directed
    - Description: A가 B를 사용함

44. **interacted_with** (상호작용함)
    - Source: Customer → Target: Product
    - Directionality: directed
    - Description: A가 B와 상호작용함

45. **viewed_on_signage** (사이니지 열람)
    - Source: Customer → Target: DigitalSignage
    - Directionality: directed
    - Description: A가 B를 열람함

46. **segment_belongs_to** (세그먼트 소속)
    - Source: Customer → Target: Customer
    - Directionality: directed
    - Description: 고객 세그먼트 분류

47. **has_wtp** (WTP 보유)
    - Source: Customer → Target: CustomerWTP
    - Directionality: directed
    - Description: A가 B의 지불의향가격을 가짐

48. **considers_wtp** (WTP 고려)
    - Source: PriceOptimization → Target: Customer
    - Directionality: directed
    - Description: 고객 지불의향가격 반영

49. **influenced_by_promotion** (프로모션 영향)
    - Source: Customer → Target: Promotion
    - Directionality: directed
    - Description: A가 B에 영향받음

50. **loyalty_tier** (멤버십 등급)
    - Source: Customer → Target: Customer
    - Directionality: directed
    - Description: 멤버십 등급 관계

51. **referred_by** (추천받음)
    - Source: Customer → Target: Customer
    - Directionality: directed
    - Description: A가 B에게 추천받음

52. **repeat_visitor** (재방문 고객)
    - Source: Customer → Target: Store
    - Directionality: directed
    - Description: A가 B를 재방문함

53. **vip_customer** (VIP 고객)
    - Source: Customer → Target: Store
    - Directionality: directed
    - Description: A가 B의 VIP 고객임

---

### 4. 직원 및 운영 관계 (Staff & Operations Relations) - 12개

54. **works_at** (근무함)
    - Source: Staff → Target: Store
    - Directionality: directed
    - Description: A가 B에 근무함

55. **assigned_to** (할당됨)
    - Source: Staff → Target: StaffZone
    - Directionality: directed
    - Description: A가 B에 할당됨

56. **has_shift** (시프트 보유)
    - Source: Staff → Target: Shift
    - Directionality: directed
    - Description: A가 B 시프트를 가짐

57. **performs_task** (업무 수행)
    - Source: Staff → Target: Task
    - Directionality: directed
    - Description: A가 B를 수행함

58. **manages** (관리함)
    - Source: Staff → Target: Zone
    - Directionality: directed
    - Description: A가 B를 관리함

59. **restocks** (재입고함)
    - Source: Staff → Target: Shelf
    - Directionality: directed
    - Description: A가 B를 재입고함

60. **operates** (운영함)
    - Source: Staff → Target: POS
    - Directionality: directed
    - Description: A가 B를 운영함

61. **supervises** (감독함)
    - Source: Staff → Target: Staff
    - Directionality: directed
    - Description: A가 B를 감독함

62. **scheduled_for** (스케줄됨)
    - Source: Shift → Target: Zone
    - Directionality: directed
    - Description: A가 B에 스케줄됨

63. **task_in_zone** (구역 내 업무)
    - Source: Task → Target: Zone
    - Directionality: directed
    - Description: A가 B에서 수행됨

64. **alert_for_staff** (직원 알림)
    - Source: Alert → Target: Staff
    - Directionality: directed
    - Description: A가 B에게 알림

65. **alert_for_store** (매장 알림)
    - Source: Alert → Target: Store
    - Directionality: directed
    - Description: 매장 관련 알림

---

### 5. IoT 및 센서 관계 (IoT & Sensor Relations) - 16개

66. **installed_in** (설치됨)
    - Source: WiFiSensor → Target: Zone
    - Directionality: directed
    - Description: A가 B에 설치됨

67. **installed_in** (설치됨)
    - Source: Beacon → Target: Zone
    - Directionality: directed

68. **installed_in** (설치됨)
    - Source: DoorSensor → Target: Entrance
    - Directionality: directed

69. **installed_in** (설치됨)
    - Source: PeopleCounter → Target: Entrance
    - Directionality: directed

70. **installed_in** (설치됨)
    - Source: TemperatureSensor → Target: Zone
    - Directionality: directed

71. **installed_in** (설치됨)
    - Source: HumiditySensor → Target: Zone
    - Directionality: directed

72. **installed_in** (설치됨)
    - Source: LightingSensor → Target: Zone
    - Directionality: directed

73. **tracked_by** (추적됨)
    - Source: Customer → Target: WiFiSensor
    - Directionality: directed
    - Description: A가 B에 의해 추적됨

74. **detected_by** (감지됨)
    - Source: Customer → Target: Beacon
    - Directionality: directed
    - Description: A가 B에 의해 감지됨

75. **counted_by** (계수됨)
    - Source: Visit → Target: PeopleCounter
    - Directionality: directed
    - Description: A가 B에 의해 계수됨

76. **recorded_by** (기록됨)
    - Source: Visit → Target: Camera
    - Directionality: directed
    - Description: A가 B에 의해 기록됨

77. **climate_controls** (온도제어)
    - Source: HVAC → Target: Zone
    - Directionality: directed
    - Description: A가 B의 온도를 제어함

78. **illuminates** (조명함)
    - Source: LightingSensor → Target: Zone
    - Directionality: directed
    - Description: A가 B를 조명함

79. **plays_in** (재생함)
    - Source: AudioSystem → Target: Zone
    - Directionality: directed
    - Description: A가 B에서 재생함

80. **sensor_alert** (센서 알림)
    - Source: Alert → Target: TemperatureSensor
    - Directionality: directed
    - Description: 센서 관련 알림

81. **network_connected** (네트워크 연결)
    - Source: WiFiSensor → Target: WiFiSensor
    - Directionality: undirected
    - Description: A가 B와 네트워크 연결됨

---

### 6. AI 및 분석 관계 (AI & Analytics Relations) - 8개

82. **forecast_for_zone** (구역 수요 예측)
    - Source: DemandForecast → Target: Zone
    - Directionality: directed
    - Description: A가 B의 수요를 예측함

83. **optimizes_price_for** (가격 최적화 대상)
    - Source: PriceOptimization → Target: Product
    - Directionality: directed
    - Description: A가 B의 가격을 최적화함

84. **based_on_demand** (수요 기반)
    - Source: PriceOptimization → Target: DemandForecast
    - Directionality: directed
    - Description: 수요 예측 기반 가격 결정

85. **influenced_by_competitor** (경쟁사 영향)
    - Source: PriceOptimization → Target: Product
    - Directionality: directed
    - Description: 경쟁사 가격 영향 반영

86. **wtp_influences_price** (WTP 가격 영향)
    - Source: CustomerWTP → Target: PriceOptimization
    - Directionality: directed
    - Description: 지불의향가격이 최적화에 영향

87. **promotion_drives_forecast** (프로모션 수요 증가)
    - Source: Promotion → Target: DemandForecast
    - Directionality: directed
    - Description: 프로모션이 수요 예측에 영향

88. **seasonality_affects** (계절성 영향)
    - Source: DemandForecast → Target: Inventory
    - Directionality: directed
    - Description: 계절성이 재고에 영향

89. **stock_optimization** (재고 최적화)
    - Source: DemandForecast → Target: Inventory
    - Directionality: directed
    - Description: 수요 예측 기반 재고 최적화

---

## 엔티티별 속성 상세

### 주요 속성 타입 설명

- **string**: 문자열 데이터
- **number**: 숫자 데이터 (정수/실수)
- **boolean**: 참/거짓 값
- **array**: 배열 (목록)
- **required**: 필수 입력 항목
- **optional**: 선택 입력 항목

### 3D 모델 관련 필드

모든 물리적 엔티티는 다음 3D 관련 필드를 가질 수 있습니다:

- **model_3d_url**: GLB 모델 파일 경로
- **model_3d_type**: 모델 유형 (building/zone/furniture/device/product)
- **model_3d_dimensions**: 기본 크기 { width, height, depth } (미터 단위)
- **model_3d_metadata**: 추가 메타데이터 (JSON)

개별 엔티티 인스턴스는 다음을 추가로 가집니다:

- **model_3d_position**: 3D 공간 좌표 { x, y, z }
- **model_3d_rotation**: 회전각 { x, y, z } (도 단위)
- **model_3d_scale**: 크기 배율 { x, y, z }

---

## 데이터 생성 가이드라인

### 1. 필수 데이터 연결

- **Store** → **Zone** → **Shelf/Rack/DisplayTable** → **Product**
- **Customer** → **Visit** → **Zone** → **Sale**
- **WiFiSensor** → **Zone** (위치 추적)
- **Staff** → **Shift** → **Task**

### 2. 최소 데이터량 권장

- **Stores**: 3개 이상
- **Zones**: 매장당 8-15개
- **Products**: 50-100개
- **Customers**: 200-500명
- **Visits**: 2000-5000건
- **Sales**: 1000-2000건
- **WiFi Sensors**: 매장당 8-12개
- **Staff**: 매장당 5-10명

### 3. 관계 데이터 생성 시 주의사항

- Source와 Target 엔티티가 반드시 존재해야 함
- Directionality에 따라 단방향/양방향 관계 생성
- 관계의 Properties에 추가 정보 저장 가능 (예: weight, timestamp)

---

## 사용 예시

### 예시 1: 매장 공간 구조 생성

```
Store "강남점"
├── Zone "입구" (Entrance)
├── Zone "여성의류"
│   ├── Shelf "S001" → Product "원피스"
│   ├── Rack "R001" → Product "코트"
│   └── DisplayTable "T001" → Product "액세서리"
├── Zone "남성의류"
├── Zone "계산대" (CheckoutCounter)
└── Zone "창고" (StorageRoom)
```

### 예시 2: 고객 여정 추적

```
Customer "C001"
→ Visit "V001"
  → visited_zone: Zone "입구"
  → visited_zone: Zone "여성의류"
  → dwelled_in: Zone "여성의류" (15분)
  → used_fitting_room: FittingRoom "F01"
  → Sale "S001"
    → purchased: Product "원피스"
    → checked_out_at: CheckoutCounter "C01"
```

### 예시 3: IoT 센서 배치

```
Zone "여성의류"
├── WiFiSensor "WS01" (천장 중앙)
├── Beacon "B01" (입구)
├── Camera "CAM01" (코너)
├── TemperatureSensor "TS01"
└── LightingSensor "LS01"
```

---

## 버전 정보

- **Version**: 1.0
- **Last Updated**: 2025-11-21
- **Total Entity Types**: 43
- **Total Relation Types**: 89
- **Compatible with**: NEURALTWIN v3.0+

---

## 참고 문서

- `GPT_DATASET_GENERATION_GUIDE.md`: 데이터셋 생성 가이드
- `WIFI_TRACKING_CSV_GUIDE.md`: WiFi 추적 데이터 명세
- `3D_MODEL_FILENAME_SPECIFICATION.md`: 3D 모델 파일 명명 규칙
- `ONTOLOGY_IMPLEMENTATION_GUIDE.md`: 온톨로지 구현 가이드
