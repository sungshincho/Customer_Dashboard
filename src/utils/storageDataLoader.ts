import { supabase } from '@/integrations/supabase/client';

export interface StoreDataset {
  customers?: any[];
  products?: any[];
  purchases?: any[];
  visits?: any[];
  staff?: any[];
}

// CSV 파싱 함수
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }
  
  return data;
}

// Storage에서 CSV 다운로드 및 파싱
async function loadCSVFromStorage(userId: string, storeId: string, filename: string): Promise<any[]> {
  try {
    const filePath = `${userId}/${storeId}/${filename}`;
    
    const { data, error } = await supabase.storage
      .from('store-data')
      .download(filePath);
    
    if (error) {
      console.error(`Failed to download ${filename}:`, error);
      return [];
    }
    
    const csvText = await data.text();
    return parseCSV(csvText);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error);
    return [];
  }
}

// 매장의 모든 데이터셋 로드
export async function loadStoreDataset(userId: string, storeId: string): Promise<StoreDataset> {
  const [customers, products, purchases, visits, staff] = await Promise.all([
    loadCSVFromStorage(userId, storeId, 'customers.csv'),
    loadCSVFromStorage(userId, storeId, 'products.csv'),
    loadCSVFromStorage(userId, storeId, 'purchases.csv'),
    loadCSVFromStorage(userId, storeId, 'visits.csv'),
    loadCSVFromStorage(userId, storeId, 'staff.csv'),
  ]);
  
  return {
    customers,
    products,
    purchases,
    visits,
    staff,
  };
}

// 특정 파일만 로드
export async function loadStoreFile(userId: string, storeId: string, filename: string): Promise<any[]> {
  return loadCSVFromStorage(userId, storeId, filename);
}
