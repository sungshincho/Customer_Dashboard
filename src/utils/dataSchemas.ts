// 표준 데이터 스키마 정의

export interface DataSchema {
  type: string;
  columns: ColumnSchema[];
  relations?: string[];
}

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  examples?: string[];
}

// 판매/거래 데이터 표준 스키마
export const SALES_SCHEMA: DataSchema = {
  type: 'sales',
  columns: [
    { name: 'transaction_id', type: 'string', required: false, description: '거래 고유 ID 주문번호 order', examples: ['주문번호', 'order_id', 'transaction', 'id'] },
    { name: 'timestamp', type: 'date', required: false, description: '거래 시간 기간 날짜 date', examples: ['기간', '날짜', 'date', 'time', '주문시각', 'timestamp'] },
    { name: 'product_name', type: 'string', required: true, description: '상품명 제품명 품목 product', examples: ['상품명', 'product', 'item', '품목', '제품'] },
    { name: 'product_category', type: 'string', required: false, description: '상품 카테고리 분류 category', examples: ['카테고리', 'category', '분류'] },
    { name: 'price', type: 'number', required: true, description: '판매 가격 단가 상품가격 price', examples: ['가격', 'price', '단가', '상품가격', '금액'] },
    { name: 'quantity', type: 'number', required: true, description: '판매 수량 건수 quantity count', examples: ['수량', 'quantity', '판매건수', 'count', '건수'] },
    { name: 'total_amount', type: 'number', required: false, description: '총 금액 실판매금액 total amount', examples: ['총금액', 'total', '실판매금액', 'amount', '판매금액', '실판매'] },
    { name: 'discount', type: 'number', required: false, description: '할인 금액 할인액 discount', examples: ['할인', 'discount', '할인금액', '할인액'] },
    { name: 'tax', type: 'number', required: false, description: '부가세 세금 tax', examples: ['부가세', 'tax', '세금', '부가세액'] },
    { name: 'customer_id', type: 'string', required: false, description: '고객 ID customer', examples: ['고객', 'customer', '회원'] },
    { name: 'payment_method', type: 'string', required: false, description: '결제 수단 payment', examples: ['결제', 'payment', '결제수단'] },
  ],
  relations: ['customer', 'product']
};

// Zone 위치 데이터 표준 스키마
export const ZONE_SCHEMA: DataSchema = {
  type: 'zone',
  columns: [
    { name: 'zone_id', type: 'string', required: true, description: 'Zone 고유 ID' },
    { name: 'zone_name', type: 'string', required: true, description: 'Zone 이름' },
    { name: 'x', type: 'number', required: true, description: 'X 좌표' },
    { name: 'y', type: 'number', required: true, description: 'Y 좌표' },
    { name: 'z', type: 'number', required: false, description: 'Z 좌표 (높이)' },
    { name: 'type', type: 'string', required: false, description: 'Zone 타입 (입구, 진열대, 계산대 등)' },
    { name: 'area', type: 'number', required: false, description: '면적 (sqm)' },
  ],
  relations: ['traffic', 'product']
};

// 고객 동선 데이터 표준 스키마
export const TRAFFIC_SCHEMA: DataSchema = {
  type: 'traffic',
  columns: [
    { name: 'person_id', type: 'string', required: true, description: '고객/방문자 ID' },
    { name: 'zones', type: 'array', required: true, description: '방문한 Zone 순서 배열' },
    { name: 'timestamp_start', type: 'date', required: true, description: '동선 시작 시간' },
    { name: 'timestamp_end', type: 'date', required: true, description: '동선 종료 시간' },
    { name: 'dwell_times', type: 'array', required: false, description: '각 Zone 체류 시간 배열 (초)' },
  ],
  relations: ['zone', 'customer']
};

// 상품 데이터 표준 스키마
export const PRODUCT_SCHEMA: DataSchema = {
  type: 'product',
  columns: [
    { name: 'product_id', type: 'string', required: true, description: '상품 고유 ID' },
    { name: 'product_name', type: 'string', required: true, description: '상품명' },
    { name: 'category', type: 'string', required: true, description: '카테고리' },
    { name: 'brand', type: 'string', required: false, description: '브랜드' },
    { name: 'price', type: 'number', required: true, description: '판매 가격' },
    { name: 'cost', type: 'number', required: false, description: '원가' },
    { name: 'sku', type: 'string', required: false, description: 'SKU 코드' },
  ],
  relations: ['sales', 'inventory']
};

// 고객 데이터 표준 스키마
export const CUSTOMER_SCHEMA: DataSchema = {
  type: 'customer',
  columns: [
    { name: 'customer_id', type: 'string', required: true, description: '고객 고유 ID' },
    { name: 'segment', type: 'string', required: false, description: '고객 세그먼트' },
    { name: 'join_date', type: 'date', required: false, description: '가입일' },
    { name: 'total_purchases', type: 'number', required: false, description: '총 구매 횟수' },
    { name: 'lifetime_value', type: 'number', required: false, description: '생애 가치 (LTV)' },
  ],
  relations: ['sales', 'traffic']
};

// 재고 데이터 표준 스키마
export const INVENTORY_SCHEMA: DataSchema = {
  type: 'inventory',
  columns: [
    { name: 'product_id', type: 'string', required: true, description: '상품 ID' },
    { name: 'timestamp', type: 'date', required: true, description: '재고 기록 시간' },
    { name: 'stock_level', type: 'number', required: true, description: '재고 수량' },
    { name: 'reorder_point', type: 'number', required: false, description: '재주문 포인트' },
    { name: 'warehouse_location', type: 'string', required: false, description: '창고 위치' },
  ],
  relations: ['product']
};

export const SCHEMA_MAP: Record<string, DataSchema> = {
  sales: SALES_SCHEMA,
  zone: ZONE_SCHEMA,
  traffic: TRAFFIC_SCHEMA,
  product: PRODUCT_SCHEMA,
  customer: CUSTOMER_SCHEMA,
  inventory: INVENTORY_SCHEMA,
};
