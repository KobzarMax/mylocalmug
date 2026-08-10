CREATE TABLE "favorite_businesses" (
	"profile_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favorite_businesses_profile_id_business_id_pk" PRIMARY KEY("profile_id","business_id")
);
--> statement-breakpoint
ALTER TABLE "profiles" RENAME COLUMN "avatar_url" TO "avatar_path";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "favorite_businesses" ADD CONSTRAINT "favorite_businesses_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorite_businesses" ADD CONSTRAINT "favorite_businesses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_display_name_check" CHECK (char_length(btrim("profiles"."display_name")) between 1 and 80);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_description_check" CHECK (char_length("profiles"."description") <= 200);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_avatar_path_check" CHECK ("profiles"."avatar_path" is null or (
        split_part("profiles"."avatar_path", '/', 1) = "profiles"."id"::text
        and "profiles"."avatar_path" ~ '^[0-9a-f-]{36}/avatar-[0-9]+\.(jpg|png|webp)$'
      ));