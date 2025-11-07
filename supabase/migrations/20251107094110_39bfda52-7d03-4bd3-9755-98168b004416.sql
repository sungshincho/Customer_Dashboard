-- Create graph entities table for storing entity instances
CREATE TABLE IF NOT EXISTS public.graph_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entity_type_id uuid NOT NULL REFERENCES public.ontology_entity_types(id) ON DELETE CASCADE,
  label text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create graph relations table for storing relationship instances
CREATE TABLE IF NOT EXISTS public.graph_relations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  relation_type_id uuid NOT NULL REFERENCES public.ontology_relation_types(id) ON DELETE CASCADE,
  source_entity_id uuid NOT NULL REFERENCES public.graph_entities(id) ON DELETE CASCADE,
  target_entity_id uuid NOT NULL REFERENCES public.graph_relations(id) ON DELETE CASCADE,
  properties jsonb DEFAULT '{}'::jsonb,
  weight double precision DEFAULT 1.0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.graph_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_relations ENABLE ROW LEVEL SECURITY;

-- RLS policies for graph_entities
CREATE POLICY "Users can view their own entities"
  ON public.graph_entities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own entities"
  ON public.graph_entities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entities"
  ON public.graph_entities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entities"
  ON public.graph_entities FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for graph_relations
CREATE POLICY "Users can view their own relations"
  ON public.graph_relations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own relations"
  ON public.graph_relations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relations"
  ON public.graph_relations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relations"
  ON public.graph_relations FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_graph_entities_user_id ON public.graph_entities(user_id);
CREATE INDEX idx_graph_entities_entity_type_id ON public.graph_entities(entity_type_id);
CREATE INDEX idx_graph_relations_user_id ON public.graph_relations(user_id);
CREATE INDEX idx_graph_relations_source ON public.graph_relations(source_entity_id);
CREATE INDEX idx_graph_relations_target ON public.graph_relations(target_entity_id);
CREATE INDEX idx_graph_relations_type ON public.graph_relations(relation_type_id);

-- Create trigger for updated_at
CREATE TRIGGER update_graph_entities_updated_at
  BEFORE UPDATE ON public.graph_entities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ontology_updated_at();

CREATE TRIGGER update_graph_relations_updated_at
  BEFORE UPDATE ON public.graph_relations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_ontology_updated_at();