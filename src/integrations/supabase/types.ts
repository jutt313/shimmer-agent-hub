export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_test_results: {
        Row: {
          ai_agent_id: string | null
          created_at: string
          id: string
          technical_details: Json | null
          test_message: string | null
          test_status: string
          tested_at: string
        }
        Insert: {
          ai_agent_id?: string | null
          created_at?: string
          id?: string
          technical_details?: Json | null
          test_message?: string | null
          test_status: string
          tested_at?: string
        }
        Update: {
          ai_agent_id?: string | null
          created_at?: string
          id?: string
          technical_details?: Json | null
          test_message?: string | null
          test_status?: string
          tested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_test_results_ai_agent_id_fkey"
            columns: ["ai_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agents: {
        Row: {
          agent_goal: string | null
          agent_memory: Json | null
          agent_name: string
          agent_role: string | null
          agent_rules: string | null
          api_key: string | null
          automation_id: string
          created_at: string
          id: string
          llm_provider: string | null
          model: string | null
          updated_at: string
        }
        Insert: {
          agent_goal?: string | null
          agent_memory?: Json | null
          agent_name: string
          agent_role?: string | null
          agent_rules?: string | null
          api_key?: string | null
          automation_id: string
          created_at?: string
          id?: string
          llm_provider?: string | null
          model?: string | null
          updated_at?: string
        }
        Update: {
          agent_goal?: string | null
          agent_memory?: Json | null
          agent_name?: string
          agent_role?: string | null
          agent_rules?: string | null
          api_key?: string | null
          automation_id?: string
          created_at?: string
          id?: string
          llm_provider?: string | null
          model?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agents_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_chats: {
        Row: {
          automation_id: string
          id: string
          message_content: string
          sender: string
          timestamp: string
        }
        Insert: {
          automation_id: string
          id?: string
          message_content: string
          sender: string
          timestamp?: string
        }
        Update: {
          automation_id?: string
          id?: string
          message_content?: string
          sender?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_chats_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          automation_id: string
          details_log: Json | null
          duration_ms: number | null
          id: string
          run_timestamp: string
          status: string
          trigger_data: Json | null
          user_id: string
        }
        Insert: {
          automation_id: string
          details_log?: Json | null
          duration_ms?: number | null
          id?: string
          run_timestamp?: string
          status?: string
          trigger_data?: Json | null
          user_id: string
        }
        Update: {
          automation_id?: string
          details_log?: Json | null
          duration_ms?: number | null
          id?: string
          run_timestamp?: string
          status?: string
          trigger_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          automation_blueprint: Json | null
          created_at: string
          description: string | null
          id: string
          platforms_config: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_blueprint?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          platforms_config?: Json | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_blueprint?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          platforms_config?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credential_test_results: {
        Row: {
          created_at: string
          id: string
          platform_credential_id: string | null
          technical_details: Json | null
          test_message: string | null
          test_status: string
          tested_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform_credential_id?: string | null
          technical_details?: Json | null
          test_message?: string | null
          test_status: string
          tested_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          platform_credential_id?: string | null
          technical_details?: Json | null
          test_message?: string | null
          test_status?: string
          tested_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credential_test_results_platform_credential_id_fkey"
            columns: ["platform_credential_id"]
            isOneToOne: false
            referencedRelation: "platform_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      error_conversations: {
        Row: {
          conversation_history: Json
          created_at: string
          error_message: string
          file_name: string | null
          id: string
          stack_trace: string | null
          updated_at: string
          user_action: string | null
          user_id: string | null
        }
        Insert: {
          conversation_history?: Json
          created_at?: string
          error_message: string
          file_name?: string | null
          id?: string
          stack_trace?: string | null
          updated_at?: string
          user_action?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_history?: Json
          created_at?: string
          error_message?: string
          file_name?: string | null
          id?: string
          stack_trace?: string | null
          updated_at?: string
          user_action?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      platform_credentials: {
        Row: {
          created_at: string
          credential_type: string
          credentials: string
          id: string
          is_active: boolean
          platform_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_type: string
          credentials: string
          id?: string
          is_active?: boolean
          platform_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_type?: string
          credentials?: string
          id?: string
          is_active?: boolean
          platform_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      universal_knowledge_store: {
        Row: {
          category: string
          created_at: string
          details: Json
          id: string
          last_used: string | null
          priority: number | null
          source_type: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          details?: Json
          id?: string
          last_used?: string | null
          priority?: number | null
          source_type?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          details?: Json
          id?: string
          last_used?: string | null
          priority?: number | null
          source_type?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
