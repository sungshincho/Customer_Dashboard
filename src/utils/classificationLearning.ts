import { supabase } from "@/integrations/supabase/client";

export interface ClassificationPattern {
  id?: string;
  user_id?: string;
  pattern_type: 'sheet_name' | 'column_pattern' | 'combined';
  pattern_value: string;
  classified_as: string;
  confidence: number;
  use_count: number;
}

/**
 * 사용자의 학습된 패턴을 가져옵니다
 */
export async function getUserPatterns(): Promise<ClassificationPattern[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('user_classification_patterns')
    .select('*')
    .order('confidence', { ascending: false })
    .order('use_count', { ascending: false });

  if (error) {
    console.error('Failed to fetch user patterns:', error);
    return [];
  }

  return (data || []) as ClassificationPattern[];
}

/**
 * 학습 패턴을 기반으로 데이터 타입 추론
 */
export async function detectDataTypeWithLearning(
  sheetName: string,
  columns: string[]
): Promise<{ type: string; confidence: number; source: 'learned' | 'default' }> {
  const patterns = await getUserPatterns();

  // 1. 시트명 기반 학습 패턴 매칭
  const sheetNamePattern = patterns.find(
    p => p.pattern_type === 'sheet_name' && 
         sheetName.toLowerCase().includes(p.pattern_value.toLowerCase())
  );

  if (sheetNamePattern && sheetNamePattern.confidence > 0.7) {
    // 패턴 사용 횟수 증가
    await incrementPatternUsage(sheetNamePattern.id!);
    
    return {
      type: sheetNamePattern.classified_as,
      confidence: sheetNamePattern.confidence,
      source: 'learned'
    };
  }

  // 2. 컬럼 패턴 기반 학습 매칭
  const columnPatterns = patterns.filter(p => p.pattern_type === 'column_pattern');
  for (const pattern of columnPatterns) {
    const matchingColumns = columns.filter(col => 
      col.toLowerCase().includes(pattern.pattern_value.toLowerCase())
    );
    
    if (matchingColumns.length > 0) {
      const matchRatio = matchingColumns.length / columns.length;
      if (matchRatio > 0.3 && pattern.confidence > 0.6) {
        await incrementPatternUsage(pattern.id!);
        
        return {
          type: pattern.classified_as,
          confidence: pattern.confidence * matchRatio,
          source: 'learned'
        };
      }
    }
  }

  // 3. 기본 키워드 기반 감지 (폴백)
  const combinedText = `${sheetName} ${columns.join(' ')}`.toLowerCase();
  
  const typeKeywords: Record<string, string[]> = {
    sales: ['매출', '판매', '거래', 'sales', 'transaction', '주문', 'order', '결제', 'payment'],
    traffic_sensor: ['센서', 'sensor', '동선', 'tracking', 'path', 'zone', 'movement', 'beacon'],
    traffic: ['동선', 'traffic', '방문', 'visit', 'path', '이동', 'movement', 'person'],
    product: ['상품', 'product', '제품', '품목', 'item', 'sku'],
    customer: ['고객', 'customer', '회원', 'member', '유저', 'user'],
    inventory: ['재고', 'inventory', 'stock', '입고', '출고'],
    brand: ['브랜드', 'brand', '제조사', 'manufacturer', 'maker'],
    store: ['매장', 'store', '지점', 'branch', 'shop', 'location'],
  };

  for (const [type, keywords] of Object.entries(typeKeywords)) {
    if (keywords.some(keyword => combinedText.includes(keyword))) {
      return {
        type,
        confidence: 0.5,
        source: 'default'
      };
    }
  }

  return {
    type: 'other',
    confidence: 0.3,
    source: 'default'
  };
}

/**
 * 사용자가 수동으로 수정한 분류를 학습합니다
 */
export async function learnFromCorrection(
  sheetName: string,
  columns: string[],
  correctedType: string
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // 1. 시트명 패턴 저장
    await upsertPattern({
      user_id: user.id,
      pattern_type: 'sheet_name',
      pattern_value: extractKeyPattern(sheetName),
      classified_as: correctedType,
      confidence: 0.8,
      use_count: 1
    });

    // 2. 주요 컬럼 패턴 저장 (상위 3개)
    const keyColumns = columns.slice(0, 3);
    for (const col of keyColumns) {
      const pattern = extractKeyPattern(col);
      if (pattern.length >= 2) {
        await upsertPattern({
          user_id: user.id,
          pattern_type: 'column_pattern',
          pattern_value: pattern,
          classified_as: correctedType,
          confidence: 0.7,
          use_count: 1
        });
      }
    }

    console.log('✅ 학습 패턴 저장 완료:', { sheetName, correctedType });
  } catch (error) {
    console.error('❌ 학습 패턴 저장 실패:', error);
  }
}

/**
 * 패턴을 Upsert (있으면 업데이트, 없으면 삽입)
 */
async function upsertPattern(pattern: Omit<ClassificationPattern, 'id'>): Promise<void> {
  // 기존 패턴 확인
  const { data: existing } = await supabase
    .from('user_classification_patterns')
    .select('*')
    .eq('user_id', pattern.user_id!)
    .eq('pattern_type', pattern.pattern_type)
    .eq('pattern_value', pattern.pattern_value)
    .eq('classified_as', pattern.classified_as)
    .single();

  if (existing) {
    // 신뢰도와 사용 횟수 증가
    await supabase
      .from('user_classification_patterns')
      .update({
        confidence: Math.min(existing.confidence + 0.1, 1.0),
        use_count: existing.use_count + 1
      })
      .eq('id', existing.id);
  } else {
    // 새 패턴 삽입
    const { error } = await supabase
      .from('user_classification_patterns')
      .insert([pattern as any]);
    
    if (error) {
      console.error('Failed to insert pattern:', error);
    }
  }
}

/**
 * 패턴 사용 횟수 증가
 */
async function incrementPatternUsage(patternId: string): Promise<void> {
  const { data } = await supabase
    .from('user_classification_patterns')
    .select('use_count, confidence')
    .eq('id', patternId)
    .single();

  if (data) {
    await supabase
      .from('user_classification_patterns')
      .update({
        use_count: data.use_count + 1,
        confidence: Math.min(data.confidence + 0.02, 1.0) // 사용할 때마다 신뢰도 증가
      })
      .eq('id', patternId);
  }
}

/**
 * 문자열에서 핵심 키워드 추출
 */
function extractKeyPattern(text: string): string {
  // 한글, 영문, 숫자만 추출하고 공백/특수문자 제거
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, ' ')
    .trim();
  
  // 가장 긴 단어 추출 (의미 있는 키워드일 가능성 높음)
  const words = cleaned.split(' ').filter(w => w.length > 1);
  return words.sort((a, b) => b.length - a.length)[0] || cleaned;
}
