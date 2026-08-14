CREATE TYPE "public"."legal_profile_status" AS ENUM('draft', 'pending_approval', 'approved');--> statement-breakpoint
CREATE TYPE "public"."uk_legal_entity_type" AS ENUM('sole_trader', 'limited_company', 'limited_liability_partnership', 'partnership', 'charity', 'other_organisation');--> statement-breakpoint
CREATE TABLE "business_legal_profiles" (
	"business_id" uuid PRIMARY KEY NOT NULL,
	"country" text DEFAULT 'GB' NOT NULL,
	"entity_type" "uk_legal_entity_type" DEFAULT 'other_organisation' NOT NULL,
	"legal_name" text DEFAULT '' NOT NULL,
	"trading_name" text DEFAULT '' NOT NULL,
	"registered_address_line1" text DEFAULT '' NOT NULL,
	"registered_address_line2" text DEFAULT '' NOT NULL,
	"registered_town_city" text DEFAULT '' NOT NULL,
	"registered_county" text DEFAULT '' NOT NULL,
	"registered_postcode" text DEFAULT '' NOT NULL,
	"contact_email" text DEFAULT '' NOT NULL,
	"contact_phone" text DEFAULT '' NOT NULL,
	"company_number" text DEFAULT '' NOT NULL,
	"charity_number" text DEFAULT '' NOT NULL,
	"vat_registered" boolean DEFAULT false NOT NULL,
	"vat_number" text DEFAULT '' NOT NULL,
	"status" "legal_profile_status" DEFAULT 'draft' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"change_request_note" text DEFAULT '' NOT NULL,
	"last_edited_by" uuid,
	"submitted_by" uuid,
	"submitted_at" timestamp with time zone,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_legal_profiles_country_check" CHECK ("business_legal_profiles"."country" = 'GB'),
	CONSTRAINT "business_legal_profiles_revision_check" CHECK ("business_legal_profiles"."revision" > 0),
	CONSTRAINT "business_legal_profiles_vat_check" CHECK ("business_legal_profiles"."vat_registered" or "business_legal_profiles"."vat_number" = ''),
	CONSTRAINT "business_legal_profiles_legal_name_check" CHECK (char_length("business_legal_profiles"."legal_name") <= 160),
	CONSTRAINT "business_legal_profiles_trading_name_check" CHECK (char_length("business_legal_profiles"."trading_name") <= 120),
	CONSTRAINT "business_legal_profiles_address_check" CHECK (
      char_length("business_legal_profiles"."registered_address_line1") <= 160
      and char_length("business_legal_profiles"."registered_address_line2") <= 160
      and char_length("business_legal_profiles"."registered_town_city") <= 100
      and char_length("business_legal_profiles"."registered_county") <= 100
    ),
	CONSTRAINT "business_legal_profiles_postcode_check" CHECK (
      "business_legal_profiles"."registered_postcode" = '' or "business_legal_profiles"."registered_postcode" ~ '^(GIR 0AA|[A-Z]{1,2}[0-9][A-Z0-9]? [0-9][A-Z]{2})$'
    ),
	CONSTRAINT "business_legal_profiles_email_check" CHECK (
      "business_legal_profiles"."contact_email" = '' or ("business_legal_profiles"."contact_email" = lower("business_legal_profiles"."contact_email") and "business_legal_profiles"."contact_email" ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$')
    ),
	CONSTRAINT "business_legal_profiles_phone_check" CHECK (
      "business_legal_profiles"."contact_phone" = '' or ("business_legal_profiles"."contact_phone" ~ '^[+]?[0-9 ()-]{7,25}$' and char_length("business_legal_profiles"."contact_phone") <= 30)
    ),
	CONSTRAINT "business_legal_profiles_company_number_check" CHECK (
      ("business_legal_profiles"."entity_type" in ('limited_company', 'limited_liability_partnership') and ("business_legal_profiles"."company_number" = '' or "business_legal_profiles"."company_number" ~ '^([0-9]{8}|[A-Z]{2}[0-9]{6})$'))
      or ("business_legal_profiles"."entity_type" not in ('limited_company', 'limited_liability_partnership') and "business_legal_profiles"."company_number" = '')
    ),
	CONSTRAINT "business_legal_profiles_charity_number_check" CHECK (
      ("business_legal_profiles"."entity_type" = 'charity' and ("business_legal_profiles"."charity_number" = '' or "business_legal_profiles"."charity_number" ~ '^([0-9]{6,8}(-[0-9]{1,2})?|[A-Z]{2}[0-9]{6})$'))
      or ("business_legal_profiles"."entity_type" <> 'charity' and "business_legal_profiles"."charity_number" = '')
    ),
	CONSTRAINT "business_legal_profiles_vat_number_check" CHECK (
      "business_legal_profiles"."vat_number" = '' or "business_legal_profiles"."vat_number" ~ '^GB[0-9]{9}([0-9]{3})?$'
    ),
	CONSTRAINT "business_legal_profiles_note_check" CHECK (char_length("business_legal_profiles"."change_request_note") <= 1000)
);
--> statement-breakpoint
ALTER TABLE "business_legal_profiles" ADD CONSTRAINT "business_legal_profiles_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_legal_profiles" ADD CONSTRAINT "business_legal_profiles_last_edited_by_profiles_id_fk" FOREIGN KEY ("last_edited_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_legal_profiles" ADD CONSTRAINT "business_legal_profiles_submitted_by_profiles_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_legal_profiles" ADD CONSTRAINT "business_legal_profiles_approved_by_profiles_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;