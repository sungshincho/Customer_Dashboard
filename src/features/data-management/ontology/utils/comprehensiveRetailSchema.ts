import { supabase } from "@/integrations/supabase/client";

/**
 * 최적화된 리테일 온톨로지 스키마 v4.0
 * 43개 엔티티 (CRITICAL: 17, HIGH: 12, MEDIUM: 9, LOW: 5)
 * 83개 관계 (CRITICAL: 25, HIGH: 20, MEDIUM: 15, LOW: 10, ADDITIONAL: 13)
 */

export const COMPREHENSIVE_ENTITY_TYPES = [
  // ==========================================
  // 🔴 CRITICAL (필수) - 17개
  // ==========================================

  // 1. 조직/매장 (2개)
  {
    name: "Organization",
    label: "조직",
    description: "리테일 조직 (본사/프랜차이즈)",
    icon: "Building2",
    color: "#3b82f6",
    model_3d_type: null,
    properties: [
      { name: "org_id", type: "string", required: true, description: "조직 ID" },
      { name: "org_name", type: "string", required: true, description: "조직명" },
      { name: "org_type", type: "string", required: false, description: "조직 유형 (retail/franchise/enterprise)" },
      { name: "industry", type: "string", required: false, description: "업종" },
      { name: "country", type: "string", required: false, description: "국가" },
      { name: "created_at", type: "string", required: false, description: "생성일" },
    ],
  },
  {
    name: "Store",
    label: "매장",
    description: "물리적 리테일 매장",
    icon: "Store",
    color: "#10b981",
    model_3d_type: "building",
    model_3d_dimensions: { width: 20, height: 4, depth: 15 },
    properties: [
      { name: "store_code", type: "string", required: true, description: "매장 코드" },
      { name: "store_name", type: "string", required: true, description: "매장명" },
      { name: "address", type: "string", required: true, description: "주소" },
      { name: "area_sqm", type: "number", required: true, description: "면적 (제곱미터)" },
      { name: "opening_date", type: "string", required: false, description: "오픈일" },
      { name: "store_format", type: "string", required: false, description: "매장 포맷 (flagship/standard/compact)" },
      { name: "region", type: "string", required: false, description: "지역" },
      { name: "district", type: "string", required: false, description: "구역" },
      { name: "manager_name", type: "string", required: false, description: "매니저명" },
      { name: "org_id", type: "string", required: true, description: "조직 ID" },
    ],
  },

  // 2. 공간 구조 (3개)
  {
    name: "Zone",
    label: "구역",
    description: "매장 내 특정 기능 영역",
    icon: "BoxSelect",
    color: "#8b5cf6",
    model_3d_type: "zone",
    model_3d_dimensions: { width: 5, height: 3, depth: 5 },
    properties: [
      { name: "zone_id", type: "string", required: true, description: "구역 ID" },
      {
        name: "zone_type",
        type: "string",
        required: true,
        description: "구역 유형 (entrance/product_display/checkout/storage/staff/fitting/rest)",
      },
      { name: "zone_name", type: "string", required: true, description: "구역명" },
      { name: "area_sqm", type: "number", required: false, description: "면적 (제곱미터)" },
      { name: "purpose", type: "string", required: false, description: "목적" },
      { name: "traffic_level", type: "string", required: false, description: "트래픽 레벨 (high/medium/low)" },
    ],
  },
  {
    name: "Entrance",
    label: "출입구",
    description: "매장 출입구",
    icon: "DoorOpen",
    color: "#f59e0b",
    model_3d_type: "structure",
    model_3d_dimensions: { width: 2, height: 2.5, depth: 0.1 },
    properties: [
      { name: "entrance_id", type: "string", required: true, description: "출입구 ID" },
      { name: "entrance_type", type: "string", required: false, description: "유형 (main/side/emergency)" },
      { name: "width_m", type: "number", required: false, description: "너비 (미터)" },
      { name: "is_primary", type: "boolean", required: false, description: "메인 출입구 여부" },
    ],
  },
  {
    name: "CheckoutCounter",
    label: "계산대",
    description: "고객 결제 처리 계산대",
    icon: "CreditCard",
    color: "#ef4444",
    model_3d_type: "furniture",
    model_3d_dimensions: { width: 1.5, height: 1, depth: 0.8 },
    properties: [
      { name: "counter_id", type: "string", required: true, description: "계산대 ID" },
      { name: "counter_number", type: "number", required: true, description: "계산대 번호" },
      { name: "has_pos_terminal", type: "boolean", required: false, description: "POS 단말기 보유" },
      { name: "supports_mobile_payment", type: "boolean", required: false, description: "모바일 결제 지원" },
      { name: "is_express_lane", type: "boolean", required: false, description: "익스프레스 레인" },
    ],
  },

  // 3. 제품 관련 (5개)
  {
    name: "Category",
    label: "카테고리",
    description: "제품 카테고리",
    icon: "FolderTree",
    color: "#06b6d4",
    model_3d_type: null,
    properties: [
      { name: "category_id", type: "string", required: true, description: "카테고리 ID" },
      { name: "category_name", type: "string", required: true, description: "카테고리명" },
      { name: "parent_category_id", type: "string", required: false, description: "상위 카테고리" },
      { name: "category_level", type: "number", required: false, description: "계층 레벨 (1/2/3)" },
      { name: "display_order", type: "number", required: false, description: "표시 순서" },
    ],
  },
  {
    name: "Product",
    label: "제품",
    description: "판매 제품",
    icon: "Package",
    color: "#f97316",
    model_3d_type: "product",
    model_3d_dimensions: { width: 0.1, height: 0.2, depth: 0.1 },
    properties: [
      { name: "sku", type: "string", required: true, description: "SKU" },
      { name: "product_name", type: "string", required: true, description: "제품명" },
      { name: "category_id", type: "string", required: true, description: "카테고리 ID" },
      { name: "brand", type: "string", required: false, description: "브랜드" },
      { name: "selling_price", type: "number", required: true, description: "판매가" },
      { name: "cost_price", type: "number", required: false, description: "원가" },
      { name: "supplier", type: "string", required: false, description: "공급업체" },
      { name: "lead_time_days", type: "number", required: false, description: "리드타임 (일)" },
    ],
  },
  {
    name: "Inventory",
    label: "재고",
    description: "제품 재고",
    icon: "Archive",
    color: "#78716c",
    model_3d_type: null,
    properties: [
      { name: "inventory_id", type: "string", required: true, description: "재고 ID" },
      { name: "product_id", type: "string", required: true, description: "제품 ID" },
      { name: "store_id", type: "string", required: true, description: "매장 ID" },
      { name: "current_stock", type: "number", required: true, description: "현재 재고" },
      { name: "minimum_stock", type: "number", required: true, description: "최소 재고" },
      { name: "optimal_stock", type: "number", required: true, description: "최적 재고" },
      { name: "weekly_demand", type: "number", required: false, description: "주간 수요" },
      { name: "last_updated", type: "string", required: false, description: "최종 업데이트" },
    ],
  },
  {
    name: "Brand",
    label: "브랜드",
    description: "제품 브랜드",
    icon: "Award",
    color: "#a855f7",
    model_3d_type: null,
    properties: [
      { name: "brand_id", type: "string", required: true, description: "브랜드 ID" },
      { name: "brand_name", type: "string", required: true, description: "브랜드명" },
      {
        name: "brand_tier",
        type: "string",
        required: false,
        description: "브랜드 등급 (luxury/premium/standard/value)",
      },
      { name: "origin_country", type: "string", required: false, description: "원산지" },
    ],
  },
  {
    name: "Promotion",
    label: "프로모션",
    description: "마케팅 프로모션",
    icon: "Tag",
    color: "#ec4899",
    model_3d_type: null,
    properties: [
      { name: "promotion_id", type: "string", required: true, description: "프로모션 ID" },
      { name: "promotion_name", type: "string", required: true, description: "프로모션명" },
      { name: "promotion_type", type: "string", required: false, description: "유형 (discount/bogo/bundle/seasonal)" },
      { name: "start_date", type: "string", required: true, description: "시작일" },
      { name: "end_date", type: "string", required: true, description: "종료일" },
      { name: "discount_rate", type: "number", required: false, description: "할인율" },
      { name: "target_products", type: "array", required: false, description: "대상 제품 목록" },
      { name: "target_zones", type: "array", required: false, description: "대상 구역 목록" },
    ],
  },

  // 4. 고객/거래 (4개)
  {
    name: "Customer",
    label: "고객",
    description: "고객 정보",
    icon: "User",
    color: "#22c55e",
    model_3d_type: null,
    properties: [
      { name: "customer_id", type: "string", required: true, description: "고객 ID" },
      { name: "age_group", type: "string", required: false, description: "연령대 (10s/20s/30s/40s/50s/60s+)" },
      { name: "gender", type: "string", required: false, description: "성별 (male/female/other)" },
      {
        name: "customer_segment",
        type: "string",
        required: false,
        description: "고객 세그먼트 (VIP/regular/new/lapsed)",
      },
      { name: "signup_date", type: "string", required: false, description: "가입일" },
      {
        name: "loyalty_tier",
        type: "string",
        required: false,
        description: "로열티 등급 (platinum/gold/silver/bronze)",
      },
      { name: "total_purchases", type: "number", required: false, description: "누적 구매액" },
      { name: "visit_frequency", type: "string", required: false, description: "방문 빈도 (high/medium/low)" },
    ],
  },
  {
    name: "Visit",
    label: "방문",
    description: "고객 매장 방문",
    icon: "UserCheck",
    color: "#14b8a6",
    model_3d_type: null,
    properties: [
      { name: "visit_id", type: "string", required: true, description: "방문 ID" },
      { name: "customer_id", type: "string", required: true, description: "고객 ID" },
      { name: "store_id", type: "string", required: true, description: "매장 ID" },
      { name: "visit_date", type: "string", required: true, description: "방문일" },
      { name: "visit_time", type: "string", required: true, description: "방문시간" },
      { name: "duration_minutes", type: "number", required: false, description: "체류 시간 (분)" },
      { name: "zones_visited", type: "array", required: false, description: "방문 구역 목록" },
      { name: "did_purchase", type: "boolean", required: false, description: "구매 여부" },
      { name: "entry_point", type: "string", required: false, description: "입구 ID" },
    ],
  },
  {
    name: "Transaction",
    label: "거래",
    description: "판매 거래",
    icon: "Receipt",
    color: "#dc2626",
    model_3d_type: null,
    properties: [
      { name: "transaction_id", type: "string", required: true, description: "거래 ID" },
      { name: "customer_id", type: "string", required: false, description: "고객 ID (비회원 null)" },
      { name: "store_id", type: "string", required: true, description: "매장 ID" },
      { name: "transaction_date", type: "string", required: true, description: "거래일" },
      { name: "transaction_time", type: "string", required: true, description: "거래시간" },
      { name: "total_amount", type: "number", required: true, description: "총 금액" },
      { name: "payment_method", type: "string", required: false, description: "결제 방법 (cash/card/mobile/mixed)" },
      { name: "discount_amount", type: "number", required: false, description: "할인 금액" },
      { name: "num_items", type: "number", required: false, description: "구매 품목 수" },
      { name: "products_purchased", type: "array", required: false, description: "구매 제품 목록" },
      { name: "counter_id", type: "string", required: false, description: "계산대 ID" },
    ],
  },
  {
    name: "Purchase",
    label: "구매",
    description: "개별 제품 구매 라인",
    icon: "ShoppingBag",
    color: "#f59e0b",
    model_3d_type: null,
    properties: [
      { name: "purchase_id", type: "string", required: true, description: "구매 ID" },
      { name: "transaction_id", type: "string", required: true, description: "거래 ID" },
      { name: "product_id", type: "string", required: true, description: "제품 ID" },
      { name: "quantity", type: "number", required: true, description: "수량" },
      { name: "unit_price", type: "number", required: true, description: "단가" },
      { name: "subtotal", type: "number", required: true, description: "소계" },
      { name: "discount_applied", type: "number", required: false, description: "적용 할인" },
    ],
  },

  // 5. 직원/운영 (2개)
  {
    name: "Staff",
    label: "직원",
    description: "매장 직원",
    icon: "Users",
    color: "#6366f1",
    model_3d_type: null,
    properties: [
      { name: "staff_id", type: "string", required: true, description: "직원 ID" },
      { name: "staff_name", type: "string", required: true, description: "직원명" },
      { name: "role", type: "string", required: true, description: "역할 (manager/sales/stockist/security)" },
      { name: "store_id", type: "string", required: true, description: "소속 매장" },
      { name: "hire_date", type: "string", required: false, description: "입사일" },
      {
        name: "employment_type",
        type: "string",
        required: false,
        description: "고용 유형 (full_time/part_time/contract)",
      },
    ],
  },
  {
    name: "Shift",
    label: "근무 시간",
    description: "직원 근무 시간",
    icon: "Clock",
    color: "#84cc16",
    model_3d_type: null,
    properties: [
      { name: "shift_id", type: "string", required: true, description: "근무 ID" },
      { name: "staff_id", type: "string", required: true, description: "직원 ID" },
      { name: "shift_date", type: "string", required: true, description: "근무일" },
      { name: "start_time", type: "string", required: true, description: "시작 시간" },
      { name: "end_time", type: "string", required: true, description: "종료 시간" },
      {
        name: "shift_type",
        type: "string",
        required: false,
        description: "근무 유형 (morning/afternoon/evening/night)",
      },
    ],
  },

  // 6. IoT/센서 (1개)
  {
    name: "WiFiSensor",
    label: "WiFi 센서",
    description: "WiFi 신호 감지 센서",
    icon: "Wifi",
    color: "#7c3aed",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.2, height: 0.15, depth: 0.05 },
    properties: [
      { name: "sensor_id", type: "string", required: true, description: "센서 ID" },
      { name: "zone_id", type: "string", required: true, description: "설치 구역" },
      { name: "mac_address", type: "string", required: false, description: "MAC 주소" },
      { name: "detection_range_m", type: "number", required: false, description: "탐지 범위 (미터)" },
      { name: "status", type: "string", required: false, description: "상태 (active/inactive/maintenance)" },
    ],
  },

  // ==========================================
  // 🟡 HIGH (고우선순위) - 12개
  // ==========================================

  // 7. 외부 컨텍스트 (3개)
  {
    name: "Weather",
    label: "날씨",
    description: "날씨 데이터",
    icon: "Cloud",
    color: "#38bdf8",
    model_3d_type: null,
    properties: [
      { name: "weather_id", type: "string", required: true, description: "날씨 ID" },
      { name: "date", type: "string", required: true, description: "날짜" },
      { name: "store_id", type: "string", required: true, description: "매장 ID" },
      { name: "condition", type: "string", required: false, description: "날씨 상태 (sunny/cloudy/rainy/snowy)" },
      { name: "temperature_c", type: "number", required: false, description: "기온 (섭씨)" },
      { name: "precipitation_mm", type: "number", required: false, description: "강수량 (mm)" },
      { name: "is_extreme", type: "boolean", required: false, description: "극한 날씨 여부" },
    ],
  },
  {
    name: "Holiday",
    label: "공휴일",
    description: "공휴일 및 이벤트",
    icon: "Calendar",
    color: "#fb923c",
    model_3d_type: null,
    properties: [
      { name: "holiday_id", type: "string", required: true, description: "공휴일 ID" },
      { name: "date", type: "string", required: true, description: "날짜" },
      { name: "holiday_name", type: "string", required: true, description: "공휴일명" },
      {
        name: "holiday_type",
        type: "string",
        required: false,
        description: "유형 (national/religious/commercial/regional)",
      },
      { name: "region", type: "string", required: false, description: "지역 (전국/지역)" },
      { name: "impact_level", type: "string", required: false, description: "영향도 (high/medium/low)" },
    ],
  },
  {
    name: "EconomicIndicator",
    label: "경제 지표",
    description: "거시경제 지표",
    icon: "TrendingUp",
    color: "#10b981",
    model_3d_type: null,
    properties: [
      { name: "indicator_id", type: "string", required: true, description: "지표 ID" },
      { name: "date", type: "string", required: true, description: "날짜" },
      {
        name: "indicator_type",
        type: "string",
        required: false,
        description: "지표 유형 (cpi/unemployment/consumer_confidence)",
      },
      { name: "indicator_value", type: "number", required: false, description: "지표 값" },
      { name: "region", type: "string", required: false, description: "지역" },
      { name: "data_source", type: "string", required: false, description: "데이터 출처" },
    ],
  },

  // 8. 공간 구조 (3개)
  {
    name: "Aisle",
    label: "통로",
    description: "고객 이동 통로",
    icon: "MoveHorizontal",
    color: "#22c55e",
    model_3d_type: "zone",
    model_3d_dimensions: { width: 1.5, height: 3, depth: 10 },
    properties: [
      { name: "aisle_code", type: "string", required: true, description: "통로 코드" },
      { name: "aisle_type", type: "string", required: false, description: "통로 유형 (main/secondary/crossover)" },
      { name: "width_m", type: "number", required: true, description: "통로 너비 (미터)" },
      { name: "length_m", type: "number", required: true, description: "통로 길이 (미터)" },
      { name: "connects_zones", type: "array", required: false, description: "연결 구역 목록" },
    ],
  },
  {
    name: "FittingRoom",
    label: "탈의실",
    description: "의류 착용 공간",
    icon: "Shirt",
    color: "#a855f7",
    model_3d_type: "room",
    model_3d_dimensions: { width: 1.2, height: 2.5, depth: 1.5 },
    properties: [
      { name: "fitting_room_id", type: "string", required: true, description: "탈의실 ID" },
      { name: "zone_id", type: "string", required: true, description: "소속 구역" },
      { name: "size_category", type: "string", required: false, description: "크기 (small/medium/large)" },
      { name: "has_mirror", type: "boolean", required: false, description: "거울 여부" },
      { name: "occupancy_sensor", type: "boolean", required: false, description: "점유 센서" },
    ],
  },
  {
    name: "StorageRoom",
    label: "창고",
    description: "재고 보관 공간",
    icon: "Warehouse",
    color: "#78716c",
    model_3d_type: "room",
    model_3d_dimensions: { width: 4, height: 3, depth: 5 },
    properties: [
      { name: "storage_id", type: "string", required: true, description: "창고 ID" },
      { name: "storage_type", type: "string", required: false, description: "보관 유형 (backstock/cold/hazmat)" },
      { name: "capacity_cbm", type: "number", required: false, description: "용량 (세제곱미터)" },
      { name: "current_utilization", type: "number", required: false, description: "사용률 (%)" },
    ],
  },

  // 9. 가구/집기 (3개)
  {
    name: "Shelf",
    label: "선반",
    description: "상품 진열 선반",
    icon: "Layers",
    color: "#3b82f6",
    model_3d_type: "furniture",
    model_3d_dimensions: { width: 1.2, height: 2, depth: 0.4 },
    properties: [
      { name: "shelf_id", type: "string", required: true, description: "선반 ID" },
      { name: "zone_id", type: "string", required: true, description: "소속 구역" },
      { name: "shelf_type", type: "string", required: false, description: "선반 유형 (wall/gondola/endcap)" },
      { name: "num_levels", type: "number", required: false, description: "단 수" },
      { name: "width_m", type: "number", required: false, description: "너비 (미터)" },
      { name: "height_m", type: "number", required: false, description: "높이 (미터)" },
      { name: "max_load_kg", type: "number", required: false, description: "최대 하중 (kg)" },
    ],
  },
  {
    name: "Rack",
    label: "랙",
    description: "의류 걸이 랙",
    icon: "Minimize2",
    color: "#06b6d4",
    model_3d_type: "furniture",
    model_3d_dimensions: { width: 1.2, height: 1.8, depth: 0.5 },
    properties: [
      { name: "rack_id", type: "string", required: true, description: "랙 ID" },
      { name: "zone_id", type: "string", required: true, description: "소속 구역" },
      { name: "rack_type", type: "string", required: false, description: "랙 유형 (round/straight/4way)" },
      { name: "capacity_units", type: "number", required: false, description: "수용 용량" },
      { name: "has_casters", type: "boolean", required: false, description: "바퀴 여부" },
    ],
  },
  {
    name: "DisplayTable",
    label: "디스플레이 테이블",
    description: "상품 진열 테이블",
    icon: "Table",
    color: "#8b5cf6",
    model_3d_type: "furniture",
    model_3d_dimensions: { width: 1.5, height: 0.9, depth: 1 },
    properties: [
      { name: "table_id", type: "string", required: true, description: "테이블 ID" },
      { name: "zone_id", type: "string", required: true, description: "소속 구역" },
      { name: "table_shape", type: "string", required: false, description: "형태 (rectangular/round/square)" },
      { name: "width_m", type: "number", required: false, description: "너비 (미터)" },
      { name: "length_m", type: "number", required: false, description: "길이 (미터)" },
    ],
  },

  // 10. 제품 관련 (1개)
  {
    name: "Supplier",
    label: "공급업체",
    description: "제품 공급업체",
    icon: "Truck",
    color: "#059669",
    model_3d_type: null,
    properties: [
      { name: "supplier_id", type: "string", required: true, description: "공급업체 ID" },
      { name: "supplier_name", type: "string", required: true, description: "공급업체명" },
      { name: "contact_person", type: "string", required: false, description: "담당자" },
      { name: "email", type: "string", required: false, description: "이메일" },
      { name: "phone", type: "string", required: false, description: "전화번호" },
      { name: "lead_time_days", type: "number", required: false, description: "리드타임 (일)" },
      { name: "reliability_score", type: "number", required: false, description: "신뢰도 점수 (0-100)" },
    ],
  },

  // 11. IoT/센서 (2개)
  {
    name: "Camera",
    label: "카메라",
    description: "CCTV 카메라",
    icon: "Video",
    color: "#dc2626",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.15, height: 0.15, depth: 0.2 },
    properties: [
      { name: "camera_id", type: "string", required: true, description: "카메라 ID" },
      { name: "zone_id", type: "string", required: true, description: "설치 구역" },
      { name: "camera_type", type: "string", required: false, description: "카메라 유형 (fixed/ptz/dome)" },
      { name: "resolution", type: "string", required: false, description: "해상도 (1080p/4K)" },
      { name: "has_night_vision", type: "boolean", required: false, description: "야간 촬영" },
      { name: "ai_features", type: "array", required: false, description: "AI 기능 (face_detection/people_counting)" },
    ],
  },
  {
    name: "Beacon",
    label: "비콘",
    description: "Bluetooth 비콘",
    icon: "Bluetooth",
    color: "#2563eb",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.05, height: 0.05, depth: 0.02 },
    properties: [
      { name: "beacon_id", type: "string", required: true, description: "비콘 ID" },
      { name: "zone_id", type: "string", required: true, description: "설치 구역" },
      { name: "uuid", type: "string", required: false, description: "UUID" },
      { name: "tx_power", type: "number", required: false, description: "송신 출력 (dBm)" },
      { name: "battery_level", type: "number", required: false, description: "배터리 잔량 (%)" },
    ],
  },

  // ==========================================
  // 🟠 MEDIUM (중우선순위) - 9개
  // ==========================================

  // 12. 분석/집계 (3개)
  {
    name: "DailySales",
    label: "일간 매출",
    description: "일간 매출 집계",
    icon: "TrendingUp",
    color: "#22c55e",
    model_3d_type: null,
    properties: [
      { name: "sales_id", type: "string", required: true, description: "매출 ID" },
      { name: "date", type: "string", required: true, description: "날짜" },
      { name: "store_id", type: "string", required: true, description: "매장 ID" },
      { name: "total_revenue", type: "number", required: true, description: "총 매출" },
      { name: "transaction_count", type: "number", required: false, description: "거래 건수" },
      { name: "customer_count", type: "number", required: false, description: "고객 수" },
      { name: "avg_basket_size", type: "number", required: false, description: "평균 구매액" },
    ],
  },
  {
    name: "InventoryHistory",
    label: "재고 이력",
    description: "재고 변동 이력",
    icon: "History",
    color: "#78716c",
    model_3d_type: null,
    properties: [
      { name: "history_id", type: "string", required: true, description: "이력 ID" },
      { name: "inventory_id", type: "string", required: true, description: "재고 ID" },
      { name: "product_id", type: "string", required: true, description: "제품 ID" },
      { name: "store_id", type: "string", required: true, description: "매장 ID" },
      { name: "date", type: "string", required: true, description: "날짜" },
      { name: "stock_level", type: "number", required: true, description: "재고 수준" },
      { name: "change_type", type: "string", required: false, description: "변경 유형 (restock/sale/adjustment)" },
      { name: "change_amount", type: "number", required: false, description: "변경량" },
    ],
  },
  {
    name: "ZonePerformance",
    label: "구역 성과",
    description: "구역별 성과 지표",
    icon: "BarChart3",
    color: "#8b5cf6",
    model_3d_type: null,
    properties: [
      { name: "performance_id", type: "string", required: true, description: "성과 ID" },
      { name: "zone_id", type: "string", required: true, description: "구역 ID" },
      { name: "date", type: "string", required: true, description: "날짜" },
      { name: "visitor_count", type: "number", required: false, description: "방문자 수" },
      { name: "dwell_time_avg", type: "number", required: false, description: "평균 체류 시간 (분)" },
      { name: "conversion_rate", type: "number", required: false, description: "전환율 (%)" },
      { name: "revenue", type: "number", required: false, description: "매출" },
    ],
  },

  // 13. 운영 (2개)
  {
    name: "Task",
    label: "작업",
    description: "직원 작업 관리",
    icon: "CheckSquare",
    color: "#6366f1",
    model_3d_type: null,
    properties: [
      { name: "task_id", type: "string", required: true, description: "작업 ID" },
      { name: "task_name", type: "string", required: true, description: "작업명" },
      { name: "staff_id", type: "string", required: false, description: "배정 직원" },
      { name: "task_type", type: "string", required: false, description: "작업 유형 (restock/cleaning/customer_service)" },
      { name: "priority", type: "string", required: false, description: "우선순위 (high/medium/low)" },
      { name: "status", type: "string", required: false, description: "상태 (pending/in_progress/completed)" },
      { name: "due_date", type: "string", required: false, description: "마감일" },
    ],
  },
  {
    name: "Alert",
    label: "알림",
    description: "시스템 알림",
    icon: "AlertCircle",
    color: "#ef4444",
    model_3d_type: null,
    properties: [
      { name: "alert_id", type: "string", required: true, description: "알림 ID" },
      { name: "alert_type", type: "string", required: true, description: "알림 유형 (stockout/security/maintenance)" },
      { name: "severity", type: "string", required: false, description: "심각도 (critical/warning/info)" },
      { name: "entity_id", type: "string", required: false, description: "관련 엔티티 ID" },
      { name: "entity_type", type: "string", required: false, description: "관련 엔티티 타입" },
      { name: "message", type: "string", required: true, description: "알림 메시지" },
      { name: "created_at", type: "string", required: true, description: "생성 시간" },
      { name: "resolved_at", type: "string", required: false, description: "해결 시간" },
    ],
  },

  // 14. IoT/센서 (4개)
  {
    name: "PeopleCounter",
    label: "인원 카운터",
    description: "출입구 인원 카운터",
    icon: "Users",
    color: "#3b82f6",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.1, height: 0.1, depth: 0.05 },
    properties: [
      { name: "counter_id", type: "string", required: true, description: "카운터 ID" },
      { name: "entrance_id", type: "string", required: true, description: "출입구 ID" },
      { name: "counter_type", type: "string", required: false, description: "카운터 유형 (laser/camera/infrared)" },
      { name: "accuracy_rate", type: "number", required: false, description: "정확도 (%)" },
    ],
  },
  {
    name: "DoorSensor",
    label: "도어 센서",
    description: "출입문 센서",
    icon: "DoorOpen",
    color: "#10b981",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.05, height: 0.05, depth: 0.02 },
    properties: [
      { name: "sensor_id", type: "string", required: true, description: "센서 ID" },
      { name: "entrance_id", type: "string", required: true, description: "출입구 ID" },
      { name: "sensor_type", type: "string", required: false, description: "센서 유형 (magnetic/motion)" },
      { name: "status", type: "string", required: false, description: "상태 (active/inactive)" },
    ],
  },
  {
    name: "TemperatureSensor",
    label: "온도 센서",
    description: "온도 측정 센서",
    icon: "Thermometer",
    color: "#f59e0b",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.05, height: 0.05, depth: 0.02 },
    properties: [
      { name: "sensor_id", type: "string", required: true, description: "센서 ID" },
      { name: "zone_id", type: "string", required: true, description: "구역 ID" },
      { name: "current_temp_c", type: "number", required: false, description: "현재 온도 (섭씨)" },
      { name: "target_range_min", type: "number", required: false, description: "목표 최소 온도" },
      { name: "target_range_max", type: "number", required: false, description: "목표 최대 온도" },
    ],
  },
  {
    name: "HumiditySensor",
    label: "습도 센서",
    description: "습도 측정 센서",
    icon: "Droplets",
    color: "#06b6d4",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.05, height: 0.05, depth: 0.02 },
    properties: [
      { name: "sensor_id", type: "string", required: true, description: "센서 ID" },
      { name: "zone_id", type: "string", required: true, description: "구역 ID" },
      { name: "current_humidity", type: "number", required: false, description: "현재 습도 (%)" },
      { name: "target_range_min", type: "number", required: false, description: "목표 최소 습도" },
      { name: "target_range_max", type: "number", required: false, description: "목표 최대 습도" },
    ],
  },

  // ==========================================
  // 🟢 LOW (저우선순위) - 5개
  // ==========================================

  // 15. 시뮬레이션 (2개)
  {
    name: "DemandForecast",
    label: "수요 예측",
    description: "제품 수요 예측",
    icon: "TrendingUp",
    color: "#14b8a6",
    model_3d_type: null,
    properties: [
      { name: "forecast_id", type: "string", required: true, description: "예측 ID" },
      { name: "product_id", type: "string", required: true, description: "제품 ID" },
      { name: "store_id", type: "string", required: true, description: "매장 ID" },
      { name: "forecast_date", type: "string", required: true, description: "예측 기준일" },
      { name: "forecast_period", type: "string", required: false, description: "예측 기간 (weekly/monthly)" },
      { name: "predicted_demand", type: "number", required: true, description: "예측 수요" },
      { name: "confidence_level", type: "number", required: false, description: "신뢰도 (%)" },
    ],
  },
  {
    name: "PriceOptimization",
    label: "가격 최적화",
    description: "제품 가격 최적화",
    icon: "DollarSign",
    color: "#84cc16",
    model_3d_type: null,
    properties: [
      { name: "optimization_id", type: "string", required: true, description: "최적화 ID" },
      { name: "product_id", type: "string", required: true, description: "제품 ID" },
      { name: "current_price", type: "number", required: true, description: "현재 가격" },
      { name: "optimized_price", type: "number", required: true, description: "최적 가격" },
      { name: "expected_revenue_increase", type: "number", required: false, description: "예상 매출 증가율 (%)" },
      { name: "created_at", type: "string", required: false, description: "생성일" },
    ],
  },

  // 16. IoT/디바이스 (3개)
  {
    name: "POS",
    label: "POS 시스템",
    description: "POS 단말기",
    icon: "Monitor",
    color: "#6366f1",
    model_3d_type: "device",
    model_3d_dimensions: { width: 0.3, height: 0.4, depth: 0.3 },
    properties: [
      { name: "pos_id", type: "string", required: true, description: "POS ID" },
      { name: "counter_id", type: "string", required: true, description: "계산대 ID" },
      { name: "pos_type", type: "string", required: false, description: "POS 유형 (desktop/tablet/mobile)" },
      { name: "software_version", type: "string", required: false, description: "소프트웨어 버전" },
      { name: "status", type: "string", required: false, description: "상태 (online/offline/maintenance)" },
    ],
  },
  {
    name: "DigitalSignage",
    label: "디지털 사이니지",
    description: "디지털 광고판",
    icon: "Monitor",
    color: "#ec4899",
    model_3d_type: "device",
    model_3d_dimensions: { width: 1.5, height: 1, depth: 0.1 },
    properties: [
      { name: "signage_id", type: "string", required: true, description: "사이니지 ID" },
      { name: "zone_id", type: "string", required: true, description: "설치 구역" },
      { name: "screen_size_inch", type: "number", required: false, description: "화면 크기 (인치)" },
      { name: "content_type", type: "string", required: false, description: "콘텐츠 유형 (video/image/text)" },
      { name: "status", type: "string", required: false, description: "상태 (active/inactive)" },
    ],
  },
  {
    name: "HVAC",
    label: "냉난방 시스템",
    description: "냉난방 제어 시스템",
    icon: "Wind",
    color: "#0ea5e9",
    model_3d_type: "device",
    model_3d_dimensions: { width: 1, height: 0.5, depth: 0.3 },
    properties: [
      { name: "hvac_id", type: "string", required: true, description: "HVAC ID" },
      { name: "zone_id", type: "string", required: true, description: "제어 구역" },
      { name: "hvac_type", type: "string", required: false, description: "시스템 유형 (central/split/vrf)" },
      { name: "target_temp_c", type: "number", required: false, description: "목표 온도 (섭씨)" },
      { name: "mode", type: "string", required: false, description: "모드 (cooling/heating/auto)" },
    ],
  },
];

export const COMPREHENSIVE_RELATION_TYPES = [
  // ==========================================
  // 🔴 CRITICAL (필수) - 25개
  // ==========================================

  // 조직 관계 (1개)
  {
    name: "BELONGS_TO_ORG",
    label: "조직 소속",
    description: "매장이 조직에 소속",
    source_entity_type: "Store",
    target_entity_type: "Organization",
    directionality: "directed",
    properties: [],
  },

  // 공간 관계 (3개)
  {
    name: "CONTAINS_ZONE",
    label: "구역 포함",
    description: "매장이 구역 포함",
    source_entity_type: "Store",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_ENTRANCE",
    label: "출입구 보유",
    description: "매장이 출입구 보유",
    source_entity_type: "Store",
    target_entity_type: "Entrance",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_CHECKOUT_COUNTER",
    label: "계산대 보유",
    description: "매장이 계산대 보유",
    source_entity_type: "Store",
    target_entity_type: "CheckoutCounter",
    directionality: "directed",
    properties: [],
  },

  // 제품 관계 (7개)
  {
    name: "BELONGS_TO_CATEGORY",
    label: "카테고리 소속",
    description: "제품이 카테고리에 소속",
    source_entity_type: "Product",
    target_entity_type: "Category",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_SUBCATEGORY",
    label: "하위 카테고리",
    description: "카테고리가 하위 카테고리 보유",
    source_entity_type: "Category",
    target_entity_type: "Category",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_INVENTORY",
    label: "재고 보유",
    description: "제품이 재고 보유",
    source_entity_type: "Product",
    target_entity_type: "Inventory",
    directionality: "directed",
    properties: [],
  },
  {
    name: "BELONGS_TO_BRAND",
    label: "브랜드 소속",
    description: "제품이 브랜드에 소속",
    source_entity_type: "Product",
    target_entity_type: "Brand",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_PROMOTION",
    label: "프로모션 적용",
    description: "제품에 프로모션 적용",
    source_entity_type: "Product",
    target_entity_type: "Promotion",
    directionality: "directed",
    properties: [],
  },
  {
    name: "TARGETS_PRODUCT",
    label: "제품 대상",
    description: "프로모션이 제품 대상",
    source_entity_type: "Promotion",
    target_entity_type: "Product",
    directionality: "directed",
    properties: [],
  },
  {
    name: "APPLIED_IN_ZONE",
    label: "구역 적용",
    description: "프로모션이 구역에 적용",
    source_entity_type: "Promotion",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [],
  },

  // 고객/거래 관계 (7개)
  {
    name: "VISITED",
    label: "방문함",
    description: "고객이 매장 방문",
    source_entity_type: "Customer",
    target_entity_type: "Visit",
    directionality: "directed",
    properties: [],
  },
  {
    name: "VISITED_STORE",
    label: "매장 방문",
    description: "방문이 특정 매장에서 발생",
    source_entity_type: "Visit",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [{ name: "visit_date", type: "string", required: false, description: "방문일" }],
  },
  {
    name: "ENTERED_THROUGH",
    label: "출입구 진입",
    description: "방문이 특정 출입구로 진입",
    source_entity_type: "Visit",
    target_entity_type: "Entrance",
    directionality: "directed",
    properties: [{ name: "entry_time", type: "string", required: false, description: "진입 시간" }],
  },
  {
    name: "MADE_TRANSACTION",
    label: "거래함",
    description: "고객이 거래 수행",
    source_entity_type: "Customer",
    target_entity_type: "Transaction",
    directionality: "directed",
    properties: [],
  },
  {
    name: "OCCURRED_AT_STORE",
    label: "매장 거래",
    description: "거래가 특정 매장에서 발생",
    source_entity_type: "Transaction",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [{ name: "transaction_date", type: "string", required: false, description: "거래일" }],
  },
  {
    name: "CHECKED_OUT_AT",
    label: "계산대 결제",
    description: "거래가 특정 계산대에서 처리",
    source_entity_type: "Transaction",
    target_entity_type: "CheckoutCounter",
    directionality: "directed",
    properties: [],
  },
  {
    name: "INCLUDES_PURCHASE",
    label: "구매 포함",
    description: "거래가 구매 항목 포함",
    source_entity_type: "Transaction",
    target_entity_type: "Purchase",
    directionality: "directed",
    properties: [],
  },

  // 직원/운영 관계 (4개)
  {
    name: "WORKS_AT",
    label: "근무함",
    description: "직원이 매장에서 근무",
    source_entity_type: "Staff",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [],
  },
  {
    name: "ASSIGNED_TO_STORE",
    label: "매장 배정",
    description: "직원이 특정 매장에 배정",
    source_entity_type: "Staff",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_SHIFT",
    label: "근무 시간 보유",
    description: "직원이 근무 시간 보유",
    source_entity_type: "Staff",
    target_entity_type: "Shift",
    directionality: "directed",
    properties: [],
  },
  {
    name: "ASSIGNED_TO_STAFF",
    label: "직원 배정",
    description: "작업이 직원에게 배정",
    source_entity_type: "Task",
    target_entity_type: "Staff",
    directionality: "directed",
    properties: [],
  },

  // IoT 관계 (3개)
  {
    name: "HAS_WIFI_SENSOR",
    label: "WiFi 센서 보유",
    description: "구역이 WiFi 센서 보유",
    source_entity_type: "Zone",
    target_entity_type: "WiFiSensor",
    directionality: "directed",
    properties: [],
  },
  {
    name: "DETECTED_IN_ZONE",
    label: "구역 감지",
    description: "고객이 구역에서 감지됨",
    source_entity_type: "Customer",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [],
  },
  {
    name: "PURCHASED_PRODUCT",
    label: "제품 구매",
    description: "구매가 제품 포함",
    source_entity_type: "Purchase",
    target_entity_type: "Product",
    directionality: "directed",
    properties: [],
  },

  // ==========================================
  // 🟡 HIGH (고우선순위) - 20개
  // ==========================================

  // 공간 관계 (4개)
  {
    name: "HAS_AISLE",
    label: "통로 보유",
    description: "구역이 통로 보유",
    source_entity_type: "Zone",
    target_entity_type: "Aisle",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_FITTING_ROOM",
    label: "탈의실 보유",
    description: "구역이 탈의실 보유",
    source_entity_type: "Zone",
    target_entity_type: "FittingRoom",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_STORAGE_ROOM",
    label: "창고 보유",
    description: "매장이 창고 보유",
    source_entity_type: "Store",
    target_entity_type: "StorageRoom",
    directionality: "directed",
    properties: [],
  },
  {
    name: "STORED_AT",
    label: "매장 재고",
    description: "재고가 특정 매장에 보관",
    source_entity_type: "Inventory",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [],
  },

  // 상품 관계 (4개)
  {
    name: "PLACED_ON",
    label: "배치됨",
    description: "제품이 진열대에 배치",
    source_entity_type: "Product",
    target_entity_type: "Shelf",
    directionality: "directed",
    properties: [{ name: "placement_date", type: "string", required: false, description: "배치일" }],
  },
  {
    name: "STORED_IN",
    label: "보관됨",
    description: "재고가 창고에 보관",
    source_entity_type: "Inventory",
    target_entity_type: "StorageRoom",
    directionality: "directed",
    properties: [],
  },
  {
    name: "SUPPLIES",
    label: "공급함",
    description: "공급업체가 제품 공급",
    source_entity_type: "Supplier",
    target_entity_type: "Product",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HISTORY_OF_PRODUCT",
    label: "제품 이력",
    description: "재고 이력이 특정 제품에 대한 기록",
    source_entity_type: "InventoryHistory",
    target_entity_type: "Product",
    directionality: "directed",
    properties: [],
  },

  // 고객 관계 (3개)
  {
    name: "TRIED_ON",
    label: "착용해봄",
    description: "고객이 탈의실에서 착용",
    source_entity_type: "Customer",
    target_entity_type: "FittingRoom",
    directionality: "directed",
    properties: [],
  },
  {
    name: "RETURNED_PRODUCT",
    label: "반품함",
    description: "고객이 제품 반품",
    source_entity_type: "Customer",
    target_entity_type: "Product",
    directionality: "directed",
    properties: [{ name: "return_date", type: "string", required: false, description: "반품일" }],
  },
  {
    name: "BELONGS_TO_SEGMENT",
    label: "세그먼트 소속",
    description: "고객이 특정 세그먼트 소속",
    source_entity_type: "Customer",
    target_entity_type: "Customer",
    directionality: "directed",
    properties: [{ name: "segment_type", type: "string", required: false, description: "세그먼트 유형" }],
  },

  // 외부 컨텍스트 관계 (3개)
  {
    name: "AFFECTS_STORE",
    label: "매장 영향",
    description: "날씨가 매장에 영향",
    source_entity_type: "Weather",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [],
  },
  {
    name: "AFFECTED_BY_HOLIDAY",
    label: "공휴일 영향",
    description: "매장이 공휴일 영향 받음",
    source_entity_type: "Store",
    target_entity_type: "Holiday",
    directionality: "directed",
    properties: [],
  },
  {
    name: "INFLUENCED_BY_ECONOMIC",
    label: "경제 영향",
    description: "매장이 경제 지표 영향 받음",
    source_entity_type: "Store",
    target_entity_type: "EconomicIndicator",
    directionality: "directed",
    properties: [],
  },

  // 분석 관계 (4개)
  {
    name: "SALES_OF_STORE",
    label: "매장 매출",
    description: "일간 매출이 특정 매장의 기록",
    source_entity_type: "DailySales",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [],
  },
  {
    name: "RECORDED_AT_STORE",
    label: "매장 기록",
    description: "재고 이력이 특정 매장에서 기록",
    source_entity_type: "InventoryHistory",
    target_entity_type: "Store",
    directionality: "directed",
    properties: [],
  },
  {
    name: "PERFORMANCE_OF_ZONE",
    label: "구역 성과",
    description: "구역 성과가 특정 구역에 대한 기록",
    source_entity_type: "ZonePerformance",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [],
  },
  {
    name: "TARGETS_ENTITY",
    label: "엔티티 대상",
    description: "알림이 특정 엔티티를 대상으로 함",
    source_entity_type: "Alert",
    target_entity_type: "Inventory",
    directionality: "directed",
    properties: [],
  },

  // IoT 관계 (2개)
  {
    name: "HAS_CAMERA",
    label: "카메라 보유",
    description: "구역이 카메라 보유",
    source_entity_type: "Zone",
    target_entity_type: "Camera",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_BEACON",
    label: "비콘 보유",
    description: "구역이 비콘 보유",
    source_entity_type: "Zone",
    target_entity_type: "Beacon",
    directionality: "directed",
    properties: [],
  },

  // ==========================================
  // 🟠 MEDIUM (중우선순위) - 15개
  // ==========================================

  // 공간/가구 관계 (3개)
  {
    name: "HAS_SHELF",
    label: "선반 보유",
    description: "구역이 선반 보유",
    source_entity_type: "Zone",
    target_entity_type: "Shelf",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_RACK",
    label: "랙 보유",
    description: "구역이 랙 보유",
    source_entity_type: "Zone",
    target_entity_type: "Rack",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_DISPLAY_TABLE",
    label: "디스플레이 테이블 보유",
    description: "구역이 디스플레이 테이블 보유",
    source_entity_type: "Zone",
    target_entity_type: "DisplayTable",
    directionality: "directed",
    properties: [],
  },

  // IoT 관계 (4개)
  {
    name: "HAS_PEOPLE_COUNTER",
    label: "인원 카운터 보유",
    description: "출입구가 인원 카운터 보유",
    source_entity_type: "Entrance",
    target_entity_type: "PeopleCounter",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_DOOR_SENSOR",
    label: "도어 센서 보유",
    description: "출입구가 도어 센서 보유",
    source_entity_type: "Entrance",
    target_entity_type: "DoorSensor",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_TEMPERATURE_SENSOR",
    label: "온도 센서 보유",
    description: "구역이 온도 센서 보유",
    source_entity_type: "Zone",
    target_entity_type: "TemperatureSensor",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_HUMIDITY_SENSOR",
    label: "습도 센서 보유",
    description: "구역이 습도 센서 보유",
    source_entity_type: "Zone",
    target_entity_type: "HumiditySensor",
    directionality: "directed",
    properties: [],
  },

  // 운영 관계 (2개)
  {
    name: "ASSIGNED_TO_TASK",
    label: "작업 배정",
    description: "직원이 작업에 배정",
    source_entity_type: "Staff",
    target_entity_type: "Task",
    directionality: "directed",
    properties: [],
  },
  {
    name: "TRIGGERED_ALERT",
    label: "알림 발생",
    description: "이벤트가 알림 발생",
    source_entity_type: "Inventory",
    target_entity_type: "Alert",
    directionality: "directed",
    properties: [],
  },

  // 분석 관계 (3개)
  {
    name: "MEASURED_IN_ZONE_PERFORMANCE",
    label: "구역 성과 측정",
    description: "방문이 구역 성과에 측정",
    source_entity_type: "Visit",
    target_entity_type: "ZonePerformance",
    directionality: "directed",
    properties: [],
  },
  {
    name: "FORECASTED_DEMAND",
    label: "수요 예측",
    description: "제품이 수요 예측됨",
    source_entity_type: "Product",
    target_entity_type: "DemandForecast",
    directionality: "directed",
    properties: [],
  },
  {
    name: "MANAGES_INVENTORY",
    label: "재고 관리",
    description: "직원이 재고 관리",
    source_entity_type: "Staff",
    target_entity_type: "Inventory",
    directionality: "directed",
    properties: [],
  },

  // 제품 배치 관계 (3개)
  {
    name: "PLACED_ON_SHELF",
    label: "선반 배치",
    description: "제품이 선반에 배치",
    source_entity_type: "Product",
    target_entity_type: "Shelf",
    directionality: "directed",
    properties: [],
  },
  {
    name: "PLACED_ON_RACK",
    label: "랙 배치",
    description: "제품이 랙에 배치",
    source_entity_type: "Product",
    target_entity_type: "Rack",
    directionality: "directed",
    properties: [],
  },
  {
    name: "PLACED_ON_TABLE",
    label: "테이블 배치",
    description: "제품이 테이블에 배치",
    source_entity_type: "Product",
    target_entity_type: "DisplayTable",
    directionality: "directed",
    properties: [],
  },

  // ==========================================
  // 🟢 LOW (저우선순위) - 10개
  // ==========================================

  // 시뮬레이션 관계 (2개)
  {
    name: "OPTIMIZED_PRICE_FOR",
    label: "가격 최적화",
    description: "제품이 가격 최적화됨",
    source_entity_type: "Product",
    target_entity_type: "PriceOptimization",
    directionality: "directed",
    properties: [],
  },
  {
    name: "GENERATES_FORECAST",
    label: "예측 생성",
    description: "이력이 예측 생성",
    source_entity_type: "InventoryHistory",
    target_entity_type: "DemandForecast",
    directionality: "directed",
    properties: [],
  },

  // IoT 관계 (5개)
  {
    name: "HAS_POS",
    label: "POS 보유",
    description: "계산대가 POS 보유",
    source_entity_type: "CheckoutCounter",
    target_entity_type: "POS",
    directionality: "directed",
    properties: [],
  },
  {
    name: "HAS_DIGITAL_SIGNAGE",
    label: "디지털 사이니지 보유",
    description: "구역이 디지털 사이니지 보유",
    source_entity_type: "Zone",
    target_entity_type: "DigitalSignage",
    directionality: "directed",
    properties: [],
  },
  {
    name: "CONTROLLED_BY_HVAC",
    label: "HVAC 제어",
    description: "구역이 HVAC로 제어됨",
    source_entity_type: "Zone",
    target_entity_type: "HVAC",
    directionality: "directed",
    properties: [],
  },
  {
    name: "PROCESSES_TRANSACTION",
    label: "거래 처리",
    description: "POS가 거래 처리",
    source_entity_type: "POS",
    target_entity_type: "Transaction",
    directionality: "directed",
    properties: [],
  },
  {
    name: "DISPLAYS_PROMOTION",
    label: "프로모션 표시",
    description: "사이니지가 프로모션 표시",
    source_entity_type: "DigitalSignage",
    target_entity_type: "Promotion",
    directionality: "directed",
    properties: [],
  },

  // 고객 감지 관계 (2개)
  {
    name: "CAPTURED_BY_CAMERA",
    label: "카메라 촬영",
    description: "고객이 카메라에 촬영됨",
    source_entity_type: "Customer",
    target_entity_type: "Camera",
    directionality: "directed",
    properties: [],
  },
  {
    name: "DETECTED_BY_BEACON",
    label: "비콘 감지",
    description: "고객이 비콘에 감지됨",
    source_entity_type: "Customer",
    target_entity_type: "Beacon",
    directionality: "directed",
    properties: [],
  },

  // 분석 관계 (1개)
  {
    name: "INFLUENCES_PRICING",
    label: "가격 영향",
    description: "수요 예측이 가격 영향",
    source_entity_type: "DemandForecast",
    target_entity_type: "PriceOptimization",
    directionality: "directed",
    properties: [],
  },

  // ==========================================
  // ⚡ ADDITIONAL (추가 필수 관계) - 13개
  // ==========================================

  // 카테고리 계층 관계 (1개)
  {
    name: "PARENT_OF",
    label: "상위 카테고리",
    description: "카테고리가 다른 카테고리의 상위",
    source_entity_type: "Category",
    target_entity_type: "Category",
    directionality: "directed",
    properties: [],
  },

  // 재고 추가 관계 (1개)
  {
    name: "REPLENISHED",
    label: "재입고됨",
    description: "제품이 재입고됨",
    source_entity_type: "Product",
    target_entity_type: "InventoryHistory",
    directionality: "directed",
    properties: [{ name: "replenish_date", type: "string", required: false, description: "재입고일" }],
  },

  // 거래 추가 관계 (1개)
  {
    name: "TRACKED_IN_DAILY_SALES",
    label: "일간 매출 추적",
    description: "거래가 일간 매출에 집계",
    source_entity_type: "Transaction",
    target_entity_type: "DailySales",
    directionality: "directed",
    properties: [],
  },

  // 재고 이력 관계 (1개)
  {
    name: "RECORDED_IN_INVENTORY_HISTORY",
    label: "재고 이력 기록",
    description: "재고 변동이 이력에 기록",
    source_entity_type: "Inventory",
    target_entity_type: "InventoryHistory",
    directionality: "directed",
    properties: [],
  },

  // 프로모션 추가 관계 (1개)
  {
    name: "PROMOTED_IN",
    label: "프로모션 진행",
    description: "프로모션이 구역에서 진행",
    source_entity_type: "Promotion",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [],
  },

  // 방문 구역 관계 (1개)
  {
    name: "VISITED_ZONE",
    label: "구역 방문",
    description: "방문이 구역에서 발생",
    source_entity_type: "Visit",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [{ name: "entry_time", type: "string", required: false, description: "진입 시간" }],
  },

  // 구역 성과 추가 관계 (1개)
  {
    name: "HAS_ZONE_PERFORMANCE",
    label: "구역 성과 보유",
    description: "구역이 성과 기록 보유",
    source_entity_type: "Zone",
    target_entity_type: "ZonePerformance",
    directionality: "directed",
    properties: [],
  },

  // 제품 카테고리 관계 (1개)
  {
    name: "CATEGORIZED_AS",
    label: "분류됨",
    description: "제품이 카테고리로 분류",
    source_entity_type: "Product",
    target_entity_type: "Category",
    directionality: "directed",
    properties: [],
  },

  // 제품 구매 관계 (1개)
  {
    name: "PURCHASED",
    label: "구매함",
    description: "고객이 제품 구매",
    source_entity_type: "Customer",
    target_entity_type: "Product",
    directionality: "directed",
    properties: [{ name: "purchase_date", type: "string", required: false, description: "구매일" }],
  },

  // 구역 이동 관계 (1개)
  {
    name: "MOVED_TO_ZONE",
    label: "구역 이동",
    description: "고객이 구역으로 이동",
    source_entity_type: "Customer",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [{ name: "movement_time", type: "string", required: false, description: "이동 시간" }],
  },

  // 센서 구역 관계 (1개)
  {
    name: "INSTALLED_IN_ZONE",
    label: "구역 설치",
    description: "센서가 구역에 설치됨",
    source_entity_type: "WiFiSensor",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [],
  },

  // 제품 배치 통합 관계 (1개)
  {
    name: "DISPLAYED_IN_ZONE",
    label: "구역 진열",
    description: "제품이 구역에 진열됨",
    source_entity_type: "Product",
    target_entity_type: "Zone",
    directionality: "directed",
    properties: [{ name: "display_date", type: "string", required: false, description: "진열일" }],
  },
];

/**
 * 마스터 사용자 계정으로 온톨로지 엔티티 타입 생성
 * (user_id: af316ab2-ffb5-4509-bd37-13aa31feb5ad)
 */
export async function createComprehensiveRetailOntology() {
  const MASTER_USER_ID = "af316ab2-ffb5-4509-bd37-13aa31feb5ad";
  const MASTER_ORG_ID = "e738e7b1-e4bd-49f1-bd96-6de4c257b5a0";

  const results = {
    entities: { created: 0, failed: 0 },
    relations: { created: 0, failed: 0 },
    errors: [] as string[],
  };

  // 1. 엔티티 타입 생성
  for (const entity of COMPREHENSIVE_ENTITY_TYPES) {
    try {
      const { error } = await supabase.from("ontology_entity_types").insert({
        user_id: MASTER_USER_ID,
        org_id: MASTER_ORG_ID,
        name: entity.name,
        label: entity.label,
        description: entity.description,
        icon: entity.icon,
        color: entity.color,
        model_3d_type: entity.model_3d_type,
        model_3d_dimensions: entity.model_3d_dimensions || null,
        properties: entity.properties,
      });

      if (error) {
        results.entities.failed++;
        results.errors.push(`Entity ${entity.name}: ${error.message}`);
      } else {
        results.entities.created++;
      }
    } catch (err) {
      results.entities.failed++;
      results.errors.push(`Entity ${entity.name}: ${String(err)}`);
    }
  }

  // 2. 관계 타입 생성
  for (const relation of COMPREHENSIVE_RELATION_TYPES) {
    try {
      const { error } = await supabase.from("ontology_relation_types").insert({
        user_id: MASTER_USER_ID,
        org_id: MASTER_ORG_ID,
        name: relation.name,
        label: relation.label,
        description: relation.description,
        source_entity_type: relation.source_entity_type,
        target_entity_type: relation.target_entity_type,
        directionality: relation.directionality,
        properties: relation.properties,
      });

      if (error) {
        results.relations.failed++;
        results.errors.push(`Relation ${relation.name}: ${error.message}`);
      } else {
        results.relations.created++;
      }
    } catch (err) {
      results.relations.failed++;
      results.errors.push(`Relation ${relation.name}: ${String(err)}`);
    }
  }

  return results;
}

/**
 * 리테일 스키마 프리셋 적용
 */
export async function applyRetailSchemaPreset() {
  return await createComprehensiveRetailOntology();
}
