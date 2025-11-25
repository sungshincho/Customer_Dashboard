/**
 * Storage 관련 타입 정의
 */

// Storage 버킷 타입
export type StorageBucket = 'store-data' | '3d-models';

// 데이터 파일 타입
export type DataFileType = 
  | 'customers' 
  | 'products' 
  | 'purchases' 
  | 'visits' 
  | 'staff'
  | 'brands'
  | 'stores'
  | 'social_states'
  | 'wifi_sensors'
  | 'wifi_tracking'
  | 'purchases_extended'
  | 'visits_extended';

// 고객 데이터
export interface CustomerData {
  customer_id: string;
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  gender?: string;
  join_date?: string;
  [key: string]: any;
}

// 상품 데이터
export interface ProductData {
  product_id: string;
  name?: string;
  category?: string;
  price?: number;
  cost?: number;
  sku?: string;
  [key: string]: any;
}

// 구매 데이터
export interface PurchaseData {
  purchase_id: string;
  customer_id?: string;
  product_id?: string;
  quantity?: number;
  price?: number;
  timestamp?: string;
  [key: string]: any;
}

// 방문 데이터
export interface VisitData {
  visit_id: string;
  customer_id?: string;
  entry_time?: string;
  exit_time?: string;
  zone?: string;
  duration?: number;
  [key: string]: any;
}

// 직원 데이터
export interface StaffData {
  staff_id: string;
  name?: string;
  role?: string;
  department?: string;
  hire_date?: string;
  [key: string]: any;
}

// WiFi 센서 데이터
export interface WiFiSensorData {
  sensor_id: string;
  x: number;
  y?: number;
  z: number;
  coverage_radius?: number;
  [key: string]: any;
}

// WiFi 트래킹 데이터
export interface WiFiTrackingData {
  mac_address: string;
  sensor_id: string;
  timestamp: string;
  rssi?: number;
  x?: number;
  z?: number;
  accuracy?: number;
  status?: string;
  [key: string]: any;
}

// 데이터셋 전체
export interface StoreDataset {
  customers?: CustomerData[];
  products?: ProductData[];
  purchases?: PurchaseData[];
  visits?: VisitData[];
  staff?: StaffData[];
  brands?: any[];
  stores?: any[];
  social_states?: any[];
  wifi_sensors?: WiFiSensorData[];
  wifi_tracking?: WiFiTrackingData[];
}

// 파일 타입별 데이터 매핑
export type DataFileMap = {
  customers: CustomerData[];
  products: ProductData[];
  purchases: PurchaseData[];
  visits: VisitData[];
  staff: StaffData[];
  wifi_sensors: WiFiSensorData[];
  wifi_tracking: WiFiTrackingData[];
  brands: any[];
  stores: any[];
  social_states: any[];
  purchases_extended: any[];
  visits_extended: any[];
};

// Storage 경로 정보
export interface StoragePath {
  bucket: StorageBucket;
  path: string;
  fileName: string;
}

// Storage 파일 메타데이터
export interface StorageFileMetadata {
  name: string;
  path: string;
  size: number;
  created_at: string;
  bucket: StorageBucket;
  publicUrl?: string;
}

// 파일 로드 옵션
export interface LoadOptions {
  skipCache?: boolean;         // 캐시 스킵
  signal?: AbortSignal;        // 취소 시그널
}

// 파일 로드 결과
export interface LoadResult<T = any[]> {
  data: T;
  source: 'storage' | 'cache';
  loadedAt: number;
  error?: string;
}
