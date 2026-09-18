CREATE TYPE "public"."social_connection_status" AS ENUM('connecting', 'ready', 'expired', 'revoked', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."social_platform" AS ENUM('facebook', 'instagram');--> statement-breakpoint
CREATE TYPE "public"."social_publication_status" AS ENUM('queued', 'publishing', 'published', 'blocked', 'failed', 'needs_review', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."social_publication_type" AS ENUM('initial', 'update', 'cancellation');--> statement-breakpoint
CREATE TABLE "social_connection_credentials" (
	"connection_id" uuid PRIMARY KEY NOT NULL,
	"token_ciphertext" text NOT NULL,
	"token_nonce" text NOT NULL,
	"key_version" integer DEFAULT 1 NOT NULL,
	"token_expires_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"provider" "social_platform" NOT NULL,
	"external_account_id" text NOT NULL,
	"account_name" text NOT NULL,
	"username" text,
	"profile_url" text NOT NULL,
	"granted_scopes" text[] DEFAULT '{}' NOT NULL,
	"status" "social_connection_status" DEFAULT 'connecting' NOT NULL,
	"token_expires_at" timestamp with time zone,
	"last_verified_at" timestamp with time zone,
	"disconnected_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_oauth_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_hash" text NOT NULL,
	"actor_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"provider" "social_platform" NOT NULL,
	"encrypted_verifier" text,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_publication_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publication_id" uuid NOT NULL,
	"attempt_number" integer NOT NULL,
	"outcome" text NOT NULL,
	"http_status" integer,
	"provider_code" text,
	"sanitized_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"connection_id" uuid NOT NULL,
	"provider" "social_platform" NOT NULL,
	"publication_type" "social_publication_type" DEFAULT 'initial' NOT NULL,
	"caption" text NOT NULL,
	"media_path" text,
	"content_url" text NOT NULL,
	"source_updated_at" timestamp with time zone NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" "social_publication_status" DEFAULT 'queued' NOT NULL,
	"provider_container_id" text,
	"provider_publication_id" text,
	"provider_url" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"lease_until" timestamp with time zone,
	"last_error" text,
	"idempotency_key" text NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "social_publications_caption_check" CHECK (char_length(btrim("social_publications"."caption")) between 1 and 2000),
	CONSTRAINT "social_publications_instagram_media_check" CHECK ("social_publications"."provider" <> 'instagram' or "social_publications"."media_path" is not null)
);
--> statement-breakpoint
ALTER TABLE "social_connection_credentials" ADD CONSTRAINT "social_connection_credentials_connection_id_social_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."social_connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_connections" ADD CONSTRAINT "social_connections_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_oauth_states" ADD CONSTRAINT "social_oauth_states_actor_id_profiles_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_oauth_states" ADD CONSTRAINT "social_oauth_states_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_publication_attempts" ADD CONSTRAINT "social_publication_attempts_publication_id_social_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."social_publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_publications" ADD CONSTRAINT "social_publications_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_publications" ADD CONSTRAINT "social_publications_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_publications" ADD CONSTRAINT "social_publications_connection_id_social_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."social_connections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_publications" ADD CONSTRAINT "social_publications_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "social_connections_business_provider_unique" ON "social_connections" USING btree ("business_id","provider");--> statement-breakpoint
CREATE UNIQUE INDEX "social_oauth_states_hash_unique" ON "social_oauth_states" USING btree ("state_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "social_publications_idempotency_unique" ON "social_publications" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "social_publications_due_idx" ON "social_publications" USING btree ("status","due_at");