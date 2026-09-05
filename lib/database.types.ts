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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          edition_id: string
          id: string
          published: boolean
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          body: string
          edition_id: string
          id?: string
          published?: boolean
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          body?: string
          edition_id?: string
          id?: string
          published?: boolean
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "announcements_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      article_slugs: {
        Row: {
          article_id: string
          slug: string
        }
        Insert: {
          article_id: string
          slug: string
        }
        Update: {
          article_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_slugs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          author: string
          author_id: string | null
          category: string
          comments_open: boolean
          content: Json
          correction_note: string
          cover_image: string
          created_at: string
          edition_id: string | null
          featured: boolean
          id: string
          image_credit: string
          kind: string
          published_at: string | null
          reading_time: string
          search_vector: unknown
          slug: string
          sources: Json
          status: string
          subtitle: string
          tags: string[]
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author: string
          author_id?: string | null
          category: string
          comments_open?: boolean
          content: Json
          correction_note?: string
          cover_image: string
          created_at?: string
          edition_id?: string | null
          featured?: boolean
          id?: string
          image_credit?: string
          kind?: string
          published_at?: string | null
          reading_time: string
          search_vector?: unknown
          slug: string
          sources?: Json
          status?: string
          subtitle: string
          tags?: string[]
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          author?: string
          author_id?: string | null
          category?: string
          comments_open?: boolean
          content?: Json
          correction_note?: string
          cover_image?: string
          created_at?: string
          edition_id?: string | null
          featured?: boolean
          id?: string
          image_credit?: string
          kind?: string
          published_at?: string | null
          reading_time?: string
          search_vector?: unknown
          slug?: string
          sources?: Json
          status?: string
          subtitle?: string
          tags?: string[]
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "articles_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          article_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          article_id: string
          author_id: string | null
          body: string
          created_at: string
          display_name: string
          edited_at: string | null
          id: string
          parent_id: string | null
          status: string
          team_badge: boolean
          version: number
        }
        Insert: {
          article_id: string
          author_id?: string | null
          body: string
          created_at?: string
          display_name: string
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          status?: string
          team_badge?: boolean
          version?: number
        }
        Update: {
          article_id?: string
          author_id?: string | null
          body?: string
          created_at?: string
          display_name?: string
          edited_at?: string | null
          id?: string
          parent_id?: string | null
          status?: string
          team_badge?: boolean
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          asset_id: string
          audience: string
          category: string | null
          description: string
          document_version: string
          edition_id: string
          id: string
          kind: string
          organization_confirmed: boolean
          published: boolean
          responsible: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          asset_id: string
          audience?: string
          category?: string | null
          description?: string
          document_version: string
          edition_id: string
          id?: string
          kind: string
          organization_confirmed?: boolean
          published?: boolean
          responsible: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          asset_id?: string
          audience?: string
          category?: string | null
          description?: string
          document_version?: string
          edition_id?: string
          id?: string
          kind?: string
          organization_confirmed?: boolean
          published?: boolean
          responsible?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "media_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      editions: {
        Row: {
          id: string
          published: boolean
          slug: string
          title: string
          updated_at: string
          version: number
          year: number
        }
        Insert: {
          id?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
          version?: number
          year: number
        }
        Update: {
          id?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
          version?: number
          year?: number
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          bucket: string
          bytes: number
          created_at: string
          id: string
          mime: string
          owner_id: string
          path: string
        }
        Insert: {
          bucket: string
          bytes: number
          created_at?: string
          id?: string
          mime: string
          owner_id: string
          path: string
        }
        Update: {
          bucket?: string
          bytes?: number
          created_at?: string
          id?: string
          mime?: string
          owner_id?: string
          path?: string
        }
        Relationships: []
      }
      reader_profiles: {
        Row: {
          display_name: string
          id: string
          updated_at: string
        }
        Insert: {
          display_name: string
          id: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_updates: {
        Row: {
          article_id: string | null
          author: string
          author_id: string | null
          body: string
          correction_note: string
          created_at: string
          id: string
          organization_confirmed: boolean
          published: boolean
          result: boolean
          session_id: string
          updated_at: string
          version: number
        }
        Insert: {
          article_id?: string | null
          author: string
          author_id?: string | null
          body: string
          correction_note?: string
          created_at?: string
          id?: string
          organization_confirmed?: boolean
          published?: boolean
          result?: boolean
          session_id: string
          updated_at?: string
          version?: number
        }
        Update: {
          article_id?: string | null
          author?: string
          author_id?: string | null
          body?: string
          correction_note?: string
          created_at?: string
          id?: string
          organization_confirmed?: boolean
          published?: boolean
          result?: boolean
          session_id?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "session_updates_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_updates_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          category: string
          edition_id: string
          ends_at: string
          id: string
          location: string
          location_public: boolean
          published: boolean
          starts_at: string
          status: string
          summary: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          edition_id: string
          ends_at: string
          id?: string
          location?: string
          location_public?: boolean
          published?: boolean
          starts_at: string
          status?: string
          summary?: string
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          edition_id?: string
          ends_at?: string
          id?: string
          location?: string
          location_public?: boolean
          published?: boolean
          starts_at?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "sessions_edition_id_fkey"
            columns: ["edition_id"]
            isOneToOne: false
            referencedRelation: "editions"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          comments_enabled: boolean
          id: boolean
          moderation_ready: boolean
          premoderation: boolean
          readers_enabled: boolean
          updated_at: string
        }
        Insert: {
          comments_enabled?: boolean
          id?: boolean
          moderation_ready?: boolean
          premoderation?: boolean
          readers_enabled?: boolean
          updated_at?: string
        }
        Update: {
          comments_enabled?: boolean
          id?: boolean
          moderation_ready?: boolean
          premoderation?: boolean
          readers_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sis_access: { Args: never; Returns: Json }
      sis_account_export: { Args: never; Returns: Json }
      sis_dashboard: {
        Args: { kind: string; pg?: number; query?: string }
        Returns: Json
      }
      sis_mutate: {
        Args: { act: string; d: Json; operation: string }
        Returns: Json
      }
      sis_public_location: { Args: { session_id: string }; Returns: string }
      sis_retention_cleanup: { Args: never; Returns: undefined }
      sis_search: {
        Args: {
          committee?: string
          edition?: string
          from_date?: string
          per_page?: number
          pg?: number
          q?: string
          to_date?: string
        }
        Returns: {
          author: string
          category: string
          cover_image: string
          edition_id: string
          featured: boolean
          id: string
          kind: string
          published_at: string
          reading_time: string
          slug: string
          subtitle: string
          tags: string[]
          title: string
          total: number
          updated_at: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
