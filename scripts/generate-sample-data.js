// 12개월 purchases 및 visits 샘플 데이터 생성 스크립트
// Node.js로 실행: node scripts/generate-sample-data.js

const fs = require('fs');

// 2023년 1월 ~ 2024년 3월 (15개월)
const stores = ['S001', 'S002', 'S003', 'S004', 'S005'];
const staff = {
  S001: ['ST001', 'ST002', 'ST003', 'ST004', 'ST005', 'ST006'],
  S002: ['ST007', 'ST008', 'ST009', 'ST010', 'ST011'],
  S003: ['ST012', 'ST013', 'ST014', 'ST015'],
  S004: ['ST016', 'ST017', 'ST018', 'ST019', 'ST020'],
  S005: ['ST021', 'ST022', 'ST023']
};

// 고객 매장 선호도 (customers.csv의 preferred_store 기반)
const customerStoreMap = {};
for (let i = 1; i <= 150; i++) {
  const customerId = `C${String(i).padStart(3, '0')}`;
  // preferred_store 분포 반영
  if (i <= 30) customerStoreMap[customerId] = 'S001';
  else if (i <= 50) customerStoreMap[customerId] = 'S002';
  else if (i <= 70) customerStoreMap[customerId] = 'S003';
  else if (i <= 85) customerStoreMap[customerId] = 'S004';
  else customerStoreMap[customerId] = 'S005';
}

const products = Array.from({length: 50}, (_, i) => `P${String(i+1).padStart(3, '0')}`);
const paymentMethods = ['카드', '앱페이', '현금'];

// Purchases 생성
let purchaseId = 1;
const purchases = ['purchase_id,customer_id,product_id,store_id,purchase_date,quantity,unit_price,total_amount,payment_method,discount_applied,staff_id'];

for (let month = 0; month < 15; month++) {
  const year = month < 12 ? 2023 : 2024;
  const m = month < 12 ? month + 1 : month - 11;
  const daysInMonth = new Date(year, m, 0).getDate();
  
  // 월별 평균 40-60건 구매
  const purchasesThisMonth = 40 + Math.floor(Math.random() * 21);
  
  for (let i = 0; i < purchasesThisMonth; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const hour = 10 + Math.floor(Math.random() * 10);
    const minute = Math.floor(Math.random() * 60);
    const purchaseDate = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    
    const customerId = `C${String(Math.floor(Math.random() * 150) + 1).padStart(3, '0')}`;
    const preferredStore = customerStoreMap[customerId];
    const storeId = Math.random() < 0.7 ? preferredStore : stores[Math.floor(Math.random() * stores.length)];
    const productId = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.random() < 0.8 ? 1 : 2;
    
    // 가격 범위 (제품별)
    const productNum = parseInt(productId.slice(1));
    let unitPrice;
    if (productNum <= 10) unitPrice = 50000 + Math.floor(Math.random() * 200000);
    else if (productNum <= 30) unitPrice = 30000 + Math.floor(Math.random() * 70000);
    else unitPrice = 20000 + Math.floor(Math.random() * 40000);
    
    const totalAmount = unitPrice * quantity;
    const discountRate = Math.random() < 0.3 ? 0.1 : 0;
    const discountApplied = Math.floor(totalAmount * discountRate);
    
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    const staffId = staff[storeId][Math.floor(Math.random() * staff[storeId].length)];
    
    purchases.push(`PU${String(purchaseId).padStart(3, '0')},${customerId},${productId},${storeId},${purchaseDate},${quantity},${unitPrice},${totalAmount},${paymentMethod},${discountApplied},${staffId}`);
    purchaseId++;
  }
}

fs.writeFileSync('public/samples/purchases.csv', purchases.join('\n'));
console.log(`Generated ${purchaseId - 1} purchases`);

// Visits 생성 (구매 포함 + 비구매 방문)
let visitId = 1;
const visits = ['visit_id,customer_id,store_id,visit_date,duration_minutes,purpose,items_viewed,purchased,satisfaction_score,accompanied_by,weather'];
const purposes = ['쇼핑', '둘러보기', '교환/환불', '문의'];
const accompanied = ['혼자', '친구', '배우자', '가족'];
const weathers = ['맑음', '흐림', '비', '눈'];

for (let month = 0; month < 15; month++) {
  const year = month < 12 ? 2023 : 2024;
  const m = month < 12 ? month + 1 : month - 11;
  const daysInMonth = new Date(year, m, 0).getDate();
  
  // 월별 평균 60-90건 방문
  const visitsThisMonth = 60 + Math.floor(Math.random() * 31);
  
  for (let i = 0; i < visitsThisMonth; i++) {
    const day = Math.floor(Math.random() * daysInMonth) + 1;
    const hour = 10 + Math.floor(Math.random() * 10);
    const minute = Math.floor(Math.random() * 60);
    const visitDate = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    
    const customerId = `C${String(Math.floor(Math.random() * 150) + 1).padStart(3, '0')}`;
    const preferredStore = customerStoreMap[customerId];
    const storeId = Math.random() < 0.7 ? preferredStore : stores[Math.floor(Math.random() * stores.length)];
    
    const isPurchase = Math.random() < 0.65;
    const purpose = isPurchase ? '쇼핑' : purposes[Math.floor(Math.random() * purposes.length)];
    const purchased = isPurchase ? 'Y' : 'N';
    
    const durationMinutes = isPurchase ? 30 + Math.floor(Math.random() * 40) : 15 + Math.floor(Math.random() * 20);
    const itemsViewed = isPurchase ? 3 + Math.floor(Math.random() * 8) : 1 + Math.floor(Math.random() * 4);
    const satisfactionScore = isPurchase ? (3.8 + Math.random() * 1.2).toFixed(1) : (3.0 + Math.random() * 1.5).toFixed(1);
    const accompaniedBy = accompanied[Math.floor(Math.random() * accompanied.length)];
    const weather = weathers[Math.floor(Math.random() * weathers.length)];
    
    visits.push(`V${String(visitId).padStart(3, '0')},${customerId},${storeId},${visitDate},${durationMinutes},${purpose},${itemsViewed},${purchased},${satisfactionScore},${accompaniedBy},${weather}`);
    visitId++;
  }
}

fs.writeFileSync('public/samples/visits.csv', visits.join('\n'));
console.log(`Generated ${visitId - 1} visits`);
console.log('Sample data generation complete!');
