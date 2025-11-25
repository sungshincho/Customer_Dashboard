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
        Relationships: []
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
            foreignKeyName: "auto_order_suggestions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          company: string
          created_at: string
          email: string
          features: string[] | null
          id: string
          message: string
          name: string
          phone: string | null
          stores: number | null
          timeline: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          features?: string[] | null
          id?: string
          message: string
          name: string
          phone?: string | null
          stores?: number | null
          timeline?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          features?: string[] | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          stores?: number | null
          timeline?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          customer_name: string | null
          email: string | null
          id: string
          last_visit_date: string | null
          org_id: string | null
          phone: string | null
          segment: string | null
          store_id: string | null
          total_purchases: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          last_visit_date?: string | null
          org_id?: string | null
          phone?: string | null
          segment?: string | null
          store_id?: string | null
          total_purchases?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          last_visit_date?: string | null
          org_id?: string | null
          phone?: string | null
          segment?: string | null
          store_id?: string | null
          total_purchases?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
        Relationships: []
      }
      etl_pipelines: {
        Row: {
          config: Json
          created_at: string
          error_log: string | null
          id: string
          last_run_at: string | null
          next_run_at: string | null
          org_id: string
          pipeline_name: string
          schedule_cron: string | null
          source_type: string
          status: string
          target_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          error_log?: string | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          org_id: string
          pipeline_name: string
          schedule_cron?: string | null
          source_type: string
          status?: string
          target_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          error_log?: string | null
          id?: string
          last_run_at?: string | null
          next_run_at?: string | null
          org_id?: string
          pipeline_name?: string
          schedule_cron?: string | null
          source_type?: string
          status?: string
          target_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "etl_pipelines_org_id_fkey"
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "inventory_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          license_id: string | null
          metadata: Json | null
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          license_id?: string | null
          metadata?: Json | null
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          license_id?: string | null
          metadata?: Json | null
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          assigned_store_id: string | null
          assigned_to: string | null
          billing_history: Json | null
          created_at: string
          effective_date: string
          expiry_date: string | null
          id: string
          issued_at: string | null
          last_used_at: string | null
          license_key: string | null
          license_type: string
          metadata: Json | null
          monthly_price: number | null
          next_billing_date: string | null
          org_id: string
          status: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          assigned_store_id?: string | null
          assigned_to?: string | null
          billing_history?: Json | null
          created_at?: string
          effective_date: string
          expiry_date?: string | null
          id?: string
          issued_at?: string | null
          last_used_at?: string | null
          license_key?: string | null
          license_type: string
          metadata?: Json | null
          monthly_price?: number | null
          next_billing_date?: string | null
          org_id: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          assigned_store_id?: string | null
          assigned_to?: string | null
          billing_history?: Json | null
          created_at?: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          issued_at?: string | null
          last_used_at?: string | null
          license_key?: string | null
          license_type?: string
          metadata?: Json | null
          monthly_price?: number | null
          next_billing_date?: string | null
          org_id?: string
          status?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "licenses_assigned_store_id_fkey"
            columns: ["assigned_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licenses_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      ontology_schemas: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_master: boolean
          schema_definition: Json
          schema_name: string
          schema_type: string
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_master?: boolean
          schema_definition: Json
          schema_name: string
          schema_type: string
          status?: string
          updated_at?: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_master?: boolean
          schema_definition?: Json
          schema_name?: string
          schema_type?: string
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invitation_accepted_at: string | null
          invited_by: string | null
          joined_at: string
          license_id: string | null
          org_id: string | null
          permissions: Json | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          joined_at?: string
          license_id?: string | null
          org_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invitation_accepted_at?: string | null
          invited_by?: string | null
          joined_at?: string
          license_id?: string | null
          org_id?: string | null
          permissions?: Json | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_org_id_fkey"
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
          member_count: number | null
          metadata: Json | null
          org_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          member_count?: number | null
          metadata?: Json | null
          org_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          member_count?: number | null
          metadata?: Json | null
          org_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          min_stock_level: number | null
          org_id: string | null
          price: number | null
          product_name: string
          sku: string | null
          stock: number | null
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          min_stock_level?: number | null
          org_id?: string | null
          price?: number | null
          product_name: string
          sku?: string | null
          stock?: number | null
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          min_stock_level?: number | null
          org_id?: string | null
          price?: number | null
          product_name?: string
          sku?: string | null
          stock?: number | null
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          org_id: string | null
          product_id: string | null
          purchase_date: string
          quantity: number
          store_id: string | null
          total_price: number
          unit_price: number
          user_id: string
          visit_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          org_id?: string | null
          product_id?: string | null
          purchase_date: string
          quantity: number
          store_id?: string | null
          total_price: number
          unit_price: number
          user_id: string
          visit_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          org_id?: string | null
          product_id?: string | null
          purchase_date?: string
          quantity?: number
          store_id?: string | null
          total_price?: number
          unit_price?: number
          user_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          parameters: Json
          results: Json | null
          scenario_name: string
          scenario_type: string
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          parameters: Json
          results?: Json | null
          scenario_name: string
          scenario_type: string
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          parameters?: Json
          results?: Json | null
          scenario_name?: string
          scenario_type?: string
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      simulation_configs: {
        Row: {
          config_name: string
          created_at: string
          created_by: string | null
          id: string
          org_id: string
          parameters: Json
          results: Json | null
          simulation_type: string
          status: string
          store_id: string | null
          updated_at: string
        }
        Insert: {
          config_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id: string
          parameters?: Json
          results?: Json | null
          simulation_type: string
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          config_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          org_id?: string
          parameters?: Json
          results?: Json | null
          simulation_type?: string
          status?: string
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "simulation_configs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulation_configs_store_id_fkey"
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
          city: string | null
          country: string | null
          created_at: string
          district: string | null
          email: string | null
          floor_area_sqm: number | null
          hq_store_code: string | null
          id: string
          license_id: string | null
          location: string | null
          manager_name: string | null
          opening_date: string | null
          org_id: string | null
          phone: string | null
          region: string | null
          status: string | null
          store_code: string | null
          store_format: string | null
          store_name: string
          store_type: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          floor_area_sqm?: number | null
          hq_store_code?: string | null
          id?: string
          license_id?: string | null
          location?: string | null
          manager_name?: string | null
          opening_date?: string | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_code?: string | null
          store_format?: string | null
          store_name: string
          store_type?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          area_sqm?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          district?: string | null
          email?: string | null
          floor_area_sqm?: number | null
          hq_store_code?: string | null
          id?: string
          license_id?: string | null
          location?: string | null
          manager_name?: string | null
          opening_date?: string | null
          org_id?: string | null
          phone?: string | null
          region?: string | null
          status?: string | null
          store_code?: string | null
          store_format?: string | null
          store_name?: string
          store_type?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          end_date: string | null
          hq_license_count: number
          hq_seat_quota: number | null
          id: string
          metadata: Json | null
          monthly_cost: number
          org_id: string
          plan_type: string | null
          start_date: string | null
          status: string
          store_license_count: number
          store_quota: number | null
          subscription_type: string
          updated_at: string
          viewer_count: number
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string | null
          hq_license_count?: number
          hq_seat_quota?: number | null
          id?: string
          metadata?: Json | null
          monthly_cost?: number
          org_id: string
          plan_type?: string | null
          start_date?: string | null
          status: string
          store_license_count?: number
          store_quota?: number | null
          subscription_type?: string
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          end_date?: string | null
          hq_license_count?: number
          hq_seat_quota?: number | null
          id?: string
          metadata?: Json | null
          monthly_cost?: number
          org_id?: string
          plan_type?: string | null
          start_date?: string | null
          status?: string
          store_license_count?: number
          store_quota?: number | null
          subscription_type?: string
          updated_at?: string
          viewer_count?: number
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
          created_at: string
          id: string
          org_id: string | null
          processed_files: number | null
          session_name: string | null
          status: string
          store_id: string | null
          total_files: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          processed_files?: number | null
          session_name?: string | null
          status?: string
          store_id?: string | null
          total_files?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          processed_files?: number | null
          session_name?: string | null
          status?: string
          store_id?: string | null
          total_files?: number | null
          updated_at?: string
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
      user_data_imports: {
        Row: {
          can_resume: boolean | null
          completed_at: string | null
          created_at: string
          data_type: string
          error_details: Json | null
          error_message: string | null
          file_name: string
          id: string
          is_paused: boolean | null
          org_id: string | null
          progress: Json | null
          raw_data: Json | null
          row_count: number | null
          started_at: string | null
          status: string
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_resume?: boolean | null
          completed_at?: string | null
          created_at?: string
          data_type: string
          error_details?: Json | null
          error_message?: string | null
          file_name: string
          id?: string
          is_paused?: boolean | null
          org_id?: string | null
          progress?: Json | null
          raw_data?: Json | null
          row_count?: number | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_resume?: boolean | null
          completed_at?: string | null
          created_at?: string
          data_type?: string
          error_details?: Json | null
          error_message?: string | null
          file_name?: string
          id?: string
          is_paused?: boolean | null
          org_id?: string | null
          progress?: Json | null
          raw_data?: Json | null
          row_count?: number | null
          started_at?: string | null
          status?: string
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_data_imports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          created_at: string
          customer_id: string | null
          duration_minutes: number | null
          id: string
          org_id: string | null
          store_id: string | null
          user_id: string
          visit_date: string
          zones_visited: string[] | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          duration_minutes?: number | null
          id?: string
          org_id?: string | null
          store_id?: string | null
          user_id: string
          visit_date: string
          zones_visited?: string[] | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          duration_minutes?: number | null
          id?: string
          org_id?: string | null
          store_id?: string | null
          user_id?: string
          visit_date?: string
          zones_visited?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_tracking: {
        Row: {
          created_at: string
          dwell_time_seconds: number | null
          id: string
          mac_address: string
          org_id: string | null
          signal_strength: number | null
          store_id: string
          timestamp: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          dwell_time_seconds?: number | null
          id?: string
          mac_address: string
          org_id?: string | null
          signal_strength?: number | null
          store_id: string
          timestamp: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          dwell_time_seconds?: number | null
          id?: string
          mac_address?: string
          org_id?: string | null
          signal_strength?: number | null
          store_id?: string
          timestamp?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "wifi_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_zones: {
        Row: {
          coordinates: Json | null
          created_at: string
          id: string
          org_id: string | null
          store_id: string
          updated_at: string
          user_id: string
          zone_name: string
          zone_type: string | null
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string
          id?: string
          org_id?: string | null
          store_id: string
          updated_at?: string
          user_id: string
          zone_name: string
          zone_type?: string | null
        }
        Update: {
          coordinates?: Json | null
          created_at?: string
          id?: string
          org_id?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
          zone_name?: string
          zone_type?: string | null
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
      has_valid_license: {
        Args: { _license_type: string; _user_id: string }
        Returns: boolean
      }
      is_neuraltwin_admin: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member_simple: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member_with_license: {
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
        | "ORG_OWNER"
        | "ORG_ADMIN"
        | "ORG_MEMBER"
        | "NEURALTWIN_ADMIN"
        | "NEURALTWIN_MASTER"
        | "ORG_HQ"
        | "ORG_STORE"
        | "ORG_VIEWER"
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
        "ORG_OWNER",
        "ORG_ADMIN",
        "ORG_MEMBER",
        "NEURALTWIN_ADMIN",
        "NEURALTWIN_MASTER",
        "ORG_HQ",
        "ORG_STORE",
        "ORG_VIEWER",
      ],
    },
  },
} as const
