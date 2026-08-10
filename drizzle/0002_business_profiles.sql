CREATE TYPE "public"."business_application_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."business_member_role" AS ENUM('owner', 'admin', 'manager', 'finance', 'barista', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."business_membership_status" AS ENUM('invited', 'active', 'suspended', 'removed');--> statement-breakpoint
CREATE TYPE "public"."business_status" AS ENUM('onboarding', 'active', 'suspended', 'closed');--> statement-breakpoint
CREATE TABLE "business_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"status" "business_application_status" DEFAULT 'draft' NOT NULL,
	"trading_name" text NOT NULL,
	"legal_name" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Independent coffee shop' NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"website_url" text DEFAULT '' NOT NULL,
	"address" text NOT NULL,
	"company_number" text DEFAULT '' NOT NULL,
	"vat_number" text DEFAULT '' NOT NULL,
	"rejection_reason" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_applications_trading_name_check" CHECK (char_length(btrim("business_applications"."trading_name")) between 2 and 120),
	CONSTRAINT "business_applications_description_check" CHECK (char_length("business_applications"."description") <= 1000)
);
--> statement-breakpoint
CREATE TABLE "business_hours" (
	"location_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"opens_at" text,
	"closes_at" text,
	"is_closed" boolean DEFAULT false NOT NULL,
	CONSTRAINT "business_hours_location_id_day_of_week_pk" PRIMARY KEY("location_id","day_of_week"),
	CONSTRAINT "business_hours_day_of_week_check" CHECK ("business_hours"."day_of_week" between 0 and 6),
	CONSTRAINT "business_hours_time_check" CHECK ("business_hours"."is_closed" or ("business_hours"."opens_at" ~ '^[0-2][0-9]:[0-5][0-9]$' and "business_hours"."closes_at" ~ '^[0-2][0-9]:[0-5][0-9]$'))
);
--> statement-breakpoint
CREATE TABLE "business_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text DEFAULT 'Main location' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"phone" text DEFAULT '' NOT NULL,
	"timezone" text DEFAULT 'Europe/London' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_memberships" (
	"business_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"role" "business_member_role" NOT NULL,
	"status" "business_membership_status" DEFAULT 'active' NOT NULL,
	"invited_by" uuid,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_memberships_business_id_profile_id_pk" PRIMARY KEY("business_id","profile_id")
);
--> statement-breakpoint
CREATE TABLE "platform_admins" (
	"profile_id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_members" RENAME TO "business_followers";--> statement-breakpoint
ALTER TABLE "business_followers" DROP CONSTRAINT "business_members_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "business_followers" DROP CONSTRAINT "business_members_client_id_profiles_id_fk";
--> statement-breakpoint
DROP INDEX "businesses_owner_id_unique";--> statement-breakpoint
ALTER TABLE "business_followers" DROP CONSTRAINT "business_members_business_id_client_id_pk";--> statement-breakpoint
ALTER TABLE "business_followers" ADD CONSTRAINT "business_followers_business_id_client_id_pk" PRIMARY KEY("business_id","client_id");--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "category" text DEFAULT 'Independent coffee shop' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "contact_email" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "contact_phone" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "website_url" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "status" "business_status" DEFAULT 'onboarding' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "business_applications" ADD CONSTRAINT "business_applications_applicant_id_profiles_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_hours" ADD CONSTRAINT "business_hours_location_id_business_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."business_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_memberships" ADD CONSTRAINT "business_memberships_invited_by_profiles_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_admins" ADD CONSTRAINT "platform_admins_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_applications_applicant_id_unique" ON "business_applications" USING btree ("applicant_id");--> statement-breakpoint
ALTER TABLE "business_followers" ADD CONSTRAINT "business_followers_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_followers" ADD CONSTRAINT "business_followers_client_id_profiles_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;