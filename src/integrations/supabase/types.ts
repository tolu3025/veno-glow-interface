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
      access_codes: {
        Row: {
          code: string
          created_at: string | null
          device_id: string | null
          id: string
          is_used: boolean | null
          payment_reference: string | null
          remember_device: boolean | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_used?: boolean | null
          payment_reference?: string | null
          remember_device?: boolean | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          device_id?: string | null
          id?: string
          is_used?: boolean | null
          payment_reference?: string | null
          remember_device?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      anatomy_option_sets: {
        Row: {
          category: Database["public"]["Enums"]["anatomy_question_category"]
          created_at: string | null
          id: string
          options: Json
          question_id: string | null
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["anatomy_question_category"]
          created_at?: string | null
          id?: string
          options: Json
          question_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["anatomy_question_category"]
          created_at?: string | null
          id?: string
          options?: Json
          question_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anatomy_option_sets_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          updated_at: string | null
          user_type: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          updated_at?: string | null
          user_type: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          updated_at?: string | null
          user_type?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          blog_post_id: string
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          reactions: Json | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          blog_post_id: string
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          blog_post_id?: string
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar: string | null
          author_id: string | null
          author_name: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published: boolean | null
          slug: string | null
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_avatar?: string | null
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      custom_tests: {
        Row: {
          created_at: string | null
          creator_id: string | null
          id: string
          is_public: boolean | null
          name: string
          question_count: number | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          question_count?: number | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          question_count?: number | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      investors: {
        Row: {
          current_value: number
          email: string | null
          full_name: string | null
          id: string
          initial_investment: number
          investment_count: number | null
          investment_total: number | null
          joined_at: string | null
          name: string
          notes: string | null
          password: string | null
          portfolio_value: number | null
          profile_image_url: string | null
          roi: number
          user_id: string | null
        }
        Insert: {
          current_value: number
          email?: string | null
          full_name?: string | null
          id: string
          initial_investment: number
          investment_count?: number | null
          investment_total?: number | null
          joined_at?: string | null
          name: string
          notes?: string | null
          password?: string | null
          portfolio_value?: number | null
          profile_image_url?: string | null
          roi: number
          user_id?: string | null
        }
        Update: {
          current_value?: number
          email?: string | null
          full_name?: string | null
          id?: string
          initial_investment?: number
          investment_count?: number | null
          investment_total?: number | null
          joined_at?: string | null
          name?: string
          notes?: string | null
          password?: string | null
          portfolio_value?: number | null
          profile_image_url?: string | null
          roi?: number
          user_id?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          subscribed_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          subscribed_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          subscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          updated_at: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          updated_at?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          updated_at?: string | null
          user_email?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          id: string
          product_id: string | null
          quantity: number
          seller_id: string | null
          status: string
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          status?: string
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          id?: string
          product_id?: string | null
          quantity?: number
          seller_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          email: string | null
          id: string
          payment_reference: string
          status: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          email?: string | null
          id?: string
          payment_reference: string
          status: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          email?: string | null
          id?: string
          payment_reference?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      phone_users: {
        Row: {
          created_at: string | null
          id: string
          is_verified: boolean | null
          phone: string
          phone_email: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_verified?: boolean | null
          phone: string
          phone_email: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string
          phone_email?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          condition: Database["public"]["Enums"]["product_condition"]
          created_at: string
          description: string | null
          id: string
          inventory_count: number
          location: string | null
          price: number
          seller_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          description?: string | null
          id?: string
          inventory_count?: number
          location?: string | null
          price: number
          seller_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: Database["public"]["Enums"]["product_condition"]
          created_at?: string
          description?: string | null
          id?: string
          inventory_count?: number
          location?: string | null
          price?: number
          seller_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          language: string | null
          notification_preferences: Json | null
          phone_number: string | null
          phone_verified: boolean | null
          theme: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          language?: string | null
          notification_preferences?: Json | null
          phone_number?: string | null
          phone_verified?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          language?: string | null
          notification_preferences?: Json | null
          phone_number?: string | null
          phone_verified?: boolean | null
          theme?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          answer: number
          created_at: string | null
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null
          explanation: string | null
          id: string
          options: Json
          question: string
          semester: string | null
          subject: string
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          answer: number
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          explanation?: string | null
          id?: string
          options: Json
          question: string
          semester?: string | null
          subject: string
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: number
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          semester?: string | null
          subject?: string
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      remembered_devices: {
        Row: {
          created_at: string | null
          device_id: string
          id: string
          last_used: string | null
          user_email: string
        }
        Insert: {
          created_at?: string | null
          device_id: string
          id?: string
          last_used?: string | null
          user_email: string
        }
        Update: {
          created_at?: string | null
          device_id?: string
          id?: string
          last_used?: string | null
          user_email?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          department: string
          email: string | null
          full_name: string | null
          id: string
          joined_at: string | null
          name: string
          password: string | null
          position: string
          profile_image_url: string | null
          salary: number | null
          user_id: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          department: string
          email?: string | null
          full_name?: string | null
          id: string
          joined_at?: string | null
          name: string
          password?: string | null
          position: string
          profile_image_url?: string | null
          salary?: number | null
          user_id?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          department?: string
          email?: string | null
          full_name?: string | null
          id?: string
          joined_at?: string | null
          name?: string
          password?: string | null
          position?: string
          profile_image_url?: string | null
          salary?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          completed_at: string | null
          id: string
          participant_email: string | null
          participant_name: string | null
          score: number
          test_id: string | null
          time_taken: number | null
          total_questions: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          participant_email?: string | null
          participant_name?: string | null
          score?: number
          test_id?: string | null
          time_taken?: number | null
          total_questions: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          participant_email?: string | null
          participant_name?: string | null
          score?: number
          test_id?: string | null
          time_taken?: number | null
          total_questions?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          answer: number
          created_at: string | null
          difficulty: string | null
          explanation: string | null
          id: string
          options: Json
          question: string
          semester: string | null
          subject: string | null
          test_id: string | null
          updated_at: string | null
        }
        Insert: {
          answer: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options: Json
          question: string
          semester?: string | null
          subject?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Update: {
          answer?: number
          created_at?: string | null
          difficulty?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          question?: string
          semester?: string | null
          subject?: string | null
          test_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "custom_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          admin_reply: string | null
          comment: string | null
          created_at: string | null
          creator_id: string | null
          difficulty: string | null
          id: string
          is_reply_read: boolean | null
          score: number
          semester: string | null
          subject: string
          test_id: string | null
          updated_at: string | null
          user_email: string | null
        }
        Insert: {
          admin_reply?: string | null
          comment?: string | null
          created_at?: string | null
          creator_id?: string | null
          difficulty?: string | null
          id?: string
          is_reply_read?: boolean | null
          score: number
          semester?: string | null
          subject: string
          test_id?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Update: {
          admin_reply?: string | null
          comment?: string | null
          created_at?: string | null
          creator_id?: string | null
          difficulty?: string | null
          id?: string
          is_reply_read?: boolean | null
          score?: number
          semester?: string | null
          subject?: string
          test_id?: string | null
          updated_at?: string | null
          user_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "custom_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_session_results: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          participant_email: string | null
          participant_name: string | null
          score: number | null
          session_id: string
          started_at: string | null
          time_spent: number | null
          total_questions: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          participant_email?: string | null
          participant_name?: string | null
          score?: number | null
          session_id: string
          started_at?: string | null
          time_spent?: number | null
          total_questions?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          participant_email?: string | null
          participant_name?: string | null
          score?: number | null
          session_id?: string
          started_at?: string | null
          time_spent?: number | null
          total_questions?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_session_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "test_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sessions: {
        Row: {
          access_code: string | null
          created_at: string | null
          creator_id: string
          description: string | null
          difficulty: Database["public"]["Enums"]["question_difficulty"] | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          name: string
          question_count: number | null
          selected_questions: Json | null
          test_id: string
          time_limit: number | null
          updated_at: string | null
        }
        Insert: {
          access_code?: string | null
          created_at?: string | null
          creator_id: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name: string
          question_count?: number | null
          selected_questions?: Json | null
          test_id: string
          time_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          access_code?: string | null
          created_at?: string | null
          creator_id?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["question_difficulty"] | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          name?: string
          question_count?: number | null
          selected_questions?: Json | null
          test_id?: string
          time_limit?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "custom_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          activities: Json | null
          created_at: string | null
          email: string | null
          id: string
          points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activities?: Json | null
          created_at?: string | null
          email?: string | null
          id: string
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activities?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_questions: {
        Row: {
          created_at: string
          id: string
          question_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          created_at: string | null
          id: string
          points_earned: number | null
          referred_email: string | null
          referred_name: string | null
          referrer_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          points_earned?: number | null
          referred_email?: string | null
          referred_name?: string | null
          referrer_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          points_earned?: number | null
          referred_email?: string | null
          referred_name?: string | null
          referrer_id?: string | null
          status?: string | null
          updated_at?: string | null
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
      user_test_questions: {
        Row: {
          answer: number
          created_at: string | null
          explanation: string | null
          id: string
          options: Json
          question_text: string
          subject: string | null
          test_id: string | null
        }
        Insert: {
          answer: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          options: Json
          question_text: string
          subject?: string | null
          test_id?: string | null
        }
        Update: {
          answer?: number
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json
          question_text?: string
          subject?: string | null
          test_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_tests: {
        Row: {
          created_at: string | null
          creator_id: string
          description: string | null
          difficulty: Database["public"]["Enums"]["test_difficulty"] | null
          id: string
          question_count: number
          results_visibility: string
          share_code: string | null
          subject: string
          time_limit: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_id: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["test_difficulty"] | null
          id?: string
          question_count: number
          results_visibility?: string
          share_code?: string | null
          subject: string
          time_limit?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_id?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["test_difficulty"] | null
          id?: string
          question_count?: number
          results_visibility?: string
          share_code?: string | null
          subject?: string
          time_limit?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_if_table_exists: {
        Args: {
          table_name: string
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          p_user_email: string
          p_title: string
          p_message: string
          p_type: string
        }
        Returns: string
      }
      dblink: {
        Args: {
          "": string
        }
        Returns: Record<string, unknown>[]
      }
      dblink_cancel_query: {
        Args: {
          "": string
        }
        Returns: string
      }
      dblink_close: {
        Args: {
          "": string
        }
        Returns: string
      }
      dblink_connect: {
        Args: {
          "": string
        }
        Returns: string
      }
      dblink_connect_u: {
        Args: {
          "": string
        }
        Returns: string
      }
      dblink_current_query: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      dblink_disconnect:
        | {
            Args: Record<PropertyKey, never>
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
      dblink_error_message: {
        Args: {
          "": string
        }
        Returns: string
      }
      dblink_exec: {
        Args: {
          "": string
        }
        Returns: string
      }
      dblink_fdw_validator: {
        Args: {
          options: string[]
          catalog: unknown
        }
        Returns: undefined
      }
      dblink_get_connections: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      dblink_get_notify:
        | {
            Args: Record<PropertyKey, never>
            Returns: Record<string, unknown>[]
          }
        | {
            Args: {
              conname: string
            }
            Returns: Record<string, unknown>[]
          }
      dblink_get_pkey: {
        Args: {
          "": string
        }
        Returns: Database["public"]["CompositeTypes"]["dblink_pkey_results"][]
      }
      dblink_get_result: {
        Args: {
          "": string
        }
        Returns: Record<string, unknown>[]
      }
      dblink_is_busy: {
        Args: {
          "": string
        }
        Returns: number
      }
      generate_share_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_new_questions: {
        Args: {
          p_user_id: string
          p_subject: string
        }
        Returns: {
          id: string
          subject: string
          question: string
          options: Json
          answer: number
          difficulty: Database["public"]["Enums"]["question_difficulty"]
        }[]
      }
      get_new_static_questions: {
        Args: {
          p_user_id: string
          p_subject: string
        }
        Returns: {
          id: string
          subject: string
          question: string
          options: Json
          answer: number
          difficulty: Database["public"]["Enums"]["question_difficulty"]
        }[]
      }
      get_subjects_from_questions: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          question_count: number
        }[]
      }
      has_role: {
        Args: {
          user_id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      register_investor: {
        Args: {
          p_email: string
          p_password: string
          p_name: string
          p_initial_investment: number
          p_current_value: number
          p_roi: number
        }
        Returns: undefined
      }
      test_ai_chat_function: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      anatomy_question_category:
        | "musculoskeletal"
        | "cardiovascular"
        | "respiratory"
        | "nervous"
        | "digestive"
        | "endocrine"
        | "reproductive"
        | "urinary"
        | "lymphatic"
        | "integumentary"
      app_role: "admin" | "moderator" | "user"
      order_status: "pending" | "paid" | "shipped" | "delivered" | "cancelled"
      product_condition: "new" | "like_new" | "good" | "fair" | "poor"
      question_difficulty: "beginner" | "intermediate" | "advanced"
      test_difficulty: "beginner" | "intermediate" | "advanced"
    }
    CompositeTypes: {
      dblink_pkey_results: {
        position: number | null
        colname: string | null
      }
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
