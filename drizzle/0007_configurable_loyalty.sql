CREATE TYPE "public"."loyalty_benefit_type" AS ENUM('free_item', 'custom_perk', 'fixed_discount', 'percentage_discount', 'bundle_price');--> statement-breakpoint
CREATE TYPE "public"."loyalty_challenge_purpose" AS ENUM('earn', 'redeem');--> statement-breakpoint
CREATE TYPE "public"."loyalty_challenge_status" AS ENUM('issued', 'claimed', 'consumed', 'expired');--> statement-breakpoint
CREATE TYPE "public"."loyalty_earning_method" AS ENUM('item', 'spend');--> statement-breakpoint
CREATE TYPE "public"."loyalty_ledger_kind" AS ENUM('earn', 'redeem', 'reversal', 'migration');--> statement-breakpoint
CREATE TYPE "public"."loyalty_offer_audience" AS ENUM('everyone', 'members', 'tier');--> statement-breakpoint
CREATE TYPE "public"."loyalty_offer_kind" AS ENUM('balance_reward', 'tier_perk', 'promotion');--> statement-breakpoint
CREATE TYPE "public"."loyalty_program_status" AS ENUM('draft', 'scheduled', 'active', 'paused', 'ended', 'archived');--> statement-breakpoint
CREATE TYPE "public"."loyalty_program_type" AS ENUM('stamp', 'points');--> statement-breakpoint
CREATE TYPE "public"."loyalty_usage_period" AS ENUM('day', 'week', 'month');--> statement-breakpoint
CREATE TABLE "event_menu_items" (
	"event_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"badge" text DEFAULT 'Event special' NOT NULL,
	"message" text NOT NULL,
	"available_from" timestamp with time zone NOT NULL,
	"available_until" timestamp with time zone NOT NULL,
	"event_only" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_menu_items_event_id_menu_item_id_pk" PRIMARY KEY("event_id","menu_item_id"),
	CONSTRAINT "event_menu_items_dates_check" CHECK ("event_menu_items"."available_until" > "event_menu_items"."available_from")
);
--> statement-breakpoint
CREATE TABLE "loyalty_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"joined_version" integer NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_accounts_balances_check" CHECK ("loyalty_accounts"."balance" >= 0 and "loyalty_accounts"."lifetime_earned" >= 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_fraud_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid,
	"customer_id" uuid,
	"actor_id" uuid,
	"event_type" text NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" uuid NOT NULL,
	"kind" "loyalty_ledger_kind" NOT NULL,
	"amount" integer NOT NULL,
	"lifetime_amount" integer DEFAULT 0 NOT NULL,
	"purchase_id" uuid,
	"redemption_id" uuid,
	"reversal_of_id" uuid,
	"actor_id" uuid NOT NULL,
	"idempotency_key" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_ledger_amount_check" CHECK ("loyalty_ledger"."amount" <> 0 or "loyalty_ledger"."lifetime_amount" <> 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_meal_deal_group_items" (
	"group_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	CONSTRAINT "loyalty_meal_deal_group_items_group_id_menu_item_id_pk" PRIMARY KEY("group_id","menu_item_id")
);
--> statement-breakpoint
CREATE TABLE "loyalty_meal_deal_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"name" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "loyalty_meal_deal_groups_quantity_check" CHECK ("loyalty_meal_deal_groups"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_offer_items" (
	"offer_id" uuid NOT NULL,
	"menu_item_id" uuid NOT NULL,
	"role" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "loyalty_offer_items_offer_id_menu_item_id_role_pk" PRIMARY KEY("offer_id","menu_item_id","role"),
	CONSTRAINT "loyalty_offer_items_role_check" CHECK ("loyalty_offer_items"."role" in ('eligible', 'rewarded')),
	CONSTRAINT "loyalty_offer_items_quantity_check" CHECK ("loyalty_offer_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"program_id" uuid,
	"tier_id" uuid,
	"kind" "loyalty_offer_kind" NOT NULL,
	"benefit_type" "loyalty_benefit_type" NOT NULL,
	"audience" "loyalty_offer_audience" DEFAULT 'members' NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"staff_instructions" text DEFAULT '' NOT NULL,
	"balance_cost" integer,
	"amount_pence" integer,
	"percentage_off" integer,
	"usage_limit" integer,
	"usage_period" "loyalty_usage_period",
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_offers_cost_check" CHECK ("loyalty_offers"."balance_cost" is null or "loyalty_offers"."balance_cost" > 0),
	CONSTRAINT "loyalty_offers_amount_check" CHECK ("loyalty_offers"."amount_pence" is null or "loyalty_offers"."amount_pence" >= 0),
	CONSTRAINT "loyalty_offers_percentage_check" CHECK ("loyalty_offers"."percentage_off" is null or "loyalty_offers"."percentage_off" between 1 and 100),
	CONSTRAINT "loyalty_offers_usage_check" CHECK (("loyalty_offers"."usage_limit" is null and "loyalty_offers"."usage_period" is null) or ("loyalty_offers"."usage_limit" > 0 and "loyalty_offers"."usage_period" is not null)),
	CONSTRAINT "loyalty_offers_dates_check" CHECK ("loyalty_offers"."ends_at" is null or "loyalty_offers"."starts_at" is null or "loyalty_offers"."ends_at" > "loyalty_offers"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "loyalty_program_eligibility" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"category_id" uuid,
	"units_per_item" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "loyalty_program_eligibility_target_check" CHECK (num_nonnulls("loyalty_program_eligibility"."menu_item_id", "loyalty_program_eligibility"."category_id") = 1),
	CONSTRAINT "loyalty_program_eligibility_units_check" CHECK ("loyalty_program_eligibility"."units_per_item" > 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_program_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"earning_method" "loyalty_earning_method" NOT NULL,
	"points_per_pound" integer,
	"terms" text NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_program_versions_rate_check" CHECK (("loyalty_program_versions"."earning_method" = 'spend' and "loyalty_program_versions"."points_per_pound" > 0) or ("loyalty_program_versions"."earning_method" = 'item' and "loyalty_program_versions"."points_per_pound" is null))
);
--> statement-breakpoint
CREATE TABLE "loyalty_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"type" "loyalty_program_type" NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"unit_singular" text NOT NULL,
	"unit_plural" text NOT NULL,
	"status" "loyalty_program_status" DEFAULT 'draft' NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone,
	CONSTRAINT "loyalty_programs_version_check" CHECK ("loyalty_programs"."current_version" > 0),
	CONSTRAINT "loyalty_programs_dates_check" CHECK ("loyalty_programs"."ends_at" is null or "loyalty_programs"."starts_at" is null or "loyalty_programs"."ends_at" > "loyalty_programs"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "loyalty_purchase_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"verified_by" uuid NOT NULL,
	"final_eligible_pence" integer NOT NULL,
	"source" text DEFAULT 'staff_verified_external_sale' NOT NULL,
	"idempotency_key" text NOT NULL,
	"reversed_at" timestamp with time zone,
	"reversed_by" uuid,
	"reversal_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_purchase_events_amount_check" CHECK ("loyalty_purchase_events"."final_eligible_pence" >= 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_purchase_items" (
	"purchase_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"item_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"was_free" boolean DEFAULT false NOT NULL,
	CONSTRAINT "loyalty_purchase_items_purchase_id_item_name_pk" PRIMARY KEY("purchase_id","item_name"),
	CONSTRAINT "loyalty_purchase_items_quantity_check" CHECK ("loyalty_purchase_items"."quantity" between 1 and 99)
);
--> statement-breakpoint
CREATE TABLE "loyalty_qr_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"offer_id" uuid,
	"purpose" "loyalty_challenge_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"status" "loyalty_challenge_status" DEFAULT 'issued' NOT NULL,
	"claimed_by" uuid,
	"claimed_at" timestamp with time zone,
	"consumed_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"account_id" uuid,
	"customer_id" uuid NOT NULL,
	"consumed_by" uuid NOT NULL,
	"balance_cost" integer DEFAULT 0 NOT NULL,
	"benefit_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"consumed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_redemptions_cost_check" CHECK ("loyalty_redemptions"."balance_cost" >= 0)
);
--> statement-breakpoint
CREATE TABLE "loyalty_tier_unlocks" (
	"account_id" uuid NOT NULL,
	"tier_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_tier_unlocks_account_id_tier_id_pk" PRIMARY KEY("account_id","tier_id")
);
--> statement-breakpoint
CREATE TABLE "loyalty_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version_id" uuid NOT NULL,
	"name" text NOT NULL,
	"threshold" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "loyalty_tiers_threshold_check" CHECK ("loyalty_tiers"."threshold" >= 0)
);
--> statement-breakpoint
ALTER TABLE "event_menu_items" ADD CONSTRAINT "event_menu_items_event_id_posts_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_menu_items" ADD CONSTRAINT "event_menu_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_program_id_loyalty_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."loyalty_programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_accounts" ADD CONSTRAINT "loyalty_accounts_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_fraud_events" ADD CONSTRAINT "loyalty_fraud_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_fraud_events" ADD CONSTRAINT "loyalty_fraud_events_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_fraud_events" ADD CONSTRAINT "loyalty_fraud_events_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_account_id_loyalty_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."loyalty_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_purchase_id_loyalty_purchase_events_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."loyalty_purchase_events"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_meal_deal_group_items" ADD CONSTRAINT "loyalty_meal_deal_group_items_group_id_loyalty_meal_deal_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."loyalty_meal_deal_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_meal_deal_group_items" ADD CONSTRAINT "loyalty_meal_deal_group_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_meal_deal_groups" ADD CONSTRAINT "loyalty_meal_deal_groups_offer_id_loyalty_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."loyalty_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_offer_items" ADD CONSTRAINT "loyalty_offer_items_offer_id_loyalty_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."loyalty_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_offer_items" ADD CONSTRAINT "loyalty_offer_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_offers" ADD CONSTRAINT "loyalty_offers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_offers" ADD CONSTRAINT "loyalty_offers_program_id_loyalty_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."loyalty_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_offers" ADD CONSTRAINT "loyalty_offers_tier_id_loyalty_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."loyalty_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program_eligibility" ADD CONSTRAINT "loyalty_program_eligibility_version_id_loyalty_program_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."loyalty_program_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program_eligibility" ADD CONSTRAINT "loyalty_program_eligibility_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program_eligibility" ADD CONSTRAINT "loyalty_program_eligibility_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program_versions" ADD CONSTRAINT "loyalty_program_versions_program_id_loyalty_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."loyalty_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_program_versions" ADD CONSTRAINT "loyalty_program_versions_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_purchase_events" ADD CONSTRAINT "loyalty_purchase_events_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_purchase_events" ADD CONSTRAINT "loyalty_purchase_events_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_purchase_events" ADD CONSTRAINT "loyalty_purchase_events_verified_by_profiles_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_purchase_events" ADD CONSTRAINT "loyalty_purchase_events_reversed_by_profiles_id_fk" FOREIGN KEY ("reversed_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_purchase_items" ADD CONSTRAINT "loyalty_purchase_items_purchase_id_loyalty_purchase_events_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."loyalty_purchase_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_purchase_items" ADD CONSTRAINT "loyalty_purchase_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_qr_challenges" ADD CONSTRAINT "loyalty_qr_challenges_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_qr_challenges" ADD CONSTRAINT "loyalty_qr_challenges_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_qr_challenges" ADD CONSTRAINT "loyalty_qr_challenges_offer_id_loyalty_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."loyalty_offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_qr_challenges" ADD CONSTRAINT "loyalty_qr_challenges_claimed_by_profiles_id_fk" FOREIGN KEY ("claimed_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_offer_id_loyalty_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."loyalty_offers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_account_id_loyalty_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."loyalty_accounts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_redemptions" ADD CONSTRAINT "loyalty_redemptions_consumed_by_profiles_id_fk" FOREIGN KEY ("consumed_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_tier_unlocks" ADD CONSTRAINT "loyalty_tier_unlocks_account_id_loyalty_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."loyalty_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_tier_unlocks" ADD CONSTRAINT "loyalty_tier_unlocks_tier_id_loyalty_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."loyalty_tiers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_tiers" ADD CONSTRAINT "loyalty_tiers_version_id_loyalty_program_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."loyalty_program_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_accounts_program_customer_unique" ON "loyalty_accounts" USING btree ("program_id","customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_ledger_account_idempotency_unique" ON "loyalty_ledger" USING btree ("account_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "loyalty_offers_business_active_idx" ON "loyalty_offers" USING btree ("business_id","is_active","starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_program_eligibility_item_unique" ON "loyalty_program_eligibility" USING btree ("version_id","menu_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_program_eligibility_category_unique" ON "loyalty_program_eligibility" USING btree ("version_id","category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_program_versions_unique" ON "loyalty_program_versions" USING btree ("program_id","version");--> statement-breakpoint
CREATE INDEX "loyalty_programs_business_status_idx" ON "loyalty_programs" USING btree ("business_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_purchase_events_verifier_idempotency_unique" ON "loyalty_purchase_events" USING btree ("verified_by","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_qr_challenges_token_unique" ON "loyalty_qr_challenges" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_redemptions_staff_idempotency_unique" ON "loyalty_redemptions" USING btree ("consumed_by","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "loyalty_tiers_threshold_unique" ON "loyalty_tiers" USING btree ("version_id","threshold");