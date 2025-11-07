// 엔터프라이즈급 데이터 스키마 정의
// 공통 규약: UTC TIMESTAMP, PII 해시, SCD2, 품질 체크

export type ColumnType = 'string' | 'number' | 'date' | 'boolean' | 'json' | 'array' | 'enum' | 'geography';

export interface EnterpriseColumnSchema {
  name: string;
  type: ColumnType;
  required: boolean;
  description: string;
  examples?: string[];
  enum?: string[]; // ENUM 타입인 경우 가능한 값들
  constraints?: string[]; // 예: 'NOT NULL', 'UNIQUE', '>=0'
  isPII?: boolean; // 개인정보 여부
  isKey?: boolean; // 키 컬럼 여부
}

export interface EnterpriseDataSchema {
  type: string;
  category: 'fact' | 'dimension' | 'bridge';
  grain: string; // 그레인 설명
  columns: EnterpriseColumnSchema[];
  relations?: string[];
  partitionBy?: string; // 파티션 컬럼
  qualityChecks?: string[]; // 품질 체크 규칙
}

// 1) 센서(동선) 데이터 스키마
export const SENSOR_FACT_SCHEMA: EnterpriseDataSchema = {
  type: 'traffic_sensor',
  category: 'fact',
  grain: '한 센서 이벤트 1건',
  partitionBy: 'event_date',
  columns: [
    { name: 'event_id', type: 'string', required: true, description: '이벤트 고유 ID (ULID)', isKey: true, examples: ['event_id', 'id', 'event'] },
    { name: 'event_ts', type: 'date', required: true, description: '이벤트 타임스탬프 (UTC)', examples: ['event_ts', 'timestamp', 'ts', 'datetime', '시간'] },
    { name: 'event_date', type: 'date', required: true, description: '이벤트 날짜 (파티션)', examples: ['event_date', 'date', '날짜'] },
    { name: 'device_id', type: 'string', required: true, description: '센서/디바이스 ID', isKey: true, examples: ['device_id', 'sensor_id', 'beacon_id', '센서ID'] },
    { name: 'store_id', type: 'string', required: true, description: '매장 ID', isKey: true, examples: ['store_id', 'shop_id', '매장ID', '지점코드'] },
    { name: 'zone_id', type: 'string', required: false, description: '존/구역 ID', isKey: true, examples: ['zone_id', 'area_id', '구역ID', 'zone'] },
    { name: 'sensor_type', type: 'enum', required: true, description: '센서 타입', enum: ['camera', 'ble', 'wifi', 'people_counter', 'rfid', 'pos_gateway', 'temp', 'energy'], examples: ['sensor_type', 'type', '센서타입'] },
    { name: 'metric_type', type: 'enum', required: true, description: '측정 지표 타입', enum: ['enter', 'exit', 'dwell', 'path', 'temperature', 'energy_kwh', 'rfid_read'], examples: ['metric_type', 'event_type', '이벤트타입'] },
    { name: 'metric_value', type: 'number', required: true, description: '측정 값 (초, 온도, kwh 등)', constraints: ['>=0'], examples: ['metric_value', 'value', 'duration', '체류시간', 'dwell_time'] },
    { name: 'customer_id', type: 'string', required: false, description: '고객 ID (익명 추적 가능 시)', isPII: true, examples: ['customer_id', 'user_id', '고객ID'] },
    { name: 'session_id', type: 'string', required: false, description: '방문 세션 ID', examples: ['session_id', 'visit_id', '세션ID'] },
    { name: 'raw_payload', type: 'json', required: false, description: '원본 센서 데이터', examples: ['raw_payload', 'raw_data', 'payload'] },
  ],
  relations: ['dim_device', 'dim_zone', 'dim_store', 'dim_customer'],
  qualityChecks: ['metric_value >= 0', 'store_id FK valid', 'event_id unique']
};

// 2) 고객(회원정보) 데이터 스키마
export const CUSTOMER_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'customer',
  category: 'dimension',
  grain: '고객 1명 (SCD2)',
  columns: [
    { name: 'customer_id', type: 'string', required: true, description: '고객 ID (가명/해시)', isKey: true, isPII: true, examples: ['customer_id', 'user_id', 'member_id', '고객ID', '회원번호'] },
    { name: 'first_seen_ts', type: 'date', required: false, description: '최초 확인 시각', examples: ['first_seen_ts', 'created_at', 'join_date', '가입일'] },
    { name: 'loyalty_tier', type: 'enum', required: false, description: '로열티 등급', enum: ['none', 'silver', 'gold', 'vip'], examples: ['loyalty_tier', 'tier', 'grade', '등급'] },
    { name: 'gender', type: 'string', required: false, description: '성별', examples: ['gender', 'sex', '성별'] },
    { name: 'birth_year', type: 'number', required: false, description: '출생년도', examples: ['birth_year', 'year_of_birth', '생년', '출생년도'] },
    { name: 'home_region', type: 'string', required: false, description: '거주 지역', examples: ['home_region', 'region', 'location', '지역', '거주지'] },
    { name: 'consent_marketing', type: 'boolean', required: false, description: '마케팅 동의 여부', examples: ['consent_marketing', 'marketing_consent', '마케팅동의'] },
    { name: 'consent_personalization', type: 'boolean', required: false, description: '개인화 동의 여부', examples: ['consent_personalization', 'personalization_consent', '개인화동의'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드 여부', examples: ['is_current', 'current'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date'] },
  ],
  relations: ['fact_sales_line', 'fact_customer_events', 'fact_loyalty_points'],
  qualityChecks: ['customer_id not null', 'is_current bool', 'valid_from <= valid_to']
};

// 3) 브랜드 데이터 스키마
export const BRAND_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'brand',
  category: 'dimension',
  grain: '브랜드 1개 (SCD2)',
  columns: [
    { name: 'brand_id', type: 'string', required: true, description: '브랜드 ID', isKey: true, examples: ['brand_id', 'id', '브랜드코드', '브랜드ID'] },
    { name: 'brand_name', type: 'string', required: true, description: '브랜드명', examples: ['brand_name', 'name', '브랜드명', '브랜드'] },
    { name: 'parent_company', type: 'string', required: false, description: '모회사', examples: ['parent_company', 'company', '모회사', '회사'] },
    { name: 'category', type: 'enum', required: false, description: '브랜드 카테고리', enum: ['fashion', 'beauty', 'f&b', 'electronics', 'etc'], examples: ['category', 'type', '카테고리', '분류'] },
    { name: 'country', type: 'string', required: false, description: '원산지 국가', examples: ['country', 'origin', '국가', '원산지'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date'] },
  ],
  relations: ['dim_product', 'dim_store', 'fact_brand_campaign'],
  qualityChecks: ['brand_id unique', 'brand_name not null']
};

// 4) 제품 데이터 스키마
export const PRODUCT_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'product',
  category: 'dimension',
  grain: '제품 1개 (SCD2)',
  columns: [
    { name: 'product_id', type: 'string', required: true, description: '제품 ID', isKey: true, examples: ['product_id', 'id', '상품코드', '제품코드'] },
    { name: 'brand_id', type: 'string', required: false, description: '브랜드 ID', isKey: true, examples: ['brand_id', '브랜드ID', '브랜드코드'] },
    { name: 'product_name', type: 'string', required: true, description: '제품명', examples: ['product_name', 'name', '상품명', '제품명'] },
    { name: 'category_lvl1', type: 'string', required: false, description: '카테고리 레벨1', examples: ['category_lvl1', 'category', '대분류'] },
    { name: 'category_lvl2', type: 'string', required: false, description: '카테고리 레벨2', examples: ['category_lvl2', 'subcategory', '중분류'] },
    { name: 'category_lvl3', type: 'string', required: false, description: '카테고리 레벨3', examples: ['category_lvl3', '소분류'] },
    { name: 'season', type: 'string', required: false, description: '시즌', examples: ['season', '시즌'] },
    { name: 'style_code', type: 'string', required: false, description: '스타일 코드', examples: ['style_code', 'style', '스타일코드'] },
    { name: 'base_price', type: 'number', required: false, description: '기본 가격', constraints: ['>=0'], examples: ['base_price', 'price', '가격', '정가'] },
    { name: 'status', type: 'enum', required: false, description: '제품 상태', enum: ['active', 'discontinued'], examples: ['status', 'state', '상태'] },
    { name: 'attributes', type: 'json', required: false, description: '추가 속성 (JSON)', examples: ['attributes', 'properties', '속성'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date'] },
  ],
  relations: ['dim_brand', 'dim_sku', 'fact_sales_line'],
  qualityChecks: ['product_id unique', 'product_name not null', 'base_price >= 0']
};

export const SKU_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'product',
  category: 'dimension',
  grain: 'SKU 1개 (SCD2)',
  columns: [
    { name: 'sku_id', type: 'string', required: true, description: 'SKU ID', isKey: true, examples: ['sku_id', 'sku', 'barcode', 'SKU코드'] },
    { name: 'product_id', type: 'string', required: true, description: '제품 ID', isKey: true, examples: ['product_id', '상품코드', '제품코드'] },
    { name: 'color', type: 'string', required: false, description: '색상', examples: ['color', 'colour', '색상', '컬러'] },
    { name: 'size', type: 'string', required: false, description: '사이즈', examples: ['size', '사이즈', '크기'] },
    { name: 'barcode', type: 'string', required: false, description: '바코드', examples: ['barcode', 'ean', 'upc', '바코드'] },
    { name: 'variant_attrs', type: 'json', required: false, description: '변형 속성 (JSON)', examples: ['variant_attrs', 'attributes', '속성'] },
    { name: 'current_price', type: 'number', required: false, description: '현재 판매가', constraints: ['>=0'], examples: ['current_price', 'price', '판매가', '가격'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date'] },
  ],
  relations: ['dim_product', 'fact_sales_line', 'fact_inventory_daily'],
  qualityChecks: ['sku_id unique', 'product_id FK valid', 'current_price >= 0']
};

// 5) 매장 데이터 스키마
export const STORE_DIM_SCHEMA: EnterpriseDataSchema = {
  type: 'store',
  category: 'dimension',
  grain: '매장 1개 (SCD2)',
  columns: [
    { name: 'store_id', type: 'string', required: true, description: '매장 ID', isKey: true, examples: ['store_id', 'shop_id', '매장코드', '지점코드'] },
    { name: 'store_name', type: 'string', required: true, description: '매장명', examples: ['store_name', 'name', '매장명', '지점명'] },
    { name: 'brand_id', type: 'string', required: false, description: '브랜드 ID', isKey: true, examples: ['brand_id', '브랜드ID', '브랜드코드'] },
    { name: 'store_type', type: 'enum', required: false, description: '매장 유형', enum: ['flagship', 'mall', 'street', 'outlet', 'pop-up'], examples: ['store_type', 'type', '매장타입', '유형'] },
    { name: 'address', type: 'string', required: false, description: '주소', examples: ['address', 'location', '주소', '위치'] },
    { name: 'city', type: 'string', required: false, description: '도시', examples: ['city', '도시', '시'] },
    { name: 'region', type: 'string', required: false, description: '지역', examples: ['region', 'state', '지역', '도'] },
    { name: 'country', type: 'string', required: false, description: '국가', examples: ['country', '국가'] },
    { name: 'timezone', type: 'string', required: false, description: '타임존', examples: ['timezone', 'tz', '타임존'] },
    { name: 'floor_area_sqm', type: 'number', required: false, description: '매장 면적 (sqm)', constraints: ['>=0'], examples: ['floor_area_sqm', 'area', '면적', '평수'] },
    { name: 'opening_hours', type: 'json', required: false, description: '영업시간 (JSON)', examples: ['opening_hours', 'hours', '영업시간'] },
    { name: 'lat', type: 'number', required: false, description: '위도', examples: ['lat', 'latitude', '위도'] },
    { name: 'lng', type: 'number', required: false, description: '경도', examples: ['lng', 'longitude', '경도'] },
    { name: 'is_current', type: 'boolean', required: true, description: 'SCD2: 현재 레코드', examples: ['is_current', 'current'] },
    { name: 'valid_from', type: 'date', required: true, description: 'SCD2: 유효 시작일', examples: ['valid_from', 'start_date', 'open_date'] },
    { name: 'valid_to', type: 'date', required: false, description: 'SCD2: 유효 종료일', examples: ['valid_to', 'end_date', 'close_date'] },
  ],
  relations: ['dim_brand', 'fact_sales_line', 'fact_store_traffic', 'dim_zone'],
  qualityChecks: ['store_id unique', 'store_name not null', 'floor_area_sqm >= 0']
};

// 6) 매출 데이터 스키마
export const SALES_FACT_SCHEMA: EnterpriseDataSchema = {
  type: 'sales',
  category: 'fact',
  grain: '거래 라인 1건',
  partitionBy: 'event_date',
  columns: [
    { name: 'transaction_id', type: 'string', required: true, description: '거래 ID', isKey: true, examples: ['transaction_id', 'order_id', 'txn_id', '거래번호', '주문번호'] },
    { name: 'line_id', type: 'number', required: false, description: '라인 번호', examples: ['line_id', 'line_number', '라인번호'] },
    { name: 'event_ts', type: 'date', required: true, description: '거래 시각 (UTC)', examples: ['event_ts', 'timestamp', 'datetime', '거래시각', '주문시각'] },
    { name: 'event_date', type: 'date', required: true, description: '거래 날짜 (파티션)', examples: ['event_date', 'date', '날짜', '거래일자'] },
    { name: 'store_id', type: 'string', required: true, description: '매장 ID', isKey: true, examples: ['store_id', 'shop_id', '매장코드', '지점코드'] },
    { name: 'register_id', type: 'string', required: false, description: '계산대 ID', examples: ['register_id', 'pos_id', '계산대', 'POS번호'] },
    { name: 'cashier_id', type: 'string', required: false, description: '계산원 ID', examples: ['cashier_id', 'staff_id', '직원ID', '계산원'] },
    { name: 'customer_id', type: 'string', required: false, description: '고객 ID', isPII: true, isKey: true, examples: ['customer_id', 'user_id', 'member_id', '고객ID', '회원번호'] },
    { name: 'visit_id', type: 'string', required: false, description: '방문 ID', examples: ['visit_id', 'session_id', '방문ID', '세션'] },
    { name: 'channel', type: 'enum', required: false, description: '판매 채널', enum: ['store', 'web', 'app', 'pos_order_ahead'], examples: ['channel', 'sales_channel', '채널'] },
    { name: 'sku_id', type: 'string', required: true, description: 'SKU ID', isKey: true, examples: ['sku_id', 'product_id', 'sku', '상품코드', 'SKU코드'] },
    { name: 'qty', type: 'number', required: true, description: '수량', constraints: ['>0'], examples: ['qty', 'quantity', '수량', '판매수량'] },
    { name: 'unit_price', type: 'number', required: true, description: '단가', constraints: ['>=0'], examples: ['unit_price', 'price', '단가', '가격'] },
    { name: 'line_discount', type: 'number', required: false, description: '라인 할인액', constraints: ['>=0'], examples: ['line_discount', 'discount', '할인', '할인금액'] },
    { name: 'line_tax', type: 'number', required: false, description: '라인 세금', constraints: ['>=0'], examples: ['line_tax', 'tax', '세금', '부가세'] },
    { name: 'net_revenue', type: 'number', required: true, description: '순매출 (qty*unit_price - discount + tax)', constraints: ['>=0'], examples: ['net_revenue', 'revenue', 'total', '순매출', '실판매금액'] },
    { name: 'payment_method', type: 'enum', required: false, description: '결제 수단', enum: ['cash', 'card', 'mobile', 'mixed'], examples: ['payment_method', 'payment', '결제수단', '결제방법'] },
    { name: 'coupon_id', type: 'string', required: false, description: '쿠폰 ID', examples: ['coupon_id', '쿠폰ID', '쿠폰번호'] },
    { name: 'promo_id', type: 'string', required: false, description: '프로모션 ID', examples: ['promo_id', 'promotion_id', '프로모션ID'] },
  ],
  relations: ['dim_store', 'dim_sku', 'dim_customer', 'dim_calendar'],
  qualityChecks: [
    'qty > 0',
    'unit_price >= 0',
    'net_revenue = qty * unit_price - line_discount + line_tax',
    'store_id FK valid',
    'sku_id FK valid'
  ]
};

// 스키마 맵
export const ENTERPRISE_SCHEMA_MAP: Record<string, EnterpriseDataSchema> = {
  traffic_sensor: SENSOR_FACT_SCHEMA,
  customer: CUSTOMER_DIM_SCHEMA,
  brand: BRAND_DIM_SCHEMA,
  product: PRODUCT_DIM_SCHEMA,
  sku: SKU_DIM_SCHEMA,
  store: STORE_DIM_SCHEMA,
  sales: SALES_FACT_SCHEMA,
};

// 공통 키 컬럼 목록 (조인 최적화용)
export const COMMON_KEY_COLUMNS = [
  'customer_id',
  'store_id',
  'brand_id',
  'product_id',
  'sku_id',
  'transaction_id',
  'event_id',
  'visit_id',
  'device_id',
  'zone_id'
];

// SCD2 필수 컬럼
export const SCD2_COLUMNS = ['is_current', 'valid_from', 'valid_to'];

// 파티션 컬럼 후보
export const PARTITION_COLUMNS = ['event_date', 'calendar_date', 'transaction_date'];
