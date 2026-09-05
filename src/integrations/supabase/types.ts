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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          image_urls: string[]
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string
          created_at?: string
          id?: string
          image_urls?: string[]
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          image_urls?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favourites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favourites_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flags: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          reason: string
          reporter_id: string
          resolved: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          reason: string
          reporter_id: string
          resolved?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          reason?: string
          reporter_id?: string
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "flags_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string
          description: string | null
          id: string
          image_emoji: string
          image_urls: string[]
          name: string
          owner_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["item_visibility"]
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          condition: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          description?: string | null
          id?: string
          image_emoji?: string
          image_urls?: string[]
          name: string
          owner_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          description?: string | null
          id?: string
          image_emoji?: string
          image_urls?: string[]
          name?: string
          owner_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["item_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "items_owner_profile_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          condition: Database["public"]["Enums"]["item_condition"]
          created_at: string
          description: string
          emirate: string | null
          flags_count: number
          id: string
          image_emoji: string
          image_urls: string[]
          item_id: string | null
          location: string
          looking_for: string
          moderation_note: string | null
          owner_id: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          condition: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          description?: string
          emirate?: string | null
          flags_count?: number
          id?: string
          image_emoji?: string
          image_urls?: string[]
          item_id?: string | null
          location: string
          looking_for?: string
          moderation_note?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          condition?: Database["public"]["Enums"]["item_condition"]
          created_at?: string
          description?: string
          emirate?: string | null
          flags_count?: number
          id?: string
          image_emoji?: string
          image_urls?: string[]
          item_id?: string | null
          location?: string
          looking_for?: string
          moderation_note?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_profile_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meetup_proposals: {
        Row: {
          created_at: string
          id: string
          meet_at: string
          note: string | null
          offer_id: string
          place: string
          proposed_by: string
          safety_confirmed_by: string[]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meet_at: string
          note?: string | null
          offer_id: string
          place: string
          proposed_by: string
          safety_confirmed_by?: string[]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meet_at?: string
          note?: string | null
          offer_id?: string
          place?: string
          proposed_by?: string
          safety_confirmed_by?: string[]
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetup_proposals_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_urls: string[]
          body: string
          created_at: string
          id: string
          offer_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachment_urls?: string[]
          body: string
          created_at?: string
          id?: string
          offer_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachment_urls?: string[]
          body?: string
          created_at?: string
          id?: string
          offer_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_profile_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          announcements: boolean
          created_at: string
          messages: boolean
          offers: boolean
          saves: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          announcements?: boolean
          created_at?: string
          messages?: boolean
          offers?: boolean
          saves?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          announcements?: boolean
          created_at?: string
          messages?: boolean
          offers?: boolean
          saves?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          complete_confirmed_by: string[]
          created_at: string
          from_user: string
          id: string
          items_ok_from: boolean
          items_ok_to: boolean
          listing_id: string
          listing_removed: boolean
          meetup_at: string | null
          meetup_location: string | null
          message: string
          offered_item_ids: string[]
          received_confirmed_by: string[]
          recipient_item_ids: string[]
          removed_item_ids: string[]
          removed_recipient_item_ids: string[]
          status: Database["public"]["Enums"]["offer_status"]
          to_user: string
          turn_user: string | null
          updated_at: string
        }
        Insert: {
          complete_confirmed_by?: string[]
          created_at?: string
          from_user: string
          id?: string
          items_ok_from?: boolean
          items_ok_to?: boolean
          listing_id: string
          listing_removed?: boolean
          meetup_at?: string | null
          meetup_location?: string | null
          message?: string
          offered_item_ids?: string[]
          received_confirmed_by?: string[]
          recipient_item_ids?: string[]
          removed_item_ids?: string[]
          removed_recipient_item_ids?: string[]
          status?: Database["public"]["Enums"]["offer_status"]
          to_user: string
          turn_user?: string | null
          updated_at?: string
        }
        Update: {
          complete_confirmed_by?: string[]
          created_at?: string
          from_user?: string
          id?: string
          items_ok_from?: boolean
          items_ok_to?: boolean
          listing_id?: string
          listing_removed?: boolean
          meetup_at?: string | null
          meetup_location?: string | null
          message?: string
          offered_item_ids?: string[]
          received_confirmed_by?: string[]
          recipient_item_ids?: string[]
          removed_item_ids?: string[]
          removed_recipient_item_ids?: string[]
          status?: Database["public"]["Enums"]["offer_status"]
          to_user?: string
          turn_user?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_from_profile_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_to_profile_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          birthday: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age_confirmed: number | null
          avatar_color: string
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          display_name: string
          emirate: string | null
          id: string
          interests: string[]
          inventory_default_visibility: Database["public"]["Enums"]["item_visibility"]
          location: string | null
          tos_accepted_at: string | null
          updated_at: string
          username: string
        }
        Insert: {
          age_confirmed?: number | null
          avatar_color?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          emirate?: string | null
          id: string
          interests?: string[]
          inventory_default_visibility?: Database["public"]["Enums"]["item_visibility"]
          location?: string | null
          tos_accepted_at?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          age_confirmed?: number | null
          avatar_color?: string
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          emirate?: string | null
          id?: string
          interests?: string[]
          inventory_default_visibility?: Database["public"]["Enums"]["item_visibility"]
          location?: string | null
          tos_accepted_at?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      support_inquiries: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          replied_at: string | null
          replied_by: string | null
          reply: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          replied_at?: string | null
          replied_by?: string | null
          reply?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_bans: {
        Row: {
          banned_by: string
          created_at: string
          expires_at: string | null
          id: string
          lifted_at: string | null
          reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          reason?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          lifted_at?: string | null
          reason?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "admin"
      item_category:
        | "Electronics"
        | "Household Items"
        | "Clothing"
        | "Outdoors"
        | "Accessories"
        | "Books"
        | "Toys"
        | "Sports"
      item_condition: "New" | "Like New" | "Good" | "Fair"
      item_visibility: "public" | "private"
      listing_status:
        | "active"
        | "reserved"
        | "completed"
        | "removed"
        | "withheld"
      offer_status:
        | "pending"
        | "accepted"
        | "declined"
        | "withdrawn"
        | "completed"
        | "waitlisted"
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
      app_role: ["user", "admin"],
      item_category: [
        "Electronics",
        "Household Items",
        "Clothing",
        "Outdoors",
        "Accessories",
        "Books",
        "Toys",
        "Sports",
      ],
      item_condition: ["New", "Like New", "Good", "Fair"],
      item_visibility: ["public", "private"],
      listing_status: [
        "active",
        "reserved",
        "completed",
        "removed",
        "withheld",
      ],
      offer_status: [
        "pending",
        "accepted",
        "declined",
        "withdrawn",
        "completed",
        "waitlisted",
      ],
    },
  },
} as const
