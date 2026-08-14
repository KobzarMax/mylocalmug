CREATE TYPE "public"."order_channel" AS ENUM('customer', 'till');--> statement-breakpoint
CREATE TYPE "public"."order_payment_status" AS ENUM('unpaid', 'processing', 'paid', 'refund_pending', 'partially_refunded', 'refunded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('awaiting_payment', 'needs_confirmation', 'accepted', 'preparing', 'ready', 'completed', 'cancelled', 'refund_pending', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_connection_status" AS ENUM('not_started', 'onboarding', 'restricted', 'ready', 'disabled', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."payment_job_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_job_type" AS ENUM('expire_order', 'refund', 'reconcile');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('card', 'apple_pay', 'google_pay', 'paypal', 'terminal_card');--> statement-breakpoint
CREATE TYPE "public"."payment_provider" AS ENUM('stripe', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('created', 'requires_action', 'processing', 'succeeded', 'failed', 'cancelled', 'partially_refunded', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"menu_item_id" uuid,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price_pence" integer NOT NULL,
	"line_total_pence" integer NOT NULL,
	CONSTRAINT "order_items_quantity_check" CHECK ("order_items"."quantity" between 1 and 99),
	CONSTRAINT "order_items_amount_check" CHECK ("order_items"."unit_price_pence" >= 0 and "order_items"."line_total_pence" = "order_items"."unit_price_pence" * "order_items"."quantity")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"customer_id" uuid,
	"created_by" uuid NOT NULL,
	"channel" "order_channel" NOT NULL,
	"status" "order_status" DEFAULT 'awaiting_payment' NOT NULL,
	"payment_status" "order_payment_status" DEFAULT 'unpaid' NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"subtotal_pence" integer NOT NULL,
	"total_pence" integer NOT NULL,
	"refunded_pence" integer DEFAULT 0 NOT NULL,
	"confirmation_deadline" timestamp with time zone,
	"cancellation_reason" text,
	"idempotency_key" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_totals_check" CHECK ("orders"."currency" = 'GBP' and "orders"."subtotal_pence" >= 0 and "orders"."total_pence" = "orders"."subtotal_pence" and "orders"."refunded_pence" between 0 and "orders"."total_pence"),
	CONSTRAINT "orders_channel_owner_check" CHECK (("orders"."channel" = 'customer' and "orders"."customer_id" = "orders"."created_by") or ("orders"."channel" = 'till' and "orders"."customer_id" is null))
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount_pence" integer NOT NULL,
	"currency" text DEFAULT 'GBP' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"provider_intent_id" text,
	"provider_order_id" text,
	"provider_capture_id" text,
	"failure_code" text,
	"failure_message" text,
	"idempotency_key" text NOT NULL,
	"succeeded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_attempts_amount_check" CHECK ("payment_attempts"."currency" = 'GBP' and "payment_attempts"."amount_pence" > 0)
);
--> statement-breakpoint
CREATE TABLE "payment_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_account_id" text,
	"status" "payment_connection_status" DEFAULT 'not_started' NOT NULL,
	"charges_enabled" boolean DEFAULT false NOT NULL,
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"requirements" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"disabled_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "payment_job_type" NOT NULL,
	"order_id" uuid,
	"refund_id" uuid,
	"status" "payment_job_status" DEFAULT 'pending' NOT NULL,
	"run_at" timestamp with time zone NOT NULL,
	"lease_until" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_refunds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"payment_attempt_id" uuid NOT NULL,
	"amount_pence" integer NOT NULL,
	"reason" text NOT NULL,
	"requested_by" uuid,
	"provider_refund_id" text,
	"status" "refund_status" DEFAULT 'pending' NOT NULL,
	"idempotency_key" text NOT NULL,
	"failure_message" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_refunds_amount_check" CHECK ("payment_refunds"."amount_pence" > 0),
	CONSTRAINT "payment_refunds_reason_check" CHECK (char_length(btrim("payment_refunds"."reason")) between 3 and 500)
);
--> statement-breakpoint
CREATE TABLE "payment_return_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"purpose" text NOT NULL,
	"token_hash" text NOT NULL,
	"order_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" "payment_provider" NOT NULL,
	"provider_event_id" text NOT NULL,
	"provider_account_id" text,
	"event_type" text NOT NULL,
	"state" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terminal_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"business_location_id" uuid NOT NULL,
	"provider_location_id" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "terminal_readers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"terminal_location_id" uuid NOT NULL,
	"provider_reader_id" text NOT NULL,
	"label" text NOT NULL,
	"device_type" text NOT NULL,
	"registration_code_last4" text,
	"status" text DEFAULT 'offline' NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_location_id_business_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."business_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_profiles_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_connections" ADD CONSTRAINT "payment_connections_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_jobs" ADD CONSTRAINT "payment_jobs_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_jobs" ADD CONSTRAINT "payment_jobs_refund_id_payment_refunds_id_fk" FOREIGN KEY ("refund_id") REFERENCES "public"."payment_refunds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_payment_attempt_id_payment_attempts_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_refunds" ADD CONSTRAINT "payment_refunds_requested_by_profiles_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_return_states" ADD CONSTRAINT "payment_return_states_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_return_states" ADD CONSTRAINT "payment_return_states_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_locations" ADD CONSTRAINT "terminal_locations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_locations" ADD CONSTRAINT "terminal_locations_business_location_id_business_locations_id_fk" FOREIGN KEY ("business_location_id") REFERENCES "public"."business_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_readers" ADD CONSTRAINT "terminal_readers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "terminal_readers" ADD CONSTRAINT "terminal_readers_terminal_location_id_terminal_locations_id_fk" FOREIGN KEY ("terminal_location_id") REFERENCES "public"."terminal_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "orders_creator_idempotency_unique" ON "orders" USING btree ("created_by","idempotency_key");--> statement-breakpoint
CREATE INDEX "orders_business_state_idx" ON "orders" USING btree ("business_id","status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_idempotency_unique" ON "payment_attempts" USING btree ("order_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_provider_intent_unique" ON "payment_attempts" USING btree ("provider","provider_intent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_connections_business_provider_unique" ON "payment_connections" USING btree ("business_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_jobs_idempotency_unique" ON "payment_jobs" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payment_jobs_due_idx" ON "payment_jobs" USING btree ("status","run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_refunds_attempt_idempotency_unique" ON "payment_refunds" USING btree ("payment_attempt_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_return_states_token_unique" ON "payment_return_states" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_webhook_events_provider_event_unique" ON "payment_webhook_events" USING btree ("provider","provider_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "terminal_locations_business_location_unique" ON "terminal_locations" USING btree ("business_id","business_location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "terminal_locations_provider_unique" ON "terminal_locations" USING btree ("provider_location_id");--> statement-breakpoint
CREATE UNIQUE INDEX "terminal_readers_provider_unique" ON "terminal_readers" USING btree ("provider_reader_id");