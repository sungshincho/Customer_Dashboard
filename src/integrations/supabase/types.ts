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
      ai_inference_logs: {
        Row: {
          application_id: string | null
          confidence_factors: Json | null
          confidence_score: number | null
          created_at: string | null
          id: string
          inference_type: string
          input_data_quality: Json | null
          measured_impact: Json | null
          model_version: string | null
          org_id: string
          processing_time_ms: number | null
          recommendations_count: number | null
          result_summary: Json | null
          scenario_type: string
          store_id: string
          user_id: string
          was_applied: boolean | null
        }
        Insert: {
          application_id?: string | null
          confidence_factors?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          inference_type: string
          input_data_quality?: Json | null
          measured_impact?: Json | null
          model_version?: string | null
          org_id: string
          processing_time_ms?: number | null
          recommendations_count?: number | null
          result_summary?: Json | null
          scenario_type: string
          store_id: string
          user_id: string
          was_applied?: boolean | null
        }
        Update: {
          application_id?: string | null
          confidence_factors?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          inference_type?: string
          input_data_quality?: Json | null
          measured_impact?: Json | null
          model_version?: string | null
          org_id?: string
          processing_time_ms?: number | null
          recommendations_count?: number | null
          result_summary?: Json | null
          scenario_type?: string
          store_id?: string
          user_id?: string
          was_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_inference_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_insights: {
        Row: {
          category: string | null
          created_at: string
          id: string
          insight_text: string
          kpi_refs: Json | null
          metadata: Json | null
          org_id: string | null
          severity: string | null
          source: string | null
          store_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          insight_text: string
          kpi_refs?: Json | null
          metadata?: Json | null
          org_id?: string | null
          severity?: string | null
          source?: string | null
          store_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          insight_text?: string
          kpi_refs?: Json | null
          metadata?: Json | null
          org_id?: string | null
          severity?: string | null
          source?: string | null
          store_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
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
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          org_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source: string | null
          store_id: string | null
          user_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          org_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source?: string | null
          store_id?: string | null
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          org_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source?: string | null
          store_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_store_id_fkey"
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
      beacon_events: {
        Row: {
          beacon_id: string | null
          created_at: string
          device_id: string | null
          event_ts: string
          id: string
          metadata: Json | null
          org_id: string | null
          rssi: number | null
          store_id: string | null
        }
        Insert: {
          beacon_id?: string | null
          created_at?: string
          device_id?: string | null
          event_ts: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          rssi?: number | null
          store_id?: string | null
        }
        Update: {
          beacon_id?: string | null
          created_at?: string
          device_id?: string | null
          event_ts?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          rssi?: number | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beacon_events_beacon_id_fkey"
            columns: ["beacon_id"]
            isOneToOne: false
            referencedRelation: "beacons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beacon_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beacon_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      beacons: {
        Row: {
          beacon_code: string
          created_at: string
          id: string
          location: string | null
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          beacon_code: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          beacon_code?: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "beacons_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beacons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_events: {
        Row: {
          camera_code: string | null
          count: number | null
          created_at: string
          event_ts: string
          event_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          camera_code?: string | null
          count?: number | null
          created_at?: string
          event_ts: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          camera_code?: string | null
          count?: number | null
          created_at?: string
          event_ts?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camera_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      column_mappings: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          source_column: string
          table_id: string
          target_column: string
          target_entity: string
          transformation_rule: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          org_id?: string | null
          source_column: string
          table_id: string
          target_column: string
          target_entity: string
          transformation_rule?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string | null
          source_column?: string
          table_id?: string
          target_column?: string
          target_entity?: string
          transformation_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "column_mappings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "column_mappings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "data_source_tables"
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
      customer_segments: {
        Row: {
          avg_ltv: number | null
          avg_purchase_frequency: number | null
          created_at: string | null
          criteria: Json | null
          customer_count: number | null
          description: string | null
          id: string
          is_active: boolean | null
          org_id: string | null
          segment_code: string
          segment_name: string
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          avg_ltv?: number | null
          avg_purchase_frequency?: number | null
          created_at?: string | null
          criteria?: Json | null
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          segment_code: string
          segment_name: string
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avg_ltv?: number | null
          avg_purchase_frequency?: number | null
          created_at?: string | null
          criteria?: Json | null
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          segment_code?: string
          segment_name?: string
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_segments_agg: {
        Row: {
          avg_basket_size: number | null
          avg_transaction_value: number | null
          calculated_at: string | null
          churn_risk_score: number | null
          created_at: string | null
          customer_count: number | null
          date: string
          id: string
          ltv_estimate: number | null
          metadata: Json | null
          org_id: string | null
          segment_name: string
          segment_type: string
          store_id: string | null
          total_revenue: number | null
          visit_frequency: number | null
        }
        Insert: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          calculated_at?: string | null
          churn_risk_score?: number | null
          created_at?: string | null
          customer_count?: number | null
          date: string
          id?: string
          ltv_estimate?: number | null
          metadata?: Json | null
          org_id?: string | null
          segment_name: string
          segment_type: string
          store_id?: string | null
          total_revenue?: number | null
          visit_frequency?: number | null
        }
        Update: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          calculated_at?: string | null
          churn_risk_score?: number | null
          created_at?: string | null
          customer_count?: number | null
          date?: string
          id?: string
          ltv_estimate?: number | null
          metadata?: Json | null
          org_id?: string | null
          segment_name?: string
          segment_type?: string
          store_id?: string | null
          total_revenue?: number | null
          visit_frequency?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_segments_agg_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_segments_agg_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
      daily_kpis_agg: {
        Row: {
          avg_basket_size: number | null
          avg_transaction_value: number | null
          avg_visit_duration_seconds: number | null
          browse_to_engage_rate: number | null
          calculated_at: string | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          engage_to_purchase_rate: number | null
          id: string
          is_holiday: boolean | null
          labor_hours: number | null
          metadata: Json | null
          org_id: string | null
          returning_visitors: number | null
          sales_per_labor_hour: number | null
          sales_per_sqm: number | null
          sales_per_visitor: number | null
          special_event: string | null
          store_id: string | null
          temperature: number | null
          total_revenue: number | null
          total_transactions: number | null
          total_units_sold: number | null
          total_visitors: number | null
          unique_visitors: number | null
          updated_at: string | null
          weather_condition: string | null
        }
        Insert: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          avg_visit_duration_seconds?: number | null
          browse_to_engage_rate?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          engage_to_purchase_rate?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          metadata?: Json | null
          org_id?: string | null
          returning_visitors?: number | null
          sales_per_labor_hour?: number | null
          sales_per_sqm?: number | null
          sales_per_visitor?: number | null
          special_event?: string | null
          store_id?: string | null
          temperature?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
          total_units_sold?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          weather_condition?: string | null
        }
        Update: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          avg_visit_duration_seconds?: number | null
          browse_to_engage_rate?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          engage_to_purchase_rate?: number | null
          id?: string
          is_holiday?: boolean | null
          labor_hours?: number | null
          metadata?: Json | null
          org_id?: string | null
          returning_visitors?: number | null
          sales_per_labor_hour?: number | null
          sales_per_sqm?: number | null
          sales_per_visitor?: number | null
          special_event?: string | null
          store_id?: string | null
          temperature?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
          total_units_sold?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          updated_at?: string | null
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_kpis_agg_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_kpis_agg_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales: {
        Row: {
          avg_transaction_value: number | null
          created_at: string
          date: string
          id: string
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          total_customers: number | null
          total_revenue: number | null
          total_transactions: number | null
        }
        Insert: {
          avg_transaction_value?: number | null
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          total_customers?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Update: {
          avg_transaction_value?: number | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          total_customers?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sales_summary: {
        Row: {
          avg_transaction_value: number | null
          conversion_rate: number | null
          created_at: string | null
          data_source: string | null
          date: string
          hourly_revenue: Json | null
          id: string
          org_id: string
          payment_method_breakdown: Json | null
          revenue_by_category: Json | null
          store_id: string
          total_revenue: number | null
          transaction_count: number | null
          updated_at: string | null
          visitor_count: number | null
        }
        Insert: {
          avg_transaction_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          data_source?: string | null
          date: string
          hourly_revenue?: Json | null
          id?: string
          org_id: string
          payment_method_breakdown?: Json | null
          revenue_by_category?: Json | null
          store_id: string
          total_revenue?: number | null
          transaction_count?: number | null
          updated_at?: string | null
          visitor_count?: number | null
        }
        Update: {
          avg_transaction_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          data_source?: string | null
          date?: string
          hourly_revenue?: Json | null
          id?: string
          org_id?: string
          payment_method_breakdown?: Json | null
          revenue_by_category?: Json | null
          store_id?: string
          total_revenue?: number | null
          transaction_count?: number | null
          updated_at?: string | null
          visitor_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sales_summary_store_id_fkey"
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
            foreignKeyName: "dashboard_kpis_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dashboard_kpis_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      data_source_tables: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          is_active: boolean
          metadata: Json | null
          org_id: string | null
          source_id: string
          sync_frequency: string | null
          table_id_code: string | null
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          org_id?: string | null
          source_id: string
          sync_frequency?: string | null
          table_id_code?: string | null
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          org_id?: string | null
          source_id?: string
          sync_frequency?: string | null
          table_id_code?: string | null
          table_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_source_tables_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_source_tables_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          config: Json | null
          connection_string: string | null
          created_at: string
          id: string
          is_active: boolean
          org_id: string | null
          source_id_code: string | null
          source_name: string
          source_type: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          connection_string?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string | null
          source_id_code?: string | null
          source_name: string
          source_type: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          connection_string?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          org_id?: string | null
          source_id_code?: string | null
          source_name?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          is_global: boolean
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
          is_global?: boolean
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
          is_global?: boolean
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
      funnel_events: {
        Row: {
          created_at: string | null
          customer_id: string | null
          device_type: string | null
          duration_seconds: number | null
          event_date: string
          event_hour: number | null
          event_timestamp: string
          event_type: string
          id: string
          metadata: Json | null
          next_event_type: string | null
          org_id: string | null
          previous_event_type: string | null
          session_id: string | null
          store_id: string | null
          visitor_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_date: string
          event_hour?: number | null
          event_timestamp: string
          event_type: string
          id?: string
          metadata?: Json | null
          next_event_type?: string | null
          org_id?: string | null
          previous_event_type?: string | null
          session_id?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          device_type?: string | null
          duration_seconds?: number | null
          event_date?: string
          event_hour?: number | null
          event_timestamp?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          next_event_type?: string | null
          org_id?: string | null
          previous_event_type?: string | null
          session_id?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
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
          country_code: string | null
          created_at: string | null
          date: string
          description: string | null
          event_name: string
          event_type: string
          id: string
          impact_level: string | null
          is_global: boolean
          metadata: Json | null
          org_id: string | null
          raw_payload: Json | null
          region_code: string | null
          source_provider: string | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country_code?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          event_name: string
          event_type: string
          id?: string
          impact_level?: string | null
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          region_code?: string | null
          source_provider?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country_code?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          event_name?: string
          event_type?: string
          id?: string
          impact_level?: string | null
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          region_code?: string | null
          source_provider?: string | null
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
      hourly_metrics: {
        Row: {
          avg_occupancy: number | null
          calculated_at: string | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          entry_count: number | null
          exit_count: number | null
          hour: number
          id: string
          metadata: Json | null
          org_id: string | null
          peak_occupancy: number | null
          revenue: number | null
          store_id: string | null
          transaction_count: number | null
          units_sold: number | null
          visitor_count: number | null
        }
        Insert: {
          avg_occupancy?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          entry_count?: number | null
          exit_count?: number | null
          hour: number
          id?: string
          metadata?: Json | null
          org_id?: string | null
          peak_occupancy?: number | null
          revenue?: number | null
          store_id?: string | null
          transaction_count?: number | null
          units_sold?: number | null
          visitor_count?: number | null
        }
        Update: {
          avg_occupancy?: number | null
          calculated_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          entry_count?: number | null
          exit_count?: number | null
          hour?: number
          id?: string
          metadata?: Json | null
          org_id?: string | null
          peak_occupancy?: number | null
          revenue?: number | null
          store_id?: string | null
          transaction_count?: number | null
          units_sold?: number | null
          visitor_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hourly_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hourly_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_guidelines: {
        Row: {
          attachments: Json | null
          category: string
          content: string
          created_at: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          org_id: string
          priority: string | null
          target_stores: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          category: string
          content: string
          created_at?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          org_id: string
          priority?: string | null
          target_stores?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          category?: string
          content?: string
          created_at?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          priority?: string | null
          target_stores?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hq_guidelines_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          org_id: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          org_id: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          org_id?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hq_notifications_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      hq_store_messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message_type: string
          org_id: string
          priority: string | null
          read_at: string | null
          recipient_role: Database["public"]["Enums"]["app_role"] | null
          recipient_store_id: string | null
          sender_name: string
          sender_role: Database["public"]["Enums"]["app_role"]
          subject: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          org_id: string
          priority?: string | null
          read_at?: string | null
          recipient_role?: Database["public"]["Enums"]["app_role"] | null
          recipient_store_id?: string | null
          sender_name: string
          sender_role: Database["public"]["Enums"]["app_role"]
          subject?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message_type?: string
          org_id?: string
          priority?: string | null
          read_at?: string | null
          recipient_role?: Database["public"]["Enums"]["app_role"] | null
          recipient_store_id?: string | null
          sender_name?: string
          sender_role?: Database["public"]["Enums"]["app_role"]
          subject?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_hq_messages_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_hq_messages_recipient_store_new"
            columns: ["recipient_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hq_store_messages_recipient_store_id_fkey"
            columns: ["recipient_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          id: string
          metadata: Json | null
          org_id: string | null
          product_id: string | null
          quantity_on_hand: number
          reorder_point: number | null
          safety_stock: number | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          quantity_on_hand: number
          reorder_point?: number | null
          safety_stock?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          quantity_on_hand?: number
          reorder_point?: number | null
          safety_stock?: number | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_history: {
        Row: {
          adjustment_qty: number | null
          closing_qty: number | null
          created_at: string
          date: string
          id: string
          metadata: Json | null
          opening_qty: number | null
          org_id: string | null
          product_id: string | null
          received_qty: number | null
          sold_qty: number | null
          store_id: string | null
        }
        Insert: {
          adjustment_qty?: number | null
          closing_qty?: number | null
          created_at?: string
          date: string
          id?: string
          metadata?: Json | null
          opening_qty?: number | null
          org_id?: string | null
          product_id?: string | null
          received_qty?: number | null
          sold_qty?: number | null
          store_id?: string | null
        }
        Update: {
          adjustment_qty?: number | null
          closing_qty?: number | null
          created_at?: string
          date?: string
          id?: string
          metadata?: Json | null
          opening_qty?: number | null
          org_id?: string | null
          product_id?: string | null
          received_qty?: number | null
          sold_qty?: number | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_history_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
            foreignKeyName: "inventory_levels_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_levels_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          moved_at: string
          movement_type: string
          new_stock: number | null
          org_id: string | null
          previous_stock: number | null
          product_id: string | null
          quantity: number
          reason: string | null
          reference_id: string | null
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moved_at?: string
          movement_type: string
          new_stock?: number | null
          org_id?: string | null
          previous_stock?: number | null
          product_id?: string | null
          quantity: number
          reason?: string | null
          reference_id?: string | null
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moved_at?: string
          movement_type?: string
          new_stock?: number | null
          org_id?: string | null
          previous_stock?: number | null
          product_id?: string | null
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      kpi_snapshots: {
        Row: {
          additional_metrics: Json | null
          application_id: string | null
          avg_dwell_time_minutes: number | null
          avg_transaction_value: number | null
          conversion_rate: number | null
          created_at: string | null
          id: string
          items_per_transaction: number | null
          org_id: string
          snapshot_date: string
          snapshot_type: string | null
          store_id: string
          total_revenue: number | null
          total_transactions: number | null
          total_visitors: number | null
        }
        Insert: {
          additional_metrics?: Json | null
          application_id?: string | null
          avg_dwell_time_minutes?: number | null
          avg_transaction_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          items_per_transaction?: number | null
          org_id: string
          snapshot_date: string
          snapshot_type?: string | null
          store_id: string
          total_revenue?: number | null
          total_transactions?: number | null
          total_visitors?: number | null
        }
        Update: {
          additional_metrics?: Json | null
          application_id?: string | null
          avg_dwell_time_minutes?: number | null
          avg_transaction_value?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          items_per_transaction?: number | null
          org_id?: string
          snapshot_date?: string
          snapshot_type?: string | null
          store_id?: string
          total_revenue?: number | null
          total_transactions?: number | null
          total_visitors?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_snapshots_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recommendation_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshots_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_snapshots_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_values: {
        Row: {
          created_at: string
          date: string
          id: string
          kpi_id: string
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          value: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          kpi_id: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          kpi_id?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_values_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_values_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_values_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          aggregation: string | null
          category: string | null
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          name: string
          org_id: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          aggregation?: string | null
          category?: string | null
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name: string
          org_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          aggregation?: string | null
          category?: string | null
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          name?: string
          org_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      license_billing_history: {
        Row: {
          amount: number
          billing_date: string
          created_at: string
          id: string
          license_id: string
          notes: string | null
          payment_method: string | null
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_date: string
          created_at?: string
          id?: string
          license_id: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_date?: string
          created_at?: string
          id?: string
          license_id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "license_billing_history_license_id_fkey"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
        ]
      }
      licenses: {
        Row: {
          activated_at: string | null
          assigned_store_id: string | null
          assigned_to: string | null
          created_at: string
          effective_date: string
          expiry_date: string | null
          id: string
          last_used_at: string | null
          license_type: string
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
          created_at?: string
          effective_date: string
          expiry_date?: string | null
          id?: string
          last_used_at?: string | null
          license_type: string
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
          created_at?: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          last_used_at?: string | null
          license_type?: string
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
      line_items: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          id: string
          is_return: boolean | null
          line_total: number
          metadata: Json | null
          org_id: string | null
          payment_method: string | null
          product_id: string | null
          purchase_id: string | null
          quantity: number
          store_id: string | null
          tax_amount: number | null
          transaction_date: string
          transaction_hour: number | null
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          is_return?: boolean | null
          line_total: number
          metadata?: Json | null
          org_id?: string | null
          payment_method?: string | null
          product_id?: string | null
          purchase_id?: string | null
          quantity?: number
          store_id?: string | null
          tax_amount?: number | null
          transaction_date: string
          transaction_hour?: number | null
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          is_return?: boolean | null
          line_total?: number
          metadata?: Json | null
          org_id?: string | null
          payment_method?: string | null
          product_id?: string | null
          purchase_id?: string | null
          quantity?: number
          store_id?: string | null
          tax_amount?: number | null
          transaction_date?: string
          transaction_hour?: number | null
          transaction_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "line_items_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_purchase_fk"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      model_runs: {
        Row: {
          created_at: string
          finished_at: string | null
          id: string
          metric_name: string | null
          metric_value: number | null
          model_id: string
          org_id: string | null
          params: Json | null
          started_at: string
          status: string
        }
        Insert: {
          created_at?: string
          finished_at?: string | null
          id?: string
          metric_name?: string | null
          metric_value?: number | null
          model_id: string
          org_id?: string | null
          params?: Json | null
          started_at: string
          status: string
        }
        Update: {
          created_at?: string
          finished_at?: string | null
          id?: string
          metric_name?: string | null
          metric_value?: number | null
          model_id?: string
          org_id?: string | null
          params?: Json | null
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_runs_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "model_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      models: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          model_type: string
          name: string
          org_id: string | null
          status: string
          target_entity: string
          updated_at: string
          version: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          model_type: string
          name: string
          org_id?: string | null
          status?: string
          target_entity: string
          updated_at?: string
          version: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          model_type?: string
          name?: string
          org_id?: string | null
          status?: string
          target_entity?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "models_org_id_fkey"
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
      onboarding_progress: {
        Row: {
          business_type: string | null
          completed_at: string | null
          completed_steps: number[] | null
          created_at: string | null
          current_step: number
          data_sources: string[] | null
          id: string
          last_activity_at: string | null
          org_id: string
          primary_goals: string[] | null
          selected_template: string | null
          skipped_steps: number[] | null
          started_at: string | null
          steps_status: Json | null
          store_count: number | null
          total_steps: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_type?: string | null
          completed_at?: string | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number
          data_sources?: string[] | null
          id?: string
          last_activity_at?: string | null
          org_id: string
          primary_goals?: string[] | null
          selected_template?: string | null
          skipped_steps?: number[] | null
          started_at?: string | null
          steps_status?: Json | null
          store_count?: number | null
          total_steps?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_type?: string | null
          completed_at?: string | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number
          data_sources?: string[] | null
          id?: string
          last_activity_at?: string | null
          org_id?: string
          primary_goals?: string[] | null
          selected_template?: string | null
          skipped_steps?: number[] | null
          started_at?: string | null
          steps_status?: Json | null
          store_count?: number | null
          total_steps?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      online_traffic: {
        Row: {
          created_at: string
          date: string
          id: string
          org_id: string | null
          pageviews: number | null
          sessions: number | null
          site: string
          transactions: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          org_id?: string | null
          pageviews?: number | null
          sessions?: number | null
          site: string
          transactions?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          org_id?: string | null
          pageviews?: number | null
          sessions?: number | null
          site?: string
          transactions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "online_traffic_org_id_fkey"
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
          priority: string | null
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
          priority?: string | null
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
          priority?: string | null
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
      ontology_relation_inference_queue: {
        Row: {
          created_at: string
          entity_id: string
          error_message: string | null
          id: string
          org_id: string | null
          processed_at: string | null
          retry_count: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          error_message?: string | null
          id?: string
          org_id?: string | null
          processed_at?: string | null
          retry_count?: number
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          error_message?: string | null
          id?: string
          org_id?: string | null
          processed_at?: string | null
          retry_count?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ontology_relation_inference_queue_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
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
          priority: string | null
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
          priority?: string | null
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
          priority?: string | null
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
          joined_at: string
          license_id: string | null
          org_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          license_id?: string | null
          org_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          license_id?: string | null
          org_id?: string | null
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
      organization_settings: {
        Row: {
          brand_color: string | null
          created_at: string | null
          currency: string | null
          default_kpi_set: string | null
          email_notifications: boolean | null
          id: string
          logo_url: string | null
          metadata: Json | null
          org_id: string
          slack_notifications: boolean | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string | null
          currency?: string | null
          default_kpi_set?: string | null
          email_notifications?: boolean | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          org_id: string
          slack_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string | null
          currency?: string | null
          default_kpi_set?: string | null
          email_notifications?: boolean | null
          id?: string
          logo_url?: string | null
          metadata?: Json | null
          org_id?: string
          slack_notifications?: boolean | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
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
      people_counter_logs: {
        Row: {
          count: number
          counter_id: string | null
          created_at: string
          direction: string | null
          id: string
          log_ts: string
          metadata: Json | null
          org_id: string | null
          store_id: string | null
        }
        Insert: {
          count: number
          counter_id?: string | null
          created_at?: string
          direction?: string | null
          id?: string
          log_ts: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
        }
        Update: {
          count?: number
          counter_id?: string | null
          created_at?: string
          direction?: string | null
          id?: string
          log_ts?: string
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_counter_logs_counter_id_fkey"
            columns: ["counter_id"]
            isOneToOne: false
            referencedRelation: "people_counters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_counter_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_counter_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      people_counters: {
        Row: {
          counter_code: string
          created_at: string
          id: string
          location: string | null
          metadata: Json | null
          org_id: string | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          counter_code: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          counter_code?: string
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          org_id?: string | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "people_counters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "people_counters_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_integrations: {
        Row: {
          access_token_encrypted: string | null
          created_at: string | null
          credentials_encrypted: Json | null
          field_mappings: Json | null
          id: string
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          org_id: string
          provider: string
          provider_store_id: string | null
          refresh_token_encrypted: string | null
          status: string | null
          store_id: string
          sync_enabled: boolean | null
          sync_frequency_minutes: number | null
          token_expires_at: string | null
          updated_at: string | null
          webhook_events: Json | null
          webhook_secret: string | null
          webhook_url: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          created_at?: string | null
          credentials_encrypted?: Json | null
          field_mappings?: Json | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          org_id: string
          provider: string
          provider_store_id?: string | null
          refresh_token_encrypted?: string | null
          status?: string | null
          store_id: string
          sync_enabled?: boolean | null
          sync_frequency_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_events?: Json | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          created_at?: string | null
          credentials_encrypted?: Json | null
          field_mappings?: Json | null
          id?: string
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          org_id?: string
          provider?: string
          provider_store_id?: string | null
          refresh_token_encrypted?: string | null
          status?: string | null
          store_id?: string
          sync_enabled?: boolean | null
          sync_frequency_minutes?: number | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_events?: Json | null
          webhook_secret?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_performance_agg: {
        Row: {
          avg_selling_price: number | null
          calculated_at: string | null
          category_rank: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          discount_rate: number | null
          id: string
          metadata: Json | null
          org_id: string | null
          product_id: string | null
          return_rate: number | null
          revenue: number | null
          stock_level: number | null
          stockout_hours: number | null
          store_id: string | null
          store_rank: number | null
          transactions: number | null
          units_sold: number | null
        }
        Insert: {
          avg_selling_price?: number | null
          calculated_at?: string | null
          category_rank?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          discount_rate?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          return_rate?: number | null
          revenue?: number | null
          stock_level?: number | null
          stockout_hours?: number | null
          store_id?: string | null
          store_rank?: number | null
          transactions?: number | null
          units_sold?: number | null
        }
        Update: {
          avg_selling_price?: number | null
          calculated_at?: string | null
          category_rank?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          discount_rate?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          return_rate?: number | null
          revenue?: number | null
          stock_level?: number | null
          stockout_hours?: number | null
          store_id?: string | null
          store_rank?: number | null
          transactions?: number | null
          units_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_performance_agg_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_agg_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_performance_agg_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sales_daily: {
        Row: {
          avg_price: number | null
          calculated_at: string | null
          cost: number | null
          created_at: string | null
          date: string
          discount_amount: number | null
          id: string
          metadata: Json | null
          org_id: string | null
          product_id: string | null
          profit: number | null
          return_amount: number | null
          return_units: number | null
          revenue: number | null
          store_id: string | null
          units_sold: number | null
        }
        Insert: {
          avg_price?: number | null
          calculated_at?: string | null
          cost?: number | null
          created_at?: string | null
          date: string
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          profit?: number | null
          return_amount?: number | null
          return_units?: number | null
          revenue?: number | null
          store_id?: string | null
          units_sold?: number | null
        }
        Update: {
          avg_price?: number | null
          calculated_at?: string | null
          cost?: number | null
          created_at?: string | null
          date?: string
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          product_id?: string | null
          profit?: number | null
          return_amount?: number | null
          return_units?: number | null
          revenue?: number | null
          store_id?: string | null
          units_sold?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sales_daily_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_daily_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_daily_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_daily_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_daily_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_sales_daily_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          org_id: string | null
          price: number | null
          product_name: string
          sku: string | null
          stock: number | null
          store_id: string | null
          supplier: string | null
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
          org_id?: string | null
          price?: number | null
          product_name: string
          sku?: string | null
          stock?: number | null
          store_id?: string | null
          supplier?: string | null
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
          org_id?: string | null
          price?: number | null
          product_name?: string
          sku?: string | null
          stock?: number | null
          store_id?: string | null
          supplier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_products_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_org_id_new"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_products_store_id_new"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "purchases_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_product_fk"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
            foreignKeyName: "purchases_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
            foreignKeyName: "purchases_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
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
      quickstart_guides: {
        Row: {
          auto_show: boolean | null
          created_at: string | null
          description: string | null
          guide_key: string
          id: string
          is_active: boolean | null
          priority: number | null
          show_once: boolean | null
          steps: Json
          target_page: string
          target_role: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          auto_show?: boolean | null
          created_at?: string | null
          description?: string | null
          guide_key: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          show_once?: boolean | null
          steps?: Json
          target_page: string
          target_role?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          auto_show?: boolean | null
          created_at?: string | null
          description?: string | null
          guide_key?: string
          id?: string
          is_active?: boolean | null
          priority?: number | null
          show_once?: boolean | null
          steps?: Json
          target_page?: string
          target_role?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      raw_imports: {
        Row: {
          created_at: string | null
          error_message: string | null
          file_path: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          processed_at: string | null
          row_count: number | null
          source_name: string | null
          source_type: string
          status: string | null
          store_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          processed_at?: string | null
          row_count?: number | null
          source_name?: string | null
          source_type: string
          status?: string | null
          store_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          file_path?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          processed_at?: string | null
          row_count?: number | null
          source_name?: string | null
          source_type?: string
          status?: string | null
          store_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_imports_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "raw_imports_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_inventory: {
        Row: {
          barcode: string | null
          category: string | null
          created_at: string | null
          external_product_id: string
          id: string
          is_low_stock: boolean | null
          last_sale_at: string | null
          last_updated_at: string | null
          org_id: string
          pos_integration_id: string | null
          product_name: string | null
          quantity_available: number | null
          quantity_on_hand: number
          quantity_reserved: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          sku: string | null
          store_id: string
          unit_cost: number | null
          unit_price: number | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          external_product_id: string
          id?: string
          is_low_stock?: boolean | null
          last_sale_at?: string | null
          last_updated_at?: string | null
          org_id: string
          pos_integration_id?: string | null
          product_name?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sku?: string | null
          store_id: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          external_product_id?: string
          id?: string
          is_low_stock?: boolean | null
          last_sale_at?: string | null
          last_updated_at?: string | null
          org_id?: string
          pos_integration_id?: string | null
          product_name?: string | null
          quantity_available?: number | null
          quantity_on_hand?: number
          quantity_reserved?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          sku?: string | null
          store_id?: string
          unit_cost?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "realtime_inventory_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_inventory_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_inventory_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      realtime_transactions: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_id: string | null
          customer_type: string | null
          discount_amount: number | null
          employee_id: string | null
          external_data: Json | null
          external_transaction_id: string
          id: string
          is_voided: boolean | null
          item_count: number | null
          items: Json | null
          org_id: string
          payment_method: string | null
          pos_integration_id: string | null
          processed_at: string | null
          receipt_number: string | null
          register_id: string | null
          store_id: string
          subtotal: number
          tax_amount: number | null
          total_amount: number
          transaction_date: string
          transaction_time: string
          transaction_timestamp: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_type?: string | null
          discount_amount?: number | null
          employee_id?: string | null
          external_data?: Json | null
          external_transaction_id: string
          id?: string
          is_voided?: boolean | null
          item_count?: number | null
          items?: Json | null
          org_id: string
          payment_method?: string | null
          pos_integration_id?: string | null
          processed_at?: string | null
          receipt_number?: string | null
          register_id?: string | null
          store_id: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_date: string
          transaction_time: string
          transaction_timestamp: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_type?: string | null
          discount_amount?: number | null
          employee_id?: string | null
          external_data?: Json | null
          external_transaction_id?: string
          id?: string
          is_voided?: boolean | null
          item_count?: number | null
          items?: Json | null
          org_id?: string
          payment_method?: string | null
          pos_integration_id?: string | null
          processed_at?: string | null
          receipt_number?: string | null
          register_id?: string | null
          store_id?: string
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          transaction_date?: string
          transaction_time?: string
          transaction_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "realtime_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_transactions_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "realtime_transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_applications: {
        Row: {
          applied_at: string | null
          applied_by: string | null
          baseline_date: string
          baseline_kpis: Json
          created_at: string | null
          id: string
          measurement_end_date: string | null
          measurement_period_days: number | null
          measurement_start_date: string | null
          org_id: string
          recommendation_details: Json | null
          recommendation_summary: string | null
          recommendation_type: string
          reverted_at: string | null
          reverted_reason: string | null
          scenario_id: string | null
          status: string | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          applied_by?: string | null
          baseline_date: string
          baseline_kpis: Json
          created_at?: string | null
          id?: string
          measurement_end_date?: string | null
          measurement_period_days?: number | null
          measurement_start_date?: string | null
          org_id: string
          recommendation_details?: Json | null
          recommendation_summary?: string | null
          recommendation_type: string
          reverted_at?: string | null
          reverted_reason?: string | null
          scenario_id?: string | null
          status?: string | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          applied_by?: string | null
          baseline_date?: string
          baseline_kpis?: Json
          created_at?: string | null
          id?: string
          measurement_end_date?: string | null
          measurement_period_days?: number | null
          measurement_start_date?: string | null
          org_id?: string
          recommendation_details?: Json | null
          recommendation_summary?: string | null
          recommendation_type?: string
          reverted_at?: string | null
          reverted_reason?: string | null
          scenario_id?: string | null
          status?: string | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_applications_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_applications_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      regional_data: {
        Row: {
          consumer_confidence: number | null
          created_at: string | null
          date: string
          gdp: number | null
          id: string
          is_global: boolean
          metadata: Json | null
          org_id: string | null
          population: number | null
          region: string
          unemployment_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consumer_confidence?: number | null
          created_at?: string | null
          date: string
          gdp?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          population?: number | null
          region: string
          unemployment_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consumer_confidence?: number | null
          created_at?: string | null
          date?: string
          gdp?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
          population?: number | null
          region?: string
          unemployment_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          created_at: string | null
          filters: Json | null
          frequency: string
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          org_id: string | null
          recipients: string[] | null
          report_name: string
          report_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          frequency: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          org_id?: string | null
          recipients?: string[] | null
          report_name: string
          report_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          frequency?: string
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          org_id?: string | null
          recipients?: string[] | null
          report_name?: string
          report_type?: string
          updated_at?: string | null
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
      roi_measurements: {
        Row: {
          application_id: string
          created_at: string | null
          estimated_annual_impact: Json | null
          id: string
          is_positive_impact: boolean | null
          kpi_changes: Json
          measured_kpis: Json
          measurement_days: number
          measurement_end_date: string
          measurement_start_date: string
          org_id: string
          statistical_significance: Json | null
          summary_text: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          estimated_annual_impact?: Json | null
          id?: string
          is_positive_impact?: boolean | null
          kpi_changes: Json
          measured_kpis: Json
          measurement_days: number
          measurement_end_date: string
          measurement_start_date: string
          org_id: string
          statistical_significance?: Json | null
          summary_text?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          estimated_annual_impact?: Json | null
          id?: string
          is_positive_impact?: boolean | null
          kpi_changes?: Json
          measured_kpis?: Json
          measurement_days?: number
          measurement_end_date?: string
          measurement_start_date?: string
          org_id?: string
          statistical_significance?: Json | null
          summary_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roi_measurements_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recommendation_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roi_measurements_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sample_data_templates: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          entity_types: Json | null
          estimated_setup_minutes: number | null
          furniture_models: Json | null
          id: string
          is_active: boolean | null
          preview_image_url: string | null
          product_models: Json | null
          relation_types: Json | null
          sample_entities: Json | null
          sample_kpis: Json | null
          sample_products: Json | null
          sample_relations: Json | null
          sample_transactions: Json | null
          sample_visits: Json | null
          sort_order: number | null
          store_3d_model_url: string | null
          store_config: Json | null
          template_name: string
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          entity_types?: Json | null
          estimated_setup_minutes?: number | null
          furniture_models?: Json | null
          id?: string
          is_active?: boolean | null
          preview_image_url?: string | null
          product_models?: Json | null
          relation_types?: Json | null
          sample_entities?: Json | null
          sample_kpis?: Json | null
          sample_products?: Json | null
          sample_relations?: Json | null
          sample_transactions?: Json | null
          sample_visits?: Json | null
          sort_order?: number | null
          store_3d_model_url?: string | null
          store_config?: Json | null
          template_name: string
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          entity_types?: Json | null
          estimated_setup_minutes?: number | null
          furniture_models?: Json | null
          id?: string
          is_active?: boolean | null
          preview_image_url?: string | null
          product_models?: Json | null
          relation_types?: Json | null
          sample_entities?: Json | null
          sample_kpis?: Json | null
          sample_products?: Json | null
          sample_relations?: Json | null
          sample_transactions?: Json | null
          sample_visits?: Json | null
          sort_order?: number | null
          store_3d_model_url?: string | null
          store_config?: Json | null
          template_name?: string
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          created_at: string
          id: string
          org_id: string | null
          parameters: Json
          predicted_kpi: Json | null
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
          predicted_kpi?: Json | null
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
          predicted_kpi?: Json | null
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
      sensor_events: {
        Row: {
          created_at: string
          event_ts: string
          event_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          sensor_id: string | null
          sensor_type: string
          store_id: string | null
          value_numeric: number | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          event_ts: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          sensor_id?: string | null
          sensor_type: string
          store_id?: string | null
          value_numeric?: number | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          event_ts?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          sensor_id?: string | null
          sensor_type?: string
          store_id?: string | null
          value_numeric?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensor_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_schedules: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          break_minutes: number | null
          created_at: string | null
          end_time: string
          id: string
          notes: string | null
          org_id: string | null
          shift_date: string
          staff_id: string | null
          start_time: string
          status: string | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          break_minutes?: number | null
          created_at?: string | null
          end_time: string
          id?: string
          notes?: string | null
          org_id?: string | null
          shift_date: string
          staff_id?: string | null
          start_time: string
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          break_minutes?: number | null
          created_at?: string | null
          end_time?: string
          id?: string
          notes?: string | null
          org_id?: string | null
          shift_date?: string
          staff_id?: string | null
          start_time?: string
          status?: string | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_staff_fk"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_store_id_fkey"
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
      staff: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          org_id: string | null
          phone: string | null
          role: string | null
          staff_code: string | null
          staff_name: string
          store_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          phone?: string | null
          role?: string | null
          staff_code?: string | null
          staff_name: string
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          phone?: string | null
          role?: string | null
          staff_code?: string | null
          staff_name?: string
          store_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_comments: {
        Row: {
          author_name: string
          author_role: Database["public"]["Enums"]["app_role"]
          comment: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          org_id: string
          parent_comment_id: string | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author_name: string
          author_role: Database["public"]["Enums"]["app_role"]
          comment: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          org_id: string
          parent_comment_id?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author_name?: string
          author_role?: Database["public"]["Enums"]["app_role"]
          comment?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          org_id?: string
          parent_comment_id?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "store_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_comments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_scenes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          org_id: string | null
          recipe_data: Json | null
          scene_name: string
          scene_type: string | null
          store_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          recipe_data?: Json | null
          scene_name: string
          scene_type?: string | null
          store_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string | null
          recipe_data?: Json | null
          scene_name?: string
          scene_type?: string | null
          store_id?: string | null
          updated_at?: string | null
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
      store_trade_area_context: {
        Row: {
          categories: Json | null
          created_at: string | null
          id: string
          org_id: string | null
          provider: string
          radius_m: number
          raw_payload: Json | null
          stats: Json | null
          store_id: string | null
          total_pois: number
          updated_at: string | null
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider: string
          radius_m: number
          raw_payload?: Json | null
          stats?: Json | null
          store_id?: string | null
          total_pois?: number
          updated_at?: string | null
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          id?: string
          org_id?: string | null
          provider?: string
          radius_m?: number
          raw_payload?: Json | null
          stats?: Json | null
          store_id?: string | null
          total_pois?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_trade_area_context_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_trade_area_context_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_visits: {
        Row: {
          created_at: string | null
          customer_id: string | null
          data_source: string | null
          device_type: string | null
          duration_minutes: number | null
          entry_point: string | null
          exit_date: string | null
          id: string
          made_purchase: boolean | null
          org_id: string
          purchase_amount: number | null
          store_id: string
          transaction_id: string | null
          visit_date: string
          zone_durations: Json | null
          zones_visited: string[] | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          data_source?: string | null
          device_type?: string | null
          duration_minutes?: number | null
          entry_point?: string | null
          exit_date?: string | null
          id?: string
          made_purchase?: boolean | null
          org_id: string
          purchase_amount?: number | null
          store_id: string
          transaction_id?: string | null
          visit_date?: string
          zone_durations?: Json | null
          zones_visited?: string[] | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          data_source?: string | null
          device_type?: string | null
          duration_minutes?: number | null
          entry_point?: string | null
          exit_date?: string | null
          id?: string
          made_purchase?: boolean | null
          org_id?: string
          purchase_amount?: number | null
          store_id?: string
          transaction_id?: string | null
          visit_date?: string
          zone_durations?: Json | null
          zones_visited?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "store_visits_store_id_fkey"
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
            foreignKeyName: "fk_stores_license_id_new"
            columns: ["license_id"]
            isOneToOne: false
            referencedRelation: "licenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stores_org_id"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_stores_org_id_new"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
      sync_logs: {
        Row: {
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          org_id: string
          pos_integration_id: string
          records_created: number | null
          records_failed: number | null
          records_fetched: number | null
          records_updated: number | null
          status: string | null
          sync_ended_at: string | null
          sync_started_at: string | null
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          org_id: string
          pos_integration_id: string
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          status?: string | null
          sync_ended_at?: string | null
          sync_started_at?: string | null
          sync_type: string
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          org_id?: string
          pos_integration_id?: string
          records_created?: number | null
          records_failed?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          status?: string | null
          sync_ended_at?: string | null
          sync_started_at?: string | null
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sync_logs_pos_integration_id_fkey"
            columns: ["pos_integration_id"]
            isOneToOne: false
            referencedRelation: "pos_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          assigned_to_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          priority: string
          status: string
          store_id: string | null
          task_code: string | null
          task_name: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          priority?: string
          status?: string
          store_id?: string | null
          task_code?: string | null
          task_name: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          priority?: string
          status?: string
          store_id?: string | null
          task_code?: string | null
          task_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          channel: string | null
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          metadata: Json | null
          net_amount: number | null
          org_id: string | null
          payment_method: string | null
          store_id: string | null
          total_amount: number | null
          transaction_datetime: string
          user_id: string | null
          visit_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          org_id?: string | null
          payment_method?: string | null
          store_id?: string | null
          total_amount?: number | null
          transaction_datetime: string
          user_id?: string | null
          visit_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          net_amount?: number | null
          org_id?: string | null
          payment_method?: string | null
          store_id?: string | null
          total_amount?: number | null
          transaction_datetime?: string
          user_id?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_signals: {
        Row: {
          created_at: string | null
          date: string
          id: string
          index_value: number
          key: string
          metadata: Json | null
          org_id: string | null
          raw_payload: Json | null
          scope: string
          source_provider: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          index_value: number
          key: string
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          scope: string
          source_provider: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          index_value?: number
          key?: string
          metadata?: Json | null
          org_id?: string | null
          raw_payload?: Json | null
          scope?: string
          source_provider?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_signals_org_id_fkey"
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
      user_activity_logs: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: string | null
          org_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: string | null
          org_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          org_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_activity_logs_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_data_imports: {
        Row: {
          can_pause: boolean | null
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
          can_pause?: boolean | null
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
          can_pause?: boolean | null
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
      user_guide_completions: {
        Row: {
          completed_at: string | null
          guide_key: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          guide_key: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          guide_key?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      visit_zone_events: {
        Row: {
          created_at: string | null
          dwell_seconds: number | null
          entry_time: string
          exit_time: string | null
          id: string
          interaction_count: number | null
          metadata: Json | null
          org_id: string | null
          path_sequence: number | null
          store_id: string | null
          visit_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string | null
          dwell_seconds?: number | null
          entry_time: string
          exit_time?: string | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          path_sequence?: number | null
          store_id?: string | null
          visit_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string | null
          dwell_seconds?: number | null
          entry_time?: string
          exit_time?: string | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          path_sequence?: number | null
          store_id?: string | null
          visit_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_zone_events_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_visit_fk"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
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
            foreignKeyName: "visits_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
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
      weather_data: {
        Row: {
          created_at: string | null
          date: string
          humidity: number | null
          id: string
          is_global: boolean
          metadata: Json | null
          org_id: string | null
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
          humidity?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
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
          humidity?: number | null
          id?: string
          is_global?: boolean
          metadata?: Json | null
          org_id?: string | null
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
      web_events: {
        Row: {
          created_at: string
          event_ts: string
          event_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          page_path: string | null
          referrer: string | null
          session_id: string | null
          site: string | null
        }
        Insert: {
          created_at?: string
          event_ts: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          site?: string | null
        }
        Update: {
          created_at?: string
          event_ts?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          page_path?: string | null
          referrer?: string | null
          session_id?: string | null
          site?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      wifi_events: {
        Row: {
          created_at: string
          device_id: string | null
          dwell_time_seconds: number | null
          event_ts: string
          event_type: string | null
          id: string
          metadata: Json | null
          org_id: string | null
          signal_strength: number | null
          store_id: string | null
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          dwell_time_seconds?: number | null
          event_ts: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          signal_strength?: number | null
          store_id?: string | null
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          dwell_time_seconds?: number | null
          event_ts?: string
          event_type?: string | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          signal_strength?: number | null
          store_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_events_store_id_fkey"
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
          session_id: string | null
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
          session_id?: string | null
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
          session_id?: string | null
          signal_strength?: number | null
          store_id?: string
          timestamp?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wifi_tracking_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wifi_tracking_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
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
      zone_daily_metrics: {
        Row: {
          avg_dwell_seconds: number | null
          calculated_at: string | null
          conversion_count: number | null
          created_at: string | null
          date: string
          entry_count: number | null
          exit_count: number | null
          heatmap_intensity: number | null
          id: string
          interaction_count: number | null
          metadata: Json | null
          org_id: string | null
          peak_hour: number | null
          peak_occupancy: number | null
          revenue_attributed: number | null
          store_id: string | null
          total_dwell_seconds: number | null
          total_visitors: number | null
          unique_visitors: number | null
          zone_id: string | null
        }
        Insert: {
          avg_dwell_seconds?: number | null
          calculated_at?: string | null
          conversion_count?: number | null
          created_at?: string | null
          date: string
          entry_count?: number | null
          exit_count?: number | null
          heatmap_intensity?: number | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          peak_hour?: number | null
          peak_occupancy?: number | null
          revenue_attributed?: number | null
          store_id?: string | null
          total_dwell_seconds?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          zone_id?: string | null
        }
        Update: {
          avg_dwell_seconds?: number | null
          calculated_at?: string | null
          conversion_count?: number | null
          created_at?: string | null
          date?: string
          entry_count?: number | null
          exit_count?: number | null
          heatmap_intensity?: number | null
          id?: string
          interaction_count?: number | null
          metadata?: Json | null
          org_id?: string | null
          peak_hour?: number | null
          peak_occupancy?: number | null
          revenue_attributed?: number | null
          store_id?: string | null
          total_dwell_seconds?: number | null
          total_visitors?: number | null
          unique_visitors?: number | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_daily_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_daily_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_daily_metrics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_events: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          customer_id: string | null
          duration_seconds: number | null
          event_date: string
          event_hour: number | null
          event_timestamp: string
          event_type: string
          id: string
          metadata: Json | null
          org_id: string | null
          sensor_id: string | null
          sensor_type: string | null
          store_id: string | null
          visitor_id: string | null
          zone_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          duration_seconds?: number | null
          event_date: string
          event_hour?: number | null
          event_timestamp: string
          event_type: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          sensor_id?: string | null
          sensor_type?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          customer_id?: string | null
          duration_seconds?: number | null
          event_date?: string
          event_hour?: number | null
          event_timestamp?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          org_id?: string | null
          sensor_id?: string | null
          sensor_type?: string | null
          store_id?: string | null
          visitor_id?: string | null
          zone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zone_events_customer_fk"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_fk"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_metrics: {
        Row: {
          conversion_rate: number | null
          created_at: string
          date: string
          dwell_time_avg_min: number | null
          hour: number | null
          id: string
          metadata: Json | null
          org_id: string | null
          revenue: number | null
          store_id: string | null
          visitor_count: number | null
          zone_id: string
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string
          date: string
          dwell_time_avg_min?: number | null
          hour?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          revenue?: number | null
          store_id?: string | null
          visitor_count?: number | null
          zone_id: string
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string
          date?: string
          dwell_time_avg_min?: number | null
          hour?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string | null
          revenue?: number | null
          store_id?: string | null
          visitor_count?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_metrics_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zone_metrics_zone_fk"
            columns: ["store_id", "zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["store_id", "zone_code"]
          },
        ]
      }
      zone_performance: {
        Row: {
          avg_dwell_time: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string
          heatmap_data: Json | null
          hourly_visits: Json | null
          id: string
          org_id: string
          purchase_count: number | null
          revenue_contribution: number | null
          store_id: string
          unique_visitors: number | null
          updated_at: string | null
          visit_count: number | null
          zone_name: string
        }
        Insert: {
          avg_dwell_time?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date: string
          heatmap_data?: Json | null
          hourly_visits?: Json | null
          id?: string
          org_id: string
          purchase_count?: number | null
          revenue_contribution?: number | null
          store_id: string
          unique_visitors?: number | null
          updated_at?: string | null
          visit_count?: number | null
          zone_name: string
        }
        Update: {
          avg_dwell_time?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string
          heatmap_data?: Json | null
          hourly_visits?: Json | null
          id?: string
          org_id?: string
          purchase_count?: number | null
          revenue_contribution?: number | null
          store_id?: string
          unique_visitors?: number | null
          updated_at?: string | null
          visit_count?: number | null
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_performance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      zones_dim: {
        Row: {
          area_sqm: number | null
          capacity: number | null
          coordinates: Json | null
          created_at: string | null
          floor_level: number | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          org_id: string | null
          parent_zone_id: string | null
          store_id: string
          updated_at: string | null
          zone_code: string
          zone_name: string
          zone_type: string | null
        }
        Insert: {
          area_sqm?: number | null
          capacity?: number | null
          coordinates?: Json | null
          created_at?: string | null
          floor_level?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          parent_zone_id?: string | null
          store_id: string
          updated_at?: string | null
          zone_code: string
          zone_name: string
          zone_type?: string | null
        }
        Update: {
          area_sqm?: number | null
          capacity?: number | null
          coordinates?: Json | null
          created_at?: string | null
          floor_level?: number | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          org_id?: string | null
          parent_zone_id?: string | null
          store_id?: string
          updated_at?: string | null
          zone_code?: string
          zone_name?: string
          zone_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zones_dim_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_fk"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_parent_zone_id_fkey"
            columns: ["parent_zone_id"]
            isOneToOne: false
            referencedRelation: "zones_dim"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_store_fk"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zones_dim_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_user_orgs: {
        Row: {
          org_id: string | null
          user_id: string | null
        }
        Insert: {
          org_id?: string | null
          user_id?: string | null
        }
        Update: {
          org_id?: string | null
          user_id?: string | null
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
    }
    Functions: {
      can_access_membership: {
        Args: { membership_org_id: string; membership_user_id: string }
        Returns: boolean
      }
      export_public_schema: { Args: never; Returns: Json }
      generate_sample_sales_data: {
        Args: { p_days?: number; p_org_id: string; p_store_id: string }
        Returns: undefined
      }
      generate_sample_visit_data: {
        Args: {
          p_days?: number
          p_org_id: string
          p_store_id: string
          p_visits_per_day?: number
        }
        Returns: undefined
      }
      get_schema_metadata: { Args: never; Returns: Json }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      get_user_orgs: {
        Args: { _user_id: string }
        Returns: {
          org_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
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
      is_org_admin_simple: { Args: { check_org_id: string }; Returns: boolean }
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
