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

// 시드 기반 랜덤 생성기 (매장별로 완전히 다른 데이터 생성)
function seededRandom(seed: number) {
  return function() {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// 매장 코드를 숫자 시드로 변환
function storeCodeToSeed(storeCode: string): number {
  let hash = 0;
  for (let i = 0; i < storeCode.length; i++) {
    hash = ((hash << 5) - hash) + storeCode.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) + 1; // Ensure positive non-zero
}

// 샘플 데이터 생성 함수들
function generateCustomers(storePrefix: string, storeSeed: number, count: number = 50) {
  const customers = [];
  const random = seededRandom(storeSeed * 137); // 큰 소수로 시드 변환
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
  const random = seededRandom(storeSeed * 251);
  
  // 매장별 고유 상품 컬렉션 (store_code 기반)
  const storeProductSets: { [key: string]: { categories: string[], brands: string[], types: string[][] } } = {
    'GN001': { // 강남점 - Street Casual
      categories: ['스트릿 티셔츠', '데님 팬츠', '후드/맨투맨', '스니커즈', '캡/비니'],
      brands: ['슈프림', '스투시', '팔라스', '카르하트', '디키즈'],
      types: [
        ['로고 티', '그래픽 티', '오버핏 티', '타이다이 티', '크롭 티'],
        ['슬림 진', '와이드 진', '크롭 진', '블랙 진', '워싱 진'],
        ['기본 후드', '오버핏 후드', '크롭 후드', '집업 후드', '맨투맨'],
        ['로우탑', '하이탑', '슬립온', '플랫폼', '러닝화'],
        ['볼캡', '버킷햇', '비니', '스냅백', '캠프캡']
      ]
    },
    'GN002': { // 강남점2 - Minimal Basic
      categories: ['베이직 티셔츠', '슬랙스', '니트', '코트', '로퍼'],
      brands: ['유니클로', '무인양품', 'COS', '에잇세컨즈', '스파오'],
      types: [
        ['라운드 티', '브이넥 티', '롱슬리브', '폴로', '헨리넥'],
        ['기본 슬랙스', '와이드 슬랙스', '테이퍼드', '치노', '린넨 팬츠'],
        ['라운드 니트', '터틀넥', '가디건', '조끼', '폴로 니트'],
        ['트렌치 코트', '울 코트', '더블 코트', '싱글 코트', '맥 코트'],
        ['페니 로퍼', '태슬 로퍼', '비트 로퍼', '스웨이드 로퍼', '특양화']
      ]
    },
    'GN003': { // 강남점3 - Trendy Luxury
      categories: ['디자이너 셔츠', '프리미엄 팬츠', '가죽 재킷', '명품 스니커즈', '디자이너 백'],
      brands: ['발렌시아가', '생로랑', '프라다', '구찌', '디올'],
      types: [
        ['오버핏 셔츠', '실크 셔츠', '린넨 셔츠', '프린트 셔츠', '데님 셔츠'],
        ['테일러드 팬츠', '와이드 팬츠', '플리츠 팬츠', '가죽 팬츠', '벨벳 팬츠'],
        ['라이더 재킷', '봄버 재킷', '블루종', '무스탕', '수트 재킷'],
        ['트리플 S', '스피드 러너', '클라우드버스트', '에이스', '디스럽터'],
        ['크로스백', '토트백', '백팩', '클러치', '벨트백']
      ]
    }
  };
  
  const storeSet = storeProductSets[storePrefix] || storeProductSets['GN001'];
  
  for (let i = 1; i <= count; i++) {
    const catIdx = Math.floor(random() * storeSet.categories.length);
    const category = storeSet.categories[catIdx];
    const brand = storeSet.brands[Math.floor(random() * storeSet.brands.length)];
    const type = storeSet.types[catIdx][Math.floor(random() * storeSet.types[catIdx].length)];
    
    // 매장별 가격대 설정
    const basePrice = storePrefix === 'GN003' ? 500000 : storePrefix === 'GN002' ? 80000 : 150000;
    const priceVariation = storePrefix === 'GN003' ? 1500000 : storePrefix === 'GN002' ? 120000 : 200000;
    const price = Math.floor(random() * priceVariation) + basePrice;
    
    products.push({
      product_id: `${storePrefix}_P${String(i).padStart(3, '0')}`,
      name: `${brand} ${type}`,
      category: category,
      price: price,
      stock: Math.floor(random() * 100) + 10,
      supplier: brand,
      sku: `SKU${storePrefix}${String(i).padStart(4, '0')}`
    });
  }
  
  return products;
}

function generatePurchases(storeId: string, storePrefix: string, storeSeed: number, customerCount: number, productCount: number, count: number = 200) {
  const purchases = [];
  const random = seededRandom(storeSeed * 373); // 다른 소수
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
  const random = seededRandom(storeSeed * 509); // 다른 소수
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
  const random = seededRandom(storeSeed * 643); // 다른 소수
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

    // 매장 코드를 prefix로 사용하고 고유 시드 생성
    const storePrefix = store.store_code;
    const storeSeed = storeCodeToSeed(storePrefix);
    
    console.log(`Generating data for ${store.store_name} (${storePrefix}) with seed: ${storeSeed}`);

    // 샘플 데이터 생성 (매장별로 완전히 다른 시드 사용)
    const customers = generateCustomers(storePrefix, storeSeed, 50);
    const products = generateProducts(storePrefix, storeSeed, 30);
    const purchases = generatePurchases(storeId, storePrefix, storeSeed, customers.length, products.length, 200);
    const visits = generateVisits(storeId, storePrefix, storeSeed, customers.length, 300);
    const staff = generateStaff(storePrefix, storeSeed, 5);
    
    console.log(`Generated: ${customers.length} customers, ${products.length} products, ${purchases.length} purchases, ${visits.length} visits, ${staff.length} staff`);

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
