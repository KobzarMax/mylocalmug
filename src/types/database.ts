// Generated from the linked Supabase project. Nullable RPC inputs are corrected where
// PostgreSQL accepts NULL but the generator cannot infer argument nullability.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      business_applications: {
        Row: {
          address: string;
          applicant_id: string;
          category: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          created_at: string;
          description: string;
          id: string;
          legal_name: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          status: Database['public']['Enums']['business_application_status'];
          submitted_at: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          website_url: string;
        };
        Insert: {
          address: string;
          applicant_id: string;
          category?: string;
          company_number?: string;
          contact_email: string;
          contact_phone?: string;
          created_at?: string;
          description?: string;
          id?: string;
          legal_name?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          status?: Database['public']['Enums']['business_application_status'];
          submitted_at?: string | null;
          trading_name: string;
          updated_at?: string;
          vat_number?: string;
          website_url?: string;
        };
        Update: {
          address?: string;
          applicant_id?: string;
          category?: string;
          company_number?: string;
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          description?: string;
          id?: string;
          legal_name?: string;
          rejection_reason?: string | null;
          reviewed_at?: string | null;
          status?: Database['public']['Enums']['business_application_status'];
          submitted_at?: string | null;
          trading_name?: string;
          updated_at?: string;
          vat_number?: string;
          website_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_applications_applicant_id_profiles_id_fk';
            columns: ['applicant_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      business_audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          business_id: string;
          created_at: string;
          id: string;
          metadata: Json;
          target_profile_id: string | null;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          business_id: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_profile_id?: string | null;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          business_id?: string;
          created_at?: string;
          id?: string;
          metadata?: Json;
          target_profile_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'business_audit_logs_actor_id_profiles_id_fk';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_audit_logs_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_audit_logs_target_profile_id_profiles_id_fk';
            columns: ['target_profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      business_followers: {
        Row: {
          business_id: string;
          client_id: string;
          event_notifications_enabled: boolean;
          joined_at: string;
        };
        Insert: {
          business_id: string;
          client_id: string;
          event_notifications_enabled?: boolean;
          joined_at?: string;
        };
        Update: {
          business_id?: string;
          client_id?: string;
          event_notifications_enabled?: boolean;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_followers_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_followers_client_id_profiles_id_fk';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      business_hours: {
        Row: {
          closes_at: string | null;
          day_of_week: number;
          is_closed: boolean;
          location_id: string;
          opens_at: string | null;
        };
        Insert: {
          closes_at?: string | null;
          day_of_week: number;
          is_closed?: boolean;
          location_id: string;
          opens_at?: string | null;
        };
        Update: {
          closes_at?: string | null;
          day_of_week?: number;
          is_closed?: boolean;
          location_id?: string;
          opens_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'business_hours_location_id_business_locations_id_fk';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'business_locations';
            referencedColumns: ['id'];
          },
        ];
      };
      business_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          business_id: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          revoked_at: string | null;
          role: Database['public']['Enums']['business_member_role'];
          status: Database['public']['Enums']['business_invitation_status'];
          token_hash: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          business_id: string;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          revoked_at?: string | null;
          role: Database['public']['Enums']['business_member_role'];
          status?: Database['public']['Enums']['business_invitation_status'];
          token_hash: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          business_id?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          revoked_at?: string | null;
          role?: Database['public']['Enums']['business_member_role'];
          status?: Database['public']['Enums']['business_invitation_status'];
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_invitations_accepted_by_profiles_id_fk';
            columns: ['accepted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_invitations_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_invitations_invited_by_profiles_id_fk';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      business_legal_profiles: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          change_request_note: string;
          charity_number: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          country: string;
          created_at: string;
          entity_type: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by: string | null;
          legal_name: string;
          registered_address_line1: string;
          registered_address_line2: string;
          registered_county: string;
          registered_postcode: string;
          registered_town_city: string;
          revision: number;
          status: Database['public']['Enums']['legal_profile_status'];
          submitted_at: string | null;
          submitted_by: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          vat_registered: boolean;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          business_id: string;
          change_request_note?: string;
          charity_number?: string;
          company_number?: string;
          contact_email?: string;
          contact_phone?: string;
          country?: string;
          created_at?: string;
          entity_type?: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by?: string | null;
          legal_name?: string;
          registered_address_line1?: string;
          registered_address_line2?: string;
          registered_county?: string;
          registered_postcode?: string;
          registered_town_city?: string;
          revision?: number;
          status?: Database['public']['Enums']['legal_profile_status'];
          submitted_at?: string | null;
          submitted_by?: string | null;
          trading_name?: string;
          updated_at?: string;
          vat_number?: string;
          vat_registered?: boolean;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          business_id?: string;
          change_request_note?: string;
          charity_number?: string;
          company_number?: string;
          contact_email?: string;
          contact_phone?: string;
          country?: string;
          created_at?: string;
          entity_type?: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by?: string | null;
          legal_name?: string;
          registered_address_line1?: string;
          registered_address_line2?: string;
          registered_county?: string;
          registered_postcode?: string;
          registered_town_city?: string;
          revision?: number;
          status?: Database['public']['Enums']['legal_profile_status'];
          submitted_at?: string | null;
          submitted_by?: string | null;
          trading_name?: string;
          updated_at?: string;
          vat_number?: string;
          vat_registered?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'business_legal_profiles_approved_by_profiles_id_fk';
            columns: ['approved_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_legal_profiles_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: true;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_legal_profiles_last_edited_by_profiles_id_fk';
            columns: ['last_edited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_legal_profiles_submitted_by_profiles_id_fk';
            columns: ['submitted_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      business_locations: {
        Row: {
          address: string;
          business_id: string;
          created_at: string;
          id: string;
          is_primary: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          phone: string;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          address?: string;
          business_id: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          phone?: string;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          business_id?: string;
          created_at?: string;
          id?: string;
          is_primary?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          phone?: string;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_locations_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
      business_memberships: {
        Row: {
          business_id: string;
          invited_by: string | null;
          joined_at: string;
          profile_id: string;
          role: Database['public']['Enums']['business_member_role'];
          status: Database['public']['Enums']['business_membership_status'];
          updated_at: string;
        };
        Insert: {
          business_id: string;
          invited_by?: string | null;
          joined_at?: string;
          profile_id: string;
          role: Database['public']['Enums']['business_member_role'];
          status?: Database['public']['Enums']['business_membership_status'];
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          invited_by?: string | null;
          joined_at?: string;
          profile_id?: string;
          role?: Database['public']['Enums']['business_member_role'];
          status?: Database['public']['Enums']['business_membership_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'business_memberships_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_memberships_invited_by_profiles_id_fk';
            columns: ['invited_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'business_memberships_profile_id_profiles_id_fk';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      businesses: {
        Row: {
          address: string;
          category: string;
          contact_email: string;
          contact_phone: string;
          created_at: string;
          description: string;
          header_url: string | null;
          id: string;
          is_published: boolean;
          latitude: number | null;
          logo_url: string | null;
          longitude: number | null;
          name: string;
          owner_id: string;
          slug: string;
          social_links: Json;
          status: Database['public']['Enums']['business_status'];
          updated_at: string;
          website_url: string;
        };
        Insert: {
          address?: string;
          category?: string;
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          description?: string;
          header_url?: string | null;
          id?: string;
          is_published?: boolean;
          latitude?: number | null;
          logo_url?: string | null;
          longitude?: number | null;
          name: string;
          owner_id: string;
          slug: string;
          social_links?: Json;
          status?: Database['public']['Enums']['business_status'];
          updated_at?: string;
          website_url?: string;
        };
        Update: {
          address?: string;
          category?: string;
          contact_email?: string;
          contact_phone?: string;
          created_at?: string;
          description?: string;
          header_url?: string | null;
          id?: string;
          is_published?: boolean;
          latitude?: number | null;
          logo_url?: string | null;
          longitude?: number | null;
          name?: string;
          owner_id?: string;
          slug?: string;
          social_links?: Json;
          status?: Database['public']['Enums']['business_status'];
          updated_at?: string;
          website_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'businesses_owner_id_profiles_id_fk';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      event_menu_items: {
        Row: {
          available_from: string;
          available_until: string;
          badge: string;
          created_at: string;
          event_id: string;
          event_only: boolean;
          menu_item_id: string;
          message: string;
        };
        Insert: {
          available_from: string;
          available_until: string;
          badge?: string;
          created_at?: string;
          event_id: string;
          event_only?: boolean;
          menu_item_id: string;
          message: string;
        };
        Update: {
          available_from?: string;
          available_until?: string;
          badge?: string;
          created_at?: string;
          event_id?: string;
          event_only?: boolean;
          menu_item_id?: string;
          message?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_menu_items_event_id_posts_id_fk';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_menu_items_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
        ];
      };
      event_notification_jobs: {
        Row: {
          attempts: number;
          created_at: string;
          due_at: string;
          event_version: number;
          id: string;
          job_type: Database['public']['Enums']['event_notification_job_type'];
          last_error: string | null;
          next_attempt_at: string | null;
          post_id: string;
          processed_at: string | null;
          reminder_minutes: number;
          status: Database['public']['Enums']['notification_job_status'];
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          due_at: string;
          event_version: number;
          id?: string;
          job_type: Database['public']['Enums']['event_notification_job_type'];
          last_error?: string | null;
          next_attempt_at?: string | null;
          post_id: string;
          processed_at?: string | null;
          reminder_minutes?: number;
          status?: Database['public']['Enums']['notification_job_status'];
        };
        Update: {
          attempts?: number;
          created_at?: string;
          due_at?: string;
          event_version?: number;
          id?: string;
          job_type?: Database['public']['Enums']['event_notification_job_type'];
          last_error?: string | null;
          next_attempt_at?: string | null;
          post_id?: string;
          processed_at?: string | null;
          reminder_minutes?: number;
          status?: Database['public']['Enums']['notification_job_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'event_notification_jobs_post_id_posts_id_fk';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      favorite_businesses: {
        Row: {
          business_id: string;
          created_at: string;
          profile_id: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          profile_id: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'favorite_businesses_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'favorite_businesses_profile_id_profiles_id_fk';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_accounts: {
        Row: {
          balance: number;
          customer_id: string;
          id: string;
          joined_at: string;
          joined_version: number;
          lifetime_earned: number;
          program_id: string;
          updated_at: string;
        };
        Insert: {
          balance?: number;
          customer_id: string;
          id?: string;
          joined_at?: string;
          joined_version: number;
          lifetime_earned?: number;
          program_id: string;
          updated_at?: string;
        };
        Update: {
          balance?: number;
          customer_id?: string;
          id?: string;
          joined_at?: string;
          joined_version?: number;
          lifetime_earned?: number;
          program_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_accounts_customer_id_profiles_id_fk';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_accounts_program_id_loyalty_programs_id_fk';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_programs';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_fraud_events: {
        Row: {
          actor_id: string | null;
          business_id: string | null;
          context: Json;
          created_at: string;
          customer_id: string | null;
          event_type: string;
          id: string;
        };
        Insert: {
          actor_id?: string | null;
          business_id?: string | null;
          context?: Json;
          created_at?: string;
          customer_id?: string | null;
          event_type: string;
          id?: string;
        };
        Update: {
          actor_id?: string | null;
          business_id?: string | null;
          context?: Json;
          created_at?: string;
          customer_id?: string | null;
          event_type?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_fraud_events_actor_id_profiles_id_fk';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_fraud_events_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_fraud_events_customer_id_profiles_id_fk';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_ledger: {
        Row: {
          account_id: string;
          actor_id: string;
          amount: number;
          created_at: string;
          id: string;
          idempotency_key: string;
          kind: Database['public']['Enums']['loyalty_ledger_kind'];
          lifetime_amount: number;
          note: string | null;
          purchase_id: string | null;
          redemption_id: string | null;
          reversal_of_id: string | null;
        };
        Insert: {
          account_id: string;
          actor_id: string;
          amount: number;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          kind: Database['public']['Enums']['loyalty_ledger_kind'];
          lifetime_amount?: number;
          note?: string | null;
          purchase_id?: string | null;
          redemption_id?: string | null;
          reversal_of_id?: string | null;
        };
        Update: {
          account_id?: string;
          actor_id?: string;
          amount?: number;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          kind?: Database['public']['Enums']['loyalty_ledger_kind'];
          lifetime_amount?: number;
          note?: string | null;
          purchase_id?: string | null;
          redemption_id?: string | null;
          reversal_of_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_ledger_account_id_loyalty_accounts_id_fk';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_ledger_actor_id_profiles_id_fk';
            columns: ['actor_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_ledger_purchase_id_loyalty_purchase_events_id_fk';
            columns: ['purchase_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_purchase_events';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_meal_deal_group_items: {
        Row: {
          group_id: string;
          menu_item_id: string;
        };
        Insert: {
          group_id: string;
          menu_item_id: string;
        };
        Update: {
          group_id?: string;
          menu_item_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_meal_deal_group_items_group_id_loyalty_meal_deal_groups';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_meal_deal_groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_meal_deal_group_items_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_meal_deal_groups: {
        Row: {
          id: string;
          name: string;
          offer_id: string;
          quantity: number;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          offer_id: string;
          quantity?: number;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          offer_id?: string;
          quantity?: number;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_meal_deal_groups_offer_id_loyalty_offers_id_fk';
            columns: ['offer_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_offers';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_offer_items: {
        Row: {
          menu_item_id: string;
          offer_id: string;
          quantity: number;
          role: string;
        };
        Insert: {
          menu_item_id: string;
          offer_id: string;
          quantity?: number;
          role: string;
        };
        Update: {
          menu_item_id?: string;
          offer_id?: string;
          quantity?: number;
          role?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_offer_items_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_offer_items_offer_id_loyalty_offers_id_fk';
            columns: ['offer_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_offers';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_offers: {
        Row: {
          amount_pence: number | null;
          audience: Database['public']['Enums']['loyalty_offer_audience'];
          balance_cost: number | null;
          benefit_type: Database['public']['Enums']['loyalty_benefit_type'];
          business_id: string;
          created_at: string;
          description: string;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          kind: Database['public']['Enums']['loyalty_offer_kind'];
          percentage_off: number | null;
          program_id: string | null;
          staff_instructions: string;
          starts_at: string | null;
          tier_id: string | null;
          title: string;
          updated_at: string;
          usage_limit: number | null;
          usage_period: Database['public']['Enums']['loyalty_usage_period'] | null;
        };
        Insert: {
          amount_pence?: number | null;
          audience?: Database['public']['Enums']['loyalty_offer_audience'];
          balance_cost?: number | null;
          benefit_type: Database['public']['Enums']['loyalty_benefit_type'];
          business_id: string;
          created_at?: string;
          description?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          kind: Database['public']['Enums']['loyalty_offer_kind'];
          percentage_off?: number | null;
          program_id?: string | null;
          staff_instructions?: string;
          starts_at?: string | null;
          tier_id?: string | null;
          title: string;
          updated_at?: string;
          usage_limit?: number | null;
          usage_period?: Database['public']['Enums']['loyalty_usage_period'] | null;
        };
        Update: {
          amount_pence?: number | null;
          audience?: Database['public']['Enums']['loyalty_offer_audience'];
          balance_cost?: number | null;
          benefit_type?: Database['public']['Enums']['loyalty_benefit_type'];
          business_id?: string;
          created_at?: string;
          description?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          kind?: Database['public']['Enums']['loyalty_offer_kind'];
          percentage_off?: number | null;
          program_id?: string | null;
          staff_instructions?: string;
          starts_at?: string | null;
          tier_id?: string | null;
          title?: string;
          updated_at?: string;
          usage_limit?: number | null;
          usage_period?: Database['public']['Enums']['loyalty_usage_period'] | null;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_offers_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_offers_program_id_loyalty_programs_id_fk';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_offers_tier_id_loyalty_tiers_id_fk';
            columns: ['tier_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_tiers';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_program_eligibility: {
        Row: {
          category_id: string | null;
          id: string;
          menu_item_id: string | null;
          units_per_item: number;
          version_id: string;
        };
        Insert: {
          category_id?: string | null;
          id?: string;
          menu_item_id?: string | null;
          units_per_item?: number;
          version_id: string;
        };
        Update: {
          category_id?: string | null;
          id?: string;
          menu_item_id?: string | null;
          units_per_item?: number;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_program_eligibility_category_id_menu_categories_id_fk';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'menu_categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_program_eligibility_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_program_eligibility_version_id_loyalty_program_versions';
            columns: ['version_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_program_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_program_versions: {
        Row: {
          created_at: string;
          created_by: string;
          earning_method: Database['public']['Enums']['loyalty_earning_method'];
          effective_at: string;
          id: string;
          points_per_pound: number | null;
          program_id: string;
          terms: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          earning_method: Database['public']['Enums']['loyalty_earning_method'];
          effective_at: string;
          id?: string;
          points_per_pound?: number | null;
          program_id: string;
          terms: string;
          version: number;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          earning_method?: Database['public']['Enums']['loyalty_earning_method'];
          effective_at?: string;
          id?: string;
          points_per_pound?: number | null;
          program_id?: string;
          terms?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_program_versions_created_by_profiles_id_fk';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_program_versions_program_id_loyalty_programs_id_fk';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_programs';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_programs: {
        Row: {
          archived_at: string | null;
          business_id: string;
          created_at: string;
          created_by: string;
          current_version: number;
          description: string;
          ends_at: string | null;
          id: string;
          name: string;
          starts_at: string | null;
          status: Database['public']['Enums']['loyalty_program_status'];
          type: Database['public']['Enums']['loyalty_program_type'];
          unit_plural: string;
          unit_singular: string;
          updated_at: string;
        };
        Insert: {
          archived_at?: string | null;
          business_id: string;
          created_at?: string;
          created_by: string;
          current_version?: number;
          description?: string;
          ends_at?: string | null;
          id?: string;
          name: string;
          starts_at?: string | null;
          status?: Database['public']['Enums']['loyalty_program_status'];
          type: Database['public']['Enums']['loyalty_program_type'];
          unit_plural: string;
          unit_singular: string;
          updated_at?: string;
        };
        Update: {
          archived_at?: string | null;
          business_id?: string;
          created_at?: string;
          created_by?: string;
          current_version?: number;
          description?: string;
          ends_at?: string | null;
          id?: string;
          name?: string;
          starts_at?: string | null;
          status?: Database['public']['Enums']['loyalty_program_status'];
          type?: Database['public']['Enums']['loyalty_program_type'];
          unit_plural?: string;
          unit_singular?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_programs_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_programs_created_by_profiles_id_fk';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_purchase_events: {
        Row: {
          business_id: string;
          created_at: string;
          customer_id: string;
          final_eligible_pence: number;
          id: string;
          idempotency_key: string;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          source: string;
          verified_by: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          customer_id: string;
          final_eligible_pence: number;
          id?: string;
          idempotency_key: string;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source?: string;
          verified_by: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          customer_id?: string;
          final_eligible_pence?: number;
          id?: string;
          idempotency_key?: string;
          reversal_reason?: string | null;
          reversed_at?: string | null;
          reversed_by?: string | null;
          source?: string;
          verified_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_purchase_events_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_purchase_events_customer_id_profiles_id_fk';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_purchase_events_reversed_by_profiles_id_fk';
            columns: ['reversed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_purchase_events_verified_by_profiles_id_fk';
            columns: ['verified_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_purchase_items: {
        Row: {
          item_name: string;
          menu_item_id: string | null;
          purchase_id: string;
          quantity: number;
          was_free: boolean;
        };
        Insert: {
          item_name: string;
          menu_item_id?: string | null;
          purchase_id: string;
          quantity: number;
          was_free?: boolean;
        };
        Update: {
          item_name?: string;
          menu_item_id?: string | null;
          purchase_id?: string;
          quantity?: number;
          was_free?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_purchase_items_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_purchase_items_purchase_id_loyalty_purchase_events_id_f';
            columns: ['purchase_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_purchase_events';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_qr_challenges: {
        Row: {
          business_id: string;
          claimed_at: string | null;
          claimed_by: string | null;
          consumed_at: string | null;
          created_at: string;
          customer_id: string;
          expires_at: string;
          id: string;
          offer_id: string | null;
          purpose: Database['public']['Enums']['loyalty_challenge_purpose'];
          status: Database['public']['Enums']['loyalty_challenge_status'];
          token_hash: string;
        };
        Insert: {
          business_id: string;
          claimed_at?: string | null;
          claimed_by?: string | null;
          consumed_at?: string | null;
          created_at?: string;
          customer_id: string;
          expires_at: string;
          id?: string;
          offer_id?: string | null;
          purpose: Database['public']['Enums']['loyalty_challenge_purpose'];
          status?: Database['public']['Enums']['loyalty_challenge_status'];
          token_hash: string;
        };
        Update: {
          business_id?: string;
          claimed_at?: string | null;
          claimed_by?: string | null;
          consumed_at?: string | null;
          created_at?: string;
          customer_id?: string;
          expires_at?: string;
          id?: string;
          offer_id?: string | null;
          purpose?: Database['public']['Enums']['loyalty_challenge_purpose'];
          status?: Database['public']['Enums']['loyalty_challenge_status'];
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_qr_challenges_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_qr_challenges_claimed_by_profiles_id_fk';
            columns: ['claimed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_qr_challenges_customer_id_profiles_id_fk';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_qr_challenges_offer_id_loyalty_offers_id_fk';
            columns: ['offer_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_offers';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_redemptions: {
        Row: {
          account_id: string | null;
          balance_cost: number;
          benefit_snapshot: Json;
          consumed_at: string;
          consumed_by: string;
          customer_id: string;
          id: string;
          idempotency_key: string;
          offer_id: string;
        };
        Insert: {
          account_id?: string | null;
          balance_cost?: number;
          benefit_snapshot?: Json;
          consumed_at?: string;
          consumed_by: string;
          customer_id: string;
          id?: string;
          idempotency_key: string;
          offer_id: string;
        };
        Update: {
          account_id?: string | null;
          balance_cost?: number;
          benefit_snapshot?: Json;
          consumed_at?: string;
          consumed_by?: string;
          customer_id?: string;
          id?: string;
          idempotency_key?: string;
          offer_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_redemptions_account_id_loyalty_accounts_id_fk';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_redemptions_consumed_by_profiles_id_fk';
            columns: ['consumed_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_redemptions_customer_id_profiles_id_fk';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_redemptions_offer_id_loyalty_offers_id_fk';
            columns: ['offer_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_offers';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_tier_unlocks: {
        Row: {
          account_id: string;
          tier_id: string;
          unlocked_at: string;
        };
        Insert: {
          account_id: string;
          tier_id: string;
          unlocked_at?: string;
        };
        Update: {
          account_id?: string;
          tier_id?: string;
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_tier_unlocks_account_id_loyalty_accounts_id_fk';
            columns: ['account_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_accounts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_tier_unlocks_tier_id_loyalty_tiers_id_fk';
            columns: ['tier_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_tiers';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_tiers: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          threshold: number;
          version_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          threshold: number;
          version_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          threshold?: number;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_tiers_version_id_loyalty_program_versions_id_fk';
            columns: ['version_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_program_versions';
            referencedColumns: ['id'];
          },
        ];
      };
      loyalty_wallets: {
        Row: {
          client_id: string;
          id: string;
          reward_id: string;
          stamp_count: number;
          updated_at: string;
        };
        Insert: {
          client_id: string;
          id?: string;
          reward_id: string;
          stamp_count?: number;
          updated_at?: string;
        };
        Update: {
          client_id?: string;
          id?: string;
          reward_id?: string;
          stamp_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'loyalty_wallets_client_id_profiles_id_fk';
            columns: ['client_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'loyalty_wallets_reward_id_rewards_id_fk';
            columns: ['reward_id'];
            isOneToOne: false;
            referencedRelation: 'rewards';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_categories: {
        Row: {
          business_id: string;
          icon_key: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          business_id: string;
          icon_key?: string;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          business_id?: string;
          icon_key?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'menu_categories_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
      menu_items: {
        Row: {
          business_id: string;
          category_id: string | null;
          created_at: string;
          description: string;
          id: string;
          is_available: boolean;
          name: string;
          photo_url: string | null;
          price: number;
        };
        Insert: {
          business_id: string;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          is_available?: boolean;
          name: string;
          photo_url?: string | null;
          price: number;
        };
        Update: {
          business_id?: string;
          category_id?: string | null;
          created_at?: string;
          description?: string;
          id?: string;
          is_available?: boolean;
          name?: string;
          photo_url?: string | null;
          price?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'menu_items_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'menu_items_category_id_menu_categories_id_fk';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'menu_categories';
            referencedColumns: ['id'];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          line_total_pence: number;
          menu_item_id: string | null;
          name: string;
          order_id: string;
          quantity: number;
          unit_price_pence: number;
        };
        Insert: {
          id?: string;
          line_total_pence: number;
          menu_item_id?: string | null;
          name: string;
          order_id: string;
          quantity: number;
          unit_price_pence: number;
        };
        Update: {
          id?: string;
          line_total_pence?: number;
          menu_item_id?: string | null;
          name?: string;
          order_id?: string;
          quantity?: number;
          unit_price_pence?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_order_id_orders_id_fk';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      orders: {
        Row: {
          accepted_at: string | null;
          business_id: string;
          cancellation_reason: string | null;
          channel: Database['public']['Enums']['order_channel'];
          completed_at: string | null;
          confirmation_deadline: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          customer_id: string | null;
          id: string;
          idempotency_key: string;
          location_id: string;
          payment_status: Database['public']['Enums']['order_payment_status'];
          refunded_pence: number;
          status: Database['public']['Enums']['order_status'];
          subtotal_pence: number;
          total_pence: number;
          updated_at: string;
        };
        Insert: {
          accepted_at?: string | null;
          business_id: string;
          cancellation_reason?: string | null;
          channel: Database['public']['Enums']['order_channel'];
          completed_at?: string | null;
          confirmation_deadline?: string | null;
          created_at?: string;
          created_by: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          idempotency_key: string;
          location_id: string;
          payment_status?: Database['public']['Enums']['order_payment_status'];
          refunded_pence?: number;
          status?: Database['public']['Enums']['order_status'];
          subtotal_pence: number;
          total_pence: number;
          updated_at?: string;
        };
        Update: {
          accepted_at?: string | null;
          business_id?: string;
          cancellation_reason?: string | null;
          channel?: Database['public']['Enums']['order_channel'];
          completed_at?: string | null;
          confirmation_deadline?: string | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          customer_id?: string | null;
          id?: string;
          idempotency_key?: string;
          location_id?: string;
          payment_status?: Database['public']['Enums']['order_payment_status'];
          refunded_pence?: number;
          status?: Database['public']['Enums']['order_status'];
          subtotal_pence?: number;
          total_pence?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_created_by_profiles_id_fk';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_customer_id_profiles_id_fk';
            columns: ['customer_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'orders_location_id_business_locations_id_fk';
            columns: ['location_id'];
            isOneToOne: false;
            referencedRelation: 'business_locations';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_attempts: {
        Row: {
          amount_pence: number;
          created_at: string;
          currency: string;
          failure_code: string | null;
          failure_message: string | null;
          id: string;
          idempotency_key: string;
          method: Database['public']['Enums']['payment_method'];
          order_id: string;
          provider: Database['public']['Enums']['payment_provider'];
          provider_capture_id: string | null;
          provider_intent_id: string | null;
          provider_order_id: string | null;
          status: Database['public']['Enums']['payment_status'];
          succeeded_at: string | null;
          updated_at: string;
        };
        Insert: {
          amount_pence: number;
          created_at?: string;
          currency?: string;
          failure_code?: string | null;
          failure_message?: string | null;
          id?: string;
          idempotency_key: string;
          method: Database['public']['Enums']['payment_method'];
          order_id: string;
          provider: Database['public']['Enums']['payment_provider'];
          provider_capture_id?: string | null;
          provider_intent_id?: string | null;
          provider_order_id?: string | null;
          status?: Database['public']['Enums']['payment_status'];
          succeeded_at?: string | null;
          updated_at?: string;
        };
        Update: {
          amount_pence?: number;
          created_at?: string;
          currency?: string;
          failure_code?: string | null;
          failure_message?: string | null;
          id?: string;
          idempotency_key?: string;
          method?: Database['public']['Enums']['payment_method'];
          order_id?: string;
          provider?: Database['public']['Enums']['payment_provider'];
          provider_capture_id?: string | null;
          provider_intent_id?: string | null;
          provider_order_id?: string | null;
          status?: Database['public']['Enums']['payment_status'];
          succeeded_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_attempts_order_id_orders_id_fk';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_connections: {
        Row: {
          business_id: string;
          charges_enabled: boolean;
          created_at: string;
          disabled_at: string | null;
          id: string;
          last_synced_at: string | null;
          payouts_enabled: boolean;
          provider: Database['public']['Enums']['payment_provider'];
          provider_account_id: string | null;
          requirements: Json;
          revoked_at: string | null;
          status: Database['public']['Enums']['payment_connection_status'];
          updated_at: string;
        };
        Insert: {
          business_id: string;
          charges_enabled?: boolean;
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          last_synced_at?: string | null;
          payouts_enabled?: boolean;
          provider: Database['public']['Enums']['payment_provider'];
          provider_account_id?: string | null;
          requirements?: Json;
          revoked_at?: string | null;
          status?: Database['public']['Enums']['payment_connection_status'];
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          charges_enabled?: boolean;
          created_at?: string;
          disabled_at?: string | null;
          id?: string;
          last_synced_at?: string | null;
          payouts_enabled?: boolean;
          provider?: Database['public']['Enums']['payment_provider'];
          provider_account_id?: string | null;
          requirements?: Json;
          revoked_at?: string | null;
          status?: Database['public']['Enums']['payment_connection_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_connections_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_jobs: {
        Row: {
          attempts: number;
          created_at: string;
          id: string;
          idempotency_key: string;
          last_error: string | null;
          lease_until: string | null;
          order_id: string | null;
          refund_id: string | null;
          run_at: string;
          status: Database['public']['Enums']['payment_job_status'];
          type: Database['public']['Enums']['payment_job_type'];
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          id?: string;
          idempotency_key: string;
          last_error?: string | null;
          lease_until?: string | null;
          order_id?: string | null;
          refund_id?: string | null;
          run_at: string;
          status?: Database['public']['Enums']['payment_job_status'];
          type: Database['public']['Enums']['payment_job_type'];
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          id?: string;
          idempotency_key?: string;
          last_error?: string | null;
          lease_until?: string | null;
          order_id?: string | null;
          refund_id?: string | null;
          run_at?: string;
          status?: Database['public']['Enums']['payment_job_status'];
          type?: Database['public']['Enums']['payment_job_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_jobs_order_id_orders_id_fk';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_jobs_refund_id_payment_refunds_id_fk';
            columns: ['refund_id'];
            isOneToOne: false;
            referencedRelation: 'payment_refunds';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_refunds: {
        Row: {
          amount_pence: number;
          completed_at: string | null;
          created_at: string;
          failure_message: string | null;
          id: string;
          idempotency_key: string;
          order_id: string;
          payment_attempt_id: string;
          provider_refund_id: string | null;
          reason: string;
          requested_by: string | null;
          status: Database['public']['Enums']['refund_status'];
          updated_at: string;
        };
        Insert: {
          amount_pence: number;
          completed_at?: string | null;
          created_at?: string;
          failure_message?: string | null;
          id?: string;
          idempotency_key: string;
          order_id: string;
          payment_attempt_id: string;
          provider_refund_id?: string | null;
          reason: string;
          requested_by?: string | null;
          status?: Database['public']['Enums']['refund_status'];
          updated_at?: string;
        };
        Update: {
          amount_pence?: number;
          completed_at?: string | null;
          created_at?: string;
          failure_message?: string | null;
          id?: string;
          idempotency_key?: string;
          order_id?: string;
          payment_attempt_id?: string;
          provider_refund_id?: string | null;
          reason?: string;
          requested_by?: string | null;
          status?: Database['public']['Enums']['refund_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_refunds_order_id_orders_id_fk';
            columns: ['order_id'];
            isOneToOne: false;
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_refunds_payment_attempt_id_payment_attempts_id_fk';
            columns: ['payment_attempt_id'];
            isOneToOne: false;
            referencedRelation: 'payment_attempts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_refunds_requested_by_profiles_id_fk';
            columns: ['requested_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_return_states: {
        Row: {
          business_id: string;
          consumed_at: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          order_id: string | null;
          profile_id: string;
          provider: Database['public']['Enums']['payment_provider'];
          purpose: string;
          token_hash: string;
        };
        Insert: {
          business_id: string;
          consumed_at?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          order_id?: string | null;
          profile_id: string;
          provider: Database['public']['Enums']['payment_provider'];
          purpose: string;
          token_hash: string;
        };
        Update: {
          business_id?: string;
          consumed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          order_id?: string | null;
          profile_id?: string;
          provider?: Database['public']['Enums']['payment_provider'];
          purpose?: string;
          token_hash?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payment_return_states_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'payment_return_states_profile_id_profiles_id_fk';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      payment_webhook_events: {
        Row: {
          attempts: number;
          created_at: string;
          event_type: string;
          id: string;
          last_error: string | null;
          payload: Json;
          processed_at: string | null;
          provider: Database['public']['Enums']['payment_provider'];
          provider_account_id: string | null;
          provider_event_id: string;
          state: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          event_type: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          processed_at?: string | null;
          provider: Database['public']['Enums']['payment_provider'];
          provider_account_id?: string | null;
          provider_event_id: string;
          state?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          event_type?: string;
          id?: string;
          last_error?: string | null;
          payload?: Json;
          processed_at?: string | null;
          provider?: Database['public']['Enums']['payment_provider'];
          provider_account_id?: string | null;
          provider_event_id?: string;
          state?: string;
        };
        Relationships: [];
      };
      platform_admins: {
        Row: {
          created_at: string;
          profile_id: string;
        };
        Insert: {
          created_at?: string;
          profile_id: string;
        };
        Update: {
          created_at?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'platform_admins_profile_id_profiles_id_fk';
            columns: ['profile_id'];
            isOneToOne: true;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      post_event_reminders: {
        Row: {
          minutes_before: number;
          post_id: string;
        };
        Insert: {
          minutes_before: number;
          post_id: string;
        };
        Update: {
          minutes_before?: number;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_event_reminders_post_id_posts_id_fk';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      posts: {
        Row: {
          archived_at: string | null;
          author_display_name: string;
          body_document: Json;
          body_text: string;
          business_id: string;
          cover_path: string | null;
          created_at: string;
          created_by: string | null;
          event_all_day: boolean;
          event_cancellation_reason: string | null;
          event_cancelled_at: string | null;
          event_ends_at: string | null;
          event_notification_version: number;
          event_starts_at: string | null;
          event_timezone: string | null;
          event_venue_address: string | null;
          event_venue_name: string | null;
          excerpt: string;
          id: string;
          is_pinned: boolean;
          kind: Database['public']['Enums']['post_kind'];
          published_at: string | null;
          title: string;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          archived_at?: string | null;
          author_display_name?: string;
          body_document?: Json;
          body_text: string;
          business_id: string;
          cover_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          event_all_day?: boolean;
          event_cancellation_reason?: string | null;
          event_cancelled_at?: string | null;
          event_ends_at?: string | null;
          event_notification_version?: number;
          event_starts_at?: string | null;
          event_timezone?: string | null;
          event_venue_address?: string | null;
          event_venue_name?: string | null;
          excerpt?: string;
          id?: string;
          is_pinned?: boolean;
          kind?: Database['public']['Enums']['post_kind'];
          published_at?: string | null;
          title: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          archived_at?: string | null;
          author_display_name?: string;
          body_document?: Json;
          body_text?: string;
          business_id?: string;
          cover_path?: string | null;
          created_at?: string;
          created_by?: string | null;
          event_all_day?: boolean;
          event_cancellation_reason?: string | null;
          event_cancelled_at?: string | null;
          event_ends_at?: string | null;
          event_notification_version?: number;
          event_starts_at?: string | null;
          event_timezone?: string | null;
          event_venue_address?: string | null;
          event_venue_name?: string | null;
          excerpt?: string;
          id?: string;
          is_pinned?: boolean;
          kind?: Database['public']['Enums']['post_kind'];
          published_at?: string | null;
          title?: string;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_created_by_profiles_id_fk';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_updated_by_profiles_id_fk';
            columns: ['updated_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          description: string;
          display_name: string;
          id: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          description?: string;
          display_name: string;
          id: string;
          role: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          description?: string;
          display_name?: string;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [];
      };
      push_deliveries: {
        Row: {
          attempts: number;
          created_at: string;
          device_id: string;
          expo_ticket_id: string | null;
          id: string;
          job_id: string;
          last_error: string | null;
          next_attempt_at: string | null;
          status: Database['public']['Enums']['push_delivery_status'];
          updated_at: string;
        };
        Insert: {
          attempts?: number;
          created_at?: string;
          device_id: string;
          expo_ticket_id?: string | null;
          id?: string;
          job_id: string;
          last_error?: string | null;
          next_attempt_at?: string | null;
          status?: Database['public']['Enums']['push_delivery_status'];
          updated_at?: string;
        };
        Update: {
          attempts?: number;
          created_at?: string;
          device_id?: string;
          expo_ticket_id?: string | null;
          id?: string;
          job_id?: string;
          last_error?: string | null;
          next_attempt_at?: string | null;
          status?: Database['public']['Enums']['push_delivery_status'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_deliveries_device_id_push_devices_id_fk';
            columns: ['device_id'];
            isOneToOne: false;
            referencedRelation: 'push_devices';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'push_deliveries_job_id_event_notification_jobs_id_fk';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'event_notification_jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      push_devices: {
        Row: {
          created_at: string;
          enabled: boolean;
          expo_push_token: string;
          id: string;
          last_seen_at: string;
          platform: string;
          profile_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          expo_push_token: string;
          id?: string;
          last_seen_at?: string;
          platform: string;
          profile_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          expo_push_token?: string;
          id?: string;
          last_seen_at?: string;
          platform?: string;
          profile_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'push_devices_profile_id_profiles_id_fk';
            columns: ['profile_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      reviews: {
        Row: {
          author_id: string;
          body: string;
          business_id: string;
          created_at: string;
          id: string;
          menu_item_id: string | null;
          rating: number;
          target: Database['public']['Enums']['review_target'];
          updated_at: string;
        };
        Insert: {
          author_id: string;
          body?: string;
          business_id: string;
          created_at?: string;
          id?: string;
          menu_item_id?: string | null;
          rating: number;
          target: Database['public']['Enums']['review_target'];
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          business_id?: string;
          created_at?: string;
          id?: string;
          menu_item_id?: string | null;
          rating?: number;
          target?: Database['public']['Enums']['review_target'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reviews_author_id_profiles_id_fk';
            columns: ['author_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reviews_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
        ];
      };
      reward_items: {
        Row: {
          menu_item_id: string;
          quantity: number;
          reward_id: string;
        };
        Insert: {
          menu_item_id: string;
          quantity?: number;
          reward_id: string;
        };
        Update: {
          menu_item_id?: string;
          quantity?: number;
          reward_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reward_items_menu_item_id_menu_items_id_fk';
            columns: ['menu_item_id'];
            isOneToOne: false;
            referencedRelation: 'menu_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reward_items_reward_id_rewards_id_fk';
            columns: ['reward_id'];
            isOneToOne: false;
            referencedRelation: 'rewards';
            referencedColumns: ['id'];
          },
        ];
      };
      rewards: {
        Row: {
          business_id: string;
          created_at: string;
          description: string;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          stamps_required: number | null;
          starts_at: string | null;
          title: string;
          type: Database['public']['Enums']['reward_type'];
        };
        Insert: {
          business_id: string;
          created_at?: string;
          description?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          stamps_required?: number | null;
          starts_at?: string | null;
          title: string;
          type: Database['public']['Enums']['reward_type'];
        };
        Update: {
          business_id?: string;
          created_at?: string;
          description?: string;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean;
          stamps_required?: number | null;
          starts_at?: string | null;
          title?: string;
          type?: Database['public']['Enums']['reward_type'];
        };
        Relationships: [
          {
            foreignKeyName: 'rewards_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
        ];
      };
      stamp_transactions: {
        Row: {
          amount: number;
          created_at: string;
          id: string;
          issued_by: string;
          note: string | null;
          wallet_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          id?: string;
          issued_by: string;
          note?: string | null;
          wallet_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          id?: string;
          issued_by?: string;
          note?: string | null;
          wallet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stamp_transactions_issued_by_profiles_id_fk';
            columns: ['issued_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stamp_transactions_wallet_id_loyalty_wallets_id_fk';
            columns: ['wallet_id'];
            isOneToOne: false;
            referencedRelation: 'loyalty_wallets';
            referencedColumns: ['id'];
          },
        ];
      };
      terminal_locations: {
        Row: {
          active: boolean;
          business_id: string;
          business_location_id: string;
          created_at: string;
          id: string;
          provider_location_id: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          business_id: string;
          business_location_id: string;
          created_at?: string;
          id?: string;
          provider_location_id: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          business_id?: string;
          business_location_id?: string;
          created_at?: string;
          id?: string;
          provider_location_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'terminal_locations_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'terminal_locations_business_location_id_business_locations_id_f';
            columns: ['business_location_id'];
            isOneToOne: false;
            referencedRelation: 'business_locations';
            referencedColumns: ['id'];
          },
        ];
      };
      terminal_readers: {
        Row: {
          business_id: string;
          created_at: string;
          device_type: string;
          id: string;
          label: string;
          last_seen_at: string | null;
          provider_reader_id: string;
          registration_code_last4: string | null;
          status: string;
          terminal_location_id: string;
          updated_at: string;
        };
        Insert: {
          business_id: string;
          created_at?: string;
          device_type: string;
          id?: string;
          label: string;
          last_seen_at?: string | null;
          provider_reader_id: string;
          registration_code_last4?: string | null;
          status?: string;
          terminal_location_id: string;
          updated_at?: string;
        };
        Update: {
          business_id?: string;
          created_at?: string;
          device_type?: string;
          id?: string;
          label?: string;
          last_seen_at?: string | null;
          provider_reader_id?: string;
          registration_code_last4?: string | null;
          status?: string;
          terminal_location_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'terminal_readers_business_id_businesses_id_fk';
            columns: ['business_id'];
            isOneToOne: false;
            referencedRelation: 'businesses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'terminal_readers_terminal_location_id_terminal_locations_id_fk';
            columns: ['terminal_location_id'];
            isOneToOne: false;
            referencedRelation: 'terminal_locations';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      add_default_menu_categories: {
        Args: { target_business_id: string };
        Returns: number;
      };
      accept_business_invitation: {
        Args: { invitation_token: string };
        Returns: string;
      };
      approve_business_legal_profile: {
        Args: {
          authority_attested: boolean;
          expected_revision: number;
          target_business_id: string;
        };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          change_request_note: string;
          charity_number: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          country: string;
          created_at: string;
          entity_type: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by: string | null;
          legal_name: string;
          registered_address_line1: string;
          registered_address_line2: string;
          registered_county: string;
          registered_postcode: string;
          registered_town_city: string;
          revision: number;
          status: Database['public']['Enums']['legal_profile_status'];
          submitted_at: string | null;
          submitted_by: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          vat_registered: boolean;
        };
        SetofOptions: {
          from: '*';
          to: 'business_legal_profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      archive_business_content: {
        Args: { target_post_id: string };
        Returns: undefined;
      };
      business_role_has_permission: {
        Args: {
          member_role: Database['public']['Enums']['business_member_role'];
          permission_key: string;
        };
        Returns: boolean;
      };
      cancel_business_event: {
        Args: { cancellation_reason: string; target_post_id: string };
        Returns: undefined;
      };
      cancel_unpaid_order: {
        Args: { target_order_id: string };
        Returns: {
          accepted_at: string | null;
          business_id: string;
          cancellation_reason: string | null;
          channel: Database['public']['Enums']['order_channel'];
          completed_at: string | null;
          confirmation_deadline: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          customer_id: string | null;
          id: string;
          idempotency_key: string;
          location_id: string;
          payment_status: Database['public']['Enums']['order_payment_status'];
          refunded_pence: number;
          status: Database['public']['Enums']['order_status'];
          subtotal_pence: number;
          total_pence: number;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'orders';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      change_business_member_role: {
        Args: {
          next_role: Database['public']['Enums']['business_member_role'];
          target_business_id: string;
          target_profile_id: string;
        };
        Returns: undefined;
      };
      check_menu_category_name: {
        Args: {
          excluded_category_id?: string | null;
          proposed_name: string;
          target_business_id: string;
        };
        Returns: {
          category_id: string;
          category_name: string;
          match_kind: string;
          similarity_score: number;
        }[];
      };
      claim_event_notification_jobs: {
        Args: { batch_size?: number };
        Returns: {
          attempts: number;
          created_at: string;
          due_at: string;
          event_version: number;
          id: string;
          job_type: Database['public']['Enums']['event_notification_job_type'];
          last_error: string | null;
          next_attempt_at: string | null;
          post_id: string;
          processed_at: string | null;
          reminder_minutes: number;
          status: Database['public']['Enums']['notification_job_status'];
        }[];
        SetofOptions: {
          from: '*';
          to: 'event_notification_jobs';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      claim_loyalty_challenge: {
        Args: { challenge_token: string };
        Returns: {
          business_id: string;
          challenge_id: string;
          customer_id: string;
          customer_name: string;
          error_message: string;
          expires_at: string;
          offer_id: string;
          purpose: Database['public']['Enums']['loyalty_challenge_purpose'];
        }[];
      };
      claim_payment_jobs: {
        Args: { batch_size?: number };
        Returns: {
          attempts: number;
          created_at: string;
          id: string;
          idempotency_key: string;
          last_error: string | null;
          lease_until: string | null;
          order_id: string | null;
          refund_id: string | null;
          run_at: string;
          status: Database['public']['Enums']['payment_job_status'];
          type: Database['public']['Enums']['payment_job_type'];
          updated_at: string;
        }[];
        SetofOptions: {
          from: '*';
          to: 'payment_jobs';
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      confirm_loyalty_earning: {
        Args: {
          final_eligible_pence: number;
          request_key: string;
          requested_items: Json;
          target_challenge_id: string;
        };
        Returns: Json;
      };
      consume_loyalty_redemption: {
        Args: {
          request_key: string;
          requested_items: Json;
          target_challenge_id: string;
        };
        Returns: {
          account_id: string | null;
          balance_cost: number;
          benefit_snapshot: Json;
          consumed_at: string;
          consumed_by: string;
          customer_id: string;
          id: string;
          idempotency_key: string;
          offer_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'loyalty_redemptions';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_business_invitation: {
        Args: {
          invite_email: string;
          invite_role: Database['public']['Enums']['business_member_role'];
          target_business_id: string;
        };
        Returns: {
          invitation_expires_at: string;
          invitation_id: string;
          invitation_token: string;
        }[];
      };
      create_loyalty_challenge: {
        Args: {
          requested_purpose: Database['public']['Enums']['loyalty_challenge_purpose'];
          target_business_id: string;
          target_offer_id?: string;
        };
        Returns: {
          challenge_id: string;
          challenge_token: string;
          expires_at: string;
        }[];
      };
      create_trusted_order: {
        Args: {
          request_key: string;
          requested_channel: Database['public']['Enums']['order_channel'];
          requested_items: Json;
          target_business_id: string;
        };
        Returns: {
          accepted_at: string | null;
          business_id: string;
          cancellation_reason: string | null;
          channel: Database['public']['Enums']['order_channel'];
          completed_at: string | null;
          confirmation_deadline: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          customer_id: string | null;
          id: string;
          idempotency_key: string;
          location_id: string;
          payment_status: Database['public']['Enums']['order_payment_status'];
          refunded_pence: number;
          status: Database['public']['Enums']['order_status'];
          subtotal_pence: number;
          total_pence: number;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'orders';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      current_business_role: {
        Args: { target_business_id: string };
        Returns: Database['public']['Enums']['business_member_role'];
      };
      delete_business_content_draft: {
        Args: { target_post_id: string };
        Returns: string;
      };
      delete_menu_category: {
        Args: { target_business_id: string; target_category_id: string };
        Returns: undefined;
      };
      disable_push_device: {
        Args: { device_token: string };
        Returns: undefined;
      };
      get_business_legal_profile: {
        Args: { target_business_id: string };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          change_request_note: string;
          charity_number: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          country: string;
          created_at: string;
          entity_type: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by: string | null;
          legal_name: string;
          registered_address_line1: string;
          registered_address_line2: string;
          registered_county: string;
          registered_postcode: string;
          registered_town_city: string;
          revision: number;
          status: Database['public']['Enums']['legal_profile_status'];
          submitted_at: string | null;
          submitted_by: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          vat_registered: boolean;
        };
        SetofOptions: {
          from: '*';
          to: 'business_legal_profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_public_business_catalog: {
        Args: {
          cursor_id?: string | null;
          cursor_name?: string | null;
          page_size?: number;
          search_text?: string | null;
        };
        Returns: {
          address: string;
          category: string;
          description: string;
          header_url: string;
          id: string;
          logo_url: string;
          name: string;
          rating: number;
          review_count: number;
        }[];
      };
      get_public_business_detail: {
        Args: { target_business_id: string };
        Returns: {
          address: string;
          category: string;
          description: string;
          header_url: string;
          hours: Json;
          id: string;
          logo_url: string;
          name: string;
          phone: string;
          rating: number;
          review_count: number;
          social_links: Json;
          timezone: string;
          website_url: string;
        }[];
      };
      get_public_business_menu: {
        Args: { target_business_id: string };
        Returns: {
          category_id: string;
          category_icon_key: string;
          category_name: string;
          category_sort_order: number;
          event_available_from: string;
          event_available_until: string;
          event_badge: string;
          event_id: string;
          event_message: string;
          event_title: string;
          item_created_at: string;
          item_description: string;
          item_id: string;
          item_name: string;
          item_photo_url: string;
          item_price: number;
        }[];
      };
      get_public_content_feed: {
        Args: {
          cursor_id?: string | null;
          cursor_pinned?: boolean | null;
          cursor_published_at?: string | null;
          followed_only?: boolean;
          page_size?: number;
          requested_kind?: string | null;
          target_business_id?: string | null;
          target_post_id?: string | null;
        };
        Returns: {
          archived_at: string;
          author_display_name: string;
          body_document: Json;
          body_text: string;
          business_id: string;
          business_logo_url: string;
          business_name: string;
          cover_path: string;
          created_at: string;
          event_all_day: boolean;
          event_cancellation_reason: string;
          event_cancelled_at: string;
          event_ends_at: string;
          event_starts_at: string;
          event_timezone: string;
          event_venue_address: string;
          event_venue_name: string;
          excerpt: string;
          id: string;
          is_pinned: boolean;
          kind: Database['public']['Enums']['post_kind'];
          published_at: string;
          reminder_minutes: number[];
          title: string;
          updated_at: string;
        }[];
      };
      has_business_permission: {
        Args: { permission_key: string; target_business_id: string };
        Returns: boolean;
      };
      is_platform_admin: { Args: never; Returns: boolean };
      join_loyalty_program: {
        Args: { target_program_id: string };
        Returns: {
          balance: number;
          customer_id: string;
          id: string;
          joined_at: string;
          joined_version: number;
          lifetime_earned: number;
          program_id: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'loyalty_accounts';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      legal_profile_is_complete: {
        Args: {
          profile: Database['public']['Tables']['business_legal_profiles']['Row'];
        };
        Returns: boolean;
      };
      owns_business: { Args: { target_business_id: string }; Returns: boolean };
      rebuild_event_reminder_jobs: {
        Args: { target_post_id: string };
        Returns: undefined;
      };
      register_push_device: {
        Args: { device_platform: string; device_token: string };
        Returns: string;
      };
      request_business_legal_profile_changes: {
        Args: {
          expected_revision: number;
          review_note: string;
          target_business_id: string;
        };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          change_request_note: string;
          charity_number: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          country: string;
          created_at: string;
          entity_type: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by: string | null;
          legal_name: string;
          registered_address_line1: string;
          registered_address_line2: string;
          registered_county: string;
          registered_postcode: string;
          registered_town_city: string;
          revision: number;
          status: Database['public']['Enums']['legal_profile_status'];
          submitted_at: string | null;
          submitted_by: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          vat_registered: boolean;
        };
        SetofOptions: {
          from: '*';
          to: 'business_legal_profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      request_payment_refund: {
        Args: {
          refund_reason: string;
          request_key: string;
          requested_amount_pence: number;
          target_order_id: string;
        };
        Returns: {
          amount_pence: number;
          completed_at: string | null;
          created_at: string;
          failure_message: string | null;
          id: string;
          idempotency_key: string;
          order_id: string;
          payment_attempt_id: string;
          provider_refund_id: string | null;
          reason: string;
          requested_by: string | null;
          status: Database['public']['Enums']['refund_status'];
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'payment_refunds';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      reverse_loyalty_purchase: {
        Args: {
          reason: string;
          request_key: string;
          target_purchase_id: string;
        };
        Returns: {
          business_id: string;
          created_at: string;
          customer_id: string;
          final_eligible_pence: number;
          id: string;
          idempotency_key: string;
          reversal_reason: string | null;
          reversed_at: string | null;
          reversed_by: string | null;
          source: string;
          verified_by: string;
        };
        SetofOptions: {
          from: '*';
          to: 'loyalty_purchase_events';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      review_business_application: {
        Args: {
          approve: boolean;
          review_reason?: string | null;
          target_application_id: string;
        };
        Returns: string;
      };
      revoke_business_invitation: {
        Args: { target_invitation_id: string };
        Returns: undefined;
      };
      reorder_menu_categories: {
        Args: { ordered_category_ids: string[]; target_business_id: string };
        Returns: undefined;
      };
      save_business_content: {
        Args: {
          content_body_document: Json;
          content_body_text: string;
          content_cover_path: string | null;
          content_event_all_day: boolean;
          content_event_ends_at: string | null;
          content_event_starts_at: string | null;
          content_event_timezone: string | null;
          content_event_venue_address: string | null;
          content_event_venue_name: string | null;
          content_excerpt: string;
          content_is_pinned: boolean;
          content_kind: string;
          content_reminder_minutes: number[];
          content_title: string;
          target_business_id: string;
          target_post_id: string | null;
        };
        Returns: string;
      };
      save_business_legal_profile: {
        Args: {
          expected_revision: number;
          profile_input: Json;
          target_business_id: string;
        };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          change_request_note: string;
          charity_number: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          country: string;
          created_at: string;
          entity_type: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by: string | null;
          legal_name: string;
          registered_address_line1: string;
          registered_address_line2: string;
          registered_county: string;
          registered_postcode: string;
          registered_town_city: string;
          revision: number;
          status: Database['public']['Enums']['legal_profile_status'];
          submitted_at: string | null;
          submitted_by: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          vat_registered: boolean;
        };
        SetofOptions: {
          from: '*';
          to: 'business_legal_profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_menu_category: {
        Args: {
          allow_similar?: boolean;
          proposed_name: string;
          proposed_icon_key: string;
          target_business_id: string;
          target_category_id: string | null;
        };
        Returns: Database['public']['Tables']['menu_categories']['Row'];
        SetofOptions: {
          from: '*';
          to: 'menu_categories';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_event_menu_link: {
        Args: {
          available_from: string;
          available_until: string;
          badge_text: string;
          is_event_only: boolean;
          message_text: string;
          target_event_id: string;
          target_menu_item_id: string;
        };
        Returns: {
          available_from: string;
          available_until: string;
          badge: string;
          created_at: string;
          event_id: string;
          event_only: boolean;
          menu_item_id: string;
          message: string;
        };
        SetofOptions: {
          from: '*';
          to: 'event_menu_items';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_loyalty_offer: {
        Args: {
          input: Json;
          target_business_id: string;
          target_offer_id: string | null;
        };
        Returns: {
          amount_pence: number | null;
          audience: Database['public']['Enums']['loyalty_offer_audience'];
          balance_cost: number | null;
          benefit_type: Database['public']['Enums']['loyalty_benefit_type'];
          business_id: string;
          created_at: string;
          description: string;
          ends_at: string | null;
          id: string;
          is_active: boolean;
          kind: Database['public']['Enums']['loyalty_offer_kind'];
          percentage_off: number | null;
          program_id: string | null;
          staff_instructions: string;
          starts_at: string | null;
          tier_id: string | null;
          title: string;
          updated_at: string;
          usage_limit: number | null;
          usage_period: Database['public']['Enums']['loyalty_usage_period'] | null;
        };
        SetofOptions: {
          from: '*';
          to: 'loyalty_offers';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      save_loyalty_program: {
        Args: {
          input: Json;
          target_business_id: string;
          target_program_id: string | null;
        };
        Returns: {
          archived_at: string | null;
          business_id: string;
          created_at: string;
          created_by: string;
          current_version: number;
          description: string;
          ends_at: string | null;
          id: string;
          name: string;
          starts_at: string | null;
          status: Database['public']['Enums']['loyalty_program_status'];
          type: Database['public']['Enums']['loyalty_program_type'];
          unit_plural: string;
          unit_singular: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'loyalty_programs';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      set_business_content_publication: {
        Args: { publication_time: string; target_post_id: string };
        Returns: undefined;
      };
      set_business_member_status: {
        Args: {
          next_status: Database['public']['Enums']['business_membership_status'];
          target_business_id: string;
          target_profile_id: string;
        };
        Returns: undefined;
      };
      set_loyalty_program_status: {
        Args: {
          next_status: Database['public']['Enums']['loyalty_program_status'];
          target_program_id: string;
        };
        Returns: {
          archived_at: string | null;
          business_id: string;
          created_at: string;
          created_by: string;
          current_version: number;
          description: string;
          ends_at: string | null;
          id: string;
          name: string;
          starts_at: string | null;
          status: Database['public']['Enums']['loyalty_program_status'];
          type: Database['public']['Enums']['loyalty_program_type'];
          unit_plural: string;
          unit_singular: string;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'loyalty_programs';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      submit_business_application: {
        Args: { target_application_id: string };
        Returns: {
          address: string;
          applicant_id: string;
          category: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          created_at: string;
          description: string;
          id: string;
          legal_name: string;
          rejection_reason: string | null;
          reviewed_at: string | null;
          status: Database['public']['Enums']['business_application_status'];
          submitted_at: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          website_url: string;
        };
        SetofOptions: {
          from: '*';
          to: 'business_applications';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      submit_business_legal_profile: {
        Args: { expected_revision: number; target_business_id: string };
        Returns: {
          approved_at: string | null;
          approved_by: string | null;
          business_id: string;
          change_request_note: string;
          charity_number: string;
          company_number: string;
          contact_email: string;
          contact_phone: string;
          country: string;
          created_at: string;
          entity_type: Database['public']['Enums']['uk_legal_entity_type'];
          last_edited_by: string | null;
          legal_name: string;
          registered_address_line1: string;
          registered_address_line2: string;
          registered_county: string;
          registered_postcode: string;
          registered_town_city: string;
          revision: number;
          status: Database['public']['Enums']['legal_profile_status'];
          submitted_at: string | null;
          submitted_by: string | null;
          trading_name: string;
          updated_at: string;
          vat_number: string;
          vat_registered: boolean;
        };
        SetofOptions: {
          from: '*';
          to: 'business_legal_profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      update_order_fulfilment: {
        Args: {
          next_status: Database['public']['Enums']['order_status'];
          reason?: string;
          target_order_id: string;
        };
        Returns: {
          accepted_at: string | null;
          business_id: string;
          cancellation_reason: string | null;
          channel: Database['public']['Enums']['order_channel'];
          completed_at: string | null;
          confirmation_deadline: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          customer_id: string | null;
          id: string;
          idempotency_key: string;
          location_id: string;
          payment_status: Database['public']['Enums']['order_payment_status'];
          refunded_pence: number;
          status: Database['public']['Enums']['order_status'];
          subtotal_pence: number;
          total_pence: number;
          updated_at: string;
        };
        SetofOptions: {
          from: '*';
          to: 'orders';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      business_application_status:
        'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
      business_invitation_status: 'pending' | 'accepted' | 'revoked' | 'expired';
      business_member_role: 'owner' | 'admin' | 'manager' | 'finance' | 'barista' | 'viewer';
      business_membership_status: 'invited' | 'active' | 'suspended' | 'removed';
      business_status: 'onboarding' | 'active' | 'suspended' | 'closed';
      event_notification_job_type: 'reminder' | 'updated' | 'cancelled';
      legal_profile_status: 'draft' | 'pending_approval' | 'approved';
      loyalty_benefit_type:
        'free_item' | 'custom_perk' | 'fixed_discount' | 'percentage_discount' | 'bundle_price';
      loyalty_challenge_purpose: 'earn' | 'redeem';
      loyalty_challenge_status: 'issued' | 'claimed' | 'consumed' | 'expired';
      loyalty_earning_method: 'item' | 'spend';
      loyalty_ledger_kind: 'earn' | 'redeem' | 'reversal' | 'migration';
      loyalty_offer_audience: 'everyone' | 'members' | 'tier';
      loyalty_offer_kind: 'balance_reward' | 'tier_perk' | 'promotion';
      loyalty_program_status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
      loyalty_program_type: 'stamp' | 'points';
      loyalty_usage_period: 'day' | 'week' | 'month';
      notification_job_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
      order_channel: 'customer' | 'till';
      order_payment_status:
        'unpaid' | 'processing' | 'paid' | 'refund_pending' | 'partially_refunded' | 'refunded' | 'failed';
      order_status:
        | 'awaiting_payment'
        | 'needs_confirmation'
        | 'accepted'
        | 'preparing'
        | 'ready'
        | 'completed'
        | 'cancelled'
        | 'refund_pending'
        | 'refunded';
      payment_connection_status:
        'not_started' | 'onboarding' | 'restricted' | 'ready' | 'disabled' | 'revoked';
      payment_job_status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
      payment_job_type: 'expire_order' | 'refund' | 'reconcile';
      payment_method: 'card' | 'apple_pay' | 'google_pay' | 'paypal' | 'terminal_card';
      payment_provider: 'stripe' | 'paypal';
      payment_status:
        | 'created'
        | 'requires_action'
        | 'processing'
        | 'succeeded'
        | 'failed'
        | 'cancelled'
        | 'partially_refunded'
        | 'refunded';
      post_kind: 'news' | 'event';
      push_delivery_status: 'pending' | 'ticketed' | 'delivered' | 'failed';
      refund_status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
      review_target: 'business' | 'menu_item';
      reward_type: 'stamp_card' | 'bonus' | 'combo';
      uk_legal_entity_type:
        | 'sole_trader'
        | 'limited_company'
        | 'limited_liability_partnership'
        | 'partnership'
        | 'charity'
        | 'other_organisation';
      user_role: 'client' | 'business';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema['Tables'] & DefaultSchema['Views']) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      business_application_status: [
        'draft',
        'submitted',
        'under_review',
        'approved',
        'rejected',
        'withdrawn',
      ],
      business_invitation_status: ['pending', 'accepted', 'revoked', 'expired'],
      business_member_role: ['owner', 'admin', 'manager', 'finance', 'barista', 'viewer'],
      business_membership_status: ['invited', 'active', 'suspended', 'removed'],
      business_status: ['onboarding', 'active', 'suspended', 'closed'],
      event_notification_job_type: ['reminder', 'updated', 'cancelled'],
      legal_profile_status: ['draft', 'pending_approval', 'approved'],
      loyalty_benefit_type: [
        'free_item',
        'custom_perk',
        'fixed_discount',
        'percentage_discount',
        'bundle_price',
      ],
      loyalty_challenge_purpose: ['earn', 'redeem'],
      loyalty_challenge_status: ['issued', 'claimed', 'consumed', 'expired'],
      loyalty_earning_method: ['item', 'spend'],
      loyalty_ledger_kind: ['earn', 'redeem', 'reversal', 'migration'],
      loyalty_offer_audience: ['everyone', 'members', 'tier'],
      loyalty_offer_kind: ['balance_reward', 'tier_perk', 'promotion'],
      loyalty_program_status: ['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'],
      loyalty_program_type: ['stamp', 'points'],
      loyalty_usage_period: ['day', 'week', 'month'],
      notification_job_status: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      order_channel: ['customer', 'till'],
      order_payment_status: [
        'unpaid',
        'processing',
        'paid',
        'refund_pending',
        'partially_refunded',
        'refunded',
        'failed',
      ],
      order_status: [
        'awaiting_payment',
        'needs_confirmation',
        'accepted',
        'preparing',
        'ready',
        'completed',
        'cancelled',
        'refund_pending',
        'refunded',
      ],
      payment_connection_status: ['not_started', 'onboarding', 'restricted', 'ready', 'disabled', 'revoked'],
      payment_job_status: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      payment_job_type: ['expire_order', 'refund', 'reconcile'],
      payment_method: ['card', 'apple_pay', 'google_pay', 'paypal', 'terminal_card'],
      payment_provider: ['stripe', 'paypal'],
      payment_status: [
        'created',
        'requires_action',
        'processing',
        'succeeded',
        'failed',
        'cancelled',
        'partially_refunded',
        'refunded',
      ],
      post_kind: ['news', 'event'],
      push_delivery_status: ['pending', 'ticketed', 'delivered', 'failed'],
      refund_status: ['pending', 'processing', 'succeeded', 'failed', 'cancelled'],
      review_target: ['business', 'menu_item'],
      reward_type: ['stamp_card', 'bonus', 'combo'],
      uk_legal_entity_type: [
        'sole_trader',
        'limited_company',
        'limited_liability_partnership',
        'partnership',
        'charity',
        'other_organisation',
      ],
      user_role: ['client', 'business'],
    },
  },
} as const;
