
-- ontology_entity_types 테이블의 model_3d_type 체크 제약 조건 업데이트
-- 기존 제약 조건 제거
ALTER TABLE public.ontology_entity_types 
DROP CONSTRAINT IF EXISTS ontology_entity_types_model_3d_type_check;

-- 새로운 제약 조건 추가 (모든 필요한 타입 포함)
ALTER TABLE public.ontology_entity_types
ADD CONSTRAINT ontology_entity_types_model_3d_type_check
CHECK (model_3d_type IS NULL OR model_3d_type = ANY (ARRAY[
  'space'::text,
  'zone'::text,
  'furniture'::text,
  'structure'::text,
  'room'::text,
  'device'::text,
  'product'::text,
  'decoration'::text,
  'lighting'::text
]));
