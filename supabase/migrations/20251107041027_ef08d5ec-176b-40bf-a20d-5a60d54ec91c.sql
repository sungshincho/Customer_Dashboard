-- 사용자별 분류 학습 패턴 테이블
CREATE TABLE IF NOT EXISTS public.user_classification_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  pattern_type TEXT NOT NULL, -- 'sheet_name', 'column_pattern', 'combined'
  pattern_value TEXT NOT NULL, -- 실제 패턴 (예: "주문", "order_id", "상품 주문 합계")
  classified_as TEXT NOT NULL, -- 'sales', 'customer', 'inventory' 등
  confidence FLOAT NOT NULL DEFAULT 1.0, -- 신뢰도 점수 (0.0 ~ 1.0)
  use_count INTEGER NOT NULL DEFAULT 1, -- 패턴 사용 횟수
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_classification_patterns_user ON public.user_classification_patterns(user_id);
CREATE INDEX idx_classification_patterns_type ON public.user_classification_patterns(pattern_type, pattern_value);
CREATE UNIQUE INDEX idx_classification_patterns_unique ON public.user_classification_patterns(user_id, pattern_type, pattern_value, classified_as);

-- RLS 정책 활성화
ALTER TABLE public.user_classification_patterns ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 사용자는 자신의 패턴만 조회 가능
CREATE POLICY "Users can view their own classification patterns"
ON public.user_classification_patterns
FOR SELECT
USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 패턴만 삽입 가능
CREATE POLICY "Users can create their own classification patterns"
ON public.user_classification_patterns
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 패턴만 업데이트 가능
CREATE POLICY "Users can update their own classification patterns"
ON public.user_classification_patterns
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS 정책: 사용자는 자신의 패턴만 삭제 가능
CREATE POLICY "Users can delete their own classification patterns"
ON public.user_classification_patterns
FOR DELETE
USING (auth.uid() = user_id);

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION public.update_classification_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_classification_patterns_updated_at
BEFORE UPDATE ON public.user_classification_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_classification_patterns_updated_at();