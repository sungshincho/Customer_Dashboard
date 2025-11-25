import { supabase } from "@/integrations/supabase/client";

/**
 * 오프라인 리테일 매장의 모든 구성요소를 포함하는 정교한 디지털 트윈 온톨로지 스키마
 */

export const COMPREHENSIVE_ENTITY_TYPES = [
  // ==========================================
  // 1. 공간 구조 엔티티 (Space Structure)
  // ==========================================
  {
    name: 'Zone',
    label: '구역',
    description: '매장 내 특정 기능을 가진 공간 영역',
    icon: 'BoxSelect',
    color: '#10b981',
    model_3d_type: 'zone',
    model_3d_dimensions: { width: 5, height: 3, depth: 5 },
    model_3d_metadata: {
      supports_heatmap: true,
      supports_pathflow: true,
      zone_shape: 'polygon',
      floor_level: 0
    },
    properties: [
      { name: 'zone_type', type: 'string', required: true, description: '구역 유형 (entrance/checkout/display/storage/fitting/aisle)' },
      { name: 'zone_code', type: 'string', required: true, description: '구역 코드' },
      { name: 'floor_area_sqm', type: 'number', required: true, description: '바닥 면적 (제곱미터)' },
      { name: 'boundary_polygon', type: 'array', required: true, description: '경계선 좌표 배열' },
      { name: 'traffic_capacity', type: 'number', required: false, description: '최대 수용 인원' },
      { name: 'temperature_target', type: 'number', required: false, description: '목표 온도 (섭씨)' },
      { name: 'lighting_target_lux', type: 'number', required: false, description: '목표 조도 (lux)' }
    ]
  },
  {
    name: 'Shelf',
    label: '선반',
    description: '상품을 진열하는 선반 유닛',
    icon: 'Layers',
    color: '#3b82f6',
    model_3d_type: 'furniture',
    model_3d_dimensions: { width: 1.2, height: 2.0, depth: 0.4 },
    model_3d_metadata: {
      stackable: true,
      shelf_levels: 5,
      max_weight_per_level_kg: 50,
      material: 'metal'
    },
    properties: [
      { name: 'shelf_type', type: 'string', required: true, description: '선반 유형 (wall_mounted/freestanding/gondola/pegboard)' },
      { name: 'shelf_code', type: 'string', required: true, description: '선반 코드' },
      { name: 'num_levels', type: 'number', required: true, description: '단 수' },
      { name: 'level_height_cm', type: 'array', required: true, description: '각 단의 높이 배열 (cm)' },
      { name: 'material', type: 'string', required: false, description: '재질 (metal/wood/glass)' },
      { name: 'max_weight_kg', type: 'number', required: false, description: '최대 적재 하중 (kg)' },
      { name: 'adjustable_levels', type: 'boolean', required: false, description: '단 높이 조절 가능 여부' }
    ]
  },
  {
    name: 'DisplayTable',
    label: '디스플레이 테이블',
    description: '상품을 진열하는 테이블',
    icon: 'Table',
    color: '#8b5cf6',
    model_3d_type: 'furniture',
    model_3d_dimensions: { width: 1.5, height: 0.9, depth: 1.0 },
    model_3d_metadata: {
      surface_type: 'flat',
      supports_lighting: true,
      display_capacity: 20
    },
    properties: [
      { name: 'table_type', type: 'string', required: true, description: '테이블 유형 (feature/promotional/seasonal/clearance)' },
      { name: 'table_code', type: 'string', required: true, description: '테이블 코드' },
      { name: 'surface_area_sqm', type: 'number', required: true, description: '표면 면적 (제곱미터)' },
      { name: 'shape', type: 'string', required: false, description: '형태 (rectangular/circular/oval/irregular)' },
      { name: 'has_lighting', type: 'boolean', required: false, description: '조명 장착 여부' },
      { name: 'material', type: 'string', required: false, description: '재질' }
    ]
  },
  {
    name: 'Rack',
    label: '랙',
    description: '의류나 상품을 걸어서 진열하는 랙',
    icon: 'Minimize2',
    color: '#06b6d4',
    model_3d_type: 'furniture',
    model_3d_dimensions: { width: 1.2, height: 1.8, depth: 0.5 },
    model_3d_metadata: {
      hanging_type: 'rail',
      capacity_items: 50,
      mobile: false
    },
    properties: [
      { name: 'rack_type', type: 'string', required: true, description: '랙 유형 (clothing/accessory/shoe/mixed)' },
      { name: 'rack_code', type: 'string', required: true, description: '랙 코드' },
      { name: 'hanging_capacity', type: 'number', required: true, description: '걸 수 있는 최대 아이템 수' },
      { name: 'rail_count', type: 'number', required: false, description: '레일 개수' },
      { name: 'is_mobile', type: 'boolean', required: false, description: '이동 가능 여부' },
      { name: 'has_wheels', type: 'boolean', required: false, description: '바퀴 장착 여부' }
    ]
  },
  {
    name: 'Wall',
    label: '벽면',
    description: '매장의 벽면 구조물',
    icon: 'Square',
    color: '#64748b',
    model_3d_type: 'structure',
    model_3d_dimensions: { width: 5, height: 3, depth: 0.2 },
    model_3d_metadata: {
      is_loadbearing: true,
      surface_finish: 'paint',
      mountable: true
    },
    properties: [
      { name: 'wall_type', type: 'string', required: true, description: '벽 유형 (exterior/interior/partition/glass)' },
      { name: 'wall_code', type: 'string', required: true, description: '벽 코드' },
      { name: 'length_m', type: 'number', required: true, description: '길이 (미터)' },
      { name: 'height_m', type: 'number', required: true, description: '높이 (미터)' },
      { name: 'material', type: 'string', required: false, description: '재질 (concrete/drywall/glass/brick)' },
      { name: 'color', type: 'string', required: false, description: '색상' },
      { name: 'finish', type: 'string', required: false, description: '마감재 (paint/wallpaper/tile)' },
      { name: 'can_mount_fixtures', type: 'boolean', required: false, description: '설비 장착 가능 여부' }
    ]
  },
  {
    name: 'Entrance',
    label: '출입구',
    description: '매장 출입구 및 문',
    icon: 'DoorOpen',
    color: '#f59e0b',
    model_3d_type: 'structure',
    model_3d_dimensions: { width: 2.0, height: 2.5, depth: 0.1 },
    model_3d_metadata: {
      door_type: 'automatic',
      traffic_counter: true,
      security_gate: false
    },
    properties: [
      { name: 'entrance_type', type: 'string', required: true, description: '출입구 유형 (main/side/emergency/staff)' },
      { name: 'entrance_code', type: 'string', required: true, description: '출입구 코드' },
      { name: 'door_type', type: 'string', required: false, description: '문 유형 (automatic/manual/revolving/sliding)' },
      { name: 'width_m', type: 'number', required: false, description: '너비 (미터)' },
      { name: 'has_sensor', type: 'boolean', required: false, description: '센서 장착 여부' },
      { name: 'has_security_gate', type: 'boolean', required: false, description: '보안 게이트 여부' },
      { name: 'accessibility_compliant', type: 'boolean', required: false, description: '장애인 접근성 준수 여부' }
    ]
  },
  {
    name: 'CheckoutCounter',
    label: '계산대',
    description: '고객 결제를 처리하는 계산대',
    icon: 'CreditCard',
    color: '#ef4444',
    model_3d_type: 'furniture',
    model_3d_dimensions: { width: 1.5, height: 1.0, depth: 0.8 },
    model_3d_metadata: {
      has_pos: true,
      has_scale: false,
      payment_methods: ['card', 'cash', 'mobile']
    },
    properties: [
      { name: 'counter_code', type: 'string', required: true, description: '계산대 코드' },
      { name: 'counter_type', type: 'string', required: false, description: '계산대 유형 (regular/express/self_checkout)' },
      { name: 'lane_number', type: 'number', required: false, description: '레인 번호' },
      { name: 'has_conveyor', type: 'boolean', required: false, description: '컨베이어 벨트 장착 여부' },
      { name: 'payment_terminals', type: 'array', required: false, description: '결제 단말기 목록' },
      { name: 'max_queue_length', type: 'number', required: false, description: '최대 대기 줄 길이' }
    ]
  },
  {
    name: 'Aisle',
    label: '통로',
    description: '고객 이동 통로',
    icon: 'MoveHorizontal',
    color: '#22c55e',
    model_3d_type: 'zone',
    model_3d_dimensions: { width: 1.5, height: 3, depth: 10 },
    model_3d_metadata: {
      pathflow_enabled: true,
      traffic_direction: 'bidirectional'
    },
    properties: [
      { name: 'aisle_code', type: 'string', required: true, description: '통로 코드' },
      { name: 'aisle_type', type: 'string', required: false, description: '통로 유형 (main/secondary/crossover)' },
      { name: 'width_m', type: 'number', required: true, description: '통로 너비 (미터)' },
      { name: 'length_m', type: 'number', required: true, description: '통로 길이 (미터)' },
      { name: 'direction', type: 'string', required: false, description: '통행 방향 (bidirectional/oneway)' },
      { name: 'flooring_type', type: 'string', required: false, description: '바닥재 유형' }
    ]
  },
  {
    name: 'FittingRoom',
    label: '탈의실',
    description: '고객이 의류를 착용해보는 공간',
    icon: 'User',
    color: '#a855f7',
    model_3d_type: 'room',
    model_3d_dimensions: { width: 1.2, height: 2.5, depth: 1.5 },
    model_3d_metadata: {
      has_mirror: true,
      has_seating: true,
      privacy_level: 'high'
    },
    properties: [
      { name: 'room_code', type: 'string', required: true, description: '탈의실 코드' },
      { name: 'occupancy_status', type: 'string', required: false, description: '점유 상태 (available/occupied/cleaning)' },
      { name: 'has_smart_mirror', type: 'boolean', required: false, description: '스마트 미러 장착 여부' },
      { name: 'max_items_allowed', type: 'number', required: false, description: '최대 반입 가능 아이템 수' },
      { name: 'accessibility_features', type: 'array', required: false, description: '접근성 기능 목록' }
    ]
  },
  {
    name: 'StorageRoom',
    label: '창고',
    description: '재고 보관 공간',
    icon: 'Package',
    color: '#78716c',
    model_3d_type: 'room',
    model_3d_dimensions: { width: 4, height: 3, depth: 5 },
    model_3d_metadata: {
      access_restricted: true,
      temperature_controlled: false
    },
    properties: [
      { name: 'room_code', type: 'string', required: true, description: '창고 코드' },
      { name: 'storage_type', type: 'string', required: false, description: '보관 유형 (dry/refrigerated/frozen/hazardous)' },
      { name: 'capacity_cubic_m', type: 'number', required: false, description: '보관 용적 (세제곱미터)' },
      { name: 'temperature_range', type: 'string', required: false, description: '온도 범위 (섭씨)' },
      { name: 'humidity_range', type: 'string', required: false, description: '습도 범위 (%)' },
      { name: 'security_level', type: 'string', required: false, description: '보안 레벨' }
    ]
  },
  {
    name: 'Window',
    label: '창문',
    description: '매장의 창문 및 유리면',
    icon: 'Maximize2',
    color: '#38bdf8',
    model_3d_type: 'structure',
    model_3d_dimensions: { width: 2, height: 2, depth: 0.05 },
    model_3d_metadata: {
      is_display_window: true,
      tint_level: 0.3
    },
    properties: [
      { name: 'window_code', type: 'string', required: true, description: '창문 코드' },
      { name: 'window_type', type: 'string', required: false, description: '창문 유형 (display/skylight/standard/bay)' },
      { name: 'glass_type', type: 'string', required: false, description: '유리 유형 (single/double/tempered)' },
      { name: 'area_sqm', type: 'number', required: false, description: '면적 (제곱미터)' },
      { name: 'tint_percentage', type: 'number', required: false, description: '틴팅 비율 (%)' },
      { name: 'uv_protection', type: 'boolean', required: false, description: 'UV 차단 여부' }
    ]
  },

  // ==========================================
  // 2. 디지털/IoT 장비 (Digital & IoT Equipment)
  // ==========================================
  {
    name: 'Sensor',
    label: '센서',
    description: '환경 및 활동 감지 센서',
    icon: 'Radio',
    color: '#14b8a6',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.1, height: 0.1, depth: 0.05 },
    model_3d_metadata: {
      wireless: true,
      battery_powered: true,
      data_frequency_hz: 1
    },
    properties: [
      { name: 'sensor_type', type: 'string', required: true, description: '센서 유형 (traffic/temperature/humidity/motion/proximity/occupancy)' },
      { name: 'sensor_id', type: 'string', required: true, description: '센서 ID' },
      { name: 'manufacturer', type: 'string', required: false, description: '제조사' },
      { name: 'model_number', type: 'string', required: false, description: '모델 번호' },
      { name: 'measurement_unit', type: 'string', required: false, description: '측정 단위' },
      { name: 'sampling_rate_sec', type: 'number', required: false, description: '샘플링 주기 (초)' },
      { name: 'accuracy', type: 'string', required: false, description: '정확도' },
      { name: 'battery_level', type: 'number', required: false, description: '배터리 잔량 (%)' }
    ]
  },
  {
    name: 'Camera',
    label: '카메라',
    description: 'CCTV 및 비전 분석 카메라',
    icon: 'Video',
    color: '#dc2626',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.15, height: 0.15, depth: 0.2 },
    model_3d_metadata: {
      resolution: '4K',
      field_of_view_degrees: 110,
      has_ai: true
    },
    properties: [
      { name: 'camera_type', type: 'string', required: true, description: '카메라 유형 (fixed/ptz/dome/bullet)' },
      { name: 'camera_id', type: 'string', required: true, description: '카메라 ID' },
      { name: 'resolution', type: 'string', required: false, description: '해상도 (1080p/4K/8K)' },
      { name: 'fps', type: 'number', required: false, description: '프레임 레이트' },
      { name: 'field_of_view', type: 'number', required: false, description: '화각 (도)' },
      { name: 'has_night_vision', type: 'boolean', required: false, description: '야간 촬영 기능' },
      { name: 'ai_features', type: 'array', required: false, description: 'AI 기능 목록 (face_detection/people_counting/heatmap)' },
      { name: 'recording_enabled', type: 'boolean', required: false, description: '녹화 활성화 여부' }
    ]
  },
  {
    name: 'Beacon',
    label: '비콘',
    description: 'Bluetooth 비콘 장치',
    icon: 'Wifi',
    color: '#2563eb',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.05, height: 0.05, depth: 0.02 },
    model_3d_metadata: {
      protocol: 'BLE',
      range_meters: 30,
      battery_life_months: 12
    },
    properties: [
      { name: 'beacon_id', type: 'string', required: true, description: '비콘 ID' },
      { name: 'uuid', type: 'string', required: false, description: 'UUID' },
      { name: 'major', type: 'number', required: false, description: 'Major 값' },
      { name: 'minor', type: 'number', required: false, description: 'Minor 값' },
      { name: 'tx_power', type: 'number', required: false, description: '송신 출력 (dBm)' },
      { name: 'advertising_interval_ms', type: 'number', required: false, description: '광고 주기 (ms)' },
      { name: 'battery_level', type: 'number', required: false, description: '배터리 잔량 (%)' }
    ]
  },
  {
    name: 'WiFiProbe',
    label: 'WiFi 프로브',
    description: 'WiFi 신호 감지 장치',
    icon: 'WifiIcon',
    color: '#7c3aed',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.2, height: 0.15, depth: 0.05 },
    model_3d_metadata: {
      detection_range_meters: 50,
      supports_5ghz: true
    },
    properties: [
      { name: 'probe_id', type: 'string', required: true, description: '프로브 ID' },
      { name: 'mac_address', type: 'string', required: false, description: 'MAC 주소' },
      { name: 'detection_range_m', type: 'number', required: false, description: '감지 범위 (미터)' },
      { name: 'frequency_bands', type: 'array', required: false, description: '주파수 대역 (2.4GHz/5GHz)' },
      { name: 'scan_interval_sec', type: 'number', required: false, description: '스캔 주기 (초)' }
    ]
  },
  {
    name: 'DigitalSignage',
    label: '디지털 사이니지',
    description: '디지털 디스플레이 광고판',
    icon: 'Monitor',
    color: '#f97316',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 1.2, height: 0.7, depth: 0.1 },
    model_3d_metadata: {
      screen_size_inch: 55,
      orientation: 'landscape',
      interactive: false
    },
    properties: [
      { name: 'signage_id', type: 'string', required: true, description: '사이니지 ID' },
      { name: 'screen_size_inch', type: 'number', required: false, description: '화면 크기 (인치)' },
      { name: 'resolution', type: 'string', required: false, description: '해상도' },
      { name: 'orientation', type: 'string', required: false, description: '방향 (landscape/portrait)' },
      { name: 'is_touchscreen', type: 'boolean', required: false, description: '터치스크린 여부' },
      { name: 'content_source', type: 'string', required: false, description: '콘텐츠 소스 URL' },
      { name: 'brightness_nits', type: 'number', required: false, description: '밝기 (nits)' }
    ]
  },
  {
    name: 'POS',
    label: 'POS 단말기',
    description: '판매 시점 관리 단말기',
    icon: 'ShoppingCart',
    color: '#059669',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.3, height: 0.4, depth: 0.3 },
    model_3d_metadata: {
      has_printer: true,
      has_scanner: true,
      payment_methods: ['card', 'cash', 'mobile']
    },
    properties: [
      { name: 'pos_id', type: 'string', required: true, description: 'POS ID' },
      { name: 'terminal_number', type: 'string', required: false, description: '단말기 번호' },
      { name: 'software_version', type: 'string', required: false, description: '소프트웨어 버전' },
      { name: 'payment_processors', type: 'array', required: false, description: '결제 프로세서 목록' },
      { name: 'peripherals', type: 'array', required: false, description: '주변 장치 (printer/scanner/scale/card_reader)' },
      { name: 'cloud_connected', type: 'boolean', required: false, description: '클라우드 연결 여부' }
    ]
  },
  {
    name: 'Kiosk',
    label: '키오스크',
    description: '셀프서비스 키오스크',
    icon: 'Tablet',
    color: '#0891b2',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.6, height: 1.6, depth: 0.5 },
    model_3d_metadata: {
      screen_size_inch: 24,
      has_payment: true,
      accessibility_features: ['audio', 'height_adjustable']
    },
    properties: [
      { name: 'kiosk_id', type: 'string', required: true, description: '키오스크 ID' },
      { name: 'kiosk_type', type: 'string', required: false, description: '키오스크 유형 (checkout/information/product_lookup/ordering)' },
      { name: 'screen_size_inch', type: 'number', required: false, description: '화면 크기 (인치)' },
      { name: 'has_payment_terminal', type: 'boolean', required: false, description: '결제 단말기 장착 여부' },
      { name: 'has_printer', type: 'boolean', required: false, description: '프린터 장착 여부' },
      { name: 'languages_supported', type: 'array', required: false, description: '지원 언어 목록' },
      { name: 'accessibility_compliant', type: 'boolean', required: false, description: '접근성 준수 여부' }
    ]
  },
  {
    name: 'SmartMirror',
    label: '스마트 미러',
    description: '인터랙티브 스마트 미러',
    icon: 'Frame',
    color: '#e11d48',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.6, height: 1.8, depth: 0.1 },
    model_3d_metadata: {
      has_camera: true,
      has_ar: true,
      virtual_try_on: true
    },
    properties: [
      { name: 'mirror_id', type: 'string', required: true, description: '미러 ID' },
      { name: 'display_size_inch', type: 'number', required: false, description: '디스플레이 크기 (인치)' },
      { name: 'has_ar_tryonon', type: 'boolean', required: false, description: 'AR 가상 착용 기능' },
      { name: 'has_camera', type: 'boolean', required: false, description: '카메라 장착 여부' },
      { name: 'supported_features', type: 'array', required: false, description: '지원 기능 목록 (outfit_recommendation/size_suggestion/style_match)' }
    ]
  },

  // ==========================================
  // 3. 환경 시스템 (Environmental Systems)
  // ==========================================
  {
    name: 'Lighting',
    label: '조명',
    description: '매장 조명 시스템',
    icon: 'Lightbulb',
    color: '#facc15',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.3, height: 0.15, depth: 0.3 },
    model_3d_metadata: {
      light_type: 'LED',
      dimmable: true,
      color_temperature_k: 4000
    },
    properties: [
      { name: 'lighting_id', type: 'string', required: true, description: '조명 ID' },
      { name: 'light_type', type: 'string', required: false, description: '조명 유형 (LED/fluorescent/halogen/spotlight)' },
      { name: 'wattage', type: 'number', required: false, description: '전력 소비량 (W)' },
      { name: 'lumens', type: 'number', required: false, description: '광속 (lm)' },
      { name: 'color_temperature_k', type: 'number', required: false, description: '색온도 (K)' },
      { name: 'is_dimmable', type: 'boolean', required: false, description: '조광 가능 여부' },
      { name: 'current_brightness', type: 'number', required: false, description: '현재 밝기 (%)' },
      { name: 'color_rgb', type: 'string', required: false, description: 'RGB 색상 (스마트 조명)' },
      { name: 'smart_control_enabled', type: 'boolean', required: false, description: '스마트 제어 가능 여부' }
    ]
  },
  {
    name: 'HVAC',
    label: '냉난방 시스템',
    description: '냉난방 공조 시스템',
    icon: 'Wind',
    color: '#06b6d4',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 1.0, height: 0.5, depth: 0.8 },
    model_3d_metadata: {
      cooling_capacity_btu: 24000,
      heating_capacity_btu: 20000,
      energy_efficiency: 'A++'
    },
    properties: [
      { name: 'hvac_id', type: 'string', required: true, description: 'HVAC ID' },
      { name: 'system_type', type: 'string', required: false, description: '시스템 유형 (split/ducted/vrf/chiller)' },
      { name: 'cooling_capacity_btu', type: 'number', required: false, description: '냉방 용량 (BTU)' },
      { name: 'heating_capacity_btu', type: 'number', required: false, description: '난방 용량 (BTU)' },
      { name: 'target_temperature', type: 'number', required: false, description: '목표 온도 (섭씨)' },
      { name: 'current_temperature', type: 'number', required: false, description: '현재 온도 (섭씨)' },
      { name: 'humidity_control', type: 'boolean', required: false, description: '습도 제어 기능' },
      { name: 'air_quality_monitoring', type: 'boolean', required: false, description: '공기질 모니터링' },
      { name: 'energy_rating', type: 'string', required: false, description: '에너지 등급' }
    ]
  },
  {
    name: 'AudioSystem',
    label: '음향 시스템',
    description: '매장 음향 재생 시스템',
    icon: 'Music',
    color: '#8b5cf6',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.4, height: 0.3, depth: 0.3 },
    model_3d_metadata: {
      max_zones: 4,
      supports_streaming: true,
      audio_format: 'stereo'
    },
    properties: [
      { name: 'audio_system_id', type: 'string', required: true, description: '음향 시스템 ID' },
      { name: 'system_type', type: 'string', required: false, description: '시스템 유형 (zone/distributed/pa)' },
      { name: 'num_speakers', type: 'number', required: false, description: '스피커 개수' },
      { name: 'total_power_watts', type: 'number', required: false, description: '총 출력 (W)' },
      { name: 'current_volume', type: 'number', required: false, description: '현재 볼륨 (%)' },
      { name: 'supports_zones', type: 'boolean', required: false, description: '구역별 제어 지원' },
      { name: 'audio_sources', type: 'array', required: false, description: '오디오 소스 (streaming/radio/local)' },
      { name: 'currently_playing', type: 'string', required: false, description: '현재 재생 중인 콘텐츠' }
    ]
  },
  {
    name: 'MusicPlaylist',
    label: '음악 재생목록',
    description: '매장 배경 음악 재생목록',
    icon: 'ListMusic',
    color: '#ec4899',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'playlist_id', type: 'string', required: true, description: '재생목록 ID' },
      { name: 'playlist_name', type: 'string', required: true, description: '재생목록 이름' },
      { name: 'genre', type: 'string', required: false, description: '장르' },
      { name: 'mood', type: 'string', required: false, description: '분위기 (energetic/calm/upbeat/relaxing)' },
      { name: 'total_duration_minutes', type: 'number', required: false, description: '총 재생 시간 (분)' },
      { name: 'track_count', type: 'number', required: false, description: '트랙 개수' },
      { name: 'shuffle_enabled', type: 'boolean', required: false, description: '셔플 모드' },
      { name: 'repeat_mode', type: 'string', required: false, description: '반복 모드 (none/single/all)' },
      { name: 'schedule', type: 'array', required: false, description: '재생 스케줄 (시간대별)' }
    ]
  },
  {
    name: 'ScentDiffuser',
    label: '향기 디퓨저',
    description: '매장 향기 시스템',
    icon: 'Sparkles',
    color: '#f472b6',
    model_3d_type: 'device',
    model_3d_dimensions: { width: 0.2, height: 0.3, depth: 0.2 },
    model_3d_metadata: {
      coverage_sqm: 100,
      refill_interval_days: 30
    },
    properties: [
      { name: 'diffuser_id', type: 'string', required: true, description: '디퓨저 ID' },
      { name: 'scent_type', type: 'string', required: false, description: '향 종류' },
      { name: 'intensity_level', type: 'number', required: false, description: '강도 레벨 (1-10)' },
      { name: 'coverage_area_sqm', type: 'number', required: false, description: '커버 면적 (제곱미터)' },
      { name: 'refill_level', type: 'number', required: false, description: '리필 잔량 (%)' },
      { name: 'schedule_active', type: 'boolean', required: false, description: '스케줄 활성화 여부' },
      { name: 'operating_hours', type: 'array', required: false, description: '작동 시간대' }
    ]
  },

  // ==========================================
  // 4. 상품 진열 관련 (Product Display)
  // ==========================================
  {
    name: 'ProductPlacement',
    label: '상품 배치',
    description: '상품의 구체적인 진열 위치',
    icon: 'MapPin',
    color: '#f59e0b',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'placement_id', type: 'string', required: true, description: '배치 ID' },
      { name: 'shelf_level', type: 'number', required: false, description: '선반 단 번호 (아래부터 1)' },
      { name: 'position_index', type: 'number', required: false, description: '선반 내 위치 인덱스' },
      { name: 'facing_count', type: 'number', required: false, description: '전면 진열 개수 (페이싱)' },
      { name: 'stock_depth', type: 'number', required: false, description: '후면 재고 깊이' },
      { name: 'display_orientation', type: 'string', required: false, description: '진열 방향 (front/side/angled)' },
      { name: 'is_featured', type: 'boolean', required: false, description: '프로모션 진열 여부' },
      { name: 'visibility_score', type: 'number', required: false, description: '가시성 점수 (1-10)' }
    ]
  },
  {
    name: 'Display',
    label: '디스플레이',
    description: '특별 상품 디스플레이',
    icon: 'Gift',
    color: '#fb923c',
    model_3d_type: 'furniture',
    model_3d_dimensions: { width: 1.0, height: 1.5, depth: 0.8 },
    model_3d_metadata: {
      display_type: 'endcap',
      seasonal: false
    },
    properties: [
      { name: 'display_id', type: 'string', required: true, description: '디스플레이 ID' },
      { name: 'display_type', type: 'string', required: false, description: '디스플레이 유형 (endcap/power_wing/dump_bin/pallet)' },
      { name: 'theme', type: 'string', required: false, description: '테마 (seasonal/promotional/clearance/new_arrival)' },
      { name: 'start_date', type: 'string', required: false, description: '시작 날짜' },
      { name: 'end_date', type: 'string', required: false, description: '종료 날짜' },
      { name: 'product_capacity', type: 'number', required: false, description: '상품 수용 개수' }
    ]
  },

  // ==========================================
  // 5. 인력 & 고객 (Staff & Customer)
  // ==========================================
  {
    name: 'StaffZone',
    label: '직원 구역 할당',
    description: '직원의 담당 구역 정보',
    icon: 'UserCheck',
    color: '#4ade80',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'assignment_id', type: 'string', required: true, description: '할당 ID' },
      { name: 'shift_start', type: 'string', required: false, description: '근무 시작 시간' },
      { name: 'shift_end', type: 'string', required: false, description: '근무 종료 시간' },
      { name: 'role_in_zone', type: 'string', required: false, description: '구역 내 역할 (sales/restocking/cleaning/security)' },
      { name: 'is_primary', type: 'boolean', required: false, description: '주 담당 구역 여부' }
    ]
  },
  {
    name: 'CustomerJourney',
    label: '고객 여정',
    description: '고객의 매장 내 이동 경로',
    icon: 'Route',
    color: '#fb7185',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'journey_id', type: 'string', required: true, description: '여정 ID' },
      { name: 'path_coordinates', type: 'array', required: false, description: '이동 경로 좌표 배열' },
      { name: 'dwell_times', type: 'array', required: false, description: '각 구역별 체류 시간 (초)' },
      { name: 'zones_visited', type: 'array', required: false, description: '방문한 구역 목록' },
      { name: 'total_distance_m', type: 'number', required: false, description: '총 이동 거리 (미터)' },
      { name: 'journey_duration_sec', type: 'number', required: false, description: '총 여정 시간 (초)' },
      { name: 'converted', type: 'boolean', required: false, description: '구매 전환 여부' }
    ]
  },

  // ==========================================
  // 6. 비즈니스 인텔리전스 (Business Intelligence)
  // ==========================================
  {
    name: 'Store',
    label: '매장',
    description: '물리적 매장 위치',
    icon: 'Store',
    color: '#3b82f6',
    model_3d_type: 'space',
    model_3d_dimensions: { width: 20, height: 3.5, depth: 15 },
    model_3d_metadata: {
      supports_heatmap: true,
      supports_pathflow: true,
      contains_zones: true
    },
    properties: [
      { name: 'store_code', type: 'string', required: true, description: '매장 코드' },
      { name: 'name', type: 'string', required: true, description: '매장명' },
      { name: 'location', type: 'string', required: true, description: '주소' },
      { name: 'area_sqm', type: 'number', required: false, description: '매장 면적(㎡)' },
      { name: 'opening_date', type: 'string', required: false, description: '오픈일' },
      { name: 'daily_traffic', type: 'number', required: false, description: '일일 방문객 수' },
      { name: 'floor_plan_url', type: 'string', required: false, description: '평면도 URL' },
      { name: 'ceiling_height', type: 'number', required: false, description: '천장 높이 (미터)' }
    ]
  },
  {
    name: 'Customer',
    label: '고객',
    description: '고객 정보',
    icon: 'Users',
    color: '#8b5cf6',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'customer_id', type: 'string', required: true, description: '고객 ID' },
      { name: 'name', type: 'string', required: false, description: '고객명' },
      { name: 'segment', type: 'string', required: false, description: '고객 세그먼트' },
      { name: 'loyalty_level', type: 'string', required: false, description: '로열티 등급' },
      { name: 'lifetime_value', type: 'number', required: false, description: '고객 생애 가치(LTV)' },
      { name: 'churn_risk_score', type: 'number', required: false, description: '이탈 위험 점수' }
    ]
  },
  {
    name: 'Product',
    label: '제품',
    description: '판매 제품 정보',
    icon: 'Package',
    color: '#10b981',
    model_3d_type: 'product',
    model_3d_dimensions: { width: 0.15, height: 0.25, depth: 0.10 },
    model_3d_metadata: {
      default_orientation: 'front',
      stackable: true,
      display_mode: 'shelf'
    },
    properties: [
      { name: 'sku', type: 'string', required: true, description: 'SKU 코드' },
      { name: 'name', type: 'string', required: true, description: '제품명' },
      { name: 'category', type: 'string', required: false, description: '카테고리' },
      { name: 'price', type: 'number', required: true, description: '가격' },
      { name: 'cost', type: 'number', required: false, description: '원가' },
      { name: 'margin_rate', type: 'number', required: false, description: '마진율(%)' },
      { name: 'price_elasticity', type: 'number', required: false, description: '가격 탄력성' },
      { name: 'optimal_price', type: 'number', required: false, description: '최적 가격' },
      { name: 'package_type', type: 'string', required: false, description: '포장 유형' },
      { name: 'display_priority', type: 'number', required: false, description: '진열 우선순위' }
    ]
  },
  {
    name: 'Sale',
    label: '매출',
    description: '판매 트랜잭션',
    icon: 'ShoppingCart',
    color: '#f59e0b',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'transaction_id', type: 'string', required: true, description: '거래 ID' },
      { name: 'amount', type: 'number', required: true, description: '거래 금액' },
      { name: 'timestamp', type: 'string', required: true, description: '거래 시간' },
      { name: 'payment_method', type: 'string', required: false, description: '결제 수단' },
      { name: 'discount_applied', type: 'number', required: false, description: '할인 금액' },
      { name: 'profit', type: 'number', required: false, description: '순이익' }
    ]
  },
  {
    name: 'Visit',
    label: '방문',
    description: '고객 매장 방문 기록',
    icon: 'MapPin',
    color: '#ec4899',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'visit_id', type: 'string', required: true, description: '방문 ID' },
      { name: 'entry_time', type: 'string', required: true, description: '입장 시간' },
      { name: 'exit_time', type: 'string', required: false, description: '퇴장 시간' },
      { name: 'dwell_time_minutes', type: 'number', required: false, description: '체류 시간(분)' },
      { name: 'zones_visited', type: 'array', required: false, description: '방문 구역' },
      { name: 'converted_to_sale', type: 'boolean', required: false, description: '구매 전환 여부' }
    ]
  },
  {
    name: 'Inventory',
    label: '재고',
    description: '제품 재고 정보',
    icon: 'Box',
    color: '#f97316',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'inventory_id', type: 'string', required: true, description: '재고 ID' },
      { name: 'current_stock', type: 'number', required: true, description: '현재 재고' },
      { name: 'optimal_stock', type: 'number', required: false, description: '최적 재고' },
      { name: 'reorder_point', type: 'number', required: false, description: '재주문 시점' },
      { name: 'stockout_risk', type: 'number', required: false, description: '품절 위험도(%)' },
      { name: 'turnover_rate', type: 'number', required: false, description: '재고 회전율' },
      { name: 'holding_cost', type: 'number', required: false, description: '재고 유지 비용' }
    ]
  },
  {
    name: 'DemandForecast',
    label: '수요 예측',
    description: '미래 수요 예측',
    icon: 'TrendingUp',
    color: '#84cc16',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'forecast_id', type: 'string', required: true, description: '예측 ID' },
      { name: 'forecast_date', type: 'string', required: true, description: '예측 날짜' },
      { name: 'predicted_demand', type: 'number', required: true, description: '예측 수요량' },
      { name: 'confidence_level', type: 'number', required: false, description: '신뢰도(%)' },
      { name: 'seasonality_factor', type: 'number', required: false, description: '계절성 요인' },
      { name: 'trend_factor', type: 'number', required: false, description: '트렌드 요인' }
    ]
  },
  {
    name: 'PriceOptimization',
    label: '가격 최적화',
    description: '동적 가격 최적화',
    icon: 'DollarSign',
    color: '#eab308',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'optimization_id', type: 'string', required: true, description: '최적화 ID' },
      { name: 'current_price', type: 'number', required: true, description: '현재 가격' },
      { name: 'recommended_price', type: 'number', required: true, description: '권장 가격' },
      { name: 'expected_revenue_lift', type: 'number', required: false, description: '예상 매출 증가율(%)' },
      { name: 'competitor_price', type: 'number', required: false, description: '경쟁사 가격' },
      { name: 'wtp_average', type: 'number', required: false, description: '평균 지불의향가격' }
    ]
  },
  {
    name: 'Promotion',
    label: '프로모션',
    description: '오프라인 프로모션',
    icon: 'Percent',
    color: '#ef4444',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'promotion_id', type: 'string', required: true, description: '프로모션 ID' },
      { name: 'name', type: 'string', required: true, description: '프로모션명' },
      { name: 'discount_rate', type: 'number', required: false, description: '할인율(%)' },
      { name: 'start_date', type: 'string', required: true, description: '시작일' },
      { name: 'end_date', type: 'string', required: true, description: '종료일' },
      { name: 'effectiveness_score', type: 'number', required: false, description: '효과성 점수' },
      { name: 'roi', type: 'number', required: false, description: 'ROI(%)' }
    ]
  },
  {
    name: 'MarketingCampaign',
    label: '마케팅 캠페인',
    description: '오프라인 마케팅 캠페인',
    icon: 'Zap',
    color: '#a855f7',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'campaign_id', type: 'string', required: true, description: '캠페인 ID' },
      { name: 'name', type: 'string', required: true, description: '캠페인명' },
      { name: 'budget', type: 'number', required: false, description: '예산' },
      { name: 'reach', type: 'number', required: false, description: '도달 수' },
      { name: 'conversion_rate', type: 'number', required: false, description: '전환율(%)' },
      { name: 'cost_per_acquisition', type: 'number', required: false, description: '고객 획득 비용' },
      { name: 'suitability_score', type: 'number', required: false, description: '적합성 점수' }
    ]
  },
  {
    name: 'PurchaseConversion',
    label: '구매 전환',
    description: '방문-구매 전환 분석',
    icon: 'CheckCircle',
    color: '#14b8a6',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'conversion_id', type: 'string', required: true, description: '전환 ID' },
      { name: 'conversion_rate', type: 'number', required: true, description: '전환율(%)' },
      { name: 'average_basket_size', type: 'number', required: false, description: '평균 장바구니 크기' },
      { name: 'conversion_factors', type: 'array', required: false, description: '전환 영향 요인' },
      { name: 'abandonment_rate', type: 'number', required: false, description: '이탈율(%)' }
    ]
  },
  {
    name: 'ZoneAnalysis',
    label: '구역 분석',
    description: '매장 구역별 분석',
    icon: 'Target',
    color: '#64748b',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'zone_id', type: 'string', required: true, description: '구역 ID' },
      { name: 'zone_name', type: 'string', required: true, description: '구역명' },
      { name: 'traffic_density', type: 'number', required: false, description: '트래픽 밀도' },
      { name: 'dwell_time_avg', type: 'number', required: false, description: '평균 체류 시간' },
      { name: 'conversion_rate', type: 'number', required: false, description: '전환율(%)' },
      { name: 'revenue_per_sqm', type: 'number', required: false, description: '평당 매출' }
    ]
  },
  {
    name: 'StaffSchedule',
    label: '직원 스케줄',
    description: '직원 근무 스케줄링',
    icon: 'Calendar',
    color: '#6366f1',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'schedule_id', type: 'string', required: true, description: '스케줄 ID' },
      { name: 'shift_start', type: 'string', required: true, description: '근무 시작' },
      { name: 'shift_end', type: 'string', required: true, description: '근무 종료' },
      { name: 'efficiency_score', type: 'number', required: false, description: '효율성 점수' },
      { name: 'labor_cost', type: 'number', required: false, description: '인건비' }
    ]
  },
  {
    name: 'Alert',
    label: '알림',
    description: '비즈니스 알림 및 경고',
    icon: 'AlertTriangle',
    color: '#dc2626',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'alert_id', type: 'string', required: true, description: '알림 ID' },
      { name: 'type', type: 'string', required: true, description: '알림 유형' },
      { name: 'severity', type: 'string', required: true, description: '심각도' },
      { name: 'message', type: 'string', required: true, description: '메시지' },
      { name: 'triggered_at', type: 'string', required: true, description: '발생 시간' },
      { name: 'resolved', type: 'boolean', required: false, description: '해결 여부' }
    ]
  },
  {
    name: 'Staff',
    label: '직원',
    description: '매장 직원 정보',
    icon: 'UserCheck',
    color: '#4ade80',
    model_3d_type: null,
    model_3d_dimensions: null,
    model_3d_metadata: {},
    properties: [
      { name: 'staff_id', type: 'string', required: true, description: '직원 ID' },
      { name: 'name', type: 'string', required: true, description: '직원명' },
      { name: 'role', type: 'string', required: false, description: '역할' },
      { name: 'department', type: 'string', required: false, description: '부서' },
      { name: 'performance_score', type: 'number', required: false, description: '성과 점수' }
    ]
  }
];

export const COMPREHENSIVE_RELATION_TYPES = [
  // 공간 관계
  { name: 'contains', label: '포함함', description: 'A가 B를 포함함', source_entity_type: 'Store', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'contains', label: '포함함', description: 'A가 B를 포함함', source_entity_type: 'Zone', target_entity_type: 'Shelf', directionality: 'directed' },
  { name: 'contains', label: '포함함', description: 'A가 B를 포함함', source_entity_type: 'Zone', target_entity_type: 'DisplayTable', directionality: 'directed' },
  { name: 'contains', label: '포함함', description: 'A가 B를 포함함', source_entity_type: 'Zone', target_entity_type: 'Rack', directionality: 'directed' },
  { name: 'contains', label: '포함함', description: 'A가 B를 포함함', source_entity_type: 'Zone', target_entity_type: 'CheckoutCounter', directionality: 'directed' },
  { name: 'contains', label: '포함함', description: 'A가 B를 포함함', source_entity_type: 'Zone', target_entity_type: 'FittingRoom', directionality: 'directed' },
  { name: 'bounded_by', label: '경계됨', description: 'A가 B에 의해 경계됨', source_entity_type: 'Zone', target_entity_type: 'Wall', directionality: 'directed' },
  { name: 'connects_to', label: '연결됨', description: 'A가 B와 연결됨', source_entity_type: 'Zone', target_entity_type: 'Aisle', directionality: 'undirected' },
  { name: 'adjacent_to', label: '인접함', description: 'A가 B와 인접함', source_entity_type: 'Zone', target_entity_type: 'Zone', directionality: 'undirected' },
  { name: 'leads_to', label: '통함', description: 'A가 B로 통함', source_entity_type: 'Entrance', target_entity_type: 'Zone', directionality: 'directed' },

  // 상품 진열 관계
  { name: 'displays', label: '진열함', description: 'A가 B를 진열함', source_entity_type: 'Shelf', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'displays', label: '진열함', description: 'A가 B를 진열함', source_entity_type: 'DisplayTable', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'displays', label: '진열함', description: 'A가 B를 진열함', source_entity_type: 'Rack', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'placed_at', label: '배치됨', description: 'A가 B에 배치됨', source_entity_type: 'Product', target_entity_type: 'ProductPlacement', directionality: 'directed' },
  { name: 'featured_in', label: '특별진열', description: 'A가 B에서 특별 진열됨', source_entity_type: 'Product', target_entity_type: 'Display', directionality: 'directed' },
  { name: 'placed_on', label: '위치함', description: 'A가 B 위에 위치함', source_entity_type: 'ProductPlacement', target_entity_type: 'Shelf', directionality: 'directed' },
  { name: 'placed_on', label: '위치함', description: 'A가 B 위에 위치함', source_entity_type: 'ProductPlacement', target_entity_type: 'DisplayTable', directionality: 'directed' },

  // IoT & 센서 관계
  { name: 'monitors', label: '모니터함', description: 'A가 B를 모니터함', source_entity_type: 'Sensor', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'monitors', label: '모니터함', description: 'A가 B를 모니터함', source_entity_type: 'Camera', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'installed_in', label: '설치됨', description: 'A가 B에 설치됨', source_entity_type: 'Beacon', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'installed_in', label: '설치됨', description: 'A가 B에 설치됨', source_entity_type: 'WiFiProbe', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'mounted_on', label: '장착됨', description: 'A가 B에 장착됨', source_entity_type: 'Sensor', target_entity_type: 'Wall', directionality: 'directed' },
  { name: 'mounted_on', label: '장착됨', description: 'A가 B에 장착됨', source_entity_type: 'Camera', target_entity_type: 'Wall', directionality: 'directed' },
  { name: 'mounted_on', label: '장착됨', description: 'A가 B에 장착됨', source_entity_type: 'DigitalSignage', target_entity_type: 'Wall', directionality: 'directed' },

  // 환경 시스템 관계
  { name: 'illuminates', label: '조명함', description: 'A가 B를 조명함', source_entity_type: 'Lighting', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'illuminates', label: '조명함', description: 'A가 B를 조명함', source_entity_type: 'Lighting', target_entity_type: 'Display', directionality: 'directed' },
  { name: 'climate_controls', label: '온도제어', description: 'A가 B의 온도를 제어함', source_entity_type: 'HVAC', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'plays_in', label: '재생됨', description: 'A가 B에서 재생됨', source_entity_type: 'AudioSystem', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'plays', label: '재생함', description: 'A가 B를 재생함', source_entity_type: 'AudioSystem', target_entity_type: 'MusicPlaylist', directionality: 'directed' },
  { name: 'diffuses_in', label: '확산됨', description: 'A가 B에서 확산됨', source_entity_type: 'ScentDiffuser', target_entity_type: 'Zone', directionality: 'directed' },

  // 디지털 장비 관계
  { name: 'located_at', label: '위치함', description: 'A가 B에 위치함', source_entity_type: 'POS', target_entity_type: 'CheckoutCounter', directionality: 'directed' },
  { name: 'located_at', label: '위치함', description: 'A가 B에 위치함', source_entity_type: 'Kiosk', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'located_at', label: '위치함', description: 'A가 B에 위치함', source_entity_type: 'SmartMirror', target_entity_type: 'FittingRoom', directionality: 'directed' },
  { name: 'displays_on', label: '표시됨', description: 'A가 B에 표시됨', source_entity_type: 'Product', target_entity_type: 'DigitalSignage', directionality: 'directed' },

  // 직원 관계
  { name: 'assigned_to', label: '할당됨', description: 'A가 B에 할당됨', source_entity_type: 'Staff', target_entity_type: 'StaffZone', directionality: 'directed' },
  { name: 'manages', label: '관리함', description: 'A가 B를 관리함', source_entity_type: 'StaffZone', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'works_at', label: '근무함', description: 'A가 B에서 근무함', source_entity_type: 'Staff', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'operates', label: '운영함', description: 'A가 B를 운영함', source_entity_type: 'Staff', target_entity_type: 'POS', directionality: 'directed' },

  // 고객 관계
  { name: 'visited', label: '방문함', description: 'A가 B를 방문함', source_entity_type: 'Customer', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'has_journey', label: '여정 기록', description: 'A의 B 여정', source_entity_type: 'Visit', target_entity_type: 'CustomerJourney', directionality: 'directed' },
  { name: 'traveled_through', label: '이동함', description: 'A가 B를 통해 이동함', source_entity_type: 'CustomerJourney', target_entity_type: 'Zone', directionality: 'directed' },
  { name: 'purchased_at', label: '구매함', description: 'A가 B에서 구매함', source_entity_type: 'Customer', target_entity_type: 'POS', directionality: 'directed' },

  // 재고 관계
  { name: 'stores', label: '보관함', description: 'A가 B를 보관함', source_entity_type: 'StorageRoom', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'restocked_from', label: '보충됨', description: 'A가 B에서 보충됨', source_entity_type: 'Shelf', target_entity_type: 'StorageRoom', directionality: 'directed' },

  // 구조 관계
  { name: 'has_window', label: '창문있음', description: 'A에 B 창문이 있음', source_entity_type: 'Wall', target_entity_type: 'Window', directionality: 'directed' },
  { name: 'has_entrance', label: '출입구있음', description: 'A에 B 출입구가 있음', source_entity_type: 'Store', target_entity_type: 'Entrance', directionality: 'directed' },
  { name: 'accesses', label: '접근함', description: 'A가 B에 접근함', source_entity_type: 'Entrance', target_entity_type: 'StorageRoom', directionality: 'directed' },

  // ==========================================
  // 비즈니스 인텔리전스 관계 (43개)
  // ==========================================
  
  // 고객 관련 관계
  { name: 'customer_visits_store', label: '방문했다', description: '고객이 매장을 방문', source_entity_type: 'Customer', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'purchased', label: '구매했다', description: '고객이 제품을 구매', source_entity_type: 'Customer', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'has_segment', label: '세그먼트 소속', description: '같은 고객 세그먼트', source_entity_type: 'Customer', target_entity_type: 'Customer', directionality: 'undirected' },
  
  // 매출/판매 관계
  { name: 'sale_of', label: '판매 기록', description: '특정 제품의 판매', source_entity_type: 'Sale', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'occurred_at', label: '발생 위치', description: '매출이 발생한 매장', source_entity_type: 'Sale', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'made_by', label: '구매자', description: '매출을 발생시킨 고객', source_entity_type: 'Sale', target_entity_type: 'Customer', directionality: 'directed' },
  
  // 방문 관계
  { name: 'visit_to_store', label: '매장 방문', description: '방문한 매장', source_entity_type: 'Visit', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'visit_by_customer', label: '방문 고객', description: '방문한 고객', source_entity_type: 'Visit', target_entity_type: 'Customer', directionality: 'directed' },
  { name: 'converted_to_sale', label: '전환됨', description: '방문이 매출로 전환', source_entity_type: 'Visit', target_entity_type: 'Sale', directionality: 'directed' },
  
  // 고객 동선 관계
  { name: 'path_of_visit', label: '방문 경로', description: '방문의 이동 경로', source_entity_type: 'CustomerJourney', target_entity_type: 'Visit', directionality: 'directed' },
  { name: 'passed_through_zone', label: '통과 구역', description: '동선이 통과한 구역', source_entity_type: 'CustomerJourney', target_entity_type: 'ZoneAnalysis', directionality: 'directed' },
  
  // 재고 관계
  { name: 'inventory_of', label: '재고 제품', description: '재고 관리 대상 제품', source_entity_type: 'Inventory', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'stored_at_store', label: '보관 매장', description: '재고가 보관된 매장', source_entity_type: 'Inventory', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'triggers_alert', label: '알림 발생', description: '재고가 알림을 발생', source_entity_type: 'Inventory', target_entity_type: 'Alert', directionality: 'directed' },
  
  // 수요 예측 관계
  { name: 'forecast_for', label: '예측 대상', description: '수요 예측 대상 제품', source_entity_type: 'DemandForecast', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'forecast_at_store', label: '예측 매장', description: '수요 예측 매장', source_entity_type: 'DemandForecast', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'influences_inventory', label: '재고 영향', description: '예측이 재고 계획에 영향', source_entity_type: 'DemandForecast', target_entity_type: 'Inventory', directionality: 'directed' },
  
  // 가격 최적화 관계
  { name: 'optimizes_price', label: '가격 최적화', description: '가격 최적화 대상 제품', source_entity_type: 'PriceOptimization', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'based_on_demand', label: '수요 기반', description: '수요 예측 기반 가격 결정', source_entity_type: 'PriceOptimization', target_entity_type: 'DemandForecast', directionality: 'directed' },
  { name: 'considers_wtp', label: 'WTP 고려', description: '고객 지불의향가격 반영', source_entity_type: 'PriceOptimization', target_entity_type: 'Customer', directionality: 'directed' },
  
  // 프로모션 관계
  { name: 'promotes_product', label: '프로모션 제품', description: '프로모션 대상 제품', source_entity_type: 'Promotion', target_entity_type: 'Product', directionality: 'directed' },
  { name: 'runs_at_store', label: '실행 매장', description: '프로모션 실행 매장', source_entity_type: 'Promotion', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'affects_sales', label: '매출 영향', description: '프로모션이 매출에 영향', source_entity_type: 'Promotion', target_entity_type: 'Sale', directionality: 'directed' },
  { name: 'part_of_campaign', label: '캠페인 소속', description: '마케팅 캠페인의 일부', source_entity_type: 'Promotion', target_entity_type: 'MarketingCampaign', directionality: 'directed' },
  
  // 마케팅 캠페인 관계
  { name: 'targets_customers', label: '타겟 고객', description: '캠페인 타겟 고객', source_entity_type: 'MarketingCampaign', target_entity_type: 'Customer', directionality: 'directed' },
  { name: 'increases_visits', label: '방문 증가', description: '캠페인이 방문 증가', source_entity_type: 'MarketingCampaign', target_entity_type: 'Visit', directionality: 'directed' },
  { name: 'deployed_at_store', label: '실행 매장', description: '캠페인 실행 매장', source_entity_type: 'MarketingCampaign', target_entity_type: 'Store', directionality: 'directed' },
  
  // 구매 전환 관계
  { name: 'conversion_from_visit', label: '방문 전환', description: '방문에서의 전환 분석', source_entity_type: 'PurchaseConversion', target_entity_type: 'Visit', directionality: 'directed' },
  { name: 'conversion_to_sale', label: '매출 전환', description: '매출로의 전환', source_entity_type: 'PurchaseConversion', target_entity_type: 'Sale', directionality: 'directed' },
  { name: 'influenced_by_path', label: '동선 영향', description: '고객 동선이 전환에 영향', source_entity_type: 'PurchaseConversion', target_entity_type: 'CustomerJourney', directionality: 'directed' },
  { name: 'in_zone_conversion', label: '구역 내 전환', description: '특정 구역에서의 전환', source_entity_type: 'PurchaseConversion', target_entity_type: 'ZoneAnalysis', directionality: 'directed' },
  
  // 직원 스케줄 관계
  { name: 'schedule_at_store', label: '근무 매장', description: '직원 근무 매장', source_entity_type: 'StaffSchedule', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'manages_zone_schedule', label: '담당 구역', description: '직원이 담당하는 구역', source_entity_type: 'StaffSchedule', target_entity_type: 'ZoneAnalysis', directionality: 'directed' },
  { name: 'impacts_sales', label: '매출 영향', description: '직원 배치가 매출에 영향', source_entity_type: 'StaffSchedule', target_entity_type: 'Sale', directionality: 'directed' },
  { name: 'staff_has_schedule', label: '스케줄 보유', description: '직원이 스케줄 보유', source_entity_type: 'Staff', target_entity_type: 'StaffSchedule', directionality: 'directed' },
  
  // 구역 분석 관계
  { name: 'zone_in_store', label: '매장 구역', description: '매장 내 구역', source_entity_type: 'ZoneAnalysis', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'zone_traffic', label: '구역 트래픽', description: '구역 방문 트래픽', source_entity_type: 'ZoneAnalysis', target_entity_type: 'Visit', directionality: 'directed' },
  { name: 'zone_revenue', label: '구역 매출', description: '구역에서 발생한 매출', source_entity_type: 'ZoneAnalysis', target_entity_type: 'Sale', directionality: 'directed' },
  { name: 'displays_product_zone', label: '제품 진열', description: '구역에 진열된 제품', source_entity_type: 'ZoneAnalysis', target_entity_type: 'Product', directionality: 'directed' },
  
  // 알림 관계
  { name: 'alert_for_inventory', label: '재고 알림', description: '재고 관련 알림', source_entity_type: 'Alert', target_entity_type: 'Inventory', directionality: 'directed' },
  { name: 'alert_for_store', label: '매장 알림', description: '매장 관련 알림', source_entity_type: 'Alert', target_entity_type: 'Store', directionality: 'directed' },
  { name: 'alert_for_product', label: '제품 알림', description: '제품 관련 알림', source_entity_type: 'Alert', target_entity_type: 'Product', directionality: 'directed' }
];

export async function insertComprehensiveSchema(userId: string) {
  try {
    // 1. Insert Entity Types
    console.log('Inserting comprehensive entity types...');
    const entityTypesWithUserId = COMPREHENSIVE_ENTITY_TYPES.map(et => ({
      ...et,
      user_id: userId,
      properties: JSON.stringify(et.properties),
      model_3d_dimensions: et.model_3d_dimensions ? JSON.stringify(et.model_3d_dimensions) : null,
      model_3d_metadata: et.model_3d_metadata ? JSON.stringify(et.model_3d_metadata) : null
    }));

    const { data: entityTypes, error: entityTypesError } = await supabase
      .from('ontology_entity_types')
      .insert(entityTypesWithUserId)
      .select();

    if (entityTypesError) {
      console.error('Entity types error:', entityTypesError);
      throw entityTypesError;
    }

    console.log(`✅ Inserted ${entityTypes?.length || 0} entity types`);

    // 2. Insert Relation Types
    console.log('Inserting comprehensive relation types...');
    console.log('Total relation types to insert:', COMPREHENSIVE_RELATION_TYPES.length);
    
    const relationTypesWithUserId = COMPREHENSIVE_RELATION_TYPES.map(rt => ({
      ...rt,
      user_id: userId,
      properties: JSON.stringify([])
    }));

    console.log('Sample relation:', relationTypesWithUserId[0]);

    const { data: relationTypes, error: relationTypesError } = await supabase
      .from('ontology_relation_types')
      .insert(relationTypesWithUserId)
      .select();

    if (relationTypesError) {
      console.error('Relation types error:', relationTypesError);
      throw relationTypesError;
    }

    console.log(`✅ Inserted ${relationTypes?.length || 0} relation types`);

    return {
      success: true,
      entityTypesCount: entityTypes?.length || 0,
      relationTypesCount: relationTypes?.length || 0
    };
  } catch (error: any) {
    console.error('Insert comprehensive schema error:', error);
    throw error;
  }
}

export async function insertRelationsOnly(userId: string) {
  try {
    console.log('Inserting relation types only...');
    console.log('Total relation types to insert:', COMPREHENSIVE_RELATION_TYPES.length);
    
    const relationTypesWithUserId = COMPREHENSIVE_RELATION_TYPES.map(rt => ({
      ...rt,
      user_id: userId,
      properties: JSON.stringify([])
    }));

    const { data: relationTypes, error: relationTypesError } = await supabase
      .from('ontology_relation_types')
      .insert(relationTypesWithUserId)
      .select();

    if (relationTypesError) {
      console.error('Relation types error:', relationTypesError);
      throw relationTypesError;
    }

    console.log(`✅ Inserted ${relationTypes?.length || 0} relation types`);

    return {
      success: true,
      relationTypesCount: relationTypes?.length || 0
    };
  } catch (error: any) {
    console.error('Insert relations error:', error);
    throw error;
  }
}
