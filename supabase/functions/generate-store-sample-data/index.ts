import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CSV 생성 헬퍼 함수
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      // 쉼표나 따옴표가 있으면 따옴표로 감싸기
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  
  return [headers.join(','), ...rows].join('\n');
}

// 시드 생성 함수 (매장별 다른 랜덤 값)
function seededRandom(seed: number) {
  let value = seed;
  return function() {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

// 샘플 데이터 생성 함수들
function generateCustomers(storePrefix: string, storeSeed: number, count: number = 50) {
  const customers = [];
  const random = seededRandom(storeSeed);
  const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
  const secondNames = ['민', '서', '지', '수', '현', '준', '은', '하', '도', '우'];
  const thirdNames = ['준', '호', '영', '진', '민', '수', '아', '연', '희', '정'];
  
  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(random() * firstNames.length)];
    const secondName = secondNames[Math.floor(random() * secondNames.length)];
    const thirdName = thirdNames[Math.floor(random() * thirdNames.length)];
    
    customers.push({
      customer_id: `${storePrefix}_C${String(i).padStart(3, '0')}`,
      name: `${firstName}${secondName}${thirdName}`,
      age: Math.floor(random() * 50) + 20,
      gender: random() > 0.5 ? '남성' : '여성',
      membership_level: ['Bronze', 'Silver', 'Gold', 'Platinum'][Math.floor(random() * 4)],
      join_date: `2023-${String(Math.floor(random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(random() * 28) + 1).padStart(2, '0')}`,
      total_purchases: Math.floor(random() * 50) + 1,
      avg_purchase_amount: Math.floor(random() * 500000) + 50000
    });
  }
  
  return customers;
}

function generateProducts(storePrefix: string, storeSeed: number, count: number = 30) {
  const products = [];
  const random = seededRandom(storeSeed + 100);
  const categories = ['스마트폰', '태블릿', '노트북', '액세서리', '웨어러블'];
  const brands = ['삼성', '애플', '엘지', '샤오미', '화웨이'];
  const productTypes = ['갤럭시', '아이폰', '아이패드', '맥북', '에어팟', '워치', '버즈'];
  
  for (let i = 1; i <= count; i++) {
    const category = categories[Math.floor(random() * categories.length)];
    const brand = brands[Math.floor(random() * brands.length)];
    const type = productTypes[Math.floor(random() * productTypes.length)];
    
    products.push({
      product_id: `${storePrefix}_P${String(i).padStart(3, '0')}`,
      name: `${brand} ${type} ${i}`,
      category,
      price: Math.floor(random() * 2000000) + 100000,
      stock: Math.floor(random() * 100) + 10,
      supplier: `${brand} 공급사`,
      sku: `SKU${storePrefix}${String(i).padStart(4, '0')}`
    });
  }
  
  return products;
}

function generatePurchases(storeId: string, storePrefix: string, storeSeed: number, customerCount: number, productCount: number, count: number = 200) {
  const purchases = [];
  const random = seededRandom(storeSeed + 200);
  const paymentMethods = ['카드', '현금', '포인트', '모바일'];
  
  for (let i = 1; i <= count; i++) {
    const year = 2024;
    const month = Math.floor(random() * 3) + 1; // 1-3월
    const day = Math.floor(random() * 28) + 1;
    const hour = Math.floor(random() * 12) + 9; // 9-20시
    const minute = Math.floor(random() * 60);
    
    purchases.push({
      purchase_id: `${storePrefix}_PUR${String(i).padStart(4, '0')}`,
      customer_id: `${storePrefix}_C${String(Math.floor(random() * customerCount) + 1).padStart(3, '0')}`,
      product_id: `${storePrefix}_P${String(Math.floor(random() * productCount) + 1).padStart(3, '0')}`,
      store_id: storeId,
      staff_id: `${storePrefix}_ST${String(Math.floor(random() * 5) + 1).padStart(2, '0')}`,
      purchase_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      purchase_time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      quantity: Math.floor(random() * 3) + 1,
      unit_price: Math.floor(random() * 2000000) + 100000,
      discount: Math.floor(random() * 20) * 5,
      payment_method: paymentMethods[Math.floor(random() * paymentMethods.length)]
    });
  }
  
  return purchases;
}

function generateVisits(storeId: string, storePrefix: string, storeSeed: number, customerCount: number, count: number = 300) {
  const visits = [];
  const random = seededRandom(storeSeed + 300);
  const purposes = ['구매', '둘러보기', '상담', '교환/환불', '수리'];
  
  for (let i = 1; i <= count; i++) {
    const year = 2024;
    const month = Math.floor(random() * 3) + 1;
    const day = Math.floor(random() * 28) + 1;
    const entryHour = Math.floor(random() * 12) + 9;
    const entryMinute = Math.floor(random() * 60);
    const duration = Math.floor(random() * 120) + 10;
    
    visits.push({
      visit_id: `${storePrefix}_V${String(i).padStart(4, '0')}`,
      customer_id: `${storePrefix}_C${String(Math.floor(random() * customerCount) + 1).padStart(3, '0')}`,
      store_id: storeId,
      visit_date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      entry_time: `${String(entryHour).padStart(2, '0')}:${String(entryMinute).padStart(2, '0')}`,
      exit_time: `${String(entryHour + Math.floor((entryMinute + duration) / 60)).padStart(2, '0')}:${String((entryMinute + duration) % 60).padStart(2, '0')}`,
      duration_minutes: duration,
      purpose: purposes[Math.floor(random() * purposes.length)],
      purchased: random() > 0.6 ? 'Y' : 'N',
      items_viewed: Math.floor(random() * 10) + 1
    });
  }
  
  return visits;
}

function generateStaff(storePrefix: string, storeSeed: number, count: number = 5) {
  const staff = [];
  const random = seededRandom(storeSeed + 400);
  const firstNames = ['김', '이', '박', '최', '정'];
  const secondNames = ['민', '서', '지', '수', '현'];
  const thirdNames = ['수', '진', '아', '우', '영'];
  const positions = ['매니저', '시니어', '주니어'];
  
  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(random() * firstNames.length)];
    const secondName = secondNames[Math.floor(random() * secondNames.length)];
    const thirdName = thirdNames[Math.floor(random() * thirdNames.length)];
    
    staff.push({
      staff_id: `${storePrefix}_ST${String(i).padStart(2, '0')}`,
      name: `${firstName}${secondName}${thirdName}`,
      position: positions[Math.floor(random() * positions.length)],
      hire_date: `202${Math.floor(random() * 4)}-${String(Math.floor(random() * 12) + 1).padStart(2, '0')}-01`,
      salary_level: Math.floor(random() * 5) + 1,
      performance_score: (random() * 2 + 7).toFixed(1)
    });
  }
  
  return staff;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 인증 확인
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { storeId } = await req.json();

    // 매장 정보 가져오기
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .eq('user_id', user.id)
      .single();

    if (storeError || !store) {
      throw new Error('Store not found');
    }

    // 매장 코드를 prefix로 사용하고 시드 생성
    const storePrefix = store.store_code;
    const storeSeed = storePrefix.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // 샘플 데이터 생성 (매장별로 다른 시드 사용)
    const customers = generateCustomers(storePrefix, storeSeed, 50);
    const products = generateProducts(storePrefix, storeSeed, 30);
    const purchases = generatePurchases(storeId, storePrefix, storeSeed, customers.length, products.length, 200);
    const visits = generateVisits(storeId, storePrefix, storeSeed, customers.length, 300);
    const staff = generateStaff(storePrefix, storeSeed, 5);

    // CSV로 변환
    const datasets = {
      'customers.csv': arrayToCSV(customers),
      'products.csv': arrayToCSV(products),
      'purchases.csv': arrayToCSV(purchases),
      'visits.csv': arrayToCSV(visits),
      'staff.csv': arrayToCSV(staff)
    };

    // 스토리지에 업로드
    const uploadResults = [];
    for (const [filename, csvContent] of Object.entries(datasets)) {
      const filePath = `${user.id}/${storeId}/${filename}`;
      
      const { error: uploadError } = await supabase.storage
        .from('store-data')
        .upload(filePath, new Blob([csvContent], { type: 'text/csv' }), {
          upsert: true,
          contentType: 'text/csv'
        });

      if (uploadError) {
        console.error(`Failed to upload ${filename}:`, uploadError);
        uploadResults.push({ filename, success: false, error: uploadError.message });
      } else {
        uploadResults.push({ filename, success: true });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        store: store.store_name,
        uploads: uploadResults,
        stats: {
          customers: customers.length,
          products: products.length,
          purchases: purchases.length,
          visits: visits.length,
          staff: staff.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
