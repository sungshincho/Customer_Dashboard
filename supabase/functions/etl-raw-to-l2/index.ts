import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * etl-raw-to-l2: 업로드된 원천 데이터를 L2 Fact/Dimension 테이블에 삽입
 * 
 * 아키텍처:
 * 고객 업로드 → Storage → integrated-data-pipeline → etl-raw-to-l2 → L2 테이블
 *                                                          ↓
 *                                              customers, products, purchases,
 *                                              visits, staff, line_items, etc.
 * 
 * 지원 데이터 타입:
 * - customers: 고객 데이터 → customers 테이블
 * - products: 상품 데이터 → products 테이블
 * - purchases: 구매 데이터 → purchases + line_items 테이블
 * - visits: 방문 데이터 → visits 테이블
 * - staff: 직원 데이터 → staff 테이블
 * - wifi_tracking: WiFi 트래킹 → wifi_tracking + zone_events 테이블
 */

interface ETLRequest {
  import_id: string;
  store_id: string;
  org_id: string;
  data_type: string;  // customers, products, purchases, visits, staff, wifi_tracking
  raw_data?: any[];   // 직접 전달하거나 import_id로 조회
}

interface ETLResult {
  success: boolean;
  data_type: string;
  records_processed: number;
  records_inserted: number;
  records_updated: number;
  errors: string[];
  tables_affected: string[];
}

// 필드 매핑 정의 (CSV 컬럼명 → DB 컬럼명)
const FIELD_MAPPINGS: Record<string, Record<string, string>> = {
  customers: {
    // CSV 컬럼명 → DB 컬럼명
    'customer_id': 'id',
    'id': 'id',
    'name': 'name',
    'customer_name': 'name',
    '고객명': 'name',
    'email': 'email',
    'phone': 'phone',
    'phone_number': 'phone',
    '전화번호': 'phone',
    'gender': 'gender',
    '성별': 'gender',
    'age': 'age',
    '나이': 'age',
    'age_group': 'age_group',
    '연령대': 'age_group',
    'first_visit_date': 'first_visit_date',
    'last_visit_date': 'last_visit_date',
    'total_visits': 'total_visits',
    'total_spent': 'total_spent',
    'membership_tier': 'membership_tier',
    '등급': 'membership_tier',
    'created_at': 'created_at',
  },
  products: {
    'product_id': 'id',
    'id': 'id',
    'name': 'product_name',
    'product_name': 'product_name',
    '상품명': 'product_name',
    'category': 'category',
    '카테고리': 'category',
    'price': 'price',
    '가격': 'price',
    'cost_price': 'cost_price',
    '원가': 'cost_price',
    'stock': 'stock',
    'stock_quantity': 'stock',
    '재고': 'stock',
    'sku': 'sku',
    'brand': 'brand',
    '브랜드': 'brand',
    'supplier': 'supplier',
    '공급업체': 'supplier',
    'description': 'description',
  },
  purchases: {
    'purchase_id': 'id',
    'transaction_id': 'id',
    'id': 'id',
    'customer_id': 'customer_id',
    '고객ID': 'customer_id',
    'product_id': 'product_id',
    '상품ID': 'product_id',
    'quantity': 'quantity',
    '수량': 'quantity',
    'unit_price': 'unit_price',
    '단가': 'unit_price',
    'total_price': 'total_price',
    'total_amount': 'total_price',
    '총액': 'total_price',
    'purchase_date': 'purchase_date',
    'transaction_date': 'purchase_date',
    '구매일': 'purchase_date',
    'payment_method': 'payment_method',
    '결제수단': 'payment_method',
  },
  visits: {
    'visit_id': 'id',
    'id': 'id',
    'customer_id': 'customer_id',
    '고객ID': 'customer_id',
    'visit_date': 'visit_date',
    '방문일': 'visit_date',
    'duration_minutes': 'duration_minutes',
    'duration': 'duration_minutes',
    '체류시간': 'duration_minutes',
    'zones_visited': 'zones_visited',
    '방문존': 'zones_visited',
    'entry_time': 'entry_time',
    '입장시간': 'entry_time',
    'exit_time': 'exit_time',
    '퇴장시간': 'exit_time',
  },
  staff: {
    'staff_id': 'id',
    'employee_id': 'id',
    'id': 'id',
    'name': 'name',
    '이름': 'name',
    'role': 'role',
    'position': 'role',
    '직책': 'role',
    'department': 'department',
    '부서': 'department',
    'hire_date': 'hire_date',
    '입사일': 'hire_date',
    'email': 'email',
    'phone': 'phone',
  },
};

// 데이터 타입 추론 (파일명 또는 컬럼 기반)
function inferDataType(fileName: string, columns: string[]): string {
  const name = fileName.toLowerCase();
  
  // 파일명 기반 추론
  if (name.includes('customer') || name.includes('고객')) return 'customers';
  if (name.includes('product') || name.includes('상품') || name.includes('제품')) return 'products';
  if (name.includes('purchase') || name.includes('order') || name.includes('구매') || name.includes('주문')) return 'purchases';
  if (name.includes('visit') || name.includes('방문')) return 'visits';
  if (name.includes('staff') || name.includes('employee') || name.includes('직원')) return 'staff';
  if (name.includes('wifi') || name.includes('tracking') || name.includes('sensor')) return 'wifi_tracking';
  
  // 컬럼명 기반 추론
  const colSet = new Set(columns.map(c => c.toLowerCase()));
  
  if (colSet.has('customer_name') || colSet.has('고객명') || colSet.has('membership_tier')) return 'customers';
  if (colSet.has('product_name') || colSet.has('상품명') || colSet.has('sku')) return 'products';
  if (colSet.has('purchase_date') || colSet.has('transaction_date') || colSet.has('구매일')) return 'purchases';
  if (colSet.has('visit_date') || colSet.has('방문일') || colSet.has('duration_minutes')) return 'visits';
  if (colSet.has('hire_date') || colSet.has('입사일') || colSet.has('department')) return 'staff';
  
  return 'unknown';
}

// 필드 매핑 적용
function mapFields(record: any, dataType: string): any {
  const mapping = FIELD_MAPPINGS[dataType] || {};
  const mapped: any = {};
  
  for (const [csvCol, value] of Object.entries(record)) {
    const dbCol = mapping[csvCol] || mapping[csvCol.toLowerCase()] || csvCol;
    mapped[dbCol] = value;
  }
  
  return mapped;
}

// 날짜 파싱
function parseDate(value: any): string | null {
  if (!value) return null;
  
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// 숫자 파싱
function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(String(value).replace(/[,원₩$]/g, ''));
  return isNaN(num) ? null : num;
}

// UUID 생성 또는 검증
function ensureUUID(value: any): string {
  if (!value) return crypto.randomUUID();
  
  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(String(value))) return String(value);
  
  // UUID가 아니면 새로 생성 (원본 값은 다른 필드에 보존)
  return crypto.randomUUID();
}

// Customers 처리
async function processCustomers(
  supabase: any, 
  data: any[], 
  storeId: string, 
  orgId: string, 
  userId: string
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  
  const customersToUpsert = data.map((record, idx) => {
    try {
      const mapped = mapFields(record, 'customers');
      
      return {
        id: ensureUUID(mapped.id),
        user_id: userId,
        org_id: orgId,
        store_id: storeId,
        name: mapped.name || `Customer ${idx + 1}`,
        email: mapped.email || null,
        phone: mapped.phone || null,
        gender: mapped.gender || null,
        age: parseNumber(mapped.age),
        age_group: mapped.age_group || null,
        first_visit_date: parseDate(mapped.first_visit_date),
        last_visit_date: parseDate(mapped.last_visit_date),
        total_visits: parseNumber(mapped.total_visits) || 0,
        total_spent: parseNumber(mapped.total_spent) || 0,
        membership_tier: mapped.membership_tier || 'basic',
        metadata: { source: 'csv_import', original_id: mapped.id },
      };
    } catch (err: any) {
      errors.push(`Row ${idx + 1}: ${err.message}`);
      return null;
    }
  }).filter(Boolean);
  
  if (customersToUpsert.length > 0) {
    const { data: result, error } = await supabase
      .from('customers')
      .upsert(customersToUpsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      errors.push(`Customers upsert error: ${error.message}`);
    } else {
      inserted = result?.length || 0;
    }
  }
  
  return { inserted, updated, errors };
}

// Products 처리
async function processProducts(
  supabase: any, 
  data: any[], 
  storeId: string, 
  orgId: string, 
  userId: string
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  
  const productsToUpsert = data.map((record, idx) => {
    try {
      const mapped = mapFields(record, 'products');
      
      return {
        id: ensureUUID(mapped.id),
        user_id: userId,
        org_id: orgId,
        store_id: storeId,
        product_name: mapped.product_name || `Product ${idx + 1}`,
        category: mapped.category || 'uncategorized',
        price: parseNumber(mapped.price) || 0,
        cost_price: parseNumber(mapped.cost_price),
        stock: parseNumber(mapped.stock) || 0,
        sku: mapped.sku || null,
        brand: mapped.brand || null,
        supplier: mapped.supplier || null,
        description: mapped.description || null,
        metadata: { source: 'csv_import', original_id: mapped.id },
      };
    } catch (err: any) {
      errors.push(`Row ${idx + 1}: ${err.message}`);
      return null;
    }
  }).filter(Boolean);
  
  if (productsToUpsert.length > 0) {
    const { data: result, error } = await supabase
      .from('products')
      .upsert(productsToUpsert, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      errors.push(`Products upsert error: ${error.message}`);
    } else {
      inserted = result?.length || 0;
    }
  }
  
  return { inserted, updated, errors };
}

// Purchases 처리 (purchases + line_items)
async function processPurchases(
  supabase: any, 
  data: any[], 
  storeId: string, 
  orgId: string, 
  userId: string
): Promise<{ inserted: number; updated: number; errors: string[]; lineItemsInserted: number }> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let lineItemsInserted = 0;
  
  // 기존 고객/상품 ID 매핑 조회
  const { data: existingCustomers } = await supabase
    .from('customers')
    .select('id, metadata')
    .eq('store_id', storeId);
  
  const { data: existingProducts } = await supabase
    .from('products')
    .select('id, metadata')
    .eq('store_id', storeId);
  
  const customerMap = new Map();
  (existingCustomers || []).forEach((c: any) => {
    customerMap.set(c.id, c.id);
    if (c.metadata?.original_id) {
      customerMap.set(String(c.metadata.original_id), c.id);
    }
  });
  
  const productMap = new Map();
  (existingProducts || []).forEach((p: any) => {
    productMap.set(p.id, p.id);
    if (p.metadata?.original_id) {
      productMap.set(String(p.metadata.original_id), p.id);
    }
  });
  
  const purchasesToInsert: any[] = [];
  const lineItemsToInsert: any[] = [];
  
  for (let idx = 0; idx < data.length; idx++) {
    try {
      const record = data[idx];
      const mapped = mapFields(record, 'purchases');
      
      const purchaseId = ensureUUID(mapped.id);
      const customerId = customerMap.get(String(mapped.customer_id)) || null;
      const productId = productMap.get(String(mapped.product_id)) || null;
      const quantity = parseNumber(mapped.quantity) || 1;
      const unitPrice = parseNumber(mapped.unit_price) || 0;
      const totalPrice = parseNumber(mapped.total_price) || (unitPrice * quantity);
      const purchaseDate = parseDate(mapped.purchase_date) || new Date().toISOString();
      
      // Purchase 레코드
      purchasesToInsert.push({
        id: purchaseId,
        user_id: userId,
        org_id: orgId,
        store_id: storeId,
        customer_id: customerId,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
        total_price: totalPrice,
        purchase_date: purchaseDate,
        payment_method: mapped.payment_method || null,
        metadata: { source: 'csv_import', original_id: mapped.id },
      });
      
      // Line Item 레코드
      lineItemsToInsert.push({
        transaction_id: purchaseId,
        purchase_id: purchaseId,
        product_id: productId,
        customer_id: customerId,
        store_id: storeId,
        org_id: orgId,
        quantity,
        unit_price: unitPrice,
        line_total: totalPrice,
        discount_amount: 0,
        tax_amount: 0,
        transaction_date: purchaseDate.split('T')[0],
        transaction_hour: new Date(purchaseDate).getHours(),
        is_return: false,
      });
    } catch (err: any) {
      errors.push(`Row ${idx + 1}: ${err.message}`);
    }
  }
  
  // Purchases 삽입
  if (purchasesToInsert.length > 0) {
    const { data: result, error } = await supabase
      .from('purchases')
      .upsert(purchasesToInsert, { onConflict: 'id' })
      .select();
    
    if (error) {
      errors.push(`Purchases upsert error: ${error.message}`);
    } else {
      inserted = result?.length || 0;
    }
  }
  
  // Line Items 삽입
  if (lineItemsToInsert.length > 0) {
    const { data: result, error } = await supabase
      .from('line_items')
      .insert(lineItemsToInsert)
      .select();
    
    if (error) {
      // 중복 에러 무시
      if (!error.message.includes('duplicate')) {
        errors.push(`Line items insert error: ${error.message}`);
      }
    } else {
      lineItemsInserted = result?.length || 0;
    }
  }
  
  return { inserted, updated, errors, lineItemsInserted };
}

// Visits 처리 (visits + funnel_events)
async function processVisits(
  supabase: any, 
  data: any[], 
  storeId: string, 
  orgId: string, 
  userId: string
): Promise<{ inserted: number; updated: number; errors: string[]; funnelEventsInserted: number }> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  let funnelEventsInserted = 0;
  
  // 기존 고객 ID 매핑 조회
  const { data: existingCustomers } = await supabase
    .from('customers')
    .select('id, metadata')
    .eq('store_id', storeId);
  
  const customerMap = new Map();
  (existingCustomers || []).forEach((c: any) => {
    customerMap.set(c.id, c.id);
    if (c.metadata?.original_id) {
      customerMap.set(String(c.metadata.original_id), c.id);
    }
  });
  
  const visitsToInsert: any[] = [];
  const funnelEventsToInsert: any[] = [];
  
  for (let idx = 0; idx < data.length; idx++) {
    try {
      const record = data[idx];
      const mapped = mapFields(record, 'visits');
      
      const visitId = ensureUUID(mapped.id);
      const customerId = customerMap.get(String(mapped.customer_id)) || null;
      const visitDate = parseDate(mapped.visit_date) || new Date().toISOString();
      const durationMinutes = parseNumber(mapped.duration_minutes) || 0;
      
      // Visit 레코드
      visitsToInsert.push({
        id: visitId,
        user_id: userId,
        org_id: orgId,
        store_id: storeId,
        customer_id: customerId,
        visit_date: visitDate,
        duration_minutes: durationMinutes,
        zones_visited: mapped.zones_visited ? 
          (Array.isArray(mapped.zones_visited) ? mapped.zones_visited : [mapped.zones_visited]) : 
          [],
        metadata: { source: 'csv_import', original_id: mapped.id },
      });
      
      // Funnel Events 생성
      const visitDateStr = visitDate.split('T')[0];
      const visitHour = new Date(visitDate).getHours();
      
      // Entry event
      funnelEventsToInsert.push({
        org_id: orgId,
        store_id: storeId,
        customer_id: customerId,
        visitor_id: customerId || visitId,
        session_id: visitId,
        event_type: 'entry',
        event_date: visitDateStr,
        event_hour: visitHour,
        event_timestamp: visitDate,
      });
      
      // Browse event (5분 이상 체류)
      if (durationMinutes >= 5) {
        funnelEventsToInsert.push({
          org_id: orgId,
          store_id: storeId,
          customer_id: customerId,
          visitor_id: customerId || visitId,
          session_id: visitId,
          event_type: 'browse',
          event_date: visitDateStr,
          event_hour: visitHour,
          event_timestamp: visitDate,
          duration_seconds: durationMinutes * 60,
        });
      }
      
      // Engage event (10분 이상 체류)
      if (durationMinutes >= 10) {
        funnelEventsToInsert.push({
          org_id: orgId,
          store_id: storeId,
          customer_id: customerId,
          visitor_id: customerId || visitId,
          session_id: visitId,
          event_type: 'engage',
          event_date: visitDateStr,
          event_hour: visitHour,
          event_timestamp: visitDate,
          duration_seconds: durationMinutes * 60,
        });
      }
    } catch (err: any) {
      errors.push(`Row ${idx + 1}: ${err.message}`);
    }
  }
  
  // Visits 삽입
  if (visitsToInsert.length > 0) {
    const { data: result, error } = await supabase
      .from('visits')
      .upsert(visitsToInsert, { onConflict: 'id' })
      .select();
    
    if (error) {
      errors.push(`Visits upsert error: ${error.message}`);
    } else {
      inserted = result?.length || 0;
    }
  }
  
  // Funnel Events 삽입
  if (funnelEventsToInsert.length > 0) {
    const { error } = await supabase
      .from('funnel_events')
      .insert(funnelEventsToInsert);
    
    if (error) {
      if (!error.message.includes('duplicate')) {
        errors.push(`Funnel events insert error: ${error.message}`);
      }
    } else {
      funnelEventsInserted = funnelEventsToInsert.length;
    }
  }
  
  return { inserted, updated, errors, funnelEventsInserted };
}

// Staff 처리
async function processStaff(
  supabase: any, 
  data: any[], 
  storeId: string, 
  orgId: string, 
  userId: string
): Promise<{ inserted: number; updated: number; errors: string[] }> {
  const errors: string[] = [];
  let inserted = 0;
  let updated = 0;
  
  const staffToUpsert = data.map((record, idx) => {
    try {
      const mapped = mapFields(record, 'staff');
      
      return {
        id: ensureUUID(mapped.id),
        user_id: userId,
        org_id: orgId,
        store_id: storeId,
        name: mapped.name || `Staff ${idx + 1}`,
        role: mapped.role || 'staff',
        department: mapped.department || null,
        hire_date: parseDate(mapped.hire_date),
        email: mapped.email || null,
        phone: mapped.phone || null,
        metadata: { source: 'csv_import', original_id: mapped.id },
      };
    } catch (err: any) {
      errors.push(`Row ${idx + 1}: ${err.message}`);
      return null;
    }
  }).filter(Boolean);
  
  if (staffToUpsert.length > 0) {
    const { data: result, error } = await supabase
      .from('staff')
      .upsert(staffToUpsert, { onConflict: 'id' })
      .select();
    
    if (error) {
      errors.push(`Staff upsert error: ${error.message}`);
    } else {
      inserted = result?.length || 0;
    }
  }
  
  return { inserted, updated, errors };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: ETLRequest = await req.json();
    const { import_id, store_id, org_id, data_type } = body;
    let { raw_data } = body;

    console.log('🚀 etl-raw-to-l2 starting');
    console.log(`📦 Import ID: ${import_id}`);
    console.log(`🏪 Store ID: ${store_id}`);
    console.log(`📊 Data Type: ${data_type}`);

    // raw_data가 없으면 import_id로 조회
    if (!raw_data && import_id) {
      const { data: importData, error: importError } = await supabase
        .from('user_data_imports')
        .select('raw_data, file_name')
        .eq('id', import_id)
        .single();

      if (importError || !importData) {
        throw new Error(`Import data not found: ${import_id}`);
      }

      raw_data = importData.raw_data;
      
      // data_type이 auto-detected면 파일명/컬럼 기반 추론
      if (data_type === 'auto-detected' && Array.isArray(raw_data) && raw_data.length > 0) {
        const columns = Object.keys(raw_data[0]);
        const inferredType = inferDataType(importData.file_name || '', columns);
        console.log(`🔍 Inferred data type: ${inferredType}`);
        body.data_type = inferredType;
      }
    }

    if (!Array.isArray(raw_data) || raw_data.length === 0) {
      throw new Error('No data to process');
    }

    const finalDataType = body.data_type || data_type;
    console.log(`📋 Processing ${raw_data.length} records as ${finalDataType}`);

    const result: ETLResult = {
      success: false,
      data_type: finalDataType,
      records_processed: raw_data.length,
      records_inserted: 0,
      records_updated: 0,
      errors: [],
      tables_affected: [],
    };

    // 데이터 타입별 처리
    switch (finalDataType) {
      case 'customers': {
        const res = await processCustomers(supabase, raw_data, store_id, org_id, user.id);
        result.records_inserted = res.inserted;
        result.records_updated = res.updated;
        result.errors = res.errors;
        result.tables_affected = ['customers'];
        break;
      }
      case 'products': {
        const res = await processProducts(supabase, raw_data, store_id, org_id, user.id);
        result.records_inserted = res.inserted;
        result.records_updated = res.updated;
        result.errors = res.errors;
        result.tables_affected = ['products'];
        break;
      }
      case 'purchases': {
        const res = await processPurchases(supabase, raw_data, store_id, org_id, user.id);
        result.records_inserted = res.inserted + res.lineItemsInserted;
        result.records_updated = res.updated;
        result.errors = res.errors;
        result.tables_affected = ['purchases', 'line_items'];
        break;
      }
      case 'visits': {
        const res = await processVisits(supabase, raw_data, store_id, org_id, user.id);
        result.records_inserted = res.inserted + res.funnelEventsInserted;
        result.records_updated = res.updated;
        result.errors = res.errors;
        result.tables_affected = ['visits', 'funnel_events'];
        break;
      }
      case 'staff': {
        const res = await processStaff(supabase, raw_data, store_id, org_id, user.id);
        result.records_inserted = res.inserted;
        result.records_updated = res.updated;
        result.errors = res.errors;
        result.tables_affected = ['staff'];
        break;
      }
      default:
        result.errors.push(`Unknown data type: ${finalDataType}`);
    }

    result.success = result.errors.length === 0 || result.records_inserted > 0;

    console.log(`✅ ETL completed: ${result.records_inserted} inserted, ${result.errors.length} errors`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('❌ ETL error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
