-- Fix foreign key reference in graph_relations table
ALTER TABLE public.graph_relations 
  DROP CONSTRAINT IF EXISTS graph_relations_target_entity_id_fkey;

ALTER TABLE public.graph_relations
  ADD CONSTRAINT graph_relations_target_entity_id_fkey 
  FOREIGN KEY (target_entity_id) 
  REFERENCES public.graph_entities(id) 
  ON DELETE CASCADE;