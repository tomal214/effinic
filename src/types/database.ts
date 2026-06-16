export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
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
  public: {
    Tables: {
      daily_tasks: {
        Row: {
          assigned_to: string | null
          checklist_progress: Json | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          end_time: string | null
          id: string
          materials_used: string | null
          notes: string | null
          photo_paths: Json
          practice_id: string
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"]
          surgery_id: string | null
          task_date: string
          task_template_id: string
        }
        Insert: {
          assigned_to?: string | null
          checklist_progress?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          materials_used?: string | null
          notes?: string | null
          photo_paths?: Json
          practice_id: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          surgery_id?: string | null
          task_date: string
          task_template_id: string
        }
        Update: {
          assigned_to?: string | null
          checklist_progress?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          end_time?: string | null
          id?: string
          materials_used?: string | null
          notes?: string | null
          photo_paths?: Json
          practice_id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          surgery_id?: string | null
          task_date?: string
          task_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_tasks_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          manager_notes: string | null
          practice_id: string
          reported_by: string
          severity: Database["public"]["Enums"]["incident_severity"]
          status: Database["public"]["Enums"]["incident_status"]
          surgery_id: string | null
          title: string
          type: Database["public"]["Enums"]["incident_type"]
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          manager_notes?: string | null
          practice_id: string
          reported_by: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          surgery_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["incident_type"]
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          manager_notes?: string | null
          practice_id?: string
          reported_by?: string
          severity?: Database["public"]["Enums"]["incident_severity"]
          status?: Database["public"]["Enums"]["incident_status"]
          surgery_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["incident_type"]
        }
        Relationships: [
          {
            foreignKeyName: "incidents_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          expires_at: string
          id: string
          practice_id: string
          role: Database["public"]["Enums"]["member_role"]
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          expires_at: string
          id?: string
          practice_id: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          expires_at?: string
          id?: string
          practice_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_invites_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_member_pins: {
        Row: {
          member_id: string
          pin_failed_attempts: number
          pin_hash: string
          pin_locked_until: string | null
        }
        Insert: {
          member_id: string
          pin_failed_attempts?: number
          pin_hash: string
          pin_locked_until?: string | null
        }
        Update: {
          member_id?: string
          pin_failed_attempts?: number
          pin_hash?: string
          pin_locked_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_member_pins_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "practice_members"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_members: {
        Row: {
          active_surgery_id: string | null
          created_at: string
          id: string
          is_active: boolean
          practice_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Insert: {
          active_surgery_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          practice_id: string
          role: Database["public"]["Enums"]["member_role"]
          user_id: string
        }
        Update: {
          active_surgery_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          practice_id?: string
          role?: Database["public"]["Enums"]["member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_surgery"
            columns: ["active_surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_members_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      practices: {
        Row: {
          created_at: string
          id: string
          name: string
          practice_token: string
          signup_mode: Database["public"]["Enums"]["signup_mode"]
          slug: string
          timezone: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          practice_token?: string
          signup_mode?: Database["public"]["Enums"]["signup_mode"]
          slug: string
          timezone?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          practice_token?: string
          signup_mode?: Database["public"]["Enums"]["signup_mode"]
          slug?: string
          timezone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      rota_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          is_published: boolean
          practice_id: string
          shift_date: string
          shift_type: Database["public"]["Enums"]["shift_type"]
          surgery_id: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          practice_id: string
          shift_date: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          surgery_id: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          practice_id?: string
          shift_date?: string
          shift_type?: Database["public"]["Enums"]["shift_type"]
          surgery_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rota_assignments_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rota_assignments_surgery_id_fkey"
            columns: ["surgery_id"]
            isOneToOne: false
            referencedRelation: "surgeries"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          key: string
          practice_id: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          practice_id: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          practice_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      surgeries: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          practice_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          practice_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          practice_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "surgeries_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          assigned_user_id: string | null
          category: string | null
          checklist_steps: Json
          compliance_file_url: string | null
          created_at: string
          description: string | null
          evidence_required: string | null
          id: string
          is_active: boolean
          is_mandatory: boolean
          practice_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          role_responsible: Database["public"]["Enums"]["member_role"]
          surgery_ids: string[]
          time_due: string | null
          title: string
        }
        Insert: {
          assigned_user_id?: string | null
          category?: string | null
          checklist_steps?: Json
          compliance_file_url?: string | null
          created_at?: string
          description?: string | null
          evidence_required?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          practice_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          role_responsible?: Database["public"]["Enums"]["member_role"]
          surgery_ids?: string[]
          time_due?: string | null
          title: string
        }
        Update: {
          assigned_user_id?: string | null
          category?: string | null
          checklist_steps?: Json
          compliance_file_url?: string | null
          created_at?: string
          description?: string | null
          evidence_required?: string | null
          id?: string
          is_active?: boolean
          is_mandatory?: boolean
          practice_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          role_responsible?: Database["public"]["Enums"]["member_role"]
          surgery_ids?: string[]
          time_due?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "practices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_task_session: { Args: { time_due: string }; Returns: string }
      get_user_practice_id: { Args: never; Returns: string }
      is_daily_task_locked: { Args: { p_task_id: string }; Returns: boolean }
    }
    Enums: {
      incident_severity: "low" | "medium" | "high" | "critical"
      incident_status: "open" | "under_review" | "resolved"
      incident_type: "incident" | "near_miss" | "issue"
      member_role:
        | "admin"
        | "manager"
        | "nurse"
        | "receptionist"
        | "dentist"
        | "hygienist"
        | "viewer"
      shift_type: "morning" | "afternoon" | "full_day"
      signup_mode: "invite_only" | "open"
      task_priority: "low" | "medium" | "high"
      task_status: "pending" | "completed" | "overdue" | "missed"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      incident_severity: ["low", "medium", "high", "critical"],
      incident_status: ["open", "under_review", "resolved"],
      incident_type: ["incident", "near_miss", "issue"],
      member_role: [
        "admin",
        "manager",
        "nurse",
        "receptionist",
        "dentist",
        "hygienist",
        "viewer",
      ],
      shift_type: ["morning", "afternoon", "full_day"],
      signup_mode: ["invite_only", "open"],
      task_priority: ["low", "medium", "high"],
      task_status: ["pending", "completed", "overdue", "missed"],
    },
  },
} as const

