--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: create_store_storage_folders(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_store_storage_folders() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- 스토리지 폴더 구조는 애플리케이션 레벨에서 관리
  -- 이 트리거는 로깅 목적
  RAISE NOTICE 'Store created: % (ID: %). Storage path: %/%', NEW.store_name, NEW.id, NEW.user_id, NEW.id;
  RETURN NEW;
END;
$$;


--
-- Name: graph_n_hop_query(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.graph_n_hop_query(p_user_id uuid, p_start_entity_id uuid, p_max_hops integer DEFAULT 3) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result jsonb;
BEGIN
  WITH RECURSIVE graph_traverse AS (
    -- Base case: start node
    SELECT 
      e.id as entity_id,
      e.label,
      e.properties,
      0 as depth,
      ARRAY[e.id] as path
    FROM graph_entities e
    WHERE e.id = p_start_entity_id AND e.user_id = p_user_id
    
    UNION ALL
    
    -- Recursive case: traverse edges
    SELECT 
      e.id as entity_id,
      e.label,
      e.properties,
      gt.depth + 1 as depth,
      gt.path || e.id as path
    FROM graph_traverse gt
    JOIN graph_relations r ON r.source_entity_id = gt.entity_id AND r.user_id = p_user_id
    JOIN graph_entities e ON e.id = r.target_entity_id
    WHERE gt.depth < p_max_hops
      AND NOT e.id = ANY(gt.path) -- Prevent cycles
  )
  SELECT jsonb_build_object(
    'nodes', (SELECT jsonb_agg(DISTINCT jsonb_build_object(
      'id', entity_id,
      'label', label,
      'properties', properties,
      'depth', depth
    )) FROM graph_traverse),
    'edges', (
      SELECT jsonb_agg(jsonb_build_object(
        'source', r.source_entity_id,
        'target', r.target_entity_id,
        'properties', r.properties,
        'weight', r.weight
      ))
      FROM graph_relations r
      WHERE r.source_entity_id IN (SELECT entity_id FROM graph_traverse)
        AND r.target_entity_id IN (SELECT entity_id FROM graph_traverse)
        AND r.user_id = p_user_id
    ),
    'paths', (SELECT jsonb_agg(DISTINCT path) FROM graph_traverse WHERE depth = p_max_hops)
  ) INTO result;
  
  RETURN result;
END;
$$;


--
-- Name: graph_shortest_path(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.graph_shortest_path(p_user_id uuid, p_start_id uuid, p_end_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  result jsonb;
BEGIN
  WITH RECURSIVE bfs AS (
    -- Start node
    SELECT 
      e.id as entity_id,
      ARRAY[e.id] as path,
      0 as distance
    FROM graph_entities e
    WHERE e.id = p_start_id AND e.user_id = p_user_id
    
    UNION ALL
    
    -- BFS traversal
    SELECT 
      e.id as entity_id,
      bfs.path || e.id as path,
      bfs.distance + 1 as distance
    FROM bfs
    JOIN graph_relations r ON r.source_entity_id = bfs.entity_id AND r.user_id = p_user_id
    JOIN graph_entities e ON e.id = r.target_entity_id
    WHERE NOT e.id = ANY(bfs.path) -- Prevent cycles
      AND bfs.entity_id != p_end_id -- Stop when we reach the end
  )
  SELECT path INTO result
  FROM bfs
  WHERE entity_id = p_end_id
  ORDER BY distance ASC
  LIMIT 1;
  
  RETURN to_jsonb(result);
END;
$$;


--
-- Name: update_ai_scene_analysis_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ai_scene_analysis_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: update_classification_patterns_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_classification_patterns_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_ontology_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_ontology_updated_at() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ai_scene_analysis; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ai_scene_analysis (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    analysis_type text NOT NULL,
    scene_data jsonb NOT NULL,
    insights jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    store_id uuid
);


--
-- Name: analysis_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analysis_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    analysis_type text NOT NULL,
    input_data jsonb NOT NULL,
    result text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    store_id uuid
);


--
-- Name: auto_order_suggestions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auto_order_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    current_stock integer NOT NULL,
    optimal_stock integer NOT NULL,
    suggested_order_quantity integer NOT NULL,
    urgency_level text NOT NULL,
    estimated_stockout_date timestamp with time zone,
    potential_revenue_loss numeric(10,2) DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT auto_order_suggestions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'ordered'::text]))),
    CONSTRAINT auto_order_suggestions_urgency_level_check CHECK ((urgency_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])))
);


--
-- Name: data_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    schedule_id uuid NOT NULL,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone,
    status text NOT NULL,
    records_synced integer DEFAULT 0,
    error_message text,
    metadata jsonb DEFAULT '{}'::jsonb
);


--
-- Name: data_sync_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_sync_schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    data_source_id uuid NOT NULL,
    schedule_name text NOT NULL,
    cron_expression text NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    last_run_at timestamp with time zone,
    next_run_at timestamp with time zone,
    last_status text,
    error_message text,
    sync_config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: external_data_sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_data_sources (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    source_type text NOT NULL,
    api_url text,
    api_key_encrypted text,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: graph_entities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_entities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    entity_type_id uuid NOT NULL,
    label text NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    model_3d_position jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_rotation jsonb DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb,
    model_3d_scale jsonb DEFAULT '{"x": 1, "y": 1, "z": 1}'::jsonb,
    store_id uuid
);

ALTER TABLE ONLY public.graph_entities REPLICA IDENTITY FULL;


--
-- Name: graph_relations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.graph_relations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    relation_type_id uuid NOT NULL,
    source_entity_id uuid NOT NULL,
    target_entity_id uuid NOT NULL,
    properties jsonb DEFAULT '{}'::jsonb,
    weight double precision DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    store_id uuid
);

ALTER TABLE ONLY public.graph_relations REPLICA IDENTITY FULL;


--
-- Name: inventory_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_levels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id uuid NOT NULL,
    current_stock integer DEFAULT 0 NOT NULL,
    optimal_stock integer NOT NULL,
    minimum_stock integer NOT NULL,
    weekly_demand integer DEFAULT 0 NOT NULL,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: neuralsense_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.neuralsense_devices (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    device_name text NOT NULL,
    device_id text NOT NULL,
    location text,
    status text DEFAULT 'offline'::text NOT NULL,
    raspberry_pi_model text,
    ip_address text,
    mac_address text,
    last_seen timestamp with time zone,
    wifi_probe_enabled boolean DEFAULT true,
    probe_interval_seconds integer DEFAULT 5,
    probe_range_meters integer DEFAULT 50,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT neuralsense_devices_status_check CHECK ((status = ANY (ARRAY['online'::text, 'offline'::text, 'error'::text])))
);


--
-- Name: ontology_entity_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ontology_entity_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    description text,
    color text DEFAULT '#3b82f6'::text,
    icon text,
    properties jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    model_3d_url text,
    model_3d_dimensions jsonb DEFAULT '{"depth": 1, "width": 1, "height": 1}'::jsonb,
    model_3d_type text,
    model_3d_metadata jsonb DEFAULT '{}'::jsonb,
    CONSTRAINT ontology_entity_types_model_3d_type_check CHECK (((model_3d_type IS NULL) OR (model_3d_type = ANY (ARRAY['space'::text, 'zone'::text, 'furniture'::text, 'structure'::text, 'room'::text, 'device'::text, 'product'::text, 'decoration'::text, 'lighting'::text]))))
);

ALTER TABLE ONLY public.ontology_entity_types REPLICA IDENTITY FULL;


--
-- Name: ontology_relation_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ontology_relation_types (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    label text NOT NULL,
    description text,
    source_entity_type text NOT NULL,
    target_entity_type text NOT NULL,
    directionality text DEFAULT 'directed'::text,
    properties jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ontology_relation_types_directionality_check CHECK ((directionality = ANY (ARRAY['directed'::text, 'undirected'::text])))
);


--
-- Name: ontology_schema_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ontology_schema_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    version_number integer NOT NULL,
    schema_data jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    category text,
    cost_price numeric(10,2) NOT NULL,
    selling_price numeric(10,2) NOT NULL,
    supplier text,
    lead_time_days integer DEFAULT 7,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: store_scenes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_scenes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_id uuid,
    name text DEFAULT 'Default Scene'::text NOT NULL,
    recipe_data jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    store_name text NOT NULL,
    store_code text NOT NULL,
    address text,
    manager_name text,
    phone text,
    email text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_classification_patterns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_classification_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pattern_type text NOT NULL,
    pattern_value text NOT NULL,
    classified_as text NOT NULL,
    confidence double precision DEFAULT 1.0 NOT NULL,
    use_count integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_data_imports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_data_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    data_type text NOT NULL,
    raw_data jsonb NOT NULL,
    row_count integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sheet_name text,
    store_id uuid,
    file_path text
);


--
-- Name: wifi_heatmap_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_heatmap_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    date date NOT NULL,
    hour integer NOT NULL,
    grid_x double precision NOT NULL,
    grid_z double precision NOT NULL,
    visit_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT wifi_heatmap_cache_hour_check CHECK (((hour >= 0) AND (hour < 24)))
);


--
-- Name: wifi_probe_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_probe_data (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id uuid NOT NULL,
    user_id uuid NOT NULL,
    mac_address text NOT NULL,
    signal_strength integer,
    "timestamp" timestamp with time zone DEFAULT now() NOT NULL,
    location_zone text,
    device_type text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wifi_raw_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_raw_signals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    "timestamp" timestamp with time zone NOT NULL,
    mac_address text NOT NULL,
    sensor_id text NOT NULL,
    rssi integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wifi_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    "timestamp" timestamp with time zone NOT NULL,
    session_id text NOT NULL,
    x double precision NOT NULL,
    z double precision NOT NULL,
    accuracy double precision,
    status text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: wifi_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wifi_zones (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    store_id uuid,
    zone_id integer NOT NULL,
    x double precision NOT NULL,
    y double precision NOT NULL,
    z double precision DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: ai_scene_analysis ai_scene_analysis_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_scene_analysis
    ADD CONSTRAINT ai_scene_analysis_pkey PRIMARY KEY (id);


--
-- Name: analysis_history analysis_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_history
    ADD CONSTRAINT analysis_history_pkey PRIMARY KEY (id);


--
-- Name: auto_order_suggestions auto_order_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_order_suggestions
    ADD CONSTRAINT auto_order_suggestions_pkey PRIMARY KEY (id);


--
-- Name: data_sync_logs data_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_logs
    ADD CONSTRAINT data_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: data_sync_schedules data_sync_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_schedules
    ADD CONSTRAINT data_sync_schedules_pkey PRIMARY KEY (id);


--
-- Name: external_data_sources external_data_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_data_sources
    ADD CONSTRAINT external_data_sources_pkey PRIMARY KEY (id);


--
-- Name: graph_entities graph_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_entities
    ADD CONSTRAINT graph_entities_pkey PRIMARY KEY (id);


--
-- Name: graph_relations graph_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_pkey PRIMARY KEY (id);


--
-- Name: inventory_levels inventory_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_levels
    ADD CONSTRAINT inventory_levels_pkey PRIMARY KEY (id);


--
-- Name: neuralsense_devices neuralsense_devices_device_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neuralsense_devices
    ADD CONSTRAINT neuralsense_devices_device_id_key UNIQUE (device_id);


--
-- Name: neuralsense_devices neuralsense_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neuralsense_devices
    ADD CONSTRAINT neuralsense_devices_pkey PRIMARY KEY (id);


--
-- Name: ontology_entity_types ontology_entity_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_entity_types
    ADD CONSTRAINT ontology_entity_types_pkey PRIMARY KEY (id);


--
-- Name: ontology_entity_types ontology_entity_types_user_id_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_entity_types
    ADD CONSTRAINT ontology_entity_types_user_id_name_key UNIQUE (user_id, name);


--
-- Name: ontology_relation_types ontology_relation_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_relation_types
    ADD CONSTRAINT ontology_relation_types_pkey PRIMARY KEY (id);


--
-- Name: ontology_relation_types ontology_relation_types_user_id_name_source_target_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_relation_types
    ADD CONSTRAINT ontology_relation_types_user_id_name_source_target_key UNIQUE (user_id, name, source_entity_type, target_entity_type);


--
-- Name: ontology_schema_versions ontology_schema_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_schema_versions
    ADD CONSTRAINT ontology_schema_versions_pkey PRIMARY KEY (id);


--
-- Name: ontology_schema_versions ontology_schema_versions_user_id_version_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ontology_schema_versions
    ADD CONSTRAINT ontology_schema_versions_user_id_version_number_key UNIQUE (user_id, version_number);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: store_scenes store_scenes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_scenes
    ADD CONSTRAINT store_scenes_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_user_id_store_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_user_id_store_code_key UNIQUE (user_id, store_code);


--
-- Name: user_classification_patterns user_classification_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_classification_patterns
    ADD CONSTRAINT user_classification_patterns_pkey PRIMARY KEY (id);


--
-- Name: user_data_imports user_data_imports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_data_imports
    ADD CONSTRAINT user_data_imports_pkey PRIMARY KEY (id);


--
-- Name: wifi_heatmap_cache wifi_heatmap_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_heatmap_cache
    ADD CONSTRAINT wifi_heatmap_cache_pkey PRIMARY KEY (id);


--
-- Name: wifi_heatmap_cache wifi_heatmap_cache_store_id_date_hour_grid_x_grid_z_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_heatmap_cache
    ADD CONSTRAINT wifi_heatmap_cache_store_id_date_hour_grid_x_grid_z_key UNIQUE (store_id, date, hour, grid_x, grid_z);


--
-- Name: wifi_probe_data wifi_probe_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_probe_data
    ADD CONSTRAINT wifi_probe_data_pkey PRIMARY KEY (id);


--
-- Name: wifi_raw_signals wifi_raw_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_raw_signals
    ADD CONSTRAINT wifi_raw_signals_pkey PRIMARY KEY (id);


--
-- Name: wifi_tracking wifi_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_tracking
    ADD CONSTRAINT wifi_tracking_pkey PRIMARY KEY (id);


--
-- Name: wifi_zones wifi_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_zones
    ADD CONSTRAINT wifi_zones_pkey PRIMARY KEY (id);


--
-- Name: wifi_zones wifi_zones_store_id_zone_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_zones
    ADD CONSTRAINT wifi_zones_store_id_zone_id_key UNIQUE (store_id, zone_id);


--
-- Name: idx_ai_scene_analysis_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ai_scene_analysis_store_id ON public.ai_scene_analysis USING btree (store_id);


--
-- Name: idx_analysis_history_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_created_at ON public.analysis_history USING btree (created_at DESC);


--
-- Name: idx_analysis_history_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_store_id ON public.analysis_history USING btree (store_id);


--
-- Name: idx_analysis_history_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_type ON public.analysis_history USING btree (analysis_type);


--
-- Name: idx_analysis_history_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_analysis_history_user_id ON public.analysis_history USING btree (user_id);


--
-- Name: idx_auto_order_suggestions_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auto_order_suggestions_product_id ON public.auto_order_suggestions USING btree (product_id);


--
-- Name: idx_auto_order_suggestions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auto_order_suggestions_status ON public.auto_order_suggestions USING btree (status);


--
-- Name: idx_auto_order_suggestions_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auto_order_suggestions_user_id ON public.auto_order_suggestions USING btree (user_id);


--
-- Name: idx_classification_patterns_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classification_patterns_type ON public.user_classification_patterns USING btree (pattern_type, pattern_value);


--
-- Name: idx_classification_patterns_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_classification_patterns_unique ON public.user_classification_patterns USING btree (user_id, pattern_type, pattern_value, classified_as);


--
-- Name: idx_classification_patterns_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_classification_patterns_user ON public.user_classification_patterns USING btree (user_id);


--
-- Name: idx_graph_entities_entity_type_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_entities_entity_type_id ON public.graph_entities USING btree (entity_type_id);


--
-- Name: idx_graph_entities_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_entities_store_id ON public.graph_entities USING btree (store_id);


--
-- Name: idx_graph_entities_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_entities_user_id ON public.graph_entities USING btree (user_id);


--
-- Name: idx_graph_relations_source; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_source ON public.graph_relations USING btree (source_entity_id);


--
-- Name: idx_graph_relations_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_store_id ON public.graph_relations USING btree (store_id);


--
-- Name: idx_graph_relations_target; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_target ON public.graph_relations USING btree (target_entity_id);


--
-- Name: idx_graph_relations_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_type ON public.graph_relations USING btree (relation_type_id);


--
-- Name: idx_graph_relations_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_graph_relations_user_id ON public.graph_relations USING btree (user_id);


--
-- Name: idx_inventory_levels_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_levels_product_id ON public.inventory_levels USING btree (product_id);


--
-- Name: idx_inventory_levels_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inventory_levels_user_id ON public.inventory_levels USING btree (user_id);


--
-- Name: idx_neuralsense_devices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_neuralsense_devices_status ON public.neuralsense_devices USING btree (status);


--
-- Name: idx_neuralsense_devices_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_neuralsense_devices_user_id ON public.neuralsense_devices USING btree (user_id);


--
-- Name: idx_products_sku; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_sku ON public.products USING btree (sku);


--
-- Name: idx_products_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_user_id ON public.products USING btree (user_id);


--
-- Name: idx_store_scenes_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_scenes_is_active ON public.store_scenes USING btree (is_active) WHERE (is_active = true);


--
-- Name: idx_store_scenes_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_scenes_store_id ON public.store_scenes USING btree (store_id);


--
-- Name: idx_store_scenes_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_scenes_user_id ON public.store_scenes USING btree (user_id);


--
-- Name: idx_user_data_imports_sheet_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_data_imports_sheet_name ON public.user_data_imports USING btree (sheet_name);


--
-- Name: idx_user_data_imports_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_data_imports_store_id ON public.user_data_imports USING btree (store_id);


--
-- Name: idx_wifi_heatmap_cache_store_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_heatmap_cache_store_date ON public.wifi_heatmap_cache USING btree (store_id, date, hour);


--
-- Name: idx_wifi_heatmap_cache_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_heatmap_cache_user ON public.wifi_heatmap_cache USING btree (user_id);


--
-- Name: idx_wifi_probe_data_device_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_probe_data_device_id ON public.wifi_probe_data USING btree (device_id);


--
-- Name: idx_wifi_probe_data_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_probe_data_timestamp ON public.wifi_probe_data USING btree ("timestamp" DESC);


--
-- Name: idx_wifi_raw_signals_store_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_raw_signals_store_timestamp ON public.wifi_raw_signals USING btree (store_id, "timestamp" DESC);


--
-- Name: idx_wifi_raw_signals_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_raw_signals_user ON public.wifi_raw_signals USING btree (user_id);


--
-- Name: idx_wifi_tracking_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_tracking_session ON public.wifi_tracking USING btree (session_id);


--
-- Name: idx_wifi_tracking_store_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_tracking_store_timestamp ON public.wifi_tracking USING btree (store_id, "timestamp" DESC);


--
-- Name: idx_wifi_tracking_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_tracking_user ON public.wifi_tracking USING btree (user_id);


--
-- Name: idx_wifi_zones_store; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_zones_store ON public.wifi_zones USING btree (store_id);


--
-- Name: idx_wifi_zones_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wifi_zones_user ON public.wifi_zones USING btree (user_id);


--
-- Name: stores on_store_created; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER on_store_created AFTER INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.create_store_storage_folders();


--
-- Name: ai_scene_analysis update_ai_scene_analysis_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ai_scene_analysis_updated_at BEFORE UPDATE ON public.ai_scene_analysis FOR EACH ROW EXECUTE FUNCTION public.update_ai_scene_analysis_updated_at();


--
-- Name: auto_order_suggestions update_auto_order_suggestions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_auto_order_suggestions_updated_at BEFORE UPDATE ON public.auto_order_suggestions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_classification_patterns update_classification_patterns_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_classification_patterns_updated_at BEFORE UPDATE ON public.user_classification_patterns FOR EACH ROW EXECUTE FUNCTION public.update_classification_patterns_updated_at();


--
-- Name: data_sync_schedules update_data_sync_schedules_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_data_sync_schedules_updated_at BEFORE UPDATE ON public.data_sync_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ontology_entity_types update_entity_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_entity_types_updated_at BEFORE UPDATE ON public.ontology_entity_types FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: external_data_sources update_external_data_sources_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_external_data_sources_updated_at BEFORE UPDATE ON public.external_data_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: graph_entities update_graph_entities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_graph_entities_updated_at BEFORE UPDATE ON public.graph_entities FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: graph_relations update_graph_relations_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_graph_relations_updated_at BEFORE UPDATE ON public.graph_relations FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: neuralsense_devices update_neuralsense_devices_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_neuralsense_devices_updated_at BEFORE UPDATE ON public.neuralsense_devices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ontology_relation_types update_relation_types_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_relation_types_updated_at BEFORE UPDATE ON public.ontology_relation_types FOR EACH ROW EXECUTE FUNCTION public.update_ontology_updated_at();


--
-- Name: store_scenes update_store_scenes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_scenes_updated_at BEFORE UPDATE ON public.store_scenes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stores update_stores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_scene_analysis ai_scene_analysis_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ai_scene_analysis
    ADD CONSTRAINT ai_scene_analysis_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: analysis_history analysis_history_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_history
    ADD CONSTRAINT analysis_history_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: analysis_history analysis_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analysis_history
    ADD CONSTRAINT analysis_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: auto_order_suggestions auto_order_suggestions_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auto_order_suggestions
    ADD CONSTRAINT auto_order_suggestions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: data_sync_logs data_sync_logs_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_logs
    ADD CONSTRAINT data_sync_logs_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.data_sync_schedules(id) ON DELETE CASCADE;


--
-- Name: data_sync_schedules data_sync_schedules_data_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_sync_schedules
    ADD CONSTRAINT data_sync_schedules_data_source_id_fkey FOREIGN KEY (data_source_id) REFERENCES public.external_data_sources(id) ON DELETE CASCADE;


--
-- Name: graph_entities graph_entities_entity_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_entities
    ADD CONSTRAINT graph_entities_entity_type_id_fkey FOREIGN KEY (entity_type_id) REFERENCES public.ontology_entity_types(id) ON DELETE CASCADE;


--
-- Name: graph_entities graph_entities_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_entities
    ADD CONSTRAINT graph_entities_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_relation_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_relation_type_id_fkey FOREIGN KEY (relation_type_id) REFERENCES public.ontology_relation_types(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_source_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_source_entity_id_fkey FOREIGN KEY (source_entity_id) REFERENCES public.graph_entities(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: graph_relations graph_relations_target_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.graph_relations
    ADD CONSTRAINT graph_relations_target_entity_id_fkey FOREIGN KEY (target_entity_id) REFERENCES public.graph_entities(id) ON DELETE CASCADE;


--
-- Name: inventory_levels inventory_levels_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_levels
    ADD CONSTRAINT inventory_levels_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: store_scenes store_scenes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_scenes
    ADD CONSTRAINT store_scenes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: user_data_imports user_data_imports_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_data_imports
    ADD CONSTRAINT user_data_imports_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_heatmap_cache wifi_heatmap_cache_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_heatmap_cache
    ADD CONSTRAINT wifi_heatmap_cache_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_probe_data wifi_probe_data_device_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_probe_data
    ADD CONSTRAINT wifi_probe_data_device_id_fkey FOREIGN KEY (device_id) REFERENCES public.neuralsense_devices(id) ON DELETE CASCADE;


--
-- Name: wifi_raw_signals wifi_raw_signals_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_raw_signals
    ADD CONSTRAINT wifi_raw_signals_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_tracking wifi_tracking_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_tracking
    ADD CONSTRAINT wifi_tracking_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: wifi_zones wifi_zones_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wifi_zones
    ADD CONSTRAINT wifi_zones_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: user_classification_patterns Users can create their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own classification patterns" ON public.user_classification_patterns FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: external_data_sources Users can create their own data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own data sources" ON public.external_data_sources FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: neuralsense_devices Users can create their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own devices" ON public.neuralsense_devices FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ontology_entity_types Users can create their own entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own entity types" ON public.ontology_entity_types FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: inventory_levels Users can create their own inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own inventory levels" ON public.inventory_levels FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: auto_order_suggestions Users can create their own order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own order suggestions" ON public.auto_order_suggestions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: products Users can create their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own products" ON public.products FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ontology_relation_types Users can create their own relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own relation types" ON public.ontology_relation_types FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: ontology_schema_versions Users can create their own schema versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own schema versions" ON public.ontology_schema_versions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: stores Users can create their own stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own stores" ON public.stores FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: data_sync_schedules Users can create their own sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own sync schedules" ON public.data_sync_schedules FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: analysis_history Users can create their store analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store analysis history" ON public.analysis_history FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = analysis_history.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: graph_entities Users can create their store entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store entities" ON public.graph_entities FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_entities.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: user_data_imports Users can create their store imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store imports" ON public.user_data_imports FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = user_data_imports.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: graph_relations Users can create their store relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store relations" ON public.graph_relations FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_relations.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis Users can create their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store scene analysis" ON public.ai_scene_analysis FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can create their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their store scenes" ON public.store_scenes FOR INSERT WITH CHECK (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: user_classification_patterns Users can delete their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own classification patterns" ON public.user_classification_patterns FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: external_data_sources Users can delete their own data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own data sources" ON public.external_data_sources FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: neuralsense_devices Users can delete their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own devices" ON public.neuralsense_devices FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ontology_entity_types Users can delete their own entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own entity types" ON public.ontology_entity_types FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_heatmap_cache Users can delete their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own heatmap cache" ON public.wifi_heatmap_cache FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: inventory_levels Users can delete their own inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own inventory levels" ON public.inventory_levels FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: auto_order_suggestions Users can delete their own order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own order suggestions" ON public.auto_order_suggestions FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: products Users can delete their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_raw_signals Users can delete their own raw signals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own raw signals" ON public.wifi_raw_signals FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: ontology_relation_types Users can delete their own relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own relation types" ON public.ontology_relation_types FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: stores Users can delete their own stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own stores" ON public.stores FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: data_sync_schedules Users can delete their own sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own sync schedules" ON public.data_sync_schedules FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_tracking Users can delete their own tracking data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own tracking data" ON public.wifi_tracking FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can delete their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own zones" ON public.wifi_zones FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: analysis_history Users can delete their store analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store analysis history" ON public.analysis_history FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = analysis_history.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: graph_entities Users can delete their store entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store entities" ON public.graph_entities FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_entities.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: user_data_imports Users can delete their store imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store imports" ON public.user_data_imports FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = user_data_imports.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: graph_relations Users can delete their store relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store relations" ON public.graph_relations FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_relations.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis Users can delete their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store scene analysis" ON public.ai_scene_analysis FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can delete their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their store scenes" ON public.store_scenes FOR DELETE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: wifi_heatmap_cache Users can insert their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own heatmap cache" ON public.wifi_heatmap_cache FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_probe_data Users can insert their own probe data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own probe data" ON public.wifi_probe_data FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_raw_signals Users can insert their own raw signals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own raw signals" ON public.wifi_raw_signals FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: data_sync_logs Users can insert their own sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own sync logs" ON public.data_sync_logs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_tracking Users can insert their own tracking data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own tracking data" ON public.wifi_tracking FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can insert their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own zones" ON public.wifi_zones FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: user_classification_patterns Users can update their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own classification patterns" ON public.user_classification_patterns FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: external_data_sources Users can update their own data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own data sources" ON public.external_data_sources FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: neuralsense_devices Users can update their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own devices" ON public.neuralsense_devices FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ontology_entity_types Users can update their own entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own entity types" ON public.ontology_entity_types FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: wifi_heatmap_cache Users can update their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own heatmap cache" ON public.wifi_heatmap_cache FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: inventory_levels Users can update their own inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own inventory levels" ON public.inventory_levels FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: auto_order_suggestions Users can update their own order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own order suggestions" ON public.auto_order_suggestions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: products Users can update their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: ontology_relation_types Users can update their own relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own relation types" ON public.ontology_relation_types FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: stores Users can update their own stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own stores" ON public.stores FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: data_sync_schedules Users can update their own sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sync schedules" ON public.data_sync_schedules FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can update their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own zones" ON public.wifi_zones FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: graph_entities Users can update their store entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their store entities" ON public.graph_entities FOR UPDATE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_entities.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: graph_relations Users can update their store relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their store relations" ON public.graph_relations FOR UPDATE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_relations.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis Users can update their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their store scene analysis" ON public.ai_scene_analysis FOR UPDATE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can update their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their store scenes" ON public.store_scenes FOR UPDATE USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: user_classification_patterns Users can view their own classification patterns; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own classification patterns" ON public.user_classification_patterns FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: external_data_sources Users can view their own data sources; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own data sources" ON public.external_data_sources FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: neuralsense_devices Users can view their own devices; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own devices" ON public.neuralsense_devices FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ontology_entity_types Users can view their own entity types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own entity types" ON public.ontology_entity_types FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_heatmap_cache Users can view their own heatmap cache; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own heatmap cache" ON public.wifi_heatmap_cache FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: inventory_levels Users can view their own inventory levels; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own inventory levels" ON public.inventory_levels FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: auto_order_suggestions Users can view their own order suggestions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own order suggestions" ON public.auto_order_suggestions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_probe_data Users can view their own probe data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own probe data" ON public.wifi_probe_data FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: products Users can view their own products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own products" ON public.products FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_raw_signals Users can view their own raw signals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own raw signals" ON public.wifi_raw_signals FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ontology_relation_types Users can view their own relation types; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own relation types" ON public.ontology_relation_types FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: ontology_schema_versions Users can view their own schema versions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own schema versions" ON public.ontology_schema_versions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: stores Users can view their own stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own stores" ON public.stores FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: data_sync_logs Users can view their own sync logs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sync logs" ON public.data_sync_logs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: data_sync_schedules Users can view their own sync schedules; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sync schedules" ON public.data_sync_schedules FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_tracking Users can view their own tracking data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own tracking data" ON public.wifi_tracking FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: wifi_zones Users can view their own zones; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own zones" ON public.wifi_zones FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: analysis_history Users can view their store analysis history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store analysis history" ON public.analysis_history FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = analysis_history.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: graph_entities Users can view their store entities; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store entities" ON public.graph_entities FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_entities.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: user_data_imports Users can view their store imports; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store imports" ON public.user_data_imports FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = user_data_imports.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: graph_relations Users can view their store relations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store relations" ON public.graph_relations FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = graph_relations.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis Users can view their store scene analysis; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store scene analysis" ON public.ai_scene_analysis FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = ai_scene_analysis.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: store_scenes Users can view their store scenes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their store scenes" ON public.store_scenes FOR SELECT USING (((auth.uid() = user_id) AND ((store_id IS NULL) OR (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_scenes.store_id) AND (stores.user_id = auth.uid())))))));


--
-- Name: ai_scene_analysis; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ai_scene_analysis ENABLE ROW LEVEL SECURITY;

--
-- Name: analysis_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

--
-- Name: auto_order_suggestions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.auto_order_suggestions ENABLE ROW LEVEL SECURITY;

--
-- Name: data_sync_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: data_sync_schedules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.data_sync_schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: external_data_sources; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;

--
-- Name: graph_entities; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.graph_entities ENABLE ROW LEVEL SECURITY;

--
-- Name: graph_relations; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.graph_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory_levels; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventory_levels ENABLE ROW LEVEL SECURITY;

--
-- Name: neuralsense_devices; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.neuralsense_devices ENABLE ROW LEVEL SECURITY;

--
-- Name: ontology_entity_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ontology_entity_types ENABLE ROW LEVEL SECURITY;

--
-- Name: ontology_relation_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ontology_relation_types ENABLE ROW LEVEL SECURITY;

--
-- Name: ontology_schema_versions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ontology_schema_versions ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: store_scenes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_scenes ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

--
-- Name: user_classification_patterns; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_classification_patterns ENABLE ROW LEVEL SECURITY;

--
-- Name: user_data_imports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_data_imports ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_heatmap_cache; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_heatmap_cache ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_probe_data; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_probe_data ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_raw_signals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_raw_signals ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_tracking; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_tracking ENABLE ROW LEVEL SECURITY;

--
-- Name: wifi_zones; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.wifi_zones ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


