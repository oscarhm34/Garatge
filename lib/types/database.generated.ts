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
    PostgrestVersion: "14.17"
  }
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
      activity_log: {
        Row: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_id: string | null
          created_at: string
          diff: Json | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          household_id: string
          id: number
        }
        Insert: {
          action: Database["public"]["Enums"]["activity_action"]
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          household_id: string
          id?: never
        }
        Update: {
          action?: Database["public"]["Enums"]["activity_action"]
          actor_id?: string | null
          created_at?: string
          diff?: Json | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          household_id?: string
          id?: never
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_calls: {
        Row: {
          created_at: string
          household_id: string
          id: number
          kind: string
          profile_id: string | null
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: never
          kind?: string
          profile_id?: string | null
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: never
          kind?: string
          profile_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_calls_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_calls_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          household_id: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          household_id: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          household_id?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
        }
        Relationships: []
      }
      item_tags: {
        Row: {
          item_id: string
          tag_id: string
        }
        Insert: {
          item_id: string
          tag_id: string
        }
        Update: {
          item_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          household_id: string
          id: string
          location_id: string | null
          name: string
          name_norm: string | null
          notes: string | null
          photo_url: string | null
          quantity: number
          search_vector: unknown
          tags_text: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          household_id: string
          id?: string
          location_id?: string | null
          name: string
          name_norm?: string | null
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          search_vector?: unknown
          tags_text?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          household_id?: string
          id?: string
          location_id?: string | null
          name?: string
          name_norm?: string | null
          notes?: string | null
          photo_url?: string | null
          quantity?: number
          search_vector?: unknown
          tags_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          borrowed_at: string
          borrowed_by: string | null
          household_id: string
          id: string
          item_id: string
          note: string | null
          returned_at: string | null
        }
        Insert: {
          borrowed_at?: string
          borrowed_by?: string | null
          household_id: string
          id?: string
          item_id: string
          note?: string | null
          returned_at?: string | null
        }
        Update: {
          borrowed_at?: string
          borrowed_by?: string | null
          household_id?: string
          id?: string
          item_id?: string
          note?: string | null
          returned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_borrowed_by_fkey"
            columns: ["borrowed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          code: string
          color: string | null
          created_at: string
          household_id: string
          id: string
          kind: Database["public"]["Enums"]["location_kind"]
          name: string
          notes: string | null
          parent_id: string | null
          photo_url: string | null
          position: number
          updated_at: string
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string
          household_id: string
          id?: string
          kind: Database["public"]["Enums"]["location_kind"]
          name: string
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          position?: number
          updated_at?: string
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string
          household_id?: string
          id?: string
          kind?: Database["public"]["Enums"]["location_kind"]
          name?: string
          notes?: string | null
          parent_id?: string | null
          photo_url?: string | null
          position?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations_detail"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          household_id: string | null
          id: string
          role: Database["public"]["Enums"]["member_role"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          household_id?: string | null
          id: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          household_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["member_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          household_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      items_detail: {
        Row: {
          borrowed_at: string | null
          borrowed_by: string | null
          borrowed_by_name: string | null
          category_color: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          household_id: string | null
          id: string | null
          location_code: string | null
          location_id: string | null
          location_path: string | null
          name: string | null
          notes: string | null
          open_loan_id: string | null
          photo_url: string | null
          quantity: number | null
          tags: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations_detail"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_borrowed_by_fkey"
            columns: ["borrowed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locations_detail: {
        Row: {
          child_count: number | null
          code: string | null
          color: string | null
          household_id: string | null
          id: string | null
          item_count: number | null
          item_count_deep: number | null
          kind: Database["public"]["Enums"]["location_kind"] | null
          name: string | null
          notes: string | null
          parent_id: string | null
          path: string | null
          photo_url: string | null
          position: number | null
        }
        Insert: {
          child_count?: never
          code?: string | null
          color?: string | null
          household_id?: string | null
          id?: string | null
          item_count?: never
          item_count_deep?: never
          kind?: Database["public"]["Enums"]["location_kind"] | null
          name?: string | null
          notes?: string | null
          parent_id?: string | null
          path?: never
          photo_url?: string | null
          position?: number | null
        }
        Update: {
          child_count?: never
          code?: string | null
          color?: string | null
          household_id?: string | null
          id?: string | null
          item_count?: never
          item_count_deep?: never
          kind?: Database["public"]["Enums"]["location_kind"] | null
          name?: string | null
          notes?: string | null
          parent_id?: string | null
          path?: never
          photo_url?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "locations_detail"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_location: {
        Args: {
          p_color?: string
          p_kind: Database["public"]["Enums"]["location_kind"]
          p_name?: string
          p_parent: string
        }
        Returns: {
          code: string
          color: string | null
          created_at: string
          household_id: string
          id: string
          kind: Database["public"]["Enums"]["location_kind"]
          name: string
          notes: string | null
          parent_id: string | null
          photo_url: string | null
          position: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "locations"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bootstrap_garage: {
        Args: { p_cabinets?: number; p_compartments?: number }
        Returns: number
      }
      create_household: { Args: { p_name: string }; Returns: string }
      f_unaccent: { Args: { "": string }; Returns: string }
      join_household: { Args: { p_invite_code: string }; Returns: string }
      location_path: { Args: { p_id: string }; Returns: string }
      next_location_code: {
        Args: {
          p_household: string
          p_kind: Database["public"]["Enums"]["location_kind"]
          p_parent: string
        }
        Returns: string
      }
      ping: { Args: never; Returns: string }
      refresh_item_tags_text: { Args: { p_item: string }; Returns: undefined }
      register_ai_call: {
        Args: { p_daily_limit?: number; p_kind?: string }
        Returns: number
      }
      search_items: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          borrowed_at: string | null
          borrowed_by: string | null
          borrowed_by_name: string | null
          category_color: string | null
          category_id: string | null
          category_name: string | null
          created_at: string | null
          description: string | null
          household_id: string | null
          id: string | null
          location_code: string | null
          location_id: string | null
          location_path: string | null
          name: string | null
          notes: string | null
          open_loan_id: string | null
          photo_url: string | null
          quantity: number | null
          tags: string[] | null
          updated_at: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "items_detail"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      activity_action:
        | "create"
        | "update"
        | "move"
        | "delete"
        | "borrow"
        | "return"
      location_kind:
        | "armari"
        | "porta"
        | "modul"
        | "prestatge"
        | "caixa"
        | "altre"
      member_role: "admin" | "member"
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
      activity_action: [
        "create",
        "update",
        "move",
        "delete",
        "borrow",
        "return",
      ],
      location_kind: [
        "armari",
        "porta",
        "modul",
        "prestatge",
        "caixa",
        "altre",
      ],
      member_role: ["admin", "member"],
    },
  },
} as const
