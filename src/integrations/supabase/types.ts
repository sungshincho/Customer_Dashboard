export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_recommendations: {
        Row: {
          action_category: string | null
          created_at: string
          data_source: string | null
          description: string
          dismissed_at: string | null
          displayed_at: string | null
          evidence: Json | null
          expected_impact: Json | null
          id: string
          is_displayed: boolean | null
          org_id: string | null
          priority: string
          recommendation_type: string
          status: string | null
          store_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_category?: string | null
          created_at?: string
          data_source?: string | null
          description: string
          dismissed_at?: string | null
          displayed_at?: string | null
          evidence?: Json | null
          expected_impact?: Json | null
          id?: string
          is_displayed?: boolean | null
          org_id?: string | null
          priority: string
          recommendation_type: string
          status?: string | null
          store_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_category?: string | null
          created_at?: string
          data_source?: string | null
          description?: string
          dismissed_at?: string | null
          displayed_at?: string | null
          evidence?: Json | null
          expected_impact?: Json | null
          id?: string
          is_displayed?: boolean | null
          org_id?: string | null
          priority?: string
          recommendation_type?: string
          status?: string | null
          store_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommendations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommendations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_scene_analysis: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          insights: Json
          org_id: string | null
          scene_data: Json
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          insights: Json
          org_id?: string | null
          scene_data: Json
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          insights?: Json
          org_id?: string | null
          scene_data?: Json
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_scene_analysis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_scene_analysis_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_history: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          input_data: Json
          org_id: string | null
          result: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          input_data: Json
          org_id?: string | null
          result: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          input_data?: Json
          org_id?: string | null
          result?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      api_connections: {
        Row: {
          auth_type: string | null
          auth_value: string | null
          created_at: string
          headers: Json | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          method: string | null
          name: string
          org_id: string | null
          type: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          auth_type?: string | null
          auth_value?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          method?: string | null
          name: string
          org_id?: string | null
          type: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          auth_type?: string | null
          auth_value?: string | null
          created_at?: string
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          method?: string | null
          name?: string
          org_id?: string | null
          type?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_connections_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_order_suggestions: {
        Row: {
          created_at: string | null
          current_stock: number
          estimated_stockout_date: string | null
          id: string
          optimal_stock: number
          org_id: string | null
          potential_revenue_loss: number | null
          product_id: string
          status: string
          suggested_order_quantity: number
          updated_at: string | null
          urgency_level: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_stock: number
          estimated_stockout_date?: string | null
          id?: string
          optimal_stock: number
          org_id?: string | null
          potential_revenue_loss?: number | null
          product_id: string
          status?: string
          suggested_order_quantity: number
          updated_at?: string | null
          urgency_level: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_stock?: number
          estimated_stockout_date?: string | null
          id?: string
          optimal_stock?: number
          org_id?: string | null
          potential_revenue_loss?: number | null
          product_id?: string
          status?: string
          suggested_order_quantity?: number
          updated_at?: string | null
          urgency_level?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_order_suggestions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_order_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_kpis: {
        Row: {
          consumer_sentiment_index: number | null
          conversion_rate: number | null
          created_at: string
          date: string
          funnel_browse: number | null
          funnel_entry: number | null
          funnel_fitting: number | null
          funnel_purchase: number | null
          funnel_return: number | null
          id: string
          is_holiday: boolean | null
          labor_hours: number | null
          org_id: string | null
          sales_per_sqm: number | null
          special_event: string | null
          store_id: string | null
          total_purchases: number | null
          total_revenue: number | null
          total_visits: number | null
          updated_at: string
          user_id: string
          weather_condition: string | null
        }
        Insert: {
          consumer_sentiment_index?: number | null
          conversion_rate?: number | null
          created_at?: string
          date: string
          funnel_browse?: number | null
          funnel_entry?: number | null
          funnel_fitting?: number | null
          funnel_purchase?: number | null
          funnel_return?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          org_id?: string | null
          sales_per_sqm?: number | null
          special_event?: string | null
          store_id?: string | null
          total_purchases?: number | null
          total_revenue?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id: string
          weather_condition?: string | null
        }
        Update: {
          consumer_sentiment_index?: number | null
          conversion_rate?: number | null
          created_at?: string
          date?: string
          funnel_browse?: number | null
          funnel_entry?: number | null
          funnel_fitting?: number | null
          funnel_purchase?: number | null
          funnel_return?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          org_id?: string | null
          sales_per_sqm?: number | null
          special_event?: string | null
          store_id?: string | null
          total_purchases?: number | null
          total_revenue?: number | null
          total_visits?: number | null
          updated_at?: string
          user_id?: string
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_kpis_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          records_synced: number | null
          schedule_id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          records_synced?: number | null
          schedule_id: string
          started_at?: string
          status: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          records_synced?: number | null
          schedule_id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sync_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sync_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "data_sync_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sync_schedules: {
        Row: {
          created_at: string
          cron_expression: string
          data_source_id: string
          error_message: string | null
          id: string
          is_enabled: boolean
          last_run_at: string | null
          last_status: string | null
          next_run_at: string | null
          org_id: string | null
          schedule_name: string
          sync_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cron_expression: string
          data_source_id: string
          error_message?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          org_id?: string | null
          schedule_name: string
          sync_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          data_source_id?: string
          error_message?: string | null
          id?: string
          is_enabled?: boolean
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string | null
          org_id?: string | null
          schedule_name?: string
          sync_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sync_schedules_data_source_id_fkey"
            columns: ["data_source_id"]
            isOneToOne: false
            referencedRelation: "external_data_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sync_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      economic_indicators: {
        Row: {
          created_at: string | null
          date: string
          id: string
          indicator_type: string
          indicator_value: number
          metadata: Json | null
          org_id: string | null
          region: string | null
          source: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          indicator_type: string
          indicator_value: number
          metadata?: Json | null
          org_id?: string | null
          region?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          indicator_type?: string
          indicator_value?: number
          metadata?: Json | null
          org_id?: string | null
          region?: string | null
          source?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "economic_indicators_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      external_data_sources: {
        Row: {
          api_key_encrypted: string | null
          api_url: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          org_id: string | null
          source_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted?: string | null
          api_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          org_id?: string | null
          source_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string | null
          api_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          org_id?: string | null
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "external_data_sources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_metrics: {
        Row: {
          count: number
          created_at: string
          customer_segment: string | null
          date: string
          duration_seconds: number | null
          hour: number | null
          id: string
          org_id: string | null
          stage: string
          store_id: string | null
          user_id: string
        }
        Insert: {
          count: number
          created_at?: string
          customer_segment?: string | null
          date: string
          duration_seconds?: number | null
          hour?: number | null
          id?: string
          org_id?: string | null
          stage: string
          store_id?: string | null
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          customer_segment?: string | null
          date?: string
          duration_seconds?: number | null
          hour?: number | null
          id?: string
          org_id?: string | null
          stage?: string
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_entities: {
        Row: {
          created_at: string | null
          entity_type_id: string
          id: string
          label: string
          model_3d_position: Json | null
          model_3d_rotation: Json | null
          model_3d_scale: Json | null
          org_id: string | null
          properties: Json | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_type_id: string
          id?: string
          label: string
          model_3d_position?: Json | null
          model_3d_rotation?: Json | null
          model_3d_scale?: Json | null
          org_id?: string | null
          properties?: Json | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_type_id?: string
          id?: string
          label?: string
          model_3d_position?: Json | null
          model_3d_rotation?: Json | null
          model_3d_scale?: Json | null
          org_id?: string | null
          properties?: Json | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_entities_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_entities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_entities_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_relations: {
        Row: {
          created_at: string | null
          id: string
          org_id: string | null
          properties: Json | null
          relation_type_id: string
          source_entity_id: string
          store_id: string | null
          target_entity_id: string
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          properties?: Json | null
          relation_type_id: string
          source_entity_id: string
          store_id?: string | null
          target_entity_id: string
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string | null
          properties?: Json | null
          relation_type_id?: string
          source_entity_id?: string
          store_id?: string | null
          target_entity_id?: string
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_relations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_relations_relation_type_id_fkey"
            columns: ["relation_type_id"]
            isOneToOne: false
            referencedRelation: "ontology_relation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_relations_source_entity_id_fkey"
            columns: ["source_entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_relations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_relations_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays_events: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          event_name: string
          event_type: string
          id: string
          impact_level: string | null
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          event_name: string
          event_type: string
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          event_name?: string
          event_type?: string
          id?: string
          impact_level?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holidays_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holidays_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_store_master: {
        Row: {
          address: string | null
          area_sqm: number | null
          created_at: string
          district: string | null
          email: string | null
          external_system_id: string | null
          external_system_name: string | null
          hq_store_code: string
          hq_store_name: string
          id: string
          last_synced_at: string | null
          manager_name: string | null
          metadata: Json | null
          opening_date: string | null
          org_id: string | null
          phone: string | null
          region: string | null
          status: string | null
          store_format: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          created_at?: string
          district?: string | null
          email?: string | null
          external_system_id?: string | null
          external_system_name?: string | null
          hq_store_code: string
          hq_store_name: string
          id?: string
          last_synced_at?: string | null
          manager_name?: string | null
          metadata?: Json | null
          opening_date?: string | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_format?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          created_at?: string
          district?: string | null
          email?: string | null
          external_system_id?: string | null
          external_system_name?: string | null
          hq_store_code?: string
          hq_store_name?: string
          id?: string
          last_synced_at?: string | null
          manager_name?: string | null
          metadata?: Json | null
          opening_date?: string | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_format?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hq_store_master_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          records_failed: number | null
          records_processed: number | null
          records_synced: number | null
          started_at: string
          status: string
          sync_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_synced?: number | null
          started_at?: string
          status: string
          sync_type: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          records_failed?: number | null
          records_processed?: number | null
          records_synced?: number | null
          started_at?: string
          status?: string
          sync_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hq_sync_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_levels: {
        Row: {
          created_at: string | null
          current_stock: number
          id: string
          last_updated: string | null
          minimum_stock: number
          optimal_stock: number
          org_id: string | null
          product_id: string
          user_id: string
          weekly_demand: number
        }
        Insert: {
          created_at?: string | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          minimum_stock: number
          optimal_stock: number
          org_id?: string | null
          product_id: string
          user_id: string
          weekly_demand?: number
        }
        Update: {
          created_at?: string | null
          current_stock?: number
          id?: string
          last_updated?: string | null
          minimum_stock?: number
          optimal_stock?: number
          org_id?: string | null
          product_id?: string
          user_id?: string
          weekly_demand?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      license_management: {
        Row: {
          api_calls_limit: number
          billing_cycle_end: string
          billing_cycle_start: string
          created_at: string
          current_hq_users: number
          current_stores: number
          id: string
          is_active: boolean | null
          max_hq_users: number
          max_stores: number
          org_id: string | null
          plan_type: string
          storage_limit_gb: number
          updated_at: string
          usage_api_calls: number | null
          usage_storage_gb: number | null
          user_id: string
        }
        Insert: {
          api_calls_limit?: number
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          current_hq_users?: number
          current_stores?: number
          id?: string
          is_active?: boolean | null
          max_hq_users?: number
          max_stores?: number
          org_id?: string | null
          plan_type: string
          storage_limit_gb?: number
          updated_at?: string
          usage_api_calls?: number | null
          usage_storage_gb?: number | null
          user_id: string
        }
        Update: {
          api_calls_limit?: number
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          current_hq_users?: number
          current_stores?: number
          id?: string
          is_active?: boolean | null
          max_hq_users?: number
          max_stores?: number
          org_id?: string | null
          plan_type?: string
          storage_limit_gb?: number
          updated_at?: string
          usage_api_calls?: number | null
          usage_storage_gb?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_management_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          created_at: string
          effective_date: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          license_type: string
          metadata: Json | null
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          effective_date: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          license_type: string
          metadata?: Json | null
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          license_type?: string
          metadata?: Json | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      neuralsense_devices: {
        Row: {
          created_at: string
          device_id: string
          device_name: string
          id: string
          ip_address: string | null
          last_seen: string | null
          location: string | null
          mac_address: string | null
          metadata: Json | null
          org_id: string | null
          probe_interval_seconds: number | null
          probe_range_meters: number | null
          raspberry_pi_model: string | null
          status: string
          updated_at: string
          user_id: string
          wifi_probe_enabled: boolean | null
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name: string
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          location?: string | null
          mac_address?: string | null
          metadata?: Json | null
          org_id?: string | null
          probe_interval_seconds?: number | null
          probe_range_meters?: number | null
          raspberry_pi_model?: string | null
          status?: string
          updated_at?: string
          user_id: string
          wifi_probe_enabled?: boolean | null
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string
          id?: string
          ip_address?: string | null
          last_seen?: string | null
          location?: string | null
          mac_address?: string | null
          metadata?: Json | null
          org_id?: string | null
          probe_interval_seconds?: number | null
          probe_range_meters?: number | null
          raspberry_pi_model?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          wifi_probe_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "neuralsense_devices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          id: string
          notification_types: Json | null
          org_id: string | null
          slack_enabled: boolean | null
          slack_webhook_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          notification_types?: Json | null
          org_id?: string | null
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          id?: string
          notification_types?: Json | null
          org_id?: string | null
          slack_enabled?: boolean | null
          slack_webhook_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_entity_types: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          label: string
          model_3d_dimensions: Json | null
          model_3d_metadata: Json | null
          model_3d_type: string | null
          model_3d_url: string | null
          name: string
          org_id: string | null
          properties: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label: string
          model_3d_dimensions?: Json | null
          model_3d_metadata?: Json | null
          model_3d_type?: string | null
          model_3d_url?: string | null
          name: string
          org_id?: string | null
          properties?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          label?: string
          model_3d_dimensions?: Json | null
          model_3d_metadata?: Json | null
          model_3d_type?: string | null
          model_3d_url?: string | null
          name?: string
          org_id?: string | null
          properties?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_entity_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_mapping_cache: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          data_type: string
          entity_mappings: Json
          file_name_pattern: string
          id: string
          last_used_at: string | null
          org_id: string | null
          relation_mappings: Json
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          data_type: string
          entity_mappings: Json
          file_name_pattern: string
          id?: string
          last_used_at?: string | null
          org_id?: string | null
          relation_mappings: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          data_type?: string
          entity_mappings?: Json
          file_name_pattern?: string
          id?: string
          last_used_at?: string | null
          org_id?: string | null
          relation_mappings?: Json
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_mapping_cache_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_relation_types: {
        Row: {
          created_at: string | null
          description: string | null
          directionality: string | null
          id: string
          label: string
          name: string
          org_id: string | null
          properties: Json | null
          source_entity_type: string
          target_entity_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          directionality?: string | null
          id?: string
          label: string
          name: string
          org_id?: string | null
          properties?: Json | null
          source_entity_type: string
          target_entity_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          directionality?: string | null
          id?: string
          label?: string
          name?: string
          org_id?: string | null
          properties?: Json | null
          source_entity_type?: string
          target_entity_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_relation_types_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ontology_schema_versions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          org_id: string | null
          schema_data: Json
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          org_id?: string | null
          schema_data: Json
          user_id: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          org_id?: string | null
          schema_data?: Json
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "ontology_schema_versions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          org_id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          org_id: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          org_id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_settings: {
        Row: {
          brand_color: string | null
          created_at: string
          currency: string
          default_kpi_set: Json | null
          id: string
          logo_url: string | null
          org_id: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          currency?: string
          default_kpi_set?: Json | null
          id?: string
          logo_url?: string | null
          org_id?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          currency?: string
          default_kpi_set?: Json | null
          id?: string
          logo_url?: string | null
          org_id?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          industry: string | null
          metadata: Json | null
          org_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          org_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          org_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string | null
          id: string
          lead_time_days: number | null
          name: string
          org_id: string | null
          selling_price: number
          sku: string
          supplier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          cost_price: number
          created_at?: string | null
          id?: string
          lead_time_days?: number | null
          name: string
          org_id?: string | null
          selling_price: number
          sku: string
          supplier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string | null
          id?: string
          lead_time_days?: number | null
          name?: string
          org_id?: string | null
          selling_price?: number
          sku?: string
          supplier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      regional_data: {
        Row: {
          comparison_value: number | null
          created_at: string | null
          data_type: string
          date: string
          id: string
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
          value: number
        }
        Insert: {
          comparison_value?: number | null
          created_at?: string | null
          data_type: string
          date: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
          value: number
        }
        Update: {
          comparison_value?: number | null
          created_at?: string | null
          data_type?: string
          date?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "regional_data_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regional_data_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules: {
        Row: {
          created_at: string
          day_of_month: number | null
          day_of_week: number | null
          frequency: string
          id: string
          is_enabled: boolean | null
          last_sent_at: string | null
          org_id: string | null
          recipients: Json
          report_name: string
          report_type: string
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          frequency: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          org_id?: string | null
          recipients?: Json
          report_name: string
          report_type: string
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_month?: number | null
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          last_sent_at?: string | null
          org_id?: string | null
          recipients?: Json
          report_name?: string
          report_type?: string
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scenario_comparisons: {
        Row: {
          comparison_type: string | null
          created_at: string | null
          id: string
          name: string
          org_id: string | null
          scenario_ids: string[]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comparison_type?: string | null
          created_at?: string | null
          id?: string
          name: string
          org_id?: string | null
          scenario_ids: string[]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comparison_type?: string | null
          created_at?: string | null
          id?: string
          name?: string
          org_id?: string | null
          scenario_ids?: string[]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_comparisons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          ai_insights: string | null
          baseline_kpi: Json | null
          confidence_score: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          org_id: string | null
          params: Json
          predicted_kpi: Json | null
          scenario_type: string
          status: string | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_insights?: string | null
          baseline_kpi?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          org_id?: string | null
          params?: Json
          predicted_kpi?: Json | null
          scenario_type: string
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_insights?: string | null
          baseline_kpi?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string | null
          params?: Json
          predicted_kpi?: Json | null
          scenario_type?: string
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scenarios_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_results: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          result_data: Json
          result_type: string
          scenario_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          result_data?: Json
          result_type: string
          scenario_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          result_data?: Json
          result_type?: string
          scenario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulation_results_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      store_mappings: {
        Row: {
          created_at: string
          hq_store_id: string
          id: string
          last_synced_at: string | null
          local_store_id: string
          mapping_status: string | null
          metadata: Json | null
          org_id: string | null
          sync_direction: string | null
          sync_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hq_store_id: string
          id?: string
          last_synced_at?: string | null
          local_store_id: string
          mapping_status?: string | null
          metadata?: Json | null
          org_id?: string | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hq_store_id?: string
          id?: string
          last_synced_at?: string | null
          local_store_id?: string
          mapping_status?: string | null
          metadata?: Json | null
          org_id?: string | null
          sync_direction?: string | null
          sync_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_mappings_hq_store_id_fkey"
            columns: ["hq_store_id"]
            isOneToOne: false
            referencedRelation: "hq_store_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_mappings_local_store_id_fkey"
            columns: ["local_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_mappings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      store_scenes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string | null
          recipe_data: Json
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          recipe_data: Json
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string | null
          recipe_data?: Json
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_scenes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_scenes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          area_sqm: number | null
          created_at: string
          district: string | null
          email: string | null
          hq_store_code: string | null
          id: string
          manager_name: string | null
          metadata: Json | null
          opening_date: string | null
          org_id: string | null
          phone: string | null
          region: string | null
          status: string | null
          store_code: string
          store_format: string | null
          store_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          created_at?: string
          district?: string | null
          email?: string | null
          hq_store_code?: string | null
          id?: string
          manager_name?: string | null
          metadata?: Json | null
          opening_date?: string | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_code: string
          store_format?: string | null
          store_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          created_at?: string
          district?: string | null
          email?: string | null
          hq_store_code?: string | null
          id?: string
          manager_name?: string | null
          metadata?: Json | null
          opening_date?: string | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_code?: string
          store_format?: string | null
          store_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          billing_cycle_end: string
          billing_cycle_start: string
          created_at: string
          hq_seat_quota: number
          id: string
          metadata: Json | null
          org_id: string
          plan: string
          status: string
          store_quota: number
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean | null
          billing_cycle_end: string
          billing_cycle_start: string
          created_at?: string
          hq_seat_quota?: number
          id?: string
          metadata?: Json | null
          org_id: string
          plan: string
          status?: string
          store_quota?: number
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean | null
          billing_cycle_end?: string
          billing_cycle_start?: string
          created_at?: string
          hq_seat_quota?: number
          id?: string
          metadata?: Json | null
          org_id?: string
          plan?: string
          status?: string
          store_quota?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      upload_sessions: {
        Row: {
          completed_at: string | null
          completed_files: number
          created_at: string | null
          failed_files: number
          id: string
          started_at: string | null
          status: string | null
          store_id: string | null
          total_files: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_files?: number
          created_at?: string | null
          failed_files?: number
          id?: string
          started_at?: string | null
          status?: string | null
          store_id?: string | null
          total_files?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_files?: number
          created_at?: string | null
          failed_files?: number
          id?: string
          started_at?: string | null
          status?: string | null
          store_id?: string | null
          total_files?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upload_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_classification_patterns: {
        Row: {
          classified_as: string
          confidence: number
          created_at: string
          id: string
          pattern_type: string
          pattern_value: string
          updated_at: string
          use_count: number
          user_id: string
        }
        Insert: {
          classified_as: string
          confidence?: number
          created_at?: string
          id?: string
          pattern_type: string
          pattern_value: string
          updated_at?: string
          use_count?: number
          user_id: string
        }
        Update: {
          classified_as?: string
          confidence?: number
          created_at?: string
          id?: string
          pattern_type?: string
          pattern_value?: string
          updated_at?: string
          use_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_data_imports: {
        Row: {
          can_pause: boolean | null
          can_resume: boolean | null
          created_at: string
          data_type: string
          error_details: string | null
          file_name: string
          file_path: string | null
          file_type: string
          id: string
          org_id: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          progress: Json | null
          raw_data: Json
          row_count: number
          session_id: string | null
          sheet_name: string | null
          status: string | null
          store_id: string | null
          user_id: string
        }
        Insert: {
          can_pause?: boolean | null
          can_resume?: boolean | null
          created_at?: string
          data_type: string
          error_details?: string | null
          file_name: string
          file_path?: string | null
          file_type: string
          id?: string
          org_id?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          progress?: Json | null
          raw_data: Json
          row_count: number
          session_id?: string | null
          sheet_name?: string | null
          status?: string | null
          store_id?: string | null
          user_id: string
        }
        Update: {
          can_pause?: boolean | null
          can_resume?: boolean | null
          created_at?: string
          data_type?: string
          error_details?: string | null
          file_name?: string
          file_path?: string | null
          file_type?: string
          id?: string
          org_id?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          progress?: Json | null
          raw_data?: Json
          row_count?: number
          session_id?: string | null
          sheet_name?: string | null
          status?: string | null
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_data_imports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_data_imports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "upload_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_data_imports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          created_at: string | null
          date: string
          hour: number | null
          humidity: number | null
          id: string
          metadata: Json | null
          precipitation: number | null
          store_id: string | null
          temperature: number | null
          updated_at: string | null
          user_id: string
          weather_condition: string | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          hour?: number | null
          humidity?: number | null
          id?: string
          metadata?: Json | null
          precipitation?: number | null
          store_id?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id: string
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          hour?: number | null
          humidity?: number | null
          id?: string
          metadata?: Json | null
          precipitation?: number | null
          store_id?: string | null
          temperature?: number | null
          updated_at?: string | null
          user_id?: string
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weather_data_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_heatmap_cache: {
        Row: {
          created_at: string
          date: string
          grid_x: number
          grid_z: number
          hour: number
          id: string
          store_id: string | null
          user_id: string
          visit_count: number
        }
        Insert: {
          created_at?: string
          date: string
          grid_x: number
          grid_z: number
          hour: number
          id?: string
          store_id?: string | null
          user_id?: string
          visit_count?: number
        }
        Update: {
          created_at?: string
          date?: string
          grid_x?: number
          grid_z?: number
          hour?: number
          id?: string
          store_id?: string | null
          user_id?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "wifi_heatmap_cache_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_probe_data: {
        Row: {
          created_at: string
          device_id: string
          device_type: string | null
          id: string
          location_zone: string | null
          mac_address: string
          metadata: Json | null
          signal_strength: number | null
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_type?: string | null
          id?: string
          location_zone?: string | null
          mac_address: string
          metadata?: Json | null
          signal_strength?: number | null
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_type?: string | null
          id?: string
          location_zone?: string | null
          mac_address?: string
          metadata?: Json | null
          signal_strength?: number | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wifi_probe_data_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "neuralsense_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_raw_signals: {
        Row: {
          created_at: string
          id: string
          mac_address: string
          rssi: number
          sensor_id: string
          store_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mac_address: string
          rssi: number
          sensor_id: string
          store_id?: string | null
          timestamp: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          mac_address?: string
          rssi?: number
          sensor_id?: string
          store_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wifi_raw_signals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_tracking: {
        Row: {
          accuracy: number | null
          created_at: string
          id: string
          session_id: string
          status: string | null
          store_id: string | null
          timestamp: string
          user_id: string
          x: number
          z: number
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          id?: string
          session_id: string
          status?: string | null
          store_id?: string | null
          timestamp: string
          user_id?: string
          x: number
          z: number
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          id?: string
          session_id?: string
          status?: string | null
          store_id?: string | null
          timestamp?: string
          user_id?: string
          x?: number
          z?: number
        }
        Relationships: [
          {
            foreignKeyName: "wifi_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_zones: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          store_id: string | null
          user_id: string
          x: number
          y: number
          z: number | null
          zone_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          store_id?: string | null
          user_id?: string
          x: number
          y: number
          z?: number | null
          zone_id: number
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          store_id?: string | null
          user_id?: string
          x?: number
          y?: number
          z?: number | null
          zone_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "wifi_zones_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      graph_n_hop_query: {
        Args: {
          p_max_hops?: number
          p_start_entity_id: string
          p_user_id: string
        }
        Returns: Json
      }
      graph_shortest_path: {
        Args: { p_end_id: string; p_start_id: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_neuraltwin_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_owner: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      migrate_user_to_organization: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "analyst"
        | "viewer"
        | "ORG_OWNER"
        | "ORG_ADMIN"
        | "ORG_MEMBER"
        | "NEURALTWIN_ADMIN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "manager",
        "analyst",
        "viewer",
        "ORG_OWNER",
        "ORG_ADMIN",
        "ORG_MEMBER",
        "NEURALTWIN_ADMIN",
      ],
    },
  },
} as const
