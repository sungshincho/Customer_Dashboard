/**
 * @deprecated Use src/lib/storage/loader.ts and src/hooks/useStoreData.ts instead
 * 
 * 이 파일은 하위 호환성을 위해 유지되지만, 새로운 코드에서는 사용하지 마세요.
 * 
 * 마이그레이션 가이드:
 * - loadStoreDataset() → useStoreDataset() Hook 사용
 * - loadStoreFile() → useStoreDataFile() Hook 사용
 */

import { loadDataFile, loadMultipleFiles } from '@/lib/storage/loader';
import { supabase } from '@/integrations/supabase/client';

export interface StoreDataset {
  customers?: any[];
  products?: any[];
  purchases?: any[];
  visits?: any[];
  staff?: any[];
}

/**
 * @deprecated Use useStoreDataset() from src/hooks/useStoreData.ts
 */
export async function loadStoreDataset(userId: string, storeId: string): Promise<StoreDataset> {
  console.warn('loadStoreDataset is deprecated. Use useStoreDataset() Hook instead.');
  
  const results = await loadMultipleFiles(
    userId,
    storeId,
    ['customers', 'products', 'purchases', 'visits', 'staff'],
    { fallbackToSample: true }
  );
  
  return {
    customers: results.customers?.data || [],
    products: results.products?.data || [],
    purchases: results.purchases?.data || [],
    visits: results.visits?.data || [],
    staff: results.staff?.data || [],
  };
}

/**
 * @deprecated Use useStoreDataFile() from src/hooks/useStoreData.ts
 */
export async function loadStoreFile(userId: string, storeId: string, filename: string): Promise<any[]> {
  console.warn('loadStoreFile is deprecated. Use useStoreDataFile() Hook instead.');
  
  // filename에서 확장자 제거하여 타입 추론
  const fileType = filename.replace(/\.(csv|xlsx)$/i, '') as any;
  
  const result = await loadDataFile(
    userId,
    storeId,
    fileType,
    { fallbackToSample: true }
  );
  
  return result.data || [];
}
