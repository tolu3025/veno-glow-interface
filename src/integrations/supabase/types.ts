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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json
          target_id: string | null
          target_table: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json
          target_id?: string | null
          target_table?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ajo_contributions: {
        Row: {
          amount: number
          created_at: string
          cycle_number: number
          due_date: string
          group_id: string
          id: string
          late_fee: number
          member_id: string
          paid_at: string | null
          status: Database["public"]["Enums"]["ajo_contribution_status"]
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          cycle_number: number
          due_date: string
          group_id: string
          id?: string
          late_fee?: number
          member_id: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["ajo_contribution_status"]
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          cycle_number?: number
          due_date?: string
          group_id?: string
          id?: string
          late_fee?: number
          member_id?: string
          paid_at?: string | null
          status?: Database["public"]["Enums"]["ajo_contribution_status"]
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ajo_contributions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ajo_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajo_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "ajo_members"
            referencedColumns: ["id"]
          },
        ]
      }
      ajo_disbursements: {
        Row: {
          amount: number
          created_at: string
          cycle_number: number
          disbursed_at: string | null
          group_id: string
          id: string
          recipient_member_id: string
          transaction_reference: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          cycle_number: number
          disbursed_at?: string | null
          group_id: string
          id?: string
          recipient_member_id: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          cycle_number?: number
          disbursed_at?: string | null
          group_id?: string
          id?: string
          recipient_member_id?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ajo_disbursements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ajo_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajo_disbursements_recipient_member_id_fkey"
            columns: ["recipient_member_id"]
            isOneToOne: false
            referencedRelation: "ajo_members"
            referencedColumns: ["id"]
          },
        ]
      }
      ajo_groups: {
        Row: {
          contribution_amount: number
          created_at: string
          creator_id: string
          current_cycle: number
          description: string | null
          filled_slots: number
          frequency: Database["public"]["Enums"]["ajo_frequency"]
          id: string
          image_url: string | null
          is_public: boolean
          late_fee_percent: number
          max_missed: number
          min_kyc_level: number
          order_type: Database["public"]["Enums"]["ajo_order_type"]
          start_date: string | null
          status: Database["public"]["Enums"]["ajo_status"]
          title: string
          total_slots: number
          updated_at: string
        }
        Insert: {
          contribution_amount: number
          created_at?: string
          creator_id: string
          current_cycle?: number
          description?: string | null
          filled_slots?: number
          frequency?: Database["public"]["Enums"]["ajo_frequency"]
          id?: string
          image_url?: string | null
          is_public?: boolean
          late_fee_percent?: number
          max_missed?: number
          min_kyc_level?: number
          order_type?: Database["public"]["Enums"]["ajo_order_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["ajo_status"]
          title: string
          total_slots: number
          updated_at?: string
        }
        Update: {
          contribution_amount?: number
          created_at?: string
          creator_id?: string
          current_cycle?: number
          description?: string | null
          filled_slots?: number
          frequency?: Database["public"]["Enums"]["ajo_frequency"]
          id?: string
          image_url?: string | null
          is_public?: boolean
          late_fee_percent?: number
          max_missed?: number
          min_kyc_level?: number
          order_type?: Database["public"]["Enums"]["ajo_order_type"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["ajo_status"]
          title?: string
          total_slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      ajo_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          missed_count: number
          position: number
          status: Database["public"]["Enums"]["ajo_member_status"]
          total_collected: number
          total_contributed: number
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          missed_count?: number
          position: number
          status?: Database["public"]["Enums"]["ajo_member_status"]
          total_collected?: number
          total_contributed?: number
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          missed_count?: number
          position?: number
          status?: Database["public"]["Enums"]["ajo_member_status"]
          total_collected?: number
          total_contributed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ajo_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "ajo_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ajo_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_case_notes: {
        Row: {
          author_id: string
          body: string
          case_id: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          case_id: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          case_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "audit_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_cases: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          id: string
          linked_evidence: Json
          severity: string
          status: string
          subject_user_id: string | null
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          linked_evidence?: Json
          severity?: string
          status?: string
          subject_user_id?: string | null
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          linked_evidence?: Json
          severity?: string
          status?: string
          subject_user_id?: string | null
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_cases_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          created_at: string
          generated_by: string
          id: string
          payload: Json
          range_from: string
          range_to: string
          report_type: string
        }
        Insert: {
          created_at?: string
          generated_by: string
          id?: string
          payload?: Json
          range_from: string
          range_to: string
          report_type: string
        }
        Update: {
          created_at?: string
          generated_by?: string
          id?: string
          payload?: Json
          range_from?: string
          range_to?: string
          report_type?: string
        }
        Relationships: []
      }
      bill_transactions: {
        Row: {
          amount: number
          bill_type: string
          created_at: string
          id: string
          metadata: Json
          network: string
          phone: string
          plan_code: string | null
          plan_name: string | null
          provider: string
          provider_ref: string | null
          reference: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          bill_type: string
          created_at?: string
          id?: string
          metadata?: Json
          network: string
          phone: string
          plan_code?: string | null
          plan_name?: string | null
          provider: string
          provider_ref?: string | null
          reference: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          bill_type?: string
          created_at?: string
          id?: string
          metadata?: Json
          network?: string
          phone?: string
          plan_code?: string | null
          plan_name?: string | null
          provider?: string
          provider_ref?: string | null
          reference?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campus_matric_patterns: {
        Row: {
          campus_id: string
          created_at: string
          example: string
          id: string
          pattern_regex: string
          updated_at: string
        }
        Insert: {
          campus_id: string
          created_at?: string
          example: string
          id?: string
          pattern_regex: string
          updated_at?: string
        }
        Update: {
          campus_id?: string
          created_at?: string
          example?: string
          id?: string
          pattern_regex?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campus_matric_patterns_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: true
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      campus_submissions: {
        Row: {
          admin_notes: string | null
          approved_campus_id: string | null
          city: string | null
          contact_email: string | null
          created_at: string
          id: string
          justification: string | null
          merchant_id: string
          name: string
          reviewed_at: string | null
          reviewed_by: string | null
          state: string | null
          status: string
          submitted_by: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          approved_campus_id?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          merchant_id: string
          name: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          submitted_by: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          approved_campus_id?: string | null
          city?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          justification?: string | null
          merchant_id?: string
          name?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string | null
          status?: string
          submitted_by?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campus_submissions_approved_campus_id_fkey"
            columns: ["approved_campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campus_submissions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          aliases: string[]
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string | null
          updated_at: string
        }
        Insert: {
          aliases?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          aliases?: string[]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      collection_payments: {
        Row: {
          amount: number
          claimed_at: string | null
          collection_id: string
          created_at: string
          id: string
          matched_at: string | null
          payer_matric_number: string | null
          payer_name: string
          payer_phone: string | null
          status: Database["public"]["Enums"]["collection_payment_status"]
          transaction_reference: string | null
          webhook_verified: boolean
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          collection_id: string
          created_at?: string
          id?: string
          matched_at?: string | null
          payer_matric_number?: string | null
          payer_name: string
          payer_phone?: string | null
          status?: Database["public"]["Enums"]["collection_payment_status"]
          transaction_reference?: string | null
          webhook_verified?: boolean
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          collection_id?: string
          created_at?: string
          id?: string
          matched_at?: string | null
          payer_matric_number?: string | null
          payer_name?: string
          payer_phone?: string | null
          status?: Database["public"]["Enums"]["collection_payment_status"]
          transaction_reference?: string | null
          webhook_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "collection_payments_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          amount_per_person: number | null
          bonus_paid: number
          bonus_pending: number
          bonus_status: string
          category: string | null
          created_at: string
          creator_id: string
          deadline: string | null
          description: string | null
          flutterwave_reference: string | null
          id: string
          participant_count: number
          previous_virtual_account_number: string | null
          require_matric: boolean
          status: Database["public"]["Enums"]["collection_status"]
          target_amount: number
          title: string
          total_collected: number
          virtual_account_name: string | null
          virtual_account_number: string | null
          virtual_bank_name: string | null
        }
        Insert: {
          amount_per_person?: number | null
          bonus_paid?: number
          bonus_pending?: number
          bonus_status?: string
          category?: string | null
          created_at?: string
          creator_id: string
          deadline?: string | null
          description?: string | null
          flutterwave_reference?: string | null
          id?: string
          participant_count?: number
          previous_virtual_account_number?: string | null
          require_matric?: boolean
          status?: Database["public"]["Enums"]["collection_status"]
          target_amount: number
          title: string
          total_collected?: number
          virtual_account_name?: string | null
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
        }
        Update: {
          amount_per_person?: number | null
          bonus_paid?: number
          bonus_pending?: number
          bonus_status?: string
          category?: string | null
          created_at?: string
          creator_id?: string
          deadline?: string | null
          description?: string | null
          flutterwave_reference?: string | null
          id?: string
          participant_count?: number
          previous_virtual_account_number?: string | null
          require_matric?: boolean
          status?: Database["public"]["Enums"]["collection_status"]
          target_amount?: number
          title?: string
          total_collected?: number
          virtual_account_name?: string | null
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
        }
        Relationships: []
      }
      commission_logs: {
        Row: {
          commission_amount: number
          commission_rate: number
          commission_type: string
          created_at: string
          id: string
          transaction_amount: number
          transaction_reference: string
          user_id: string
        }
        Insert: {
          commission_amount?: number
          commission_rate?: number
          commission_type: string
          created_at?: string
          id?: string
          transaction_amount?: number
          transaction_reference: string
          user_id: string
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          commission_type?: string
          created_at?: string
          id?: string
          transaction_amount?: number
          transaction_reference?: string
          user_id?: string
        }
        Relationships: []
      }
      crypto_deposits: {
        Row: {
          amount_usd: number | null
          asset_id: string
          asset_identifier: string
          asset_name: string
          asset_symbol: string
          breet_trade_id: string | null
          breet_wallet_id: string
          confirmations: number | null
          created_at: string
          credited_at: string | null
          crypto_amount: number | null
          deposit_address: string
          email_sent_at: string | null
          id: string
          label: string
          last_event: string | null
          minimum_ngn: number | null
          network: string
          ngn_credited: number | null
          rate_ngn_at_creation: number | null
          rate_used: number | null
          raw_payload: Json | null
          status: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_usd?: number | null
          asset_id: string
          asset_identifier: string
          asset_name: string
          asset_symbol: string
          breet_trade_id?: string | null
          breet_wallet_id: string
          confirmations?: number | null
          created_at?: string
          credited_at?: string | null
          crypto_amount?: number | null
          deposit_address: string
          email_sent_at?: string | null
          id?: string
          label: string
          last_event?: string | null
          minimum_ngn?: number | null
          network: string
          ngn_credited?: number | null
          rate_ngn_at_creation?: number | null
          rate_used?: number | null
          raw_payload?: Json | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_usd?: number | null
          asset_id?: string
          asset_identifier?: string
          asset_name?: string
          asset_symbol?: string
          breet_trade_id?: string | null
          breet_wallet_id?: string
          confirmations?: number | null
          created_at?: string
          credited_at?: string | null
          crypto_amount?: number | null
          deposit_address?: string
          email_sent_at?: string | null
          id?: string
          label?: string
          last_event?: string | null
          minimum_ngn?: number | null
          network?: string
          ngn_credited?: number | null
          rate_ngn_at_creation?: number | null
          rate_used?: number | null
          raw_payload?: Json | null
          status?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          device_name: string | null
          fingerprint: string
          first_seen_at: string
          id: string
          is_trusted: boolean
          last_seen_at: string
          user_id: string
        }
        Insert: {
          device_name?: string | null
          fingerprint: string
          first_seen_at?: string
          id?: string
          is_trusted?: boolean
          last_seen_at?: string
          user_id: string
        }
        Update: {
          device_name?: string | null
          fingerprint?: string
          first_seen_at?: string
          id?: string
          is_trusted?: boolean
          last_seen_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dollar_lock_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lock_id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lock_id: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lock_id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dollar_lock_events_lock_id_fkey"
            columns: ["lock_id"]
            isOneToOne: false
            referencedRelation: "dollar_locks"
            referencedColumns: ["id"]
          },
        ]
      }
      dollar_locks: {
        Row: {
          broken_at: string | null
          challenge_name: string
          created_at: string
          id: string
          lock_days: number
          mature_at: string
          matured_at: string | null
          penalty_applied: boolean
          penalty_usd: number
          principal_usd: number
          reminded_24h: boolean
          start_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          broken_at?: string | null
          challenge_name: string
          created_at?: string
          id?: string
          lock_days: number
          mature_at: string
          matured_at?: string | null
          penalty_applied?: boolean
          penalty_usd?: number
          principal_usd: number
          reminded_24h?: boolean
          start_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          broken_at?: string | null
          challenge_name?: string
          created_at?: string
          id?: string
          lock_days?: number
          mature_at?: string
          matured_at?: string | null
          penalty_applied?: boolean
          penalty_usd?: number
          principal_usd?: number
          reminded_24h?: boolean
          start_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      errand_assignments: {
        Row: {
          admin_resolved: boolean
          amount_held: number
          completed_at: string | null
          created_at: string
          dispute_flag: boolean
          errand_id: string
          helper_id: string
          id: string
          status: Database["public"]["Enums"]["errand_assignment_status"]
        }
        Insert: {
          admin_resolved?: boolean
          amount_held?: number
          completed_at?: string | null
          created_at?: string
          dispute_flag?: boolean
          errand_id: string
          helper_id: string
          id?: string
          status?: Database["public"]["Enums"]["errand_assignment_status"]
        }
        Update: {
          admin_resolved?: boolean
          amount_held?: number
          completed_at?: string | null
          created_at?: string
          dispute_flag?: boolean
          errand_id?: string
          helper_id?: string
          id?: string
          status?: Database["public"]["Enums"]["errand_assignment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "errand_assignments_errand_id_fkey"
            columns: ["errand_id"]
            isOneToOne: false
            referencedRelation: "errand_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      errand_requests: {
        Row: {
          accepted_at: string | null
          amount: number
          campus_id: string | null
          completed_at: string | null
          created_at: string
          delivery_deadline: string | null
          delivery_fee: number
          delivery_lat: number | null
          delivery_lng: number | null
          description: string | null
          errand_type: string
          estimated_minutes: number | null
          helper_id: string | null
          helper_lat: number | null
          helper_lng: number | null
          id: string
          is_delayed: boolean
          item_cost: number
          location_updated_at: string | null
          merchant_id: string | null
          merchant_order_id: string | null
          requester_id: string
          requester_lat: number | null
          requester_lng: number | null
          status: Database["public"]["Enums"]["errand_status"]
          title: string
          urgency: string
          zone: string | null
        }
        Insert: {
          accepted_at?: string | null
          amount: number
          campus_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_deadline?: string | null
          delivery_fee?: number
          delivery_lat?: number | null
          delivery_lng?: number | null
          description?: string | null
          errand_type?: string
          estimated_minutes?: number | null
          helper_id?: string | null
          helper_lat?: number | null
          helper_lng?: number | null
          id?: string
          is_delayed?: boolean
          item_cost?: number
          location_updated_at?: string | null
          merchant_id?: string | null
          merchant_order_id?: string | null
          requester_id: string
          requester_lat?: number | null
          requester_lng?: number | null
          status?: Database["public"]["Enums"]["errand_status"]
          title: string
          urgency?: string
          zone?: string | null
        }
        Update: {
          accepted_at?: string | null
          amount?: number
          campus_id?: string | null
          completed_at?: string | null
          created_at?: string
          delivery_deadline?: string | null
          delivery_fee?: number
          delivery_lat?: number | null
          delivery_lng?: number | null
          description?: string | null
          errand_type?: string
          estimated_minutes?: number | null
          helper_id?: string | null
          helper_lat?: number | null
          helper_lng?: number | null
          id?: string
          is_delayed?: boolean
          item_cost?: number
          location_updated_at?: string | null
          merchant_id?: string | null
          merchant_order_id?: string | null
          requester_id?: string
          requester_lat?: number | null
          requester_lng?: number | null
          status?: Database["public"]["Enums"]["errand_status"]
          title?: string
          urgency?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "errand_requests_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      errand_zones: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          lat: number | null
          lng: number | null
          name: string
          radius_meters: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          radius_meters?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          radius_meters?: number | null
        }
        Relationships: []
      }
      event_outbox: {
        Row: {
          aggregate_id: string | null
          attempts: number
          available_at: string
          created_at: string
          event_type: string
          id: string
          last_error: string | null
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          aggregate_id?: string | null
          attempts?: number
          available_at?: string
          created_at?: string
          event_type: string
          id?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          aggregate_id?: string | null
          attempts?: number
          available_at?: string
          created_at?: string
          event_type?: string
          id?: string
          last_error?: string | null
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          category: string
          created_at: string
          description: string | null
          end_date: string | null
          event_date: string
          flutterwave_reference: string | null
          id: string
          image_url: string | null
          min_kyc_level: number
          organizer_id: string
          settlement_account_name: string | null
          settlement_account_number: string | null
          settlement_bank_name: string | null
          settlement_status: string
          status: string
          title: string
          total_revenue: number
          total_tickets_sold: number
          updated_at: string
          venue: string
          virtual_account_number: string | null
          virtual_bank_name: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date: string
          flutterwave_reference?: string | null
          id?: string
          image_url?: string | null
          min_kyc_level?: number
          organizer_id: string
          settlement_account_name?: string | null
          settlement_account_number?: string | null
          settlement_bank_name?: string | null
          settlement_status?: string
          status?: string
          title: string
          total_revenue?: number
          total_tickets_sold?: number
          updated_at?: string
          venue: string
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          end_date?: string | null
          event_date?: string
          flutterwave_reference?: string | null
          id?: string
          image_url?: string | null
          min_kyc_level?: number
          organizer_id?: string
          settlement_account_name?: string | null
          settlement_account_number?: string | null
          settlement_bank_name?: string | null
          settlement_status?: string
          status?: string
          title?: string
          total_revenue?: number
          total_tickets_sold?: number
          updated_at?: string
          venue?: string
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          description: string
          flag_type: string
          id: string
          metadata: Json | null
          resolved: boolean
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description: string
          flag_type: string
          id?: string
          metadata?: Json | null
          resolved?: boolean
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          flag_type?: string
          id?: string
          metadata?: Json | null
          resolved?: boolean
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      fx_quotes: {
        Row: {
          created_at: string
          direction: string
          expires_at: string
          id: string
          ngn_amount: number
          provider_quote_id: string | null
          rate: number
          status: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          expires_at: string
          id?: string
          ngn_amount: number
          provider_quote_id?: string | null
          rate: number
          status?: string
          usd_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          expires_at?: string
          id?: string
          ngn_amount?: number
          provider_quote_id?: string | null
          rate?: number
          status?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      idempotency_keys: {
        Row: {
          created_at: string
          entry_group_id: string | null
          id: string
          idem_key: string
          operation: string
          request_hash: string | null
          response: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entry_group_id?: string | null
          id?: string
          idem_key: string
          operation: string
          request_hash?: string | null
          response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entry_group_id?: string | null
          id?: string
          idem_key?: string
          operation?: string
          request_hash?: string | null
          response?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ip_blocklist: {
        Row: {
          blocked_until: string | null
          created_at: string
          id: string
          ip_address: string
          level: string
          reason: string | null
          strikes: number
          updated_at: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address: string
          level?: string
          reason?: string | null
          strikes?: number
          updated_at?: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          level?: string
          reason?: string | null
          strikes?: number
          updated_at?: string
        }
        Relationships: []
      }
      ip_reputation: {
        Row: {
          distinct_users: number
          failed_auth_count: number
          ip_address: string
          request_count: number
          score: number
          updated_at: string
          window_start: string
        }
        Insert: {
          distinct_users?: number
          failed_auth_count?: number
          ip_address: string
          request_count?: number
          score?: number
          updated_at?: string
          window_start?: string
        }
        Update: {
          distinct_users?: number
          failed_auth_count?: number
          ip_address?: string
          request_count?: number
          score?: number
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      kyc_documents: {
        Row: {
          address_proof_url: string | null
          address_text: string | null
          address_verified: boolean | null
          admin_notes: string | null
          bvn_number: string | null
          created_at: string
          encrypted_bvn: string | null
          encrypted_nin: string | null
          encryption_version: number | null
          extracted_name: string | null
          face_match_confidence: number | null
          id: string
          id_card_image_url: string | null
          kyc_level: number | null
          name_match: boolean | null
          nin_check_notes: string | null
          nin_image_url: string | null
          nin_number: string | null
          nin_verified: boolean | null
          nin_verified_name: string | null
          reviewed_by: string | null
          selfie_image_url: string | null
          user_id: string
          verification_status: Database["public"]["Enums"]["kyc_verification_status"]
        }
        Insert: {
          address_proof_url?: string | null
          address_text?: string | null
          address_verified?: boolean | null
          admin_notes?: string | null
          bvn_number?: string | null
          created_at?: string
          encrypted_bvn?: string | null
          encrypted_nin?: string | null
          encryption_version?: number | null
          extracted_name?: string | null
          face_match_confidence?: number | null
          id?: string
          id_card_image_url?: string | null
          kyc_level?: number | null
          name_match?: boolean | null
          nin_check_notes?: string | null
          nin_image_url?: string | null
          nin_number?: string | null
          nin_verified?: boolean | null
          nin_verified_name?: string | null
          reviewed_by?: string | null
          selfie_image_url?: string | null
          user_id: string
          verification_status?: Database["public"]["Enums"]["kyc_verification_status"]
        }
        Update: {
          address_proof_url?: string | null
          address_text?: string | null
          address_verified?: boolean | null
          admin_notes?: string | null
          bvn_number?: string | null
          created_at?: string
          encrypted_bvn?: string | null
          encrypted_nin?: string | null
          encryption_version?: number | null
          extracted_name?: string | null
          face_match_confidence?: number | null
          id?: string
          id_card_image_url?: string | null
          kyc_level?: number | null
          name_match?: boolean | null
          nin_check_notes?: string | null
          nin_image_url?: string | null
          nin_number?: string | null
          nin_verified?: boolean | null
          nin_verified_name?: string | null
          reviewed_by?: string | null
          selfie_image_url?: string | null
          user_id?: string
          verification_status?: Database["public"]["Enums"]["kyc_verification_status"]
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          attempts: number
          email: string
          last_attempt_at: string
          locked_until: string | null
          window_started_at: string
        }
        Insert: {
          attempts?: number
          email: string
          last_attempt_at?: string
          locked_until?: string | null
          window_started_at?: string
        }
        Update: {
          attempts?: number
          email?: string
          last_attempt_at?: string
          locked_until?: string | null
          window_started_at?: string
        }
        Relationships: []
      }
      maintenance_flags: {
        Row: {
          ends_at: string | null
          is_active: boolean
          message: string | null
          page_key: string
          starts_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ends_at?: string | null
          is_active?: boolean
          message?: string | null
          page_key: string
          starts_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ends_at?: string | null
          is_active?: boolean
          message?: string | null
          page_key?: string
          starts_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      merchant_delivery_zones: {
        Row: {
          created_at: string
          fee: number
          id: string
          is_active: boolean
          merchant_id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fee?: number
          id?: string
          is_active?: boolean
          merchant_id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fee?: number
          id?: string
          is_active?: boolean
          merchant_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_delivery_zones_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_orders: {
        Row: {
          created_at: string
          customer_id: string
          customer_name: string
          delivery_address: string | null
          delivery_fee: number
          delivery_location: Json | null
          delivery_method: string | null
          delivery_status: string | null
          delivery_window: Json | null
          delivery_zone_id: string | null
          delivery_zone_name: string | null
          errand_id: string | null
          escrow_held: boolean
          id: string
          items: Json
          laundry_items: Json | null
          merchant_id: string
          order_type: string
          pickup_window: Json | null
          print_file_name: string | null
          print_file_url: string | null
          print_specs: Json | null
          released_at: string | null
          service_type: string | null
          special_instructions: string | null
          status: string
          total_amount: number
          transaction_reference: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          customer_name: string
          delivery_address?: string | null
          delivery_fee?: number
          delivery_location?: Json | null
          delivery_method?: string | null
          delivery_status?: string | null
          delivery_window?: Json | null
          delivery_zone_id?: string | null
          delivery_zone_name?: string | null
          errand_id?: string | null
          escrow_held?: boolean
          id?: string
          items?: Json
          laundry_items?: Json | null
          merchant_id: string
          order_type?: string
          pickup_window?: Json | null
          print_file_name?: string | null
          print_file_url?: string | null
          print_specs?: Json | null
          released_at?: string | null
          service_type?: string | null
          special_instructions?: string | null
          status?: string
          total_amount: number
          transaction_reference?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          customer_name?: string
          delivery_address?: string | null
          delivery_fee?: number
          delivery_location?: Json | null
          delivery_method?: string | null
          delivery_status?: string | null
          delivery_window?: Json | null
          delivery_zone_id?: string | null
          delivery_zone_name?: string | null
          errand_id?: string | null
          escrow_held?: boolean
          id?: string
          items?: Json
          laundry_items?: Json | null
          merchant_id?: string
          order_type?: string
          pickup_window?: Json | null
          print_file_name?: string | null
          print_file_url?: string | null
          print_specs?: Json | null
          released_at?: string | null
          service_type?: string | null
          special_instructions?: string | null
          status?: string
          total_amount?: number
          transaction_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_orders_delivery_zone_id_fkey"
            columns: ["delivery_zone_id"]
            isOneToOne: false
            referencedRelation: "merchant_delivery_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_orders_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          merchant_id: string
          metadata: Json
          name: string
          price: number
          quantity: number
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          merchant_id: string
          metadata?: Json
          name: string
          price: number
          quantity?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          merchant_id?: string
          metadata?: Json
          name?: string
          price?: number
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_products_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_transactions: {
        Row: {
          amount: number
          commission_amount: number
          created_at: string
          customer_id: string
          id: string
          merchant_id: string
          net_amount: number
          reference: string
          status: string
        }
        Insert: {
          amount: number
          commission_amount?: number
          created_at?: string
          customer_id: string
          id?: string
          merchant_id: string
          net_amount?: number
          reference: string
          status?: string
        }
        Update: {
          amount?: number
          commission_amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          merchant_id?: string
          net_amount?: number
          reference?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_transactions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_wallets: {
        Row: {
          available_balance: number
          available_balance_kobo: number | null
          balance: number
          created_at: string
          hold_balance: number
          hold_balance_kobo: number
          id: string
          ledger_balance_kobo: number
          merchant_id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          available_balance_kobo?: number | null
          balance?: number
          created_at?: string
          hold_balance?: number
          hold_balance_kobo?: number
          id?: string
          ledger_balance_kobo?: number
          merchant_id: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          available_balance_kobo?: number | null
          balance?: number
          created_at?: string
          hold_balance?: number
          hold_balance_kobo?: number
          id?: string
          ledger_balance_kobo?: number
          merchant_id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_wallets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          auto_withdraw_enabled: boolean
          auto_withdraw_threshold_kobo: number
          business_name: string
          campus_id: string | null
          category: string
          commission_rate: number
          created_at: string
          delivery_fee: number
          description: string | null
          id: string
          is_print_shop: boolean
          latitude: number | null
          laundry_pricing: Json
          logo_url: string | null
          longitude: number | null
          offers_delivery: boolean
          printing_pricing: Json
          qr_code: string
          service_categories: string[]
          settlement_account_name: string | null
          settlement_account_number: string | null
          settlement_bank_name: string | null
          status: Database["public"]["Enums"]["merchant_status"]
          total_revenue: number
          total_transactions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_withdraw_enabled?: boolean
          auto_withdraw_threshold_kobo?: number
          business_name: string
          campus_id?: string | null
          category?: string
          commission_rate?: number
          created_at?: string
          delivery_fee?: number
          description?: string | null
          id?: string
          is_print_shop?: boolean
          latitude?: number | null
          laundry_pricing?: Json
          logo_url?: string | null
          longitude?: number | null
          offers_delivery?: boolean
          printing_pricing?: Json
          qr_code: string
          service_categories?: string[]
          settlement_account_name?: string | null
          settlement_account_number?: string | null
          settlement_bank_name?: string | null
          status?: Database["public"]["Enums"]["merchant_status"]
          total_revenue?: number
          total_transactions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_withdraw_enabled?: boolean
          auto_withdraw_threshold_kobo?: number
          business_name?: string
          campus_id?: string | null
          category?: string
          commission_rate?: number
          created_at?: string
          delivery_fee?: number
          description?: string | null
          id?: string
          is_print_shop?: boolean
          latitude?: number | null
          laundry_pricing?: Json
          logo_url?: string | null
          longitude?: number | null
          offers_delivery?: boolean
          printing_pricing?: Json
          qr_code?: string
          service_categories?: string[]
          settlement_account_name?: string | null
          settlement_account_number?: string | null
          settlement_bank_name?: string | null
          status?: Database["public"]["Enums"]["merchant_status"]
          total_revenue?: number
          total_transactions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchants_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      monnify_virtual_accounts: {
        Row: {
          account_name: string | null
          account_number: string | null
          account_reference: string
          accounts: Json
          attempted_at: string
          bank_name: string | null
          created_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          account_reference: string
          accounts?: Json
          attempted_at?: string
          bank_name?: string | null
          created_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          account_reference?: string
          accounts?: Json
          attempted_at?: string
          bank_name?: string | null
          created_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizer_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_students: number
          price_monthly: number
          started_at: string
          tier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          price_monthly?: number
          started_at?: string
          tier?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_students?: number
          price_monthly?: number
          started_at?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_otp_attempts: {
        Row: {
          action: string
          created_at: string
          id: string
          ip: string | null
          phone_e164: string | null
          reason: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip?: string | null
          phone_e164?: string | null
          reason?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip?: string | null
          phone_e164?: string | null
          reason?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      phone_otp_requests: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          otp_reference: string
          phone_number: string
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          otp_reference: string
          phone_number: string
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          otp_reference?: string
          phone_number?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          phone_e164: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          phone_e164: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone_e164?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          biometric_credential_id: string | null
          biometric_enabled: boolean
          created_at: string
          face_match_score: number | null
          failed_pin_attempts: number
          free_withdrawals_reset_at: string
          free_withdrawals_used: number
          full_name: string
          id: string
          is_suspended: boolean
          kyc_level: number
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          login_pin_hash: string | null
          matric_correction_deadline: string | null
          matric_flagged_at: string | null
          matric_number: string
          phone_e164: string | null
          phone_number: string
          phone_verified: boolean
          phone_verified_at: string | null
          pin_locked_until: string | null
          registration_completed: boolean
          suspended_reason: string | null
          terms_accepted: boolean
          terms_accepted_at: string | null
          transaction_pin_hash: string | null
          two_factor_enabled: boolean
          two_factor_method: string | null
          university: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          biometric_credential_id?: string | null
          biometric_enabled?: boolean
          created_at?: string
          face_match_score?: number | null
          failed_pin_attempts?: number
          free_withdrawals_reset_at?: string
          free_withdrawals_used?: number
          full_name: string
          id: string
          is_suspended?: boolean
          kyc_level?: number
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          login_pin_hash?: string | null
          matric_correction_deadline?: string | null
          matric_flagged_at?: string | null
          matric_number: string
          phone_e164?: string | null
          phone_number: string
          phone_verified?: boolean
          phone_verified_at?: string | null
          pin_locked_until?: string | null
          registration_completed?: boolean
          suspended_reason?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          transaction_pin_hash?: string | null
          two_factor_enabled?: boolean
          two_factor_method?: string | null
          university: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          biometric_credential_id?: string | null
          biometric_enabled?: boolean
          created_at?: string
          face_match_score?: number | null
          failed_pin_attempts?: number
          free_withdrawals_reset_at?: string
          free_withdrawals_used?: number
          full_name?: string
          id?: string
          is_suspended?: boolean
          kyc_level?: number
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          login_pin_hash?: string | null
          matric_correction_deadline?: string | null
          matric_flagged_at?: string | null
          matric_number?: string
          phone_e164?: string | null
          phone_number?: string
          phone_verified?: boolean
          phone_verified_at?: string | null
          pin_locked_until?: string | null
          registration_completed?: boolean
          suspended_reason?: string | null
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          transaction_pin_hash?: string | null
          two_factor_enabled?: boolean
          two_factor_method?: string | null
          university?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          count: number
          created_at: string
          id: string
          key: string
          window_start: string
        }
        Insert: {
          action: string
          count?: number
          created_at?: string
          id?: string
          key: string
          window_start?: string
        }
        Update: {
          action?: string
          count?: number
          created_at?: string
          id?: string
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reconciliation_flags: {
        Row: {
          actual_amount: number | null
          auto_reversed: boolean
          created_at: string
          expected_amount: number | null
          flag_type: string
          id: string
          reference: string
          user_id: string | null
        }
        Insert: {
          actual_amount?: number | null
          auto_reversed?: boolean
          created_at?: string
          expected_amount?: number | null
          flag_type: string
          id?: string
          reference: string
          user_id?: string | null
        }
        Update: {
          actual_amount?: number | null
          auto_reversed?: boolean
          created_at?: string
          expected_amount?: number | null
          flag_type?: string
          id?: string
          reference?: string
          user_id?: string | null
        }
        Relationships: []
      }
      reconciliation_runs: {
        Row: {
          checked: number
          created_at: string
          details: Json
          errors: number
          flagged: number
          id: string
          job: string
          refunded: number
          settled: number
        }
        Insert: {
          checked?: number
          created_at?: string
          details?: Json
          errors?: number
          flagged?: number
          id?: string
          job: string
          refunded?: number
          settled?: number
        }
        Update: {
          checked?: number
          created_at?: string
          details?: Json
          errors?: number
          flagged?: number
          id?: string
          job?: string
          refunded?: number
          settled?: number
        }
        Relationships: []
      }
      revenue_snapshots: {
        Row: {
          airtime_commission: number
          created_at: string
          daily_interest_accrual: number
          data_commission: number
          id: string
          merchant_fee_revenue: number
          snapshot_date: string
          total_daily_revenue: number
          total_float_balance: number
          withdrawal_fee_revenue: number
        }
        Insert: {
          airtime_commission?: number
          created_at?: string
          daily_interest_accrual?: number
          data_commission?: number
          id?: string
          merchant_fee_revenue?: number
          snapshot_date: string
          total_daily_revenue?: number
          total_float_balance?: number
          withdrawal_fee_revenue?: number
        }
        Update: {
          airtime_commission?: number
          created_at?: string
          daily_interest_accrual?: number
          data_commission?: number
          id?: string
          merchant_fee_revenue?: number
          snapshot_date?: string
          total_daily_revenue?: number
          total_float_balance?: number
          withdrawal_fee_revenue?: number
        }
        Relationships: []
      }
      ride_bookings: {
        Row: {
          amount: number
          created_at: string
          id: string
          landmark_id: string | null
          landmark_name: string | null
          metadata: Json
          passenger_email: string | null
          passenger_name: string | null
          passenger_phone: string | null
          payment_reference: string
          provider: string
          provider_booking_id: string | null
          provider_reference: string | null
          route_id: string | null
          route_name: string | null
          seats: number
          status: string
          travel_date: string | null
          user_id: string
          vacation_period_id: string | null
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          landmark_id?: string | null
          landmark_name?: string | null
          metadata?: Json
          passenger_email?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          payment_reference: string
          provider?: string
          provider_booking_id?: string | null
          provider_reference?: string | null
          route_id?: string | null
          route_name?: string | null
          seats?: number
          status?: string
          travel_date?: string | null
          user_id: string
          vacation_period_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          landmark_id?: string | null
          landmark_name?: string | null
          metadata?: Json
          passenger_email?: string | null
          passenger_name?: string | null
          passenger_phone?: string | null
          payment_reference?: string
          provider?: string
          provider_booking_id?: string | null
          provider_reference?: string | null
          route_id?: string | null
          route_name?: string | null
          seats?: number
          status?: string
          travel_date?: string | null
          user_id?: string
          vacation_period_id?: string | null
        }
        Relationships: []
      }
      runner_applications: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          created_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          created_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      runner_availability: {
        Row: {
          campus_id: string | null
          created_at: string
          is_active: boolean
          last_ping_at: string
          lat: number | null
          lng: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          campus_id?: string | null
          created_at?: string
          is_active?: boolean
          last_ping_at?: string
          lat?: number | null
          lng?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          campus_id?: string | null
          created_at?: string
          is_active?: boolean
          last_ping_at?: string
          lat?: number | null
          lng?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sar_reports: {
        Row: {
          created_at: string
          created_by: string
          evidence_refs: Json
          id: string
          narrative: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          risk_level: string
          status: string
          subject_user_id: string | null
          submitted_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          evidence_refs?: Json
          id?: string
          narrative?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          risk_level?: string
          status?: string
          subject_user_id?: string | null
          submitted_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          evidence_refs?: Json
          id?: string
          narrative?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          risk_level?: string
          status?: string
          subject_user_id?: string | null
          submitted_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sar_reports_subject_user_id_fkey"
            columns: ["subject_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_beneficiaries: {
        Row: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at: string
          id: string
          is_favorite: boolean
          nickname: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_code: string
          bank_name: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          nickname?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_code?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          nickname?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          created_at: string
          deadline: string | null
          id: string
          saved_amount: number
          status: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deadline?: string | null
          id?: string
          saved_amount?: number
          status?: string
          target_amount: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deadline?: string | null
          id?: string
          saved_amount?: number
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action: string
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      service_request_messages: {
        Row: {
          attachments: Json
          body: string | null
          created_at: string
          id: string
          milestone_key: string | null
          request_id: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachments?: Json
          body?: string | null
          created_at?: string
          id?: string
          milestone_key?: string | null
          request_id: string
          sender_id: string
          sender_role: string
        }
        Update: {
          attachments?: Json
          body?: string | null
          created_at?: string
          id?: string
          milestone_key?: string | null
          request_id?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          approved_at: string | null
          attachments: Json
          category: string
          completed_at: string | null
          created_at: string
          deadline: string | null
          deliverables: string[] | null
          description: string
          escrow_held: number
          escrow_released: number
          id: string
          merchant_id: string
          merchant_note: string | null
          milestones: Json
          negotiation_history: Json
          proposed_budget: number | null
          quote_amount: number | null
          quote_timeline_days: number | null
          status: string
          student_id: string
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          attachments?: Json
          category: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deliverables?: string[] | null
          description: string
          escrow_held?: number
          escrow_released?: number
          id?: string
          merchant_id: string
          merchant_note?: string | null
          milestones?: Json
          negotiation_history?: Json
          proposed_budget?: number | null
          quote_amount?: number | null
          quote_timeline_days?: number | null
          status?: string
          student_id: string
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          attachments?: Json
          category?: string
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          deliverables?: string[] | null
          description?: string
          escrow_held?: number
          escrow_released?: number
          id?: string
          merchant_id?: string
          merchant_note?: string | null
          milestones?: Json
          negotiation_history?: Json
          proposed_budget?: number | null
          quote_amount?: number | null
          quote_timeline_days?: number | null
          status?: string
          student_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      session_risk_events: {
        Row: {
          created_at: string
          details: Json
          event_type: string
          id: string
          score_delta: number
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json
          event_type: string
          id?: string
          score_delta?: number
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json
          event_type?: string
          id?: string
          score_delta?: number
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_risk_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_virtual_accounts: {
        Row: {
          account_name: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string
          customer_identifier: string
          last_attempt_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          customer_identifier: string
          last_attempt_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string
          customer_identifier?: string
          last_attempt_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_types: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          name: string
          price: number
          quantity: number
          sold: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          name: string
          price?: number
          quantity?: number
          sold?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          name?: string
          price?: number
          quantity?: number
          sold?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          amount_paid: number
          buyer_id: string
          buyer_matric: string
          buyer_name: string
          checked_in_at: string | null
          checked_in_by: string | null
          created_at: string
          event_id: string
          id: string
          payment_method: string
          qr_code: string
          status: string
          ticket_type_id: string
          transaction_reference: string | null
        }
        Insert: {
          amount_paid?: number
          buyer_id: string
          buyer_matric: string
          buyer_name: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id: string
          id?: string
          payment_method?: string
          qr_code: string
          status?: string
          ticket_type_id: string
          transaction_reference?: string | null
        }
        Update: {
          amount_paid?: number
          buyer_id?: string
          buyer_matric?: string
          buyer_name?: string
          checked_in_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          event_id?: string
          id?: string
          payment_method?: string
          qr_code?: string
          status?: string
          ticket_type_id?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_disputes: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          transaction_id: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_feedback: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          transaction_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          transaction_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      transaction_limits: {
        Row: {
          created_at: string
          currency: string
          effective_date: string
          id: string
          is_active: boolean
          limit_type: string
          max_amount: number
        }
        Insert: {
          created_at?: string
          currency?: string
          effective_date: string
          id?: string
          is_active?: boolean
          limit_type: string
          max_amount: number
        }
        Update: {
          created_at?: string
          currency?: string
          effective_date?: string
          id?: string
          is_active?: boolean
          limit_type?: string
          max_amount?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          fee_amount: number
          fee_reason: string | null
          id: string
          metadata: Json | null
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee_amount?: number
          fee_reason?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_amount?: number
          fee_reason?: string | null
          id?: string
          metadata?: Json | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      usd_conversions: {
        Row: {
          created_at: string
          direction: string
          fx_quote_id: string | null
          id: string
          ngn_amount: number
          provider_payload: Json | null
          rate: number
          reference: string
          status: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          fx_quote_id?: string | null
          id?: string
          ngn_amount: number
          provider_payload?: Json | null
          rate: number
          reference: string
          status?: string
          usd_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          fx_quote_id?: string | null
          id?: string
          ngn_amount?: number
          provider_payload?: Json | null
          rate?: number
          reference?: string
          status?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usd_conversions_fx_quote_id_fkey"
            columns: ["fx_quote_id"]
            isOneToOne: false
            referencedRelation: "fx_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      usd_wallets: {
        Row: {
          available_usd: number
          created_at: string
          id: string
          locked_usd: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_usd?: number
          created_at?: string
          id?: string
          locked_usd?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_usd?: number
          created_at?: string
          id?: string
          locked_usd?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_2fa_otps: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          used?: boolean
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
      user_sessions: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          last_seen_at: string
          risk_band: string
          risk_score: number
          status: string
          step_up_verified_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          risk_band?: string
          risk_score?: number
          status?: string
          step_up_verified_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          last_seen_at?: string
          risk_band?: string
          risk_score?: number
          status?: string
          step_up_verified_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      velocity_counters: {
        Row: {
          id: string
          outflow_kobo: number
          tx_count: number
          updated_at: string
          user_id: string
          window_date: string
        }
        Insert: {
          id?: string
          outflow_kobo?: number
          tx_count?: number
          updated_at?: string
          user_id: string
          window_date?: string
        }
        Update: {
          id?: string
          outflow_kobo?: number
          tx_count?: number
          updated_at?: string
          user_id?: string
          window_date?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          account_kind: Database["public"]["Enums"]["ledger_account_kind"]
          amount_kobo: number
          balance_after_kobo: number | null
          created_at: string
          currency: string
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_group_id: string
          id: string
          metadata: Json
          purpose: string
          reference: string | null
          transaction_id: string | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          account_kind: Database["public"]["Enums"]["ledger_account_kind"]
          amount_kobo: number
          balance_after_kobo?: number | null
          created_at?: string
          currency?: string
          direction: Database["public"]["Enums"]["ledger_direction"]
          entry_group_id: string
          id?: string
          metadata?: Json
          purpose: string
          reference?: string | null
          transaction_id?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          account_kind?: Database["public"]["Enums"]["ledger_account_kind"]
          amount_kobo?: number
          balance_after_kobo?: number | null
          created_at?: string
          currency?: string
          direction?: Database["public"]["Enums"]["ledger_direction"]
          entry_group_id?: string
          id?: string
          metadata?: Json
          purpose?: string
          reference?: string | null
          transaction_id?: string | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: []
      }
      wallets: {
        Row: {
          available_balance: number
          available_balance_kobo: number | null
          balance: number
          created_at: string
          flutterwave_reference: string | null
          hold_balance: number
          hold_balance_kobo: number
          id: string
          ledger_balance_kobo: number
          previous_virtual_account_number: string | null
          updated_at: string
          user_id: string
          virtual_account_name: string | null
          virtual_account_number: string | null
          virtual_bank_name: string | null
        }
        Insert: {
          available_balance?: number
          available_balance_kobo?: number | null
          balance?: number
          created_at?: string
          flutterwave_reference?: string | null
          hold_balance?: number
          hold_balance_kobo?: number
          id?: string
          ledger_balance_kobo?: number
          previous_virtual_account_number?: string | null
          updated_at?: string
          user_id: string
          virtual_account_name?: string | null
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
        }
        Update: {
          available_balance?: number
          available_balance_kobo?: number | null
          balance?: number
          created_at?: string
          flutterwave_reference?: string | null
          hold_balance?: number
          hold_balance_kobo?: number
          id?: string
          ledger_balance_kobo?: number
          previous_virtual_account_number?: string | null
          updated_at?: string
          user_id?: string
          virtual_account_name?: string | null
          virtual_account_number?: string | null
          virtual_bank_name?: string | null
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          id: string
          payload: Json
          processed: boolean
          provider: string
          signature_valid: boolean
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          payload?: Json
          processed?: boolean
          provider: string
          signature_valid?: boolean
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          payload?: Json
          processed?: boolean
          provider?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_name: string
          account_number: string
          amount: number
          amount_kobo: number | null
          bank_code: string | null
          bank_name: string
          created_at: string
          debit_mode: string
          failure_reason: string | null
          fee_amount: number
          fee_amount_kobo: number | null
          fee_model: string
          fee_reason: string | null
          flutterwave_transfer_ref: string | null
          id: string
          idempotency_key: string | null
          is_instant: boolean
          merchant_id: string | null
          net_amount_kobo: number | null
          provider: string
          provider_attempted_at: string | null
          provider_reference: string | null
          provider_status: string | null
          reference: string | null
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
          wallet_scope: string
        }
        Insert: {
          account_name: string
          account_number: string
          amount: number
          amount_kobo?: number | null
          bank_code?: string | null
          bank_name: string
          created_at?: string
          debit_mode?: string
          failure_reason?: string | null
          fee_amount?: number
          fee_amount_kobo?: number | null
          fee_model?: string
          fee_reason?: string | null
          flutterwave_transfer_ref?: string | null
          id?: string
          idempotency_key?: string | null
          is_instant?: boolean
          merchant_id?: string | null
          net_amount_kobo?: number | null
          provider?: string
          provider_attempted_at?: string | null
          provider_reference?: string | null
          provider_status?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
          wallet_scope?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          amount?: number
          amount_kobo?: number | null
          bank_code?: string | null
          bank_name?: string
          created_at?: string
          debit_mode?: string
          failure_reason?: string | null
          fee_amount?: number
          fee_amount_kobo?: number | null
          fee_model?: string
          fee_reason?: string | null
          flutterwave_transfer_ref?: string | null
          id?: string
          idempotency_key?: string | null
          is_instant?: boolean
          merchant_id?: string | null
          net_amount_kobo?: number | null
          provider?: string
          provider_attempted_at?: string | null
          provider_reference?: string | null
          provider_status?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
          wallet_scope?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_errand_escrow: {
        Args: { p_errand_id: string; p_helper_id: string }
        Returns: Json
      }
      acquire_convert_crypto_lock: {
        Args: { _asset: string; _user: string }
        Returns: undefined
      }
      align_wallet_ledger: { Args: { _wallet_id?: string }; Returns: Json }
      align_wallet_ledger_internal: {
        Args: { _wallet_id?: string }
        Returns: Json
      }
      apply_fx_conversion: {
        Args: { _quote_id: string; _reference: string; _user_id: string }
        Returns: Json
      }
      assert_caller: { Args: { _expected: string }; Returns: undefined }
      auto_suspend_expired_matric_flags: { Args: never; Returns: number }
      award_collection_bonus: {
        Args: { _collection_id: string }
        Returns: Json
      }
      begin_monnify_withdrawal: {
        Args: {
          _account_name: string
          _account_number: string
          _amount_kobo: number
          _bank_code: string
          _bank_name: string
          _idempotency_key: string
          _reference: string
          _user_id: string
        }
        Returns: Json
      }
      break_dollar_lock: {
        Args: { _current_rate: number; _lock_id: string; _user_id: string }
        Returns: Json
      }
      bump_velocity: {
        Args: {
          _daily_cap_kobo?: number
          _daily_tx_cap?: number
          _outflow_kobo: number
          _user_id: string
        }
        Returns: Json
      }
      campus_has_active_runner: {
        Args: { p_campus_id: string }
        Returns: boolean
      }
      check_adaptive_limit: {
        Args: {
          _action: string
          _ip: string
          _max_requests?: number
          _success?: boolean
          _window_seconds?: number
        }
        Returns: Json
      }
      check_login_lock: { Args: { _email: string }; Returns: Json }
      check_otp_rate_limits: {
        Args: { p_ip: string; p_phone: string; p_user_id: string }
        Returns: Json
      }
      check_pin_lockout: { Args: { p_user_id: string }; Returns: Json }
      check_rate_limit: {
        Args: {
          _action: string
          _key: string
          _max_requests: number
          _window_seconds: number
        }
        Returns: Json
      }
      check_registration_identity: {
        Args: { p_matric: string; p_phone: string; p_university: string }
        Returns: string
      }
      claim_collection_payment: {
        Args: {
          p_amount: number
          p_collection_id: string
          p_payer_matric?: string
          p_payer_name: string
          p_payer_phone?: string
        }
        Returns: string
      }
      claim_monnify_account: {
        Args: { _account_reference: string; _user_id: string }
        Returns: Json
      }
      claim_squad_account: {
        Args: { _customer_identifier: string; _user_id: string }
        Returns: Json
      }
      collection_bonus_for_total: { Args: { _total: number }; Returns: number }
      complete_errand: {
        Args: { p_errand_id: string; p_requester_id: string }
        Returns: Json
      }
      complete_merchant_errand: {
        Args: { p_errand_id: string; p_requester_id: string }
        Returns: Json
      }
      consume_phone_otp: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      contribute_to_ajo: {
        Args: {
          p_cycle: number
          p_group_id: string
          p_member_id: string
          p_user_id: string
        }
        Returns: Json
      }
      count_active_runners: { Args: { p_campus_id: string }; Returns: number }
      create_dollar_lock: {
        Args: {
          _challenge: string
          _days: number
          _usd: number
          _user_id: string
        }
        Returns: Json
      }
      create_instant_order: {
        Args: {
          p_customer_name: string
          p_delivery_address: string
          p_delivery_fee: number
          p_delivery_method: string
          p_delivery_window: Json
          p_delivery_zone_name: string
          p_items: Json
          p_laundry_items: Json
          p_merchant_id: string
          p_order_type: string
          p_pickup_window: Json
          p_print_file_name: string
          p_print_file_url: string
          p_print_specs: Json
          p_service_type: string
          p_special_instructions: string
          p_total: number
        }
        Returns: Json
      }
      create_notification: {
        Args: {
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: undefined
      }
      credit_breet_deposit: {
        Args: {
          _amount_usd: number
          _confirmations: number
          _crypto_amount: number
          _deposit_address: string
          _event: string
          _ngn_amount: number
          _payload: Json
          _rate: number
          _status: string
          _trade_id: string
          _tx_hash: string
        }
        Returns: Json
      }
      credit_monnify_deposit: {
        Args: {
          _account_reference: string
          _amount_kobo: number
          _transaction_reference: string
        }
        Returns: Json
      }
      credit_squad_deposit: {
        Args: {
          _account_number: string
          _amount_kobo: number
          _customer_identifier: string
          _transaction_reference: string
        }
        Returns: Json
      }
      credit_wallet: {
        Args: { p_amount: number; p_wallet_id: string }
        Returns: undefined
      }
      dec_kyc_field: {
        Args: {
          _field: string
          _ip?: string
          _key: string
          _kyc_id: string
          _user_agent?: string
        }
        Returns: string
      }
      email_exists: { Args: { p_email: string }; Returns: boolean }
      enc_kyc_field: {
        Args: { _key: string; _plaintext: string }
        Returns: string
      }
      ensure_runner_application: { Args: never; Returns: Json }
      ensure_usd_wallet: {
        Args: { _user_id: string }
        Returns: {
          available_usd: number
          created_at: string
          id: string
          locked_usd: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "usd_wallets"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      evaluate_session_risk: {
        Args: {
          _city?: string
          _country?: string
          _fingerprint: string
          _ip: string
          _local_hour?: number
          _user_agent?: string
          _user_id: string
        }
        Returns: Json
      }
      execute_p2p_transfer: {
        Args: {
          p_amount: number
          p_note?: string
          p_recipient_id: string
          p_sender_id: string
        }
        Returns: Json
      }
      finalize_merchant_withdrawal: {
        Args: { _source?: string; _withdrawal_id: string }
        Returns: Json
      }
      finalize_withdrawal: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      finish_monnify_withdrawal: {
        Args: {
          _failure_reason: string
          _outcome: string
          _provider_reference: string
          _provider_status: string
          _reference: string
        }
        Returns: Json
      }
      flag_ledger_mismatches: { Args: never; Returns: Json }
      get_collection_claim_status: {
        Args: { p_claim_id: string }
        Returns: {
          amount: number
          confirmed_at: string
          payer_matric_number: string
          payer_name: string
          reference: string
          status: string
        }[]
      }
      get_collection_payout_details: {
        Args: { p_collection_id: string }
        Returns: {
          virtual_account_number: string
          virtual_bank_name: string
        }[]
      }
      get_event_payout_details: {
        Args: { p_event_id: string }
        Returns: {
          settlement_account_name: string
          settlement_account_number: string
          settlement_bank_name: string
          virtual_account_number: string
          virtual_bank_name: string
        }[]
      }
      get_public_collection: {
        Args: { p_collection_id: string }
        Returns: {
          amount_per_person: number
          deadline: string
          description: string
          id: string
          organizer_name: string
          participant_count: number
          require_matric: boolean
          status: string
          target_amount: number
          title: string
          total_collected: number
          virtual_account_name: string
          virtual_account_number: string
          virtual_bank_name: string
        }[]
      }
      get_user_campus_id: { Args: { _user_id: string }; Returns: string }
      has_bvn_kyc: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_ajo_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      kyc_max_balance: { Args: { _user_id: string }; Returns: number }
      log_admin_action: {
        Args: {
          _action: string
          _ip?: string
          _metadata?: Json
          _target_id: string
          _target_table: string
          _user_agent?: string
        }
        Returns: string
      }
      lookup_profile_by_matric: { Args: { p_matric: string }; Returns: Json }
      mark_session_verified: { Args: { _session_id: string }; Returns: Json }
      match_collection_claim: {
        Args: {
          p_amount: number
          p_collection_id: string
          p_payer_name: string
          p_reference: string
        }
        Returns: {
          id: string
          payer_matric_number: string
          payer_name: string
        }[]
      }
      mature_due_dollar_locks: { Args: never; Returns: Json }
      merchant_update_order_status: {
        Args: {
          p_merchant_user_id: string
          p_new_status: string
          p_order_id: string
        }
        Returns: Json
      }
      merchant_withdraw_to_bank: {
        Args: {
          p_amount: number
          p_idempotency_key?: string
          p_source?: string
          p_user_id: string
        }
        Returns: Json
      }
      pay_bill_from_wallet: {
        Args: {
          p_amount: number
          p_bill_type: string
          p_metadata?: Json
          p_reference: string
          p_user_id: string
        }
        Returns: Json
      }
      pay_collection_from_wallet: {
        Args: {
          p_amount: number
          p_collection_id: string
          p_payer_id: string
          p_payer_matric: string
          p_payer_name: string
        }
        Returns: Json
      }
      pay_merchant_from_wallet: {
        Args: { p_amount: number; p_customer_id: string; p_merchant_id: string }
        Returns: Json
      }
      post_ledger_entry: {
        Args: {
          _allow_overdraft?: boolean
          _amount_kobo: number
          _credit_user_id: string
          _debit_user_id: string
          _external_kind?: Database["public"]["Enums"]["ledger_account_kind"]
          _metadata?: Json
          _purpose: string
          _reference?: string
        }
        Returns: Json
      }
      preview_withdrawal_fee: {
        Args: { _amount: number; _is_instant?: boolean; _user_id: string }
        Returns: Json
      }
      publish_event: {
        Args: { _aggregate_id: string; _event_type: string; _payload?: Json }
        Returns: string
      }
      purchase_ticket_from_wallet: {
        Args: {
          p_buyer_id: string
          p_buyer_matric: string
          p_buyer_name: string
          p_event_id: string
          p_ticket_type_id: string
        }
        Returns: Json
      }
      reconcile_wallet_ledger: {
        Args: never
        Returns: {
          diff_kobo: number
          ledger_kobo: number
          user_id: string
          wallet_id: string
          wallet_kobo: number
        }[]
      }
      record_failed_pin: { Args: { p_user_id: string }; Returns: Json }
      record_login_attempt: {
        Args: { _email: string; _success: boolean }
        Returns: Json
      }
      record_reconciliation_run: {
        Args: {
          _checked: number
          _details?: Json
          _errors: number
          _flagged: number
          _job: string
          _refunded: number
          _settled: number
        }
        Returns: string
      }
      record_session_risk_event: {
        Args: {
          _delta?: number
          _details?: Json
          _event_type: string
          _session_id: string
        }
        Returns: Json
      }
      refresh_kyc_level: { Args: { p_user_id: string }; Returns: Json }
      refund_withdrawal_by_id: {
        Args: { _reason?: string; _source?: string; _withdrawal_id: string }
        Returns: Json
      }
      release_collection_bonus: {
        Args: { _collection_id: string }
        Returns: number
      }
      release_convert_crypto_lock: {
        Args: { _asset: string; _user: string }
        Returns: undefined
      }
      release_service_milestone: {
        Args: { _milestone_key: string; _request_id: string }
        Returns: Json
      }
      remind_upcoming_dollar_locks: { Args: never; Returns: Json }
      remove_ajo_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: Json
      }
      reset_pin_attempts: { Args: { p_user_id: string }; Returns: undefined }
      resync_flutterwave_withdrawals: { Args: never; Returns: number }
      reverse_ghost_credit: {
        Args: { _reason?: string; _reference: string }
        Returns: Json
      }
      reverse_merchant_withdrawal: {
        Args: { _reason?: string; _source?: string; _withdrawal_id: string }
        Returns: Json
      }
      rotate_kyc_key: {
        Args: {
          _ip?: string
          _new_key: string
          _old_key: string
          _user_agent?: string
        }
        Returns: Json
      }
      run_merchant_auto_withdrawals: { Args: never; Returns: number }
      safe_credit: {
        Args: {
          _amount: number
          _event_id: string
          _reference: string
          _user_id: string
        }
        Returns: Json
      }
      safe_withdrawal:
        | {
            Args: {
              _amount: number
              _bank_account: string
              _bank_code: string
              _reference: string
              _user_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              _amount: number
              _bank_account: string
              _bank_code: string
              _is_instant?: boolean
              _reference: string
              _user_id: string
            }
            Returns: Json
          }
      session_outflow_guard: {
        Args: { _amount_kobo: number; _user_id: string }
        Returns: Json
      }
      settle_withdrawal_by_id: {
        Args: { _source?: string; _withdrawal_id: string }
        Returns: Json
      }
      terminate_other_sessions: {
        Args: { _keep_session_id: string }
        Returns: Json
      }
      terminate_session: { Args: { _session_id: string }; Returns: Json }
      update_limit: {
        Args: {
          _effective_date: string
          _limit_type: string
          _new_amount: number
        }
        Returns: Json
      }
    }
    Enums: {
      ajo_contribution_status: "pending" | "paid" | "late" | "missed"
      ajo_frequency: "daily" | "weekly" | "monthly"
      ajo_member_status: "active" | "removed" | "left"
      ajo_order_type: "random_ballot" | "admin_assigned" | "first_come"
      ajo_status: "recruiting" | "active" | "completed" | "cancelled"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "organizer"
        | "compliance_officer"
        | "support_staff"
        | "auditor"
      collection_payment_status: "pending" | "confirmed"
      collection_status: "active" | "completed" | "cancelled"
      errand_assignment_status:
        | "assigned"
        | "in_progress"
        | "completed"
        | "disputed"
      errand_status:
        | "open"
        | "accepted"
        | "in_progress"
        | "completed"
        | "cancelled"
      kyc_status:
        | "unverified"
        | "pending"
        | "submitted"
        | "verified"
        | "rejected"
      kyc_verification_status: "pending" | "approved" | "rejected"
      ledger_account_kind:
        | "user_wallet"
        | "merchant_wallet"
        | "external"
        | "platform_fee"
        | "escrow"
      ledger_direction: "debit" | "credit"
      merchant_status: "pending" | "active" | "suspended"
      transaction_status: "pending" | "completed" | "failed" | "reversed"
      transaction_type:
        | "deposit"
        | "p2p_transfer"
        | "withdrawal"
        | "collection_payment"
        | "errand_payment"
        | "ajo_contribution"
        | "ajo_disbursement"
        | "REFUND"
        | "merchant_payment"
        | "service_request_payout"
        | "bill_payment"
      withdrawal_status:
        | "pending"
        | "processing"
        | "completed"
        | "refunded"
        | "failed"
        | "reversed"
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
    Enums: {
      ajo_contribution_status: ["pending", "paid", "late", "missed"],
      ajo_frequency: ["daily", "weekly", "monthly"],
      ajo_member_status: ["active", "removed", "left"],
      ajo_order_type: ["random_ballot", "admin_assigned", "first_come"],
      ajo_status: ["recruiting", "active", "completed", "cancelled"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "organizer",
        "compliance_officer",
        "support_staff",
        "auditor",
      ],
      collection_payment_status: ["pending", "confirmed"],
      collection_status: ["active", "completed", "cancelled"],
      errand_assignment_status: [
        "assigned",
        "in_progress",
        "completed",
        "disputed",
      ],
      errand_status: [
        "open",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ],
      kyc_status: [
        "unverified",
        "pending",
        "submitted",
        "verified",
        "rejected",
      ],
      kyc_verification_status: ["pending", "approved", "rejected"],
      ledger_account_kind: [
        "user_wallet",
        "merchant_wallet",
        "external",
        "platform_fee",
        "escrow",
      ],
      ledger_direction: ["debit", "credit"],
      merchant_status: ["pending", "active", "suspended"],
      transaction_status: ["pending", "completed", "failed", "reversed"],
      transaction_type: [
        "deposit",
        "p2p_transfer",
        "withdrawal",
        "collection_payment",
        "errand_payment",
        "ajo_contribution",
        "ajo_disbursement",
        "REFUND",
        "merchant_payment",
        "service_request_payout",
        "bill_payment",
      ],
      withdrawal_status: [
        "pending",
        "processing",
        "completed",
        "refunded",
        "failed",
        "reversed",
      ],
    },
  },
} as const
