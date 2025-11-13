
-- ontology_relation_types 테이블에 올바른 unique constraint 추가
-- 기존 constraint 제거 (user_id, name만으로는 부족함)
ALTER TABLE public.ontology_relation_types 
DROP CONSTRAINT IF EXISTS ontology_relation_types_user_id_name_key;

-- 새로운 unique constraint 추가 (user_id, name, source_entity_type, target_entity_type 조합)
ALTER TABLE public.ontology_relation_types
ADD CONSTRAINT ontology_relation_types_user_id_name_source_target_key 
UNIQUE (user_id, name, source_entity_type, target_entity_type);
