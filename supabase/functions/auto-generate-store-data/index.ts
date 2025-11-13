import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 시드 기반 랜덤 생성기
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
    hash = hash & hash;
  }
  return Math.abs(hash) + 1;
}

// CSV 생성
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value ?? '';
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// 브랜드별 특성 정의 - Street Casual 브랜드 A로 통일
function getBrandProfile(storeCode: string) {
  // 모든 매장이 동일한 Street Casual 브랜드 A 특성
  return {
    name: 'Street Casual A',
    ageRange: [20, 25], // 20대 초반
    categories: ['스트릿 티셔츠', '데님 팬츠', '후드/맨투맨', '스니커즈', '캡/모자'],
    brands: ['슈프림', '스투시', '팔라스', '카르하트', '디키즈', '챔피온', '반스'],
    priceRange: [20000, 80000], // 저렴한 가격대
    membershipLevels: ['Bronze', 'Silver', 'Gold'], // Platinum 제외
    purchaseFrequency: [15, 30], // 높은 방문 빈도
    avgAmount: [30000, 80000] // 평균 구매액 낮음
  };
}

// 샘플 데이터 생성
function generateCustomers(storePrefix: string, storeSeed: number, storeCode: string, count: number = 50) {
  const customers = [];
  const random = seededRandom(storeSeed * 137);
  const brand = getBrandProfile(storeCode);
  const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권'];
  const secondNames = ['민', '서', '지', '수', '현', '준', '은', '하', '도', '우', '재', '예', '시', '유'];
  const thirdNames = ['준', '호', '영', '진', '민', '수', '아', '연', '희', '정', '우', '현', '서', '은'];
  
  for (let i = 1; i <= count; i++) {
    const age = Math.floor(random() * (brand.ageRange[1] - brand.ageRange[0])) + brand.ageRange[0];
    customers.push({
      customer_id: `${storePrefix}_C${String(i).padStart(3, '0')}`,
      name: `${firstNames[Math.floor(random() * firstNames.length)]}${secondNames[Math.floor(random() * secondNames.length)]}${thirdNames[Math.floor(random() * thirdNames.length)]}`,
      age: age,
      gender: random() > 0.5 ? '남성' : '여성',
      membership_level: brand.membershipLevels[Math.floor(random() * brand.membershipLevels.length)],
      join_date: `2023-${String(Math.floor(random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(random() * 28) + 1).padStart(2, '0')}`,
      total_purchases: Math.floor(random() * (brand.purchaseFrequency[1] - brand.purchaseFrequency[0])) + brand.purchaseFrequency[0],
      avg_purchase_amount: Math.floor(random() * (brand.avgAmount[1] - brand.avgAmount[0])) + brand.avgAmount[0]
    });
  }
  return customers;
}

function generateProducts(storePrefix: string, storeSeed: number, storeCode: string, count: number = 30) {
  const products = [];
  const random = seededRandom(storeSeed * 251);
  const brand = getBrandProfile(storeCode);
  
  for (let i = 1; i <= count; i++) {
    const category = brand.categories[Math.floor(random() * brand.categories.length)];
    const brandName = brand.brands[Math.floor(random() * brand.brands.length)];
    const price = Math.floor(random() * (brand.priceRange[1] - brand.priceRange[0])) + brand.priceRange[0];
    
    // 상품명을 카테고리와 브랜드에 맞게 생성
    const productNames: { [key: string]: string[] } = {
      '스트릿 티셔츠': ['로고 티셔츠', '그래픽 티셔츠', '오버핏 티셔츠'],
      '데님 팬츠': ['슬림 진', '와이드 진', '크롭 진'],
      '후드/맨투맨': ['기본 후드', '오버핏 후드', '크롭 후드'],
      '스니커즈': ['로우탑 스니커즈', '하이탑 스니커즈', '슬립온'],
      '캡/비니': ['볼캡', '버킷햇', '비니'],
      '베이직 티셔츠': ['라운드 티셔츠', '브이넥 티셔츠', '롱슬리브'],
      '슬랙스': ['기본 슬랙스', '와이드 슬랙스', '테이퍼드 슬랙스'],
      '니트': ['라운드 니트', '터틀넥', '가디건'],
      '코트': ['트렌치 코트', '울 코트', '더블 코트'],
      '로퍼': ['페니 로퍼', '태슬 로퍼', '비트 로퍼'],
      '디자이너 셔츠': ['오버핏 셔츠', '실크 셔츠', '린넨 셔츠'],
      '프리미엄 팬츠': ['테일러드 팬츠', '와이드 팬츠', '플리츠 팬츠'],
      '가죽 재킷': ['라이더 재킷', '봄버 재킷', '블루종'],
      '명품 스니커즈': ['하이엔드 스니커즈', '디자이너 스니커즈', '리미티드 스니커즈'],
      '디자이너 백': ['크로스백', '토트백', '백팩']
    };
    
    const nameOptions = productNames[category] || ['아이템'];
    const productName = nameOptions[Math.floor(random() * nameOptions.length)];
    
    products.push({
      product_id: `${storePrefix}_P${String(i).padStart(3, '0')}`,
      name: `${brandName} ${productName} ${String.fromCharCode(65 + (i % 26))}`,
      category: category,
      price: price,
      stock: Math.floor(random() * 50) + 5,
      supplier: brandName,
      sku: `SKU${storePrefix}${String(i).padStart(4, '0')}`
    });
  }
  return products;
}

function generatePurchases(storeId: string, storePrefix: string, storeSeed: number, storeCode: string, customerCount: number, productCount: number, count: number = 200) {
  const purchases = [];
  const random = seededRandom(storeSeed * 373);
  const brand = getBrandProfile(storeCode);
  const paymentMethods = ['카드', '현금', '포인트', '모바일', '간편결제'];
  
  for (let i = 1; i <= count; i++) {
    const price = Math.floor(random() * (brand.priceRange[1] - brand.priceRange[0])) + brand.priceRange[0];
    const discount = storeCode.includes('001') ? Math.floor(random() * 15) * 5 : // 브랜드 A: 할인 많음
                     storeCode.includes('002') ? Math.floor(random() * 10) * 5 : // 브랜드 B: 할인 보통
                     Math.floor(random() * 5) * 5; // 브랜드 C: 할인 적음
    
    purchases.push({
      purchase_id: `${storePrefix}_PUR${String(i).padStart(4, '0')}`,
      customer_id: `${storePrefix}_C${String(Math.floor(random() * customerCount) + 1).padStart(3, '0')}`,
      product_id: `${storePrefix}_P${String(Math.floor(random() * productCount) + 1).padStart(3, '0')}`,
      store_id: storeId,
      staff_id: `${storePrefix}_ST${String(Math.floor(random() * 5) + 1).padStart(2, '0')}`,
      purchase_date: `2024-${String(Math.floor(random() * 3) + 1).padStart(2, '0')}-${String(Math.floor(random() * 28) + 1).padStart(2, '0')}`,
      purchase_time: `${String(Math.floor(random() * 12) + 9).padStart(2, '0')}:${String(Math.floor(random() * 60)).padStart(2, '0')}`,
      quantity: Math.floor(random() * 3) + 1,
      unit_price: price,
      discount: discount,
      payment_method: paymentMethods[Math.floor(random() * paymentMethods.length)]
    });
  }
  return purchases;
}

function generateVisits(storeId: string, storePrefix: string, storeSeed: number, storeCode: string, customerCount: number, count: number = 300) {
  const visits = [];
  const random = seededRandom(storeSeed * 509);
  
  // 브랜드별 방문 패턴
  const visitPatterns = storeCode.includes('001') ? {
    purposes: ['구매', '둘러보기', '신상품 확인', '프로모션', 'SNS 촬영'],
    avgDuration: [15, 45], // 짧은 체류
    conversionRate: 0.55 // 높은 전환율
  } : storeCode.includes('002') ? {
    purposes: ['구매', '둘러보기', '상담', '교환/환불', '피팅'],
    avgDuration: [20, 60], // 중간 체류
    conversionRate: 0.50 // 중간 전환율
  } : {
    purposes: ['구매', '둘러보기', '개인 스타일링', 'VIP 라운지', '신상 론칭'],
    avgDuration: [30, 90], // 긴 체류
    conversionRate: 0.45 // 낮은 전환율 (신중한 구매)
  };
  
  for (let i = 1; i <= count; i++) {
    const entryHour = Math.floor(random() * 12) + 9;
    const entryMinute = Math.floor(random() * 60);
    const duration = Math.floor(random() * (visitPatterns.avgDuration[1] - visitPatterns.avgDuration[0])) + visitPatterns.avgDuration[0];
    const itemsViewed = storeCode.includes('001') ? Math.floor(random() * 8) + 3 : // 많이 봄
                        storeCode.includes('002') ? Math.floor(random() * 6) + 2 : // 보통
                        Math.floor(random() * 5) + 1; // 적게 봄 (신중)
    
    visits.push({
      visit_id: `${storePrefix}_V${String(i).padStart(4, '0')}`,
      customer_id: `${storePrefix}_C${String(Math.floor(random() * customerCount) + 1).padStart(3, '0')}`,
      store_id: storeId,
      visit_date: `2024-${String(Math.floor(random() * 3) + 1).padStart(2, '0')}-${String(Math.floor(random() * 28) + 1).padStart(2, '0')}`,
      entry_time: `${String(entryHour).padStart(2, '0')}:${String(entryMinute).padStart(2, '0')}`,
      exit_time: `${String(entryHour + Math.floor((entryMinute + duration) / 60)).padStart(2, '0')}:${String((entryMinute + duration) % 60).padStart(2, '0')}`,
      duration_minutes: duration,
      purpose: visitPatterns.purposes[Math.floor(random() * visitPatterns.purposes.length)],
      purchased: random() > (1 - visitPatterns.conversionRate) ? 'Y' : 'N',
      items_viewed: itemsViewed
    });
  }
  return visits;
}

function generateStaff(storePrefix: string, storeSeed: number, storeCode: string, count: number = 5) {
  const staff = [];
  const random = seededRandom(storeSeed * 643);
  const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤'];
  const secondNames = ['민', '서', '지', '수', '현', '재', '예', '시'];
  const thirdNames = ['수', '진', '아', '우', '영', '현', '준', '원'];
  
  // 브랜드별 직원 구성
  const staffProfiles = storeCode.includes('001') ? {
    positions: ['매니저', '시니어 스타일리스트', '주니어 스타일리스트', '캐셔', 'SNS 마케터'],
    performanceRange: [7.5, 9.5] // 활발한 서비스
  } : storeCode.includes('002') ? {
    positions: ['매니저', '시니어', '주니어', '재고 관리자', '피팅 어시스턴트'],
    performanceRange: [7.0, 9.0] // 안정적인 서비스
  } : {
    positions: ['매니저', 'VIP 컨설턴트', '시니어 스타일리스트', '어시스턴트', '컨시어지'],
    performanceRange: [8.0, 10.0] // 프리미엄 서비스
  };
  
  for (let i = 1; i <= count; i++) {
    const performance = (random() * (staffProfiles.performanceRange[1] - staffProfiles.performanceRange[0]) + staffProfiles.performanceRange[0]).toFixed(1);
    
    staff.push({
      staff_id: `${storePrefix}_ST${String(i).padStart(2, '0')}`,
      name: `${firstNames[Math.floor(random() * firstNames.length)]}${secondNames[Math.floor(random() * secondNames.length)]}${thirdNames[Math.floor(random() * thirdNames.length)]}`,
      position: staffProfiles.positions[i % staffProfiles.positions.length],
      hire_date: `202${Math.floor(random() * 4)}-${String(Math.floor(random() * 12) + 1).padStart(2, '0')}-01`,
      salary_level: Math.floor(random() * 5) + 1,
      performance_score: performance
    });
  }
  return staff;
}

function generateBrands(storePrefix: string, storeSeed: number) {
  const random = seededRandom(storeSeed * 787);
  const brandNames = ['슈프림', '스투시', '팔라스', '카르하트', '디키즈', '챔피온', '반스'];
  const brands: any[] = [];
  
  brandNames.forEach((brandName, i) => {
    brands.push({
      brand_id: `${storePrefix}_B${String(i + 1).padStart(3, '0')}`,
      brand_name: brandName,
      category: 'Street Casual',
      country: ['미국', '일본', '영국'][Math.floor(random() * 3)],
      popularity_score: Math.floor(random() * 30) + 70 // 70-100
    });
  });
  
  return brands;
}

function generateSocialStates(storeId: string, storePrefix: string, storeSeed: number, customerCount: number, count: number = 100) {
  const socialStates = [];
  const random = seededRandom(storeSeed * 883);
  const platforms = ['Instagram', 'TikTok', 'Twitter'];
  const actionTypes = ['post', 'story', 'comment', 'like', 'share'];
  const sentiments = ['positive', 'neutral', 'negative'];
  
  for (let i = 1; i <= count; i++) {
    const year = 2024;
    const month = Math.floor(random() * 3) + 1;
    const day = Math.floor(random() * 28) + 1;
    const hour = Math.floor(random() * 24);
    const minute = Math.floor(random() * 60);
    
    socialStates.push({
      social_id: `${storePrefix}_SS${String(i).padStart(4, '0')}`,
      customer_id: `${storePrefix}_C${String(Math.floor(random() * customerCount) + 1).padStart(3, '0')}`,
      store_id: storeId,
      platform: platforms[Math.floor(random() * platforms.length)],
      action_type: actionTypes[Math.floor(random() * actionTypes.length)],
      content_snippet: `Great experience at store! #streetwear #fashion`,
      sentiment: sentiments[Math.floor(random() * sentiments.length)],
      engagement_score: Math.floor(random() * 100),
      timestamp: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
      reach_count: Math.floor(random() * 1000) + 100
    });
  }
  
  return socialStates;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // 사용자의 모든 매장 가져오기
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', user.id);

    if (storesError) throw storesError;

    const results = [];

    for (const store of stores || []) {
      const brandProfile = getBrandProfile(store.store_code);
      console.log(`Processing store: ${store.store_name} (${store.store_code}) - ${brandProfile.name}`);
      
      const storePrefix = store.store_code;
      const storeSeed = storeCodeToSeed(storePrefix);

      // 샘플 데이터 생성 (브랜드별 특성 반영)
      const customers = generateCustomers(storePrefix, storeSeed, store.store_code, 50);
      const products = generateProducts(storePrefix, storeSeed, store.store_code, 30);
      const purchases = generatePurchases(store.id, storePrefix, storeSeed, store.store_code, customers.length, products.length, 200);
      const visits = generateVisits(store.id, storePrefix, storeSeed, store.store_code, customers.length, 300);
      const staff = generateStaff(storePrefix, storeSeed, store.store_code, 5);
      const brands = generateBrands(storePrefix, storeSeed);
      const socialStates = generateSocialStates(store.id, storePrefix, storeSeed, customers.length, 100);

      // CSV로 변환
      const datasets = {
        'customers.csv': arrayToCSV(customers),
        'products.csv': arrayToCSV(products),
        'purchases.csv': arrayToCSV(purchases),
        'visits.csv': arrayToCSV(visits),
        'staff.csv': arrayToCSV(staff),
        'brands.csv': arrayToCSV(brands),
        'social_states.csv': arrayToCSV(socialStates)
      };

      // 스토리지에 업로드
      const uploadResults = [];
      for (const [filename, csvContent] of Object.entries(datasets)) {
        const filePath = `${user.id}/${store.id}/${filename}`;
        
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

      results.push({
        store: store.store_name,
        storeCode: store.store_code,
        uploads: uploadResults,
        stats: {
          customers: customers.length,
          products: products.length,
          purchases: purchases.length,
          visits: visits.length,
          staff: staff.length,
          brands: brands.length,
          social_states: socialStates.length
        }
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${results.length}개 매장에 샘플 데이터 생성 완료`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
