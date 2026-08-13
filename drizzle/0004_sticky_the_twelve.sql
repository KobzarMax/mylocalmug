CREATE TYPE "public"."event_notification_job_type" AS ENUM('reminder', 'updated', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_job_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."post_kind" AS ENUM('news', 'event');--> statement-breakpoint
CREATE TYPE "public"."push_delivery_status" AS ENUM('pending', 'ticketed', 'delivered', 'failed');--> statement-breakpoint
CREATE TABLE "event_notification_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"job_type" "event_notification_job_type" NOT NULL,
	"reminder_minutes" integer DEFAULT 0 NOT NULL,
	"event_version" integer NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"status" "notification_job_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "event_notification_jobs_reminder_check" CHECK (("event_notification_jobs"."job_type" = 'reminder' and "event_notification_jobs"."reminder_minutes" in (60, 1440, 10080))
        or ("event_notification_jobs"."job_type" <> 'reminder' and "event_notification_jobs"."reminder_minutes" = 0)),
	CONSTRAINT "event_notification_jobs_attempts_check" CHECK ("event_notification_jobs"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "post_event_reminders" (
	"post_id" uuid NOT NULL,
	"minutes_before" integer NOT NULL,
	CONSTRAINT "post_event_reminders_post_id_minutes_before_pk" PRIMARY KEY("post_id","minutes_before"),
	CONSTRAINT "post_event_reminders_allowed_offset_check" CHECK ("post_event_reminders"."minutes_before" in (60, 1440, 10080))
);
--> statement-breakpoint
CREATE TABLE "push_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"expo_ticket_id" text,
	"status" "push_delivery_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_attempt_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_deliveries_attempts_check" CHECK ("push_deliveries"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "push_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"expo_push_token" text NOT NULL,
	"platform" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_devices_platform_check" CHECK ("push_devices"."platform" in ('ios', 'android'))
);
--> statement-breakpoint
ALTER TABLE "posts" RENAME COLUMN "body" TO "body_text";--> statement-breakpoint
ALTER TABLE "posts" RENAME COLUMN "cover_url" TO "cover_path";--> statement-breakpoint
ALTER TABLE "business_followers" ADD COLUMN "event_notifications_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "kind" "post_kind" DEFAULT 'news' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "excerpt" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "body_document" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "author_display_name" text DEFAULT 'Coffee shop team' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_all_day" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_timezone" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_venue_name" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_venue_address" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_cancellation_reason" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "event_notification_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
UPDATE "posts" post
SET
	"kind" = CASE WHEN post."event_starts_at" IS NULL THEN 'news'::"post_kind" ELSE 'event'::"post_kind" END,
	"excerpt" = left(post."body_text", 300),
	"body_document" = jsonb_build_object(
		'type', 'doc',
		'content', jsonb_build_array(jsonb_build_object(
			'type', 'paragraph',
			'content', jsonb_build_array(jsonb_build_object('type', 'text', 'text', post."body_text"))
		))
	),
	"event_timezone" = CASE
		WHEN post."event_starts_at" IS NOT NULL THEN coalesce(
			(select location."timezone" from "business_locations" location where location."business_id" = post."business_id" and location."is_primary" limit 1),
			'Europe/London'
		)
		ELSE NULL
	END,
	"event_ends_at" = CASE
		WHEN post."event_ends_at" > post."event_starts_at" THEN post."event_ends_at"
		ELSE NULL
	END,
	"created_by" = business."owner_id",
	"updated_by" = business."owner_id",
	"author_display_name" = coalesce(nullif(btrim(profile."display_name"), ''), 'Coffee shop team')
FROM "businesses" business
LEFT JOIN "profiles" profile ON profile."id" = business."owner_id"
WHERE business."id" = post."business_id";--> statement-breakpoint
ALTER TABLE "event_notification_jobs" ADD CONSTRAINT "event_notification_jobs_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_event_reminders" ADD CONSTRAINT "post_event_reminders_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_deliveries" ADD CONSTRAINT "push_deliveries_job_id_event_notification_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."event_notification_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_deliveries" ADD CONSTRAINT "push_deliveries_device_id_push_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."push_devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_devices" ADD CONSTRAINT "push_devices_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "event_notification_jobs_unique" ON "event_notification_jobs" USING btree ("post_id","job_type","event_version","reminder_minutes");--> statement-breakpoint
CREATE UNIQUE INDEX "push_deliveries_job_device_unique" ON "push_deliveries" USING btree ("job_id","device_id");--> statement-breakpoint
CREATE UNIQUE INDEX "push_devices_expo_push_token_unique" ON "push_devices" USING btree ("expo_push_token");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updated_by_profiles_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_title_check" CHECK (char_length(btrim("posts"."title")) between 3 and 140);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_excerpt_check" CHECK (char_length("posts"."excerpt") <= 300);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_body_text_check" CHECK (char_length("posts"."body_text") <= 50000);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_event_notification_version_check" CHECK ("posts"."event_notification_version" > 0);--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_event_dates_check" CHECK ((
        "posts"."kind" = 'news'
        and "posts"."event_starts_at" is null
        and "posts"."event_ends_at" is null
        and "posts"."event_timezone" is null
        and "posts"."event_venue_name" is null
        and "posts"."event_venue_address" is null
        and "posts"."event_cancelled_at" is null
      ) or (
        "posts"."kind" = 'event'
        and "posts"."event_starts_at" is not null
        and "posts"."event_timezone" is not null
        and ("posts"."event_ends_at" is null or "posts"."event_ends_at" > "posts"."event_starts_at")
      ));
