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
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          target_resource_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          target_resource_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          target_resource_id?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_tutor_chats: {
        Row: {
          created_at: string | null
          id: string
          messages: Json
          subject: string
          topic: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          messages?: Json
          subject: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          messages?: Json
          subject?: string
          topic?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      blog_article_comments: {
        Row: {
          article_id: string | null
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          reactions: Json | null
          updated_at: string | null
          user_email: string
        }
        Insert: {
          article_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          reactions?: Json | null
          updated_at?: string | null
          user_email: string
        }
        Update: {
          article_id?: string | null
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
            foreignKeyName: "blog_article_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_article_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "blog_article_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_articles: {
        Row: {
          author_name: string | null
          category: string
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          published: boolean | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category: string
          content: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          slug?: string | null
          title?: string
          updated_at?: string
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
      challenge_answers: {
        Row: {
          answered_at: string
          challenge_id: string
          id: string
          is_correct: boolean
          question_index: number
          selected_answer: number
          user_id: string
        }
        Insert: {
          answered_at?: string
          challenge_id: string
          id?: string
          is_correct: boolean
          question_index: number
          selected_answer: number
          user_id: string
        }
        Update: {
          answered_at?: string
          challenge_id?: string
          id?: string
          is_correct?: boolean
          question_index?: number
          selected_answer?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_answers_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "streak_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
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
      documents: {
        Row: {
          created_at: string | null
          file_size: number
          file_type: string
          filename: string
          id: string
          original_filename: string
          storage_path: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_size: number
          file_type: string
          filename: string
          id?: string
          original_filename: string
          storage_path: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          original_filename?: string
          storage_path?: string
          updated_at?: string | null
          user_id?: string
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
          link: string | null
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
          link?: string | null
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
          link?: string | null
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
      participant_results: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          participant_email: string
          participant_name: string | null
          score: number
          test_id: string | null
          total_questions: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          participant_email: string
          participant_name?: string | null
          score: number
          test_id?: string | null
          total_questions?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          participant_email?: string
          participant_name?: string | null
          score?: number
          test_id?: string | null
          total_questions?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "user_tests"
            referencedColumns: ["id"]
          },
        ]
      }
      past_questions: {
        Row: {
          created_at: string
          exam_type: string
          file_size: number
          file_url: string
          id: string
          school: string
          subject: string
          title: string
          updated_at: string
          uploaded_by: string | null
          year: string
        }
        Insert: {
          created_at?: string
          exam_type: string
          file_size?: number
          file_url: string
          id?: string
          school: string
          subject: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          year: string
        }
        Update: {
          created_at?: string
          exam_type?: string
          file_size?: number
          file_url?: string
          id?: string
          school?: string
          subject?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          year?: string
        }
        Relationships: []
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
      streak_challenges: {
        Row: {
          completed_at: string | null
          created_at: string
          difficulty: string
          duration_seconds: number
          expires_at: string | null
          host_finished: boolean | null
          host_id: string
          host_score: number | null
          id: string
          is_draw: boolean | null
          opponent_finished: boolean | null
          opponent_id: string | null
          opponent_score: number | null
          questions: Json | null
          share_code: string | null
          started_at: string | null
          status: string
          subject: string
          winner_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          duration_seconds: number
          expires_at?: string | null
          host_finished?: boolean | null
          host_id: string
          host_score?: number | null
          id?: string
          is_draw?: boolean | null
          opponent_finished?: boolean | null
          opponent_id?: string | null
          opponent_score?: number | null
          questions?: Json | null
          share_code?: string | null
          started_at?: string | null
          status?: string
          subject: string
          winner_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          difficulty?: string
          duration_seconds?: number
          expires_at?: string | null
          host_finished?: boolean | null
          host_id?: string
          host_score?: number | null
          id?: string
          is_draw?: boolean | null
          opponent_finished?: boolean | null
          opponent_id?: string | null
          opponent_score?: number | null
          questions?: Json | null
          share_code?: string | null
          started_at?: string | null
          status?: string
          subject?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          completed_at: string | null
          disqualified: boolean | null
          id: string
          participant_email: string | null
          participant_name: string | null
          score: number
          subject: string | null
          test_id: string | null
          time_taken: number | null
          total_questions: number
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          disqualified?: boolean | null
          id?: string
          participant_email?: string | null
          participant_name?: string | null
          score?: number
          subject?: string | null
          test_id?: string | null
          time_taken?: number | null
          total_questions: number
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          disqualified?: boolean | null
          id?: string
          participant_email?: string | null
          participant_name?: string | null
          score?: number
          subject?: string | null
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
            referencedRelation: "user_tests"
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
      tutorial_comment_reactions: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          reaction_type: string
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          reaction_type: string
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          reaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "tutorial_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorial_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          reactions: Json | null
          tutorial_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          reactions?: Json | null
          tutorial_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          reactions?: Json | null
          tutorial_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutorial_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tutorial_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutorial_comments_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
      }
      tutorials: {
        Row: {
          created_at: string | null
          description: string
          duration: string
          duration_seconds: number | null
          id: string
          inventory_count: number | null
          level: string
          preview_url: string | null
          price: number
          subject: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          duration: string
          duration_seconds?: number | null
          id?: string
          inventory_count?: number | null
          level: string
          preview_url?: string | null
          price: number
          subject: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          duration?: string
          duration_seconds?: number | null
          id?: string
          inventory_count?: number | null
          level?: string
          preview_url?: string | null
          price?: number
          subject?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      user_bans: {
        Row: {
          banned_at: string | null
          banned_by: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          reason: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          banned_at?: string | null
          banned_by: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          banned_at?: string | null
          banned_by?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          reason?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_challenge_stats: {
        Row: {
          created_at: string
          current_streak: number
          highest_streak: number
          id: string
          last_challenge_date: string | null
          total_challenges: number
          total_wins: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          highest_streak?: number
          id?: string
          last_challenge_date?: string | null
          total_challenges?: number
          total_wins?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          highest_streak?: number
          id?: string
          last_challenge_date?: string | null
          total_challenges?: number
          total_wins?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feature_access: {
        Row: {
          access_count: number | null
          created_at: string
          expires_at: string | null
          feature_type: string
          id: string
          unlimited_access: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          expires_at?: string | null
          feature_type: string
          id?: string
          unlimited_access?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_count?: number | null
          created_at?: string
          expires_at?: string | null
          feature_type?: string
          id?: string
          unlimited_access?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          payment_type: string
          region: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_type: string
          region?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          payment_type?: string
          region?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          activities: Json | null
          created_at: string | null
          email: string | null
          id: string
          is_verified: boolean | null
          points: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activities?: Json | null
          created_at?: string | null
          email?: string | null
          id: string
          is_verified?: boolean | null
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activities?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_verified?: boolean | null
          points?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          payment_reference: string | null
          purchased_at: string | null
          status: string | null
          tutorial_id: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          payment_reference?: string | null
          purchased_at?: string | null
          status?: string | null
          tutorial_id?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          payment_reference?: string | null
          purchased_at?: string | null
          status?: string | null
          tutorial_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_tutorial_id_fkey"
            columns: ["tutorial_id"]
            isOneToOne: false
            referencedRelation: "tutorials"
            referencedColumns: ["id"]
          },
        ]
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
      user_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string
          id: string
          points: number
          status: string
          task_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          points: number
          status?: string
          task_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          points?: number
          status?: string
          task_type?: string
          updated_at?: string
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
          allow_retakes: boolean | null
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
          allow_retakes?: boolean | null
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
          allow_retakes?: boolean | null
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
      user_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_user_view: {
        Row: {
          activities: Json | null
          created_at: string | null
          email: string | null
          id: string | null
          is_verified: boolean | null
          points: number | null
          role: Database["public"]["Enums"]["app_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      ban_user: {
        Args: { expires_at?: string; reason: string; target_user_id: string }
        Returns: string
      }
      check_if_table_exists: { Args: { table_name: string }; Returns: boolean }
      create_notification: {
        Args: {
          p_message: string
          p_title: string
          p_type: string
          p_user_email: string
        }
        Returns: string
      }
      dblink: { Args: { "": string }; Returns: Record<string, unknown>[] }
      dblink_cancel_query: { Args: { "": string }; Returns: string }
      dblink_close: { Args: { "": string }; Returns: string }
      dblink_connect: { Args: { "": string }; Returns: string }
      dblink_connect_u: { Args: { "": string }; Returns: string }
      dblink_current_query: { Args: never; Returns: string }
      dblink_disconnect:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      dblink_error_message: { Args: { "": string }; Returns: string }
      dblink_exec: { Args: { "": string }; Returns: string }
      dblink_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      dblink_get_connections: { Args: never; Returns: string[] }
      dblink_get_notify:
        | { Args: { conname: string }; Returns: Record<string, unknown>[] }
        | { Args: never; Returns: Record<string, unknown>[] }
      dblink_get_pkey: {
        Args: { "": string }
        Returns: Database["public"]["CompositeTypes"]["dblink_pkey_results"][]
        SetofOptions: {
          from: "*"
          to: "dblink_pkey_results"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      dblink_get_result: {
        Args: { "": string }
        Returns: Record<string, unknown>[]
      }
      dblink_is_busy: { Args: { "": string }; Returns: number }
      generate_share_code: { Args: never; Returns: string }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_new_questions: {
        Args: { p_subject: string; p_user_id: string }
        Returns: {
          answer: number
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          id: string
          options: Json
          question: string
          subject: string
        }[]
      }
      get_new_static_questions: {
        Args: { p_subject: string; p_user_id: string }
        Returns: {
          answer: number
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          id: string
          options: Json
          question: string
          subject: string
        }[]
      }
      get_public_results: {
        Args: never
        Returns: {
          created_at: string
          participant_email: string
          score: number
        }[]
      }
      get_realtime_status: { Args: { table_name: string }; Returns: boolean }
      get_subjects_from_questions: {
        Args: never
        Returns: {
          name: string
          question_count: number
        }[]
      }
      get_test_leaderboard: {
        Args: { test_id: string }
        Returns: {
          completed_at: string
          participant_email: string
          participant_name: string
          percentage: number
          score: number
          total_questions: number
        }[]
      }
      get_top_tests: {
        Args: { limit_count?: number }
        Returns: {
          count: number
          test_id: string
        }[]
      }
      get_user_activity_summary: {
        Args: never
        Returns: {
          recent_signups: number
          total_points: number
          total_users: number
          verified_users: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_user_banned: { Args: { user_id: string }; Returns: boolean }
      register_investor: {
        Args: {
          p_current_value: number
          p_email: string
          p_initial_investment: number
          p_name: string
          p_password: string
          p_roi: number
        }
        Returns: undefined
      }
      send_admin_notification: {
        Args: {
          notification_message: string
          notification_title: string
          notification_type?: string
          target_user_email: string
        }
        Returns: string
      }
      test_ai_chat_function: { Args: never; Returns: undefined }
      unban_user: { Args: { target_user_id: string }; Returns: boolean }
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
      app_role: "admin" | "moderator" | "user" | "educator" | "superadmin"
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
      anatomy_question_category: [
        "musculoskeletal",
        "cardiovascular",
        "respiratory",
        "nervous",
        "digestive",
        "endocrine",
        "reproductive",
        "urinary",
        "lymphatic",
        "integumentary",
      ],
      app_role: ["admin", "moderator", "user", "educator", "superadmin"],
      order_status: ["pending", "paid", "shipped", "delivered", "cancelled"],
      product_condition: ["new", "like_new", "good", "fair", "poor"],
      question_difficulty: ["beginner", "intermediate", "advanced"],
      test_difficulty: ["beginner", "intermediate", "advanced"],
    },
  },
} as const
