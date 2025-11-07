// 🎯 NEURALTWIN 공통 샘플 데이터셋
// 모든 feature 컴포넌트가 이 통합 데이터셋을 사용합니다

// ===== 제품 정보 =====
export const PRODUCTS = [
  { id: "P1", name: "화이트 티셔츠", category: "상의", price: 32000, cost: 18000, stock: 85, dailySales: 14, zone: "Z2" },
  { id: "P2", name: "데님 자켓", category: "아우터", price: 145000, cost: 85000, stock: 23, dailySales: 4, zone: "Z1" },
  { id: "P3", name: "블랙 진", category: "하의", price: 80000, cost: 45000, stock: 42, dailySales: 8, zone: "Z3" },
  { id: "P4", name: "스니커즈", category: "신발", price: 120000, cost: 70000, stock: 8, dailySales: 12, zone: "Z4" },
  { id: "P5", name: "백팩", category: "악세사리", price: 100000, cost: 55000, stock: 156, dailySales: 3, zone: "Z5" },
] as const;

// ===== Zone/구역 정보 =====
export const ZONES = [
  { id: "Z1", name: "신상품 코너", x: 30, y: 25, width: 20, height: 15, category: "아우터" },
  { id: "Z2", name: "인기상품", x: 70, y: 30, width: 20, height: 15, category: "상의" },
  { id: "Z3", name: "하의 섹션", x: 40, y: 40, width: 20, height: 15, category: "하의" },
  { id: "Z4", name: "신발 코너", x: 60, y: 35, width: 15, height: 12, category: "신발" },
  { id: "Z5", name: "악세사리", x: 60, y: 60, width: 15, height: 12, category: "악세사리" },
  { id: "Z6", name: "할인코너", x: 40, y: 40, width: 18, height: 12, category: "할인" },
  { id: "CHECKOUT", name: "계산대", x: 70, y: 70, width: 15, height: 10, category: "계산" },
  { id: "FITTING", name: "피팅룸", x: 30, y: 50, width: 12, height: 10, category: "피팅" },
] as const;

// ===== 매출 데이터 (최근 7일) =====
export const SALES_DATA = [
  { day: "월", date: "2025-01-13", sales: 3200000, transactions: 42, visitors: 158, conversion: 26.6 },
  { day: "화", date: "2025-01-14", sales: 3040000, transactions: 38, visitors: 152, conversion: 25.0 },
  { day: "수", date: "2025-01-15", sales: 3520000, transactions: 48, visitors: 175, conversion: 27.4 },
  { day: "목", date: "2025-01-16", sales: 3360000, transactions: 45, visitors: 165, conversion: 27.3 },
  { day: "금", date: "2025-01-17", sales: 4160000, transactions: 58, visitors: 198, conversion: 29.3 },
  { day: "토", date: "2025-01-18", sales: 5760000, transactions: 86, visitors: 285, conversion: 30.2 },
  { day: "일", date: "2025-01-19", sales: 5280000, transactions: 78, visitors: 256, conversion: 30.5 },
] as const;

// ===== 제품별 상세 판매 데이터 =====
export const PRODUCT_SALES = [
  { 
    ...PRODUCTS[0], 
    sales: 300, 
    revenue: 9600000, 
    trend: 8, 
    status: "high" as const,
    avgDiscount: 12,
    returningCustomerRate: 35
  },
  { 
    ...PRODUCTS[1], 
    sales: 58, 
    revenue: 8410000, 
    trend: -3, 
    status: "medium" as const,
    avgDiscount: 8,
    returningCustomerRate: 42
  },
  { 
    ...PRODUCTS[2], 
    sales: 210, 
    revenue: 16800000, 
    trend: -5, 
    status: "medium" as const,
    avgDiscount: 15,
    returningCustomerRate: 28
  },
  { 
    ...PRODUCTS[3], 
    sales: 98, 
    revenue: 11760000, 
    trend: 12, 
    status: "critical" as const,
    avgDiscount: 5,
    returningCustomerRate: 48
  },
  { 
    ...PRODUCTS[4], 
    sales: 67, 
    revenue: 6700000, 
    trend: -12, 
    status: "low" as const,
    avgDiscount: 20,
    returningCustomerRate: 22
  },
] as const;

// ===== 카테고리별 매출 =====
export const CATEGORY_SALES = [
  { name: "아우터", value: 8410000, color: "hsl(var(--primary))", products: 1 },
  { name: "상의", value: 9600000, color: "hsl(217, 91%, 60%)", products: 1 },
  { name: "하의", value: 16800000, color: "hsl(262, 83%, 58%)", products: 1 },
  { name: "신발", value: 11760000, color: "hsl(142, 76%, 36%)", products: 1 },
  { name: "악세사리", value: 6700000, color: "hsl(48, 96%, 53%)", products: 1 },
];

// ===== 전환 퍼널 데이터 =====
export const FUNNEL_DATA = [
  { stage: "방문", count: 1000, rate: 100, color: "hsl(var(--primary))" },
  { stage: "관심", count: 680, rate: 68, color: "hsl(217, 91%, 60%)" },
  { stage: "체류", count: 420, rate: 42, color: "hsl(262, 83%, 58%)" },
  { stage: "구매", count: 150, rate: 15, color: "hsl(142, 76%, 36%)" },
] as const;

// ===== 고객 동선 패턴 =====
export const CUSTOMER_JOURNEYS = [
  {
    id: "C1",
    type: "구매" as const,
    steps: [
      { x: 50, y: 10, action: "입장", duration: 0, zone: "ENTRANCE" },
      { x: 30, y: 25, action: "신상품 구경", duration: 45, zone: "Z1" },
      { x: 30, y: 50, action: "피팅룸", duration: 180, zone: "FITTING" },
      { x: 70, y: 70, action: "계산대", duration: 90, zone: "CHECKOUT" },
      { x: 50, y: 90, action: "퇴장", duration: 0, zone: "EXIT" },
    ],
    revenue: 145000,
    products: ["P2"],
  },
  {
    id: "C2",
    type: "브라우징" as const,
    steps: [
      { x: 50, y: 10, action: "입장", duration: 0, zone: "ENTRANCE" },
      { x: 70, y: 30, action: "인기상품", duration: 60, zone: "Z2" },
      { x: 40, y: 40, action: "할인코너", duration: 120, zone: "Z6" },
      { x: 60, y: 60, action: "악세사리", duration: 45, zone: "Z5" },
      { x: 50, y: 90, action: "퇴장", duration: 0, zone: "EXIT" },
    ],
    revenue: 0,
    products: [],
  },
  {
    id: "C3",
    type: "구매" as const,
    steps: [
      { x: 50, y: 10, action: "입장", duration: 0, zone: "ENTRANCE" },
      { x: 60, y: 35, action: "신발 코너", duration: 90, zone: "Z4" },
      { x: 70, y: 70, action: "계산대", duration: 60, zone: "CHECKOUT" },
      { x: 50, y: 90, action: "퇴장", duration: 0, zone: "EXIT" },
    ],
    revenue: 120000,
    products: ["P4"],
  },
] as const;

// ===== 재고 정보 (Inventory Optimizer용) =====
export const INVENTORY_DATA = PRODUCTS.map(p => ({
  id: p.id,
  name: p.name,
  current: p.stock,
  optimal: Math.round(p.dailySales * 7 * 1.5), // 1.5주 분량
  dailySales: p.dailySales,
  daysLeft: p.stock / p.dailySales,
  status: (
    p.stock / p.dailySales < 1 ? "critical" :
    p.stock / p.dailySales < 7 ? "warning" :
    p.stock / (p.dailySales * 7 * 1.5) > 1.3 ? "excess" :
    "optimal"
  ) as "critical" | "warning" | "optimal" | "excess",
  category: p.category,
  zone: p.zone,
}));

// ===== 직원 성과 데이터 =====
export const STAFF_DATA = [
  { 
    id: "S1", 
    name: "김지훈", 
    role: "매니저", 
    sales: 14200000, 
    customers: 48, 
    avgTime: 8.5, 
    rating: 4.8, 
    performance: 96,
    efficiency: 95,
    productKnowledge: 92,
    customerSatisfaction: 96
  },
  { 
    id: "S2", 
    name: "이서연", 
    role: "시니어", 
    sales: 11800000, 
    customers: 42, 
    avgTime: 9.2, 
    rating: 4.6, 
    performance: 92,
    efficiency: 90,
    productKnowledge: 88,
    customerSatisfaction: 92
  },
  { 
    id: "S3", 
    name: "박민준", 
    role: "주니어", 
    sales: 8400000, 
    customers: 38, 
    avgTime: 11.0, 
    rating: 4.3, 
    performance: 78,
    efficiency: 75,
    productKnowledge: 85,
    customerSatisfaction: 78
  },
  { 
    id: "S4", 
    name: "최유나", 
    role: "주니어", 
    sales: 7200000, 
    customers: 32, 
    avgTime: 12.5, 
    rating: 4.1, 
    performance: 72,
    efficiency: 70,
    productKnowledge: 80,
    customerSatisfaction: 70
  },
] as const;

// ===== 주간 직원 성과 데이터 =====
export const STAFF_WEEKLY_DATA = [
  { day: "Mon", 김지훈: 92, 이서연: 88, 박민준: 75, 최유나: 70 },
  { day: "Tue", 김지훈: 95, 이서연: 90, 박민준: 78, 최유나: 72 },
  { day: "Wed", 김지훈: 93, 이서연: 91, 박민준: 76, 최유나: 74 },
  { day: "Thu", 김지훈: 96, 이서연: 93, 박민준: 80, 최유나: 73 },
  { day: "Fri", 김지훈: 98, 이서연: 95, 박민준: 82, 최유나: 75 },
  { day: "Sat", 김지훈: 97, 이서연: 94, 박민준: 79, 최유나: 71 },
  { day: "Sun", 김지훈: 95, 이서연: 92, 박민준: 78, 최유나: 70 },
];

// ===== 시간대별 트래픽 패턴 =====
export const HOURLY_TRAFFIC = [
  { hour: 9, visitors: 12, intensity: 0.15 },
  { hour: 10, visitors: 28, intensity: 0.25 },
  { hour: 11, visitors: 45, intensity: 0.35 },
  { hour: 12, visitors: 82, intensity: 0.72 },
  { hour: 13, visitors: 95, intensity: 0.85 },
  { hour: 14, visitors: 88, intensity: 0.78 },
  { hour: 15, visitors: 76, intensity: 0.68 },
  { hour: 16, visitors: 65, intensity: 0.58 },
  { hour: 17, visitors: 72, intensity: 0.65 },
  { hour: 18, visitors: 85, intensity: 0.75 },
  { hour: 19, visitors: 68, intensity: 0.60 },
  { hour: 20, visitors: 52, intensity: 0.45 },
  { hour: 21, visitors: 38, intensity: 0.32 },
  { hour: 22, visitors: 22, intensity: 0.20 },
] as const;

// ===== Layout Simulator용 제품 배치 =====
export const LAYOUT_PRODUCTS = PRODUCTS.map((p, idx) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  x: [10, 30, 50, 70, 10][idx],
  y: [10, 30, 10, 30, 50][idx],
  width: 15,
  height: 15,
  sales: PRODUCT_SALES[idx].sales,
  conversion: 15 + idx * 3,
}));

// ===== AI가 제안하는 최적 레이아웃 =====
export const AI_OPTIMIZED_LAYOUT = PRODUCTS.map((p, idx) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  x: [50, 10, 70, 30, 70][idx], // AI 최적화된 위치
  y: [10, 30, 30, 50, 60][idx],
  width: 15,
  height: 15,
  sales: Math.round(PRODUCT_SALES[idx].sales * 1.25), // 25% 향상 예측
  conversion: Math.round((15 + idx * 3) * 1.3), // 30% 향상 예측
}));

// ===== Footfall 시각화용 포인트 데이터 =====
export const generateFootfallPoints = () => {
  const points = [];
  for (let i = 0; i < 50; i++) {
    const hour = 9 + Math.floor(Math.random() * 14);
    const trafficData = HOURLY_TRAFFIC.find(t => t.hour === hour);
    
    points.push({
      x: Math.random() * 400,
      y: Math.random() * 300,
      time: hour + Math.random(),
      isReturning: Math.random() > 0.6,
      dwell: 1 + Math.random() * 10,
      intensity: trafficData?.intensity || 0.5,
    });
  }
  return points;
};

// ===== 수요 예측 기본 데이터 =====
export const FORECAST_BASE_DATA = SALES_DATA.map(d => ({
  day: d.day,
  sales: d.sales / 1000, // k 단위
  conversion: d.conversion,
}));

// ===== 유틸리티 함수 =====
export const calculateMetrics = {
  // 총 매출
  totalRevenue: () => SALES_DATA.reduce((sum, d) => sum + d.sales, 0),
  
  // 평균 전환율
  avgConversion: () => {
    const total = SALES_DATA.reduce((sum, d) => sum + d.conversion, 0);
    return (total / SALES_DATA.length).toFixed(1);
  },
  
  // 객단가 (ATV)
  averageTransactionValue: () => {
    const totalSales = SALES_DATA.reduce((sum, d) => sum + d.sales, 0);
    const totalTransactions = SALES_DATA.reduce((sum, d) => sum + d.transactions, 0);
    return Math.round(totalSales / totalTransactions);
  },
  
  // 재고 회전율
  inventoryTurnover: () => {
    const totalSold = PRODUCT_SALES.reduce((sum, p) => sum + p.sales, 0);
    const totalStock = PRODUCTS.reduce((sum, p) => sum + p.stock, 0);
    return (totalSold / totalStock).toFixed(2);
  },
};
