import { SCHEMA_MAP, DataSchema, ColumnSchema } from './dataSchemas';

export interface NormalizedData {
  schema_type: string;
  original_columns: string[];
  mapped_data: any[];
  metadata: {
    total_records: number;
    normalized_at: string;
    column_mappings: Record<string, string>;
    quality_score: number;
  };
}

/**
 * 컬럼명에서 의미 있는 키워드 추출
 */
function extractKeywords(columnName: string): string[] {
  return columnName
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, ' ')
    .split(' ')
    .filter(word => word.length > 1);
}

/**
 * 두 문자열의 유사도 계산 (간단한 키워드 매칭)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const keywords1 = extractKeywords(str1);
  const keywords2 = extractKeywords(str2);
  
  let matches = 0;
  keywords1.forEach(k1 => {
    keywords2.forEach(k2 => {
      if (k1.includes(k2) || k2.includes(k1) || k1 === k2) {
        matches++;
      }
    });
  });
  
  return matches / Math.max(keywords1.length, keywords2.length);
}

/**
 * 데이터 타입 자동 감지
 */
function detectDataType(dataType: string): 'sales' | 'zone' | 'traffic' | 'product' | 'customer' | 'inventory' | 'other' {
  const typeKeywords: Record<string, string[]> = {
    sales: ['매출', '판매', '거래', 'sales', 'transaction', '주문', 'order', '결제', 'payment'],
    zone: ['zone', '구역', '좌표', 'x', 'y', 'coordinate', '위치', 'location'],
    traffic: ['동선', 'traffic', '방문', 'visit', 'path', '이동', 'movement', 'person'],
    product: ['상품', 'product', '제품', '품목', 'item', 'sku'],
    customer: ['고객', 'customer', '회원', 'member', '유저', 'user'],
    inventory: ['재고', 'inventory', 'stock', '입고', '출고'],
  };
  
  const typeLower = dataType.toLowerCase();
  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => typeLower.includes(keyword))) {
      return type as any;
    }
  }
  
  return 'other';
}

/**
 * 컬럼을 스키마에 자동 매핑
 */
function autoMapColumns(
  rawColumns: string[],
  schema: DataSchema
): Record<string, string> {
  const mappings: Record<string, string> = {};
  
  // 각 스키마 컬럼에 대해 가장 유사한 원본 컬럼 찾기
  schema.columns.forEach(schemaCol => {
    let bestMatch = '';
    let bestScore = 0;
    
    rawColumns.forEach(rawCol => {
      // 스키마 컬럼 이름, 설명, 예시를 모두 고려
      const searchTerms = [
        schemaCol.name,
        schemaCol.description,
        ...(schemaCol.examples || [])
      ].join(' ');
      
      const score = calculateSimilarity(rawCol, searchTerms);
      
      if (score > bestScore && score > 0.3) { // 최소 30% 유사도
        bestScore = score;
        bestMatch = rawCol;
      }
    });
    
    if (bestMatch) {
      mappings[schemaCol.name] = bestMatch;
    }
  });
  
  return mappings;
}

/**
 * 값을 지정된 타입으로 변환
 */
function convertValue(value: any, targetType: ColumnSchema['type']): any {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  try {
    switch (targetType) {
      case 'string':
        return String(value);
      
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      
      case 'date':
        // Excel serial date 처리 (45819 같은 숫자)
        if (typeof value === 'number' && value > 1000) {
          const excelEpoch = new Date(1900, 0, 1);
          const date = new Date(excelEpoch.getTime() + (value - 2) * 86400000);
          return date.toISOString();
        }
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date.toISOString();
      
      case 'boolean':
        if (typeof value === 'boolean') return value;
        return ['true', 'yes', '1', 'y'].includes(String(value).toLowerCase());
      
      case 'array':
        if (Array.isArray(value)) return value;
        // "zones[0]", "zones[1]" 형식 처리
        return [value];
      
      case 'object':
        if (typeof value === 'object') return value;
        try {
          return JSON.parse(value);
        } catch {
          return { raw: value };
        }
      
      default:
        return value;
    }
  } catch (e) {
    console.warn(`Failed to convert value ${value} to ${targetType}:`, e);
    return null;
  }
}

/**
 * 배열 형식의 데이터 병합 (zones[0], zones[1] -> zones: [])
 */
function mergeArrayColumns(rawData: any[]): any[] {
  return rawData.map(row => {
    const merged: any = {};
    const arrayFields: Record<string, any[]> = {};
    
    Object.entries(row).forEach(([key, value]) => {
      // "field[index]" 패턴 감지
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, fieldName, index] = arrayMatch;
        if (!arrayFields[fieldName]) {
          arrayFields[fieldName] = [];
        }
        arrayFields[fieldName][parseInt(index)] = value;
      } else {
        merged[key] = value;
      }
    });
    
    // 배열 필드 추가
    Object.entries(arrayFields).forEach(([fieldName, values]) => {
      merged[fieldName] = values.filter(v => v !== undefined);
    });
    
    return merged;
  });
}

/**
 * 원본 데이터를 표준 스키마로 정규화
 */
export function normalizeData(
  rawData: any[],
  dataType: string
): NormalizedData {
  if (!rawData || rawData.length === 0) {
    return {
      schema_type: dataType,
      original_columns: [],
      mapped_data: [],
      metadata: {
        total_records: 0,
        normalized_at: new Date().toISOString(),
        column_mappings: {},
        quality_score: 0,
      }
    };
  }
  
  // 배열 컬럼 병합
  const mergedData = mergeArrayColumns(rawData);
  
  // 자동 타입 감지
  const detectedType = detectDataType(dataType);
  const schema = SCHEMA_MAP[detectedType];
  
  if (!schema) {
    // 스키마가 없으면 원본 그대로 반환
    return {
      schema_type: dataType,
      original_columns: Object.keys(mergedData[0] || {}),
      mapped_data: mergedData,
      metadata: {
        total_records: mergedData.length,
        normalized_at: new Date().toISOString(),
        column_mappings: {},
        quality_score: 0.5,
      }
    };
  }
  
  // 원본 컬럼명 추출
  const rawColumns = Object.keys(mergedData[0] || {});
  
  // 자동 컬럼 매핑
  const columnMappings = autoMapColumns(rawColumns, schema);
  
  // 데이터 변환
  const mappedData = mergedData.map((row, index) => {
    const normalized: any = {};
    
    schema.columns.forEach(schemaCol => {
      const rawColName = columnMappings[schemaCol.name];
      if (rawColName && row[rawColName] !== undefined) {
        normalized[schemaCol.name] = convertValue(row[rawColName], schemaCol.type);
      } else if (schemaCol.required) {
        // 필수 컬럼이 없으면 null로 설정
        normalized[schemaCol.name] = null;
      }
    });
    
    // 자동 계산 필드
    if (detectedType === 'sales') {
      // transaction_id가 없으면 자동 생성
      if (!normalized.transaction_id) {
        normalized.transaction_id = `TXN_${Date.now()}_${index}`;
      }
      
      // total_amount가 없으면 price * quantity로 계산
      if (!normalized.total_amount && normalized.price && normalized.quantity) {
        normalized.total_amount = normalized.price * normalized.quantity;
      }
    }
    
    // 원본 데이터도 보존 (unmapped 필드)
    normalized._original = row;
    
    return normalized;
  });
  
  // 품질 점수 계산 (필수 필드 + 중요 선택 필드 채워진 비율)
  const requiredFields = schema.columns.filter(c => c.required);
  const optionalImportantFields = schema.columns.filter(c => !c.required && 
    ['timestamp', 'product_category', 'total_amount', 'discount'].includes(c.name)
  );
  
  const totalImportantFields = [...requiredFields, ...optionalImportantFields];
  const mappedImportantFields = totalImportantFields.filter(field => 
    columnMappings[field.name]
  ).length;
  
  const qualityScore = totalImportantFields.length > 0 
    ? mappedImportantFields / totalImportantFields.length 
    : 0.5;
  
  return {
    schema_type: detectedType,
    original_columns: rawColumns,
    mapped_data: mappedData,
    metadata: {
      total_records: mappedData.length,
      normalized_at: new Date().toISOString(),
      column_mappings: columnMappings,
      quality_score: qualityScore,
    }
  };
}

/**
 * 여러 데이터셋을 정규화하고 관계 추출
 */
export function normalizeMultipleDatasets(
  datasets: Array<{ raw_data: any[]; data_type: string }>
): Record<string, NormalizedData> {
  const normalized: Record<string, NormalizedData> = {};
  
  datasets.forEach((dataset, index) => {
    const key = `dataset_${index}_${dataset.data_type}`;
    normalized[key] = normalizeData(dataset.raw_data, dataset.data_type);
  });
  
  return normalized;
}
