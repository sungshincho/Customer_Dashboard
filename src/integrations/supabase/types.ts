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
      analysis_history: {
        Row: {
          analysis_type: string
          created_at: string
          id: string
          input_data: Json
          result: string
          user_id: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          id?: string
          input_data: Json
          result: string
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          id?: string
          input_data?: Json
          result?: string
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
      data_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
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
          source_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          properties: Json | null
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
          properties?: Json | null
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
          properties?: Json | null
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
        ]
      }
      graph_relations: {
        Row: {
          created_at: string | null
          id: string
          properties: Json | null
          relation_type_id: string
          source_entity_id: string
          target_entity_id: string
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          properties?: Json | null
          relation_type_id: string
          source_entity_id: string
          target_entity_id: string
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          properties?: Json | null
          relation_type_id?: string
          source_entity_id?: string
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
            foreignKeyName: "graph_relations_target_entity_id_fkey"
            columns: ["target_entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
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
          properties?: Json | null
          updated_at?: string | null
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
          schema_data: Json
          user_id: string
          version_number: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          schema_data: Json
          user_id: string
          version_number: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          schema_data?: Json
          user_id?: string
          version_number?: number
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
          selling_price?: number
          sku?: string
          supplier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          created_at: string
          data_type: string
          file_name: string
          file_type: string
          id: string
          raw_data: Json
          row_count: number
          sheet_name: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data_type: string
          file_name: string
          file_type: string
          id?: string
          raw_data: Json
          row_count: number
          sheet_name?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data_type?: string
          file_name?: string
          file_type?: string
          id?: string
          raw_data?: Json
          row_count?: number
          sheet_name?: string | null
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
