-- 1. Store/매장 타입의 엔티티를 'other'에서 'space'로 변경
UPDATE ontology_entity_types
SET model_3d_type = 'space'
WHERE model_3d_type = 'other'
  AND (
    name ILIKE '%store%' 
    OR name ILIKE '%매장%'
    OR name ILIKE '%room%'
    OR name ILIKE '%building%'
    OR label ILIKE '%매장%'
    OR label ILIKE '%상점%'
    OR label ILIKE '%건물%'
  );

-- 2. 로그 출력
DO $$ 
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % entity types from "other" to "space"', updated_count;
END $$;