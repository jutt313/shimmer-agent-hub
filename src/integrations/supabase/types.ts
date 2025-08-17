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
    PostgrestVersion: "12.2.3 (519615d)"
  }
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
      ai_section_configurations: {
        Row: {
          created_at: string | null
          custom_instructions: string | null
          examples: string[] | null
          id: string
          is_active: boolean | null
          rules: string[] | null
          section_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_instructions?: string | null
          examples?: string[] | null
          id?: string
          is_active?: boolean | null
          rules?: string[] | null
          section_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_instructions?: string | null
          examples?: string[] | null
          id?: string
          is_active?: boolean | null
          rules?: string[] | null
          section_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      api_credentials: {
        Row: {
          api_key: string
          created_at: string
          credential_name: string
          credential_type: Database["public"]["Enums"]["api_credential_type"]
          id: string
          is_active: boolean | null
          is_private_only: boolean | null
          last_used_at: string | null
          permissions: Json
          project_id: string | null
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          credential_name: string
          credential_type?: Database["public"]["Enums"]["api_credential_type"]
          id?: string
          is_active?: boolean | null
          is_private_only?: boolean | null
          last_used_at?: string | null
          permissions?: Json
          project_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          credential_name?: string
          credential_type?: Database["public"]["Enums"]["api_credential_type"]
          id?: string
          is_active?: boolean | null
          is_private_only?: boolean | null
          last_used_at?: string | null
          permissions?: Json
          project_id?: string | null
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "developer_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_credential_id: string | null
          api_token_id: string | null
          created_at: string
          developer_integration_id: string | null
          endpoint: string
          id: string
          method: string
          response_time_ms: number | null
          status_code: number
          user_id: string | null
        }
        Insert: {
          api_credential_id?: string | null
          api_token_id?: string | null
          created_at?: string
          developer_integration_id?: string | null
          endpoint: string
          id?: string
          method: string
          response_time_ms?: number | null
          status_code: number
          user_id?: string | null
        }
        Update: {
          api_credential_id?: string | null
          api_token_id?: string | null
          created_at?: string
          developer_integration_id?: string | null
          endpoint?: string
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_developer_integration_id_fkey"
            columns: ["developer_integration_id"]
            isOneToOne: false
            referencedRelation: "developer_integrations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_tracking: {
        Row: {
          api_credential_id: string
          cost_amount: number | null
          created_at: string
          endpoint: string
          id: string
          method: string
          project_id: string | null
          response_time_ms: number | null
          status_code: number | null
          tokens_used: number | null
          usage_date: string
          user_id: string
        }
        Insert: {
          api_credential_id: string
          cost_amount?: number | null
          created_at?: string
          endpoint: string
          id?: string
          method: string
          project_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          tokens_used?: number | null
          usage_date?: string
          user_id: string
        }
        Update: {
          api_credential_id?: string
          cost_amount?: number | null
          created_at?: string
          endpoint?: string
          id?: string
          method?: string
          project_id?: string | null
          response_time_ms?: number | null
          status_code?: number | null
          tokens_used?: number | null
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_tracking_api_credential_id_fkey"
            columns: ["api_credential_id"]
            isOneToOne: false
            referencedRelation: "api_credentials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_tracking_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "developer_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_agent_decisions: {
        Row: {
          agent_data: Json | null
          agent_name: string
          automation_id: string
          created_at: string
          decision: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_data?: Json | null
          agent_name: string
          automation_id: string
          created_at?: string
          decision: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_data?: Json | null
          agent_name?: string
          automation_id?: string
          created_at?: string
          decision?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      automation_diagrams: {
        Row: {
          automation_id: string
          created_at: string
          diagram_data: Json
          id: string
          layout_version: string
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          diagram_data?: Json
          id?: string
          layout_version?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          diagram_data?: Json
          id?: string
          layout_version?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_diagrams_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          automation_id: string
          created_at: string
          execution_result: Json | null
          generated_code: string | null
          generation_timestamp: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          execution_result?: Json | null
          generated_code?: string | null
          generation_timestamp?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          execution_result?: Json | null
          generated_code?: string | null
          generation_timestamp?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_platform_credentials: {
        Row: {
          automation_id: string
          created_at: string
          credential_type: string
          credentials: string
          id: string
          is_active: boolean
          is_tested: boolean
          platform_name: string
          test_message: string | null
          test_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          credential_type?: string
          credentials: string
          id?: string
          is_active?: boolean
          is_tested?: boolean
          platform_name: string
          test_message?: string | null
          test_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          credential_type?: string
          credentials?: string
          id?: string
          is_active?: boolean
          is_tested?: boolean
          platform_name?: string
          test_message?: string | null
          test_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_responses: {
        Row: {
          automation_id: string
          chat_message_id: number | null
          created_at: string
          error_help_available: boolean | null
          id: string
          is_ready_for_execution: boolean | null
          response_text: string
          seven_sections_validated: boolean | null
          structured_data: Json | null
          updated_at: string
          user_id: string
          yusrai_powered: boolean | null
        }
        Insert: {
          automation_id: string
          chat_message_id?: number | null
          created_at?: string
          error_help_available?: boolean | null
          id?: string
          is_ready_for_execution?: boolean | null
          response_text: string
          seven_sections_validated?: boolean | null
          structured_data?: Json | null
          updated_at?: string
          user_id: string
          yusrai_powered?: boolean | null
        }
        Update: {
          automation_id?: string
          chat_message_id?: number | null
          created_at?: string
          error_help_available?: boolean | null
          id?: string
          is_ready_for_execution?: boolean | null
          response_text?: string
          seven_sections_validated?: boolean | null
          structured_data?: Json | null
          updated_at?: string
          user_id?: string
          yusrai_powered?: boolean | null
        }
        Relationships: []
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
      automation_webhooks: {
        Row: {
          automation_id: string
          created_at: string
          expected_events: string[] | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          trigger_count: number
          webhook_description: string | null
          webhook_name: string
          webhook_secret: string
          webhook_url: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          expected_events?: string[] | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          trigger_count?: number
          webhook_description?: string | null
          webhook_name: string
          webhook_secret?: string
          webhook_url: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          expected_events?: string[] | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          trigger_count?: number
          webhook_description?: string | null
          webhook_name?: string
          webhook_secret?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_webhooks_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          automation_blueprint: Json | null
          automation_diagram_data: Json | null
          created_at: string
          description: string | null
          id: string
          is_pinned: boolean | null
          notification_enabled: boolean | null
          platforms_config: Json | null
          priority: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_blueprint?: Json | null
          automation_diagram_data?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          notification_enabled?: boolean | null
          platforms_config?: Json | null
          priority?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_blueprint?: Json | null
          automation_diagram_data?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_pinned?: boolean | null
          notification_enabled?: boolean | null
          platforms_config?: Json | null
          priority?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_accounts: {
        Row: {
          auto_recharge_amount: number | null
          auto_recharge_enabled: boolean | null
          auto_recharge_threshold: number | null
          billing_email: string
          billing_status: Database["public"]["Enums"]["billing_status"] | null
          company_name: string | null
          created_at: string
          credits_balance: number | null
          id: string
          primary_business_address: Json | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_threshold?: number | null
          billing_email: string
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          company_name?: string | null
          created_at?: string
          credits_balance?: number | null
          id?: string
          primary_business_address?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_recharge_amount?: number | null
          auto_recharge_enabled?: boolean | null
          auto_recharge_threshold?: number | null
          billing_email?: string
          billing_status?: Database["public"]["Enums"]["billing_status"] | null
          company_name?: string | null
          created_at?: string
          credits_balance?: number | null
          id?: string
          primary_business_address?: Json | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_transactions: {
        Row: {
          amount: number
          billing_account_id: string
          created_at: string
          credits_amount: number | null
          description: string | null
          id: string
          status: string | null
          stripe_payment_intent_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_account_id: string
          created_at?: string
          credits_amount?: number | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_account_id?: string
          created_at?: string
          credits_amount?: number | null
          description?: string | null
          id?: string
          status?: string | null
          stripe_payment_intent_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_transactions_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_limits: {
        Row: {
          budget_amount: number
          budget_name: string
          budget_period: string
          created_at: string
          current_spend: number | null
          end_date: string | null
          id: string
          is_active: boolean | null
          project_id: string | null
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_amount: number
          budget_name: string
          budget_period: string
          created_at?: string
          current_spend?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_amount?: number
          budget_name?: string
          budget_period?: string
          created_at?: string
          current_spend?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_limits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "developer_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_ai_feedback: {
        Row: {
          automation_context: Json | null
          created_at: string
          desired_output: string | null
          feedback_type: string
          id: string
          original_output: string
          solution_applied: string | null
          user_id: string
        }
        Insert: {
          automation_context?: Json | null
          created_at?: string
          desired_output?: string | null
          feedback_type: string
          id?: string
          original_output: string
          solution_applied?: string | null
          user_id: string
        }
        Update: {
          automation_context?: Json | null
          created_at?: string
          desired_output?: string | null
          feedback_type?: string
          id?: string
          original_output?: string
          solution_applied?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_ai_instructions: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          instruction_type: string
          is_active: boolean
          priority: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          instruction_type: string
          is_active?: boolean
          priority?: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          instruction_type?: string
          is_active?: boolean
          priority?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_ai_memory: {
        Row: {
          conversation_context: Json
          created_at: string
          id: string
          learned_patterns: Json
          memory_type: string
          successful_solutions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_context?: Json
          created_at?: string
          id?: string
          learned_patterns?: Json
          memory_type?: string
          successful_solutions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_context?: Json
          created_at?: string
          id?: string
          learned_patterns?: Json
          memory_type?: string
          successful_solutions?: Json
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
      developer_integrations: {
        Row: {
          app_description: string | null
          app_logo_url: string | null
          app_name: string
          client_id: string
          client_secret: string
          created_at: string
          developer_email: string | null
          environment: string | null
          event_descriptions: Json | null
          homepage_url: string | null
          id: string
          is_active: boolean
          privacy_policy_url: string | null
          rate_limit_per_hour: number
          redirect_uris: string[]
          supported_events: Json | null
          terms_of_service_url: string | null
          test_client_id: string | null
          test_client_secret: string | null
          tier: Database["public"]["Enums"]["developer_tier"]
          tool_description: string | null
          updated_at: string
          use_cases: string[] | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          app_description?: string | null
          app_logo_url?: string | null
          app_name: string
          client_id?: string
          client_secret?: string
          created_at?: string
          developer_email?: string | null
          environment?: string | null
          event_descriptions?: Json | null
          homepage_url?: string | null
          id?: string
          is_active?: boolean
          privacy_policy_url?: string | null
          rate_limit_per_hour?: number
          redirect_uris?: string[]
          supported_events?: Json | null
          terms_of_service_url?: string | null
          test_client_id?: string | null
          test_client_secret?: string | null
          tier?: Database["public"]["Enums"]["developer_tier"]
          tool_description?: string | null
          updated_at?: string
          use_cases?: string[] | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          app_description?: string | null
          app_logo_url?: string | null
          app_name?: string
          client_id?: string
          client_secret?: string
          created_at?: string
          developer_email?: string | null
          environment?: string | null
          event_descriptions?: Json | null
          homepage_url?: string | null
          id?: string
          is_active?: boolean
          privacy_policy_url?: string | null
          rate_limit_per_hour?: number
          redirect_uris?: string[]
          supported_events?: Json | null
          terms_of_service_url?: string | null
          test_client_id?: string | null
          test_client_secret?: string | null
          tier?: Database["public"]["Enums"]["developer_tier"]
          tool_description?: string | null
          updated_at?: string
          use_cases?: string[] | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      developer_projects: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          project_description: string | null
          project_name: string
          updated_at: string
          use_case: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          project_description?: string | null
          project_name: string
          updated_at?: string
          use_case?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          project_description?: string | null
          project_name?: string
          updated_at?: string
          use_case?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documentation_articles: {
        Row: {
          category_id: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          rating_count: number | null
          rating_sum: number | null
          read_count: number | null
          slug: string
          sort_order: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          rating_count?: number | null
          rating_sum?: number | null
          read_count?: number | null
          slug: string
          sort_order?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          rating_count?: number | null
          rating_sum?: number | null
          read_count?: number | null
          slug?: string
          sort_order?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "documentation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      documentation_feedback: {
        Row: {
          article_id: string | null
          comment: string | null
          created_at: string
          id: string
          is_helpful: boolean | null
          rating: number | null
          user_id: string
        }
        Insert: {
          article_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_helpful?: boolean | null
          rating?: number | null
          user_id: string
        }
        Update: {
          article_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          is_helpful?: boolean | null
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "documentation_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation_progress: {
        Row: {
          article_id: string | null
          created_at: string
          id: string
          is_completed: boolean | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentation_progress_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "documentation_articles"
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
      error_logs: {
        Row: {
          automation_id: string | null
          context: Json | null
          created_at: string
          error_code: string
          error_message: string
          error_type: string
          id: string
          resolved: boolean
          severity: string
          stack_trace: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          automation_id?: string | null
          context?: Json | null
          created_at?: string
          error_code: string
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean
          severity: string
          stack_trace?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          automation_id?: string | null
          context?: Json | null
          created_at?: string
          error_code?: string
          error_message?: string
          error_type?: string
          id?: string
          resolved?: boolean
          severity?: string
          stack_trace?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      monitoring_events: {
        Row: {
          created_at: string
          event_data: Json
          event_type: string
          id: string
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json
          event_type: string
          id?: string
          severity: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_type?: string
          id?: string
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          metadata: Json | null
          title: string | null
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          metadata?: Json | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      oauth_connections: {
        Row: {
          access_token: string
          connected_at: string
          developer_integration_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_used_at: string | null
          refresh_token: string | null
          scopes: Json
          user_id: string
        }
        Insert: {
          access_token: string
          connected_at?: string
          developer_integration_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          refresh_token?: string | null
          scopes?: Json
          user_id: string
        }
        Update: {
          access_token?: string
          connected_at?: string
          developer_integration_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          refresh_token?: string | null
          scopes?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oauth_connections_developer_integration_id_fkey"
            columns: ["developer_integration_id"]
            isOneToOne: false
            referencedRelation: "developer_integrations"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      special_offers: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          expires_at: string
          id: string
          is_claimed: boolean | null
          offer_type: string
          shown_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          is_claimed?: boolean | null
          offer_type?: string
          shown_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          is_claimed?: boolean | null
          offer_type?: string
          shown_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      universal_knowledge_store: {
        Row: {
          category: string
          created_at: string
          credential_fields: Json | null
          details: Json
          id: string
          last_used: string | null
          platform_description: string | null
          platform_name: string | null
          priority: number | null
          source_type: string | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          usage_count: number | null
          use_cases: string[] | null
        }
        Insert: {
          category: string
          created_at?: string
          credential_fields?: Json | null
          details?: Json
          id?: string
          last_used?: string | null
          platform_description?: string | null
          platform_name?: string | null
          priority?: number | null
          source_type?: string | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          usage_count?: number | null
          use_cases?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string
          credential_fields?: Json | null
          details?: Json
          id?: string
          last_used?: string | null
          platform_description?: string | null
          platform_name?: string | null
          priority?: number | null
          source_type?: string | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          usage_count?: number | null
          use_cases?: string[] | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          active_ai_agents_count: number | null
          active_automations_count: number | null
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          step_runs_used: number | null
          total_runs_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_ai_agents_count?: number | null
          active_automations_count?: number | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          step_runs_used?: number | null
          total_runs_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_ai_agents_count?: number | null
          active_automations_count?: number | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          step_runs_used?: number | null
          total_runs_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_api_tokens: {
        Row: {
          connection_purpose: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          last_usage_details: Json | null
          last_used_at: string | null
          permissions: Json
          token_description: string | null
          token_hash: string
          token_name: string
          token_type: Database["public"]["Enums"]["api_token_type"]
          usage_count: number | null
          user_id: string
        }
        Insert: {
          connection_purpose?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_usage_details?: Json | null
          last_used_at?: string | null
          permissions?: Json
          token_description?: string | null
          token_hash: string
          token_name: string
          token_type?: Database["public"]["Enums"]["api_token_type"]
          usage_count?: number | null
          user_id: string
        }
        Update: {
          connection_purpose?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          last_usage_details?: Json | null
          last_used_at?: string | null
          permissions?: Json
          token_description?: string | null
          token_hash?: string
          token_name?: string
          token_type?: Database["public"]["Enums"]["api_token_type"]
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          notification_preferences: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notification_preferences?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          max_ai_agents: number
          max_automations: number
          max_step_runs: number
          max_total_runs: number
          monthly_price: number
          plan_type: string
          special_offer_expires_at: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_ai_agents: number
          max_automations: number
          max_step_runs: number
          max_total_runs: number
          monthly_price: number
          plan_type: string
          special_offer_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_ai_agents?: number
          max_automations?: number
          max_step_runs?: number
          max_total_runs?: number
          monthly_price?: number
          plan_type?: string
          special_offer_expires_at?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
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
      webhook_delivery_logs: {
        Row: {
          automation_run_id: string | null
          automation_webhook_id: string
          created_at: string
          delivered_at: string | null
          delivery_attempts: number
          id: string
          payload: Json
          response_body: string | null
          status_code: number | null
        }
        Insert: {
          automation_run_id?: string | null
          automation_webhook_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_attempts?: number
          id?: string
          payload: Json
          response_body?: string | null
          status_code?: number | null
        }
        Update: {
          automation_run_id?: string | null
          automation_webhook_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_attempts?: number
          id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_delivery_logs_automation_run_id_fkey"
            columns: ["automation_run_id"]
            isOneToOne: false
            referencedRelation: "automation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_delivery_logs_automation_webhook_id_fkey"
            columns: ["automation_webhook_id"]
            isOneToOne: false
            referencedRelation: "automation_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          automation_id: string | null
          created_at: string | null
          event_description: string | null
          event_type: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          trigger_count: number | null
          updated_at: string | null
          webhook_url: string
        }
        Insert: {
          automation_id?: string | null
          created_at?: string | null
          event_description?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          webhook_url: string
        }
        Update: {
          automation_id?: string | null
          created_at?: string | null
          event_description?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          trigger_count?: number | null
          updated_at?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_api_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_unified_api_key: {
        Args: { key_type?: string }
        Returns: string
      }
      generate_webhook_url: {
        Args: { automation_id: string }
        Returns: string
      }
      generate_yusrai_api_key: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      hash_api_token: {
        Args: { token: string }
        Returns: string
      }
      track_api_usage: {
        Args: {
          p_api_credential_id: string
          p_cost_amount?: number
          p_endpoint: string
          p_method: string
          p_project_id: string
          p_response_time_ms?: number
          p_status_code?: number
          p_tokens_used?: number
          p_user_id: string
        }
        Returns: undefined
      }
      validate_api_token: {
        Args: { token_hash: string }
        Returns: {
          is_valid: boolean
          permissions: Json
          token_type: Database["public"]["Enums"]["api_token_type"]
          user_id: string
        }[]
      }
      validate_unified_api_key: {
        Args: { api_key: string }
        Returns: {
          credential_type: string
          is_valid: boolean
          permissions: Json
          rate_limit_per_hour: number
          user_id: string
        }[]
      }
      validate_yusrai_api_key: {
        Args: { api_key: string }
        Returns: {
          is_valid: boolean
          permissions: Json
          project_id: string
          rate_limit_per_hour: number
          user_id: string
        }[]
      }
    }
    Enums: {
      api_credential_type: "personal" | "project" | "service"
      api_token_type: "developer" | "user" | "automation"
      billing_status: "active" | "suspended" | "cancelled"
      developer_tier: "free" | "pro" | "enterprise"
      integration_type: "oauth" | "api_key" | "webhook"
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
      api_credential_type: ["personal", "project", "service"],
      api_token_type: ["developer", "user", "automation"],
      billing_status: ["active", "suspended", "cancelled"],
      developer_tier: ["free", "pro", "enterprise"],
      integration_type: ["oauth", "api_key", "webhook"],
    },
  },
} as const
