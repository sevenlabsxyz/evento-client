

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgsodium";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."comment_reaction_type" AS ENUM (
    'like',
    'thumbsup'
);


ALTER TYPE "public"."comment_reaction_type" OWNER TO "postgres";


CREATE TYPE "public"."event_gallery_kind" AS ENUM (
    'image',
    'video'
);


ALTER TYPE "public"."event_gallery_kind" OWNER TO "postgres";


CREATE TYPE "public"."event_rsvp" AS ENUM (
    'yes',
    'no',
    'maybe'
);


ALTER TYPE "public"."event_rsvp" OWNER TO "postgres";


COMMENT ON TYPE "public"."event_rsvp" IS 'RSVP Types';



CREATE TYPE "public"."event_status" AS ENUM (
    'draft',
    'published',
    'archived'
);


ALTER TYPE "public"."event_status" OWNER TO "postgres";


CREATE TYPE "public"."event_visibility" AS ENUM (
    'public',
    'private'
);


ALTER TYPE "public"."event_visibility" OWNER TO "postgres";


CREATE TYPE "public"."stripe_connected_account_status" AS ENUM (
    'disabled',
    'processing',
    'enabled'
);


ALTER TYPE "public"."stripe_connected_account_status" OWNER TO "postgres";


COMMENT ON TYPE "public"."stripe_connected_account_status" IS 'Status of Stripe Connected Accounts';



CREATE TYPE "public"."user_verification_status" AS ENUM (
    'not_verified',
    'verified',
    'id_verified'
);


ALTER TYPE "public"."user_verification_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_timestamptz"("year" integer, "month" integer, "day" integer, "hour" integer, "minute" integer, "tz" "text") RETURNS timestamp with time zone
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT (year || '-' || 
          LPAD(month::text, 2, '0') || '-' || 
          LPAD(day::text, 2, '0') || ' ' || 
          LPAD(hour::text, 2, '0') || ':' || 
          LPAD(minute::text, 2, '0') || ':00')::timestamptz AT TIME ZONE COALESCE(tz, 'UTC')
$$;


ALTER FUNCTION "public"."generate_timestamptz"("year" integer, "month" integer, "day" integer, "hour" integer, "minute" integer, "tz" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_timestamptz"("year" numeric, "month" numeric, "day" numeric, "hour" numeric, "minute" numeric, "tz" "text") RETURNS TABLE("result" timestamp with time zone, "used_timezone" "text")
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    datetime TEXT;
    used_tz TEXT;
BEGIN
    datetime := year::int || '-' || 
                LPAD(month::int::text, 2, '0') || '-' || 
                LPAD(day::int::text, 2, '0') || ' ' || 
                LPAD(hour::int::text, 2, '0') || ':' || 
                LPAD(minute::int::text, 2, '0') || ':00';
    used_tz := COALESCE(tz, 'UTC');
    RETURN QUERY SELECT 
        (datetime::timestamptz AT TIME ZONE used_tz) AS result,
        used_tz AS used_timezone;
END;
$$;


ALTER FUNCTION "public"."generate_timestamptz"("year" numeric, "month" numeric, "day" numeric, "hour" numeric, "minute" numeric, "tz" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_profile_events"("username" "text") RETURNS TABLE("id" "text", "title" "text", "cost" numeric, "cover" "text", "date" timestamp without time zone, "end_date" timestamp without time zone, "is_time_set" boolean, "location" "text", "visibility" "text", "description" "text", "status" "text", "start_date_day" integer, "start_date_month" integer, "start_date_year" integer, "start_date_hours" integer, "start_date_minutes" integer, "end_date_day" integer, "end_date_month" integer, "end_date_year" integer, "end_date_hours" integer, "end_date_minutes" integer, "timezone" "text", "computed_start_date" timestamp without time zone, "computed_end_date" timestamp without time zone, "user_details" "jsonb")
    LANGUAGE "sql"
    AS $_$
    SELECT 
        events.id,
        events.title,
        events.cost,
        events.cover,
        events.date,
        events.end_date,
        events.is_time_set,
        events.location,
        events.visibility,
        events.description,
        events.status,
        events.start_date_day,
        events.start_date_month,
        events.start_date_year,
        events.start_date_hours,
        events.start_date_minutes,
        events.end_date_day,
        events.end_date_month,
        events.end_date_year,
        events.end_date_hours,
        events.end_date_minutes,
        events.timezone,
        events.computed_start_date,
        events.computed_end_date,
        jsonb_build_object(
            'id', creator.id,
            'username', creator.username,
            'image', creator.image,
            'verification_status', creator.verification_status
        ) as user_details
    FROM event_rsvps
    INNER JOIN events ON events.id = event_rsvps.event_id
    INNER JOIN user_details creator ON events.creator_user_id = creator.id
    LEFT JOIN event_hosts ON events.id = event_hosts.event_id
    WHERE event_rsvps.user_id = (SELECT id FROM user_details ud WHERE ud.username = $1)
    AND event_rsvps.status = 'yes'
    AND events.status = 'published'
    AND events.computed_start_date IS NOT NULL
    ORDER BY events.computed_start_date DESC;
$_$;


ALTER FUNCTION "public"."get_profile_events"("username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_username_events"("username" "text") RETURNS TABLE("id" "text", "title" "text", "cost" numeric, "cover" "text", "date" timestamp without time zone, "end_date" timestamp without time zone, "is_time_set" boolean, "location" "text", "visibility" "text", "description" "text", "status" "text", "start_date_day" integer, "start_date_month" integer, "start_date_year" integer, "start_date_hours" integer, "start_date_minutes" integer, "end_date_day" integer, "end_date_month" integer, "end_date_year" integer, "end_date_hours" integer, "end_date_minutes" integer, "timezone" "text", "computed_start_date" timestamp without time zone, "computed_end_date" timestamp without time zone, "user_details" "jsonb")
    LANGUAGE "sql"
    AS $_$SELECT DISTINCT
      events.id,
      events.title,
      events.cost,
      events.cover,
      events.date,
      events.end_date,
      events.is_time_set,
      events.location,
      events.visibility,
      events.description,
      events.status,
      events.start_date_day,
      events.start_date_month,
      events.start_date_year,
      events.start_date_hours,
      events.start_date_minutes,
      events.end_date_day,
      events.end_date_month,
      events.end_date_year,
      events.end_date_hours,
      events.end_date_minutes,
      events.timezone,
      events.computed_start_date,
      events.computed_end_date,
      jsonb_build_object(
          'id', creator.id,
          'username', creator.username,
          'image', creator.image,
          'verification_status', creator.verification_status
      ) as user_details
  FROM events
  INNER JOIN user_details creator ON events.creator_user_id =
   creator.id
  WHERE (
      -- Events they created
      events.creator_user_id = (SELECT id FROM user_details
  WHERE username = $1)
      OR
      -- Events they're hosting
      events.id IN (
          SELECT event_id FROM event_hosts
          WHERE user_id = (SELECT id FROM user_details WHERE
  username = $1)
      )
      OR
      -- Events they RSVP'd yes to
      events.id IN (
          SELECT event_id FROM event_rsvps
          WHERE user_id = (SELECT id FROM user_details WHERE
  username = $1)
          AND status = 'yes'
      )
  )
  AND events.status = 'published'
  AND events.visibility = 'public'
  AND events.computed_start_date IS NOT NULL
  ORDER BY events.computed_start_date DESC;$_$;


ALTER FUNCTION "public"."get_username_events"("username" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."email_blast_configs" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "max_recipients_per_blast" bigint DEFAULT '100'::bigint NOT NULL,
    "max_blasts_per_event" bigint DEFAULT '5'::bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."email_blast_configs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_blast_deliveries" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email_blast_id" "text" NOT NULL,
    "recipient_id" "uuid",
    "sent_at" timestamp with time zone,
    "failure_reason" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL
);


ALTER TABLE "public"."email_blast_deliveries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_blasts" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "message" "text" NOT NULL,
    "recipient_filter" "text",
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_for" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."email_blasts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_comment_reactions" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "comment_id" "text" NOT NULL,
    "reaction_type" "public"."comment_reaction_type" NOT NULL
);


ALTER TABLE "public"."event_comment_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_comments" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message" "text",
    "user_id" "uuid",
    "event_id" "text" NOT NULL,
    "parent_comment_id" "text",
    "id" "text" NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."event_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_contributions" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "text",
    "price" numeric,
    "is_enabled" boolean DEFAULT false NOT NULL,
    "option_venmo" "text",
    "option_cashapp" "text",
    "option_bitcoin" "text",
    "option_paypal" "text"
);


ALTER TABLE "public"."event_contributions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_gallery" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "text",
    "kind" "public"."event_gallery_kind" DEFAULT 'image'::"public"."event_gallery_kind" NOT NULL,
    "url" "text" NOT NULL,
    "uploader_id" "uuid"
);


ALTER TABLE "public"."event_gallery" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_gallery_reactions" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gallery_item_id" "text" NOT NULL
);


ALTER TABLE "public"."event_gallery_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_hosts" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "id" "text" NOT NULL
);


ALTER TABLE "public"."event_hosts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_invitees" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "text"
);


ALTER TABLE "public"."event_invitees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_invites" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'pending'::"text",
    "invitee_email" "text",
    "invitee_id" "uuid",
    "inviter_id" "uuid",
    "event_id" "text",
    "message" "text",
    "response" "text"
);


ALTER TABLE "public"."event_invites" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_payment_confirmations" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "amount" numeric NOT NULL,
    "event_id" "text",
    "rsvp_id" "text",
    "payment_method" "text",
    "user_id" "uuid",
    "confirmed_at" timestamp with time zone
);


ALTER TABLE "public"."event_payment_confirmations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_rsvps" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."event_rsvp" NOT NULL,
    "event_id" "text" NOT NULL,
    "id" "text" NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."event_rsvps" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_settings" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_guest_list_visible" boolean DEFAULT true,
    "event_id" "text" NOT NULL,
    "max_capacity" numeric,
    "show_capacity_count" boolean DEFAULT false NOT NULL,
    CONSTRAINT "event_settings_max_capacity_check" CHECK (("max_capacity" > (0)::numeric))
);


ALTER TABLE "public"."event_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "title" "text" DEFAULT 'Untitled Event'::"text",
    "description" "text",
    "cover" "text",
    "visibility" "public"."event_visibility" DEFAULT 'public'::"public"."event_visibility" NOT NULL,
    "cost" numeric DEFAULT '0'::numeric NOT NULL,
    "date" timestamp with time zone,
    "location" "text",
    "slug" "text",
    "id" "text" NOT NULL,
    "status" "public"."event_status" DEFAULT 'published'::"public"."event_status" NOT NULL,
    "creator_user_id" "uuid",
    "end_date" timestamp with time zone,
    "is_time_set" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "timezone" "text",
    "start_date_month" numeric,
    "start_date_day" numeric,
    "start_date_year" numeric,
    "start_date_hours" numeric,
    "start_date_minutes" numeric,
    "end_date_month" numeric,
    "end_date_year" numeric,
    "end_date_day" numeric,
    "end_date_hours" numeric,
    "end_date_minutes" numeric,
    "updated_at" timestamp with time zone,
    "computed_end_date" timestamp with time zone,
    "computed_start_date" timestamp with time zone,
    "spotify_url" "text",
    "contrib_cashapp" "text",
    "contrib_paypal" "text",
    "contrib_venmo" "text",
    "contrib_btclightning" "text",
    "last_reminder_sent" timestamp with time zone,
    "wavlake_url" "text",
    "parent_event_id" "text"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Events';



COMMENT ON COLUMN "public"."events"."is_time_set" IS 'Details whether an Evento should show time (aka date vs datetime)';



CREATE TABLE IF NOT EXISTS "public"."feedback" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "text" NOT NULL,
    "submitted_by_user_id" "uuid" NOT NULL,
    "feedback" "text" NOT NULL
);


ALTER TABLE "public"."feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows" (
    "follower_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "followed_id" "uuid" NOT NULL
);


ALTER TABLE "public"."follows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications_incoming" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications_incoming" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ticket_validations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ticket_id" "uuid",
    "validated_by" "uuid",
    "validation_location" "text",
    "validation_type" "text" DEFAULT 'online'::"text",
    "device_id" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."ticket_validations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ticket_code" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "expiration_time" timestamp with time zone,
    "wallet_pass_id" "text" NOT NULL,
    "seat_info" "jsonb",
    "metadata" "jsonb"
);


ALTER TABLE "public"."tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity_log" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "activity_type" "text",
    "user_id" "uuid",
    "details" "jsonb"
);


ALTER TABLE "public"."user_activity_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_details" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text",
    "bio" "text",
    "image" "text",
    "bio_link" "text",
    "instagram_handle" "text",
    "x_handle" "text",
    "name" "text",
    "verification_status" "public"."user_verification_status" DEFAULT 'not_verified'::"public"."user_verification_status" NOT NULL,
    "verification_date" timestamp with time zone,
    "ln_address" "text",
    "nip05" "text",
    "pinned_event" "text"
);


ALTER TABLE "public"."user_details" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_favorite_events" (
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "event_id" "text",
    "id" "text" NOT NULL
);


ALTER TABLE "public"."user_favorite_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_fcm_tokens" (
    "user_id" "uuid" NOT NULL,
    "token" "text"
);


ALTER TABLE "public"."user_fcm_tokens" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_fcm_tokens" IS 'FCM Tokens';



CREATE TABLE IF NOT EXISTS "public"."user_stripe_settings" (
    "id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "account_link_url" "text",
    "user_id" "uuid" NOT NULL,
    "account_id" "text",
    "connected_status" "public"."stripe_connected_account_status" DEFAULT 'disabled'::"public"."stripe_connected_account_status" NOT NULL
);


ALTER TABLE "public"."user_stripe_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."waitlist_emails" OWNER TO "postgres";


COMMENT ON TABLE "public"."waitlist_emails" IS 'Email addresses for users that are interested in the Evento release';



CREATE TABLE IF NOT EXISTS "public"."wallet_passes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ticket_id" "uuid",
    "wallet_type" "text",
    "pass_data" "jsonb" NOT NULL,
    "serial_number" "text" NOT NULL,
    "last_updated" timestamp with time zone
);


ALTER TABLE "public"."wallet_passes" OWNER TO "postgres";


ALTER TABLE ONLY "public"."email_blast_configs"
    ADD CONSTRAINT "email_blast_configs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_blast_deliveries"
    ADD CONSTRAINT "email_blast_deliveries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_blasts"
    ADD CONSTRAINT "email_blasts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_payment_confirmations"
    ADD CONSTRAINT "email_payment_confirmations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_comment_reactions"
    ADD CONSTRAINT "event_comment_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_contributions"
    ADD CONSTRAINT "event_contributions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_gallery"
    ADD CONSTRAINT "event_gallery_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_gallery_reactions"
    ADD CONSTRAINT "event_gallery_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_gallery"
    ADD CONSTRAINT "event_gallery_url_key" UNIQUE ("url");



ALTER TABLE ONLY "public"."event_hosts"
    ADD CONSTRAINT "event_hosts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_user_id_event_id_key" UNIQUE ("user_id", "event_id");



ALTER TABLE ONLY "public"."event_settings"
    ADD CONSTRAINT "event_settings_event_id_key" UNIQUE ("event_id");



ALTER TABLE ONLY "public"."event_settings"
    ADD CONSTRAINT "event_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "followed_id");



ALTER TABLE ONLY "public"."notifications_incoming"
    ADD CONSTRAINT "notifications_incoming_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ticket_validations"
    ADD CONSTRAINT "ticket_validations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_comment_reactions"
    ADD CONSTRAINT "unique_user_comment_reaction" UNIQUE ("comment_id", "user_id");



ALTER TABLE ONLY "public"."event_gallery_reactions"
    ADD CONSTRAINT "unique_user_item_reaction" UNIQUE ("gallery_item_id", "user_id");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_details"
    ADD CONSTRAINT "user_details_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_details"
    ADD CONSTRAINT "user_details_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."user_favorite_events"
    ADD CONSTRAINT "user_favorite_events_id_key" UNIQUE ("id");



ALTER TABLE ONLY "public"."user_favorite_events"
    ADD CONSTRAINT "user_favorite_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_fcm_tokens"
    ADD CONSTRAINT "user_fcm_tokens_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."feedback"
    ADD CONSTRAINT "user_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stripe_settings"
    ADD CONSTRAINT "user_stripe_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stripe_settings"
    ADD CONSTRAINT "user_stripe_settings_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."waitlist_emails"
    ADD CONSTRAINT "waitlist_emails_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist_emails"
    ADD CONSTRAINT "waitlist_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_passes"
    ADD CONSTRAINT "wallet_passes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."wallet_passes"
    ADD CONSTRAINT "wallet_passes_serial_number_key" UNIQUE ("serial_number");



CREATE INDEX "event_invites_event_id_idx" ON "public"."event_invites" USING "btree" ("event_id");



CREATE INDEX "event_invites_invitee_id_idx" ON "public"."event_invites" USING "btree" ("invitee_id");



CREATE INDEX "event_invites_inviter_id_idx" ON "public"."event_invites" USING "btree" ("inviter_id");



CREATE INDEX "follows_followed_id_idx" ON "public"."follows" USING "btree" ("followed_id");



CREATE INDEX "follows_follower_id_idx" ON "public"."follows" USING "btree" ("follower_id");



CREATE INDEX "idx_event_comment_reactions_comment_id" ON "public"."event_comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_event_comment_reactions_user_reaction" ON "public"."event_comment_reactions" USING "btree" ("user_id", "reaction_type");



CREATE INDEX "idx_event_rsvps_user_status" ON "public"."event_rsvps" USING "btree" ("user_id", "status");



CREATE INDEX "idx_events_creator_status_start_date" ON "public"."events" USING "btree" ("creator_user_id", "status", "computed_start_date");



CREATE INDEX "idx_events_dates" ON "public"."events" USING "btree" ("computed_start_date", "computed_end_date") WHERE ("status" = 'published'::"public"."event_status");



CREATE INDEX "idx_events_status_dates" ON "public"."events" USING "btree" ("status", "computed_start_date", "computed_end_date");



CREATE INDEX "idx_username" ON "public"."user_details" USING "gin" ("to_tsvector"('"english"'::"regconfig", "username"));



CREATE INDEX "ticket_validations_ticket_id_idx" ON "public"."ticket_validations" USING "btree" ("ticket_id");



CREATE INDEX "tickets_event_id_idx" ON "public"."tickets" USING "btree" ("event_id");



CREATE INDEX "tickets_status_idx" ON "public"."tickets" USING "btree" ("status");



CREATE INDEX "tickets_user_id_idx" ON "public"."tickets" USING "btree" ("user_id");



CREATE INDEX "wallet_passes_ticket_id_idx" ON "public"."wallet_passes" USING "btree" ("ticket_id");



-- CREATE OR REPLACE TRIGGER "evento-update-notification" AFTER INSERT OR UPDATE ON "public"."events" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://evento.so/api/v1/webhooks/events/update', 'POST', '{"Content-type":"application/json","k":"856e19627bbfc850b024709c994d82f6"}', '{}', '5000');



-- CREATE OR REPLACE TRIGGER "new-comment-reaction" AFTER INSERT ON "public"."event_comment_reactions" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://evento.so/api/v1/webhooks/events/comments/reactions/new', 'POST', '{"Content-type":"application/json","k":"123456"}', '{}', '5000');



-- CREATE OR REPLACE TRIGGER "new-evento-comment" AFTER INSERT ON "public"."event_comments" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://evento.so/api/v1/webhooks/events/comments/new', 'POST', '{"Content-type":"application/json","k":"123456"}', '{}', '5000');



-- CREATE OR REPLACE TRIGGER "new-evento-rsvp" AFTER INSERT ON "public"."event_rsvps" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://evento.so/api/v1/webhooks/events/rsvp/new', 'POST', '{"Content-type":"application/json","k":"123456"}', '{}', '5000');



-- CREATE OR REPLACE TRIGGER "new-follower-alert" AFTER INSERT ON "public"."follows" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://evento.so/api/v1/webhooks/users/follows', 'POST', '{"Content-type":"application/json","k":"123456"}', '{}', '5000');



-- CREATE OR REPLACE TRIGGER "new-gallery-reaction" AFTER INSERT ON "public"."event_gallery_reactions" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://evento.so/api/v1/webhooks/events/gallery/reactions', 'POST', '{"Content-type":"application/json","k":"123456"}', '{}', '5000');



-- CREATE OR REPLACE TRIGGER "user_alerts" AFTER INSERT OR UPDATE ON "public"."user_details" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://evento.so/api/v1/webhooks/users/upsert', 'POST', '{"Content-type":"application/json","k":"12345"}', '{}', '5000');



ALTER TABLE ONLY "public"."email_blast_configs"
    ADD CONSTRAINT "email_blast_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."email_blast_deliveries"
    ADD CONSTRAINT "email_blast_deliveries_email_blast_id_fkey" FOREIGN KEY ("email_blast_id") REFERENCES "public"."email_blasts"("id");



ALTER TABLE ONLY "public"."email_blast_deliveries"
    ADD CONSTRAINT "email_blast_deliveries_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."email_blasts"
    ADD CONSTRAINT "email_blasts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."email_blasts"
    ADD CONSTRAINT "email_blasts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."event_payment_confirmations"
    ADD CONSTRAINT "email_payment_confirmations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_payment_confirmations"
    ADD CONSTRAINT "email_payment_confirmations_rsvp_id_fkey" FOREIGN KEY ("rsvp_id") REFERENCES "public"."event_rsvps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_payment_confirmations"
    ADD CONSTRAINT "email_payment_confirmations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."event_comment_reactions"
    ADD CONSTRAINT "event_comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."event_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_comment_reactions"
    ADD CONSTRAINT "event_comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."event_comments"("id");



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "event_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_gallery"
    ADD CONSTRAINT "event_gallery_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_gallery_reactions"
    ADD CONSTRAINT "event_gallery_reactions_gallery_item_id_fkey" FOREIGN KEY ("gallery_item_id") REFERENCES "public"."event_gallery"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_gallery_reactions"
    ADD CONSTRAINT "event_gallery_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."event_gallery"
    ADD CONSTRAINT "event_gallery_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."event_hosts"
    ADD CONSTRAINT "event_hosts_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_hosts"
    ADD CONSTRAINT "event_hosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_invitees"
    ADD CONSTRAINT "event_invitees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_invitees"
    ADD CONSTRAINT "event_invitees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_invitee_id_fkey" FOREIGN KEY ("invitee_id") REFERENCES "public"."user_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_invites"
    ADD CONSTRAINT "event_invites_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "public"."user_details"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."event_settings"
    ADD CONSTRAINT "event_settings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_parent_event_id_fkey" FOREIGN KEY ("parent_event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_comments"
    ADD CONSTRAINT "public_event_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."event_contributions"
    ADD CONSTRAINT "public_event_contributions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."event_hosts"
    ADD CONSTRAINT "public_event_hosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."event_rsvps"
    ADD CONSTRAINT "public_event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "public_events_creator_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "public_follows_followed_id_fkey" FOREIGN KEY ("followed_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."follows"
    ADD CONSTRAINT "public_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."ticket_validations"
    ADD CONSTRAINT "ticket_validations_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE ONLY "public"."ticket_validations"
    ADD CONSTRAINT "ticket_validations_validated_by_fkey" FOREIGN KEY ("validated_by") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."tickets"
    ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."user_activity_log"
    ADD CONSTRAINT "user_activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."user_details"
    ADD CONSTRAINT "user_details_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_details"
    ADD CONSTRAINT "user_details_pinned_event_fkey" FOREIGN KEY ("pinned_event") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."user_favorite_events"
    ADD CONSTRAINT "user_favorite_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id");



ALTER TABLE ONLY "public"."user_favorite_events"
    ADD CONSTRAINT "user_favorite_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_fcm_tokens"
    ADD CONSTRAINT "user_fcm_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."user_stripe_settings"
    ADD CONSTRAINT "user_stripe_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_details"("id");



ALTER TABLE ONLY "public"."wallet_passes"
    ADD CONSTRAINT "wallet_passes_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id");



ALTER TABLE "public"."email_blast_configs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_blast_deliveries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."email_blasts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_comment_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_contributions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_gallery" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_gallery_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_hosts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_invitees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_payment_confirmations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_rsvps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feedback" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."follows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications_incoming" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."ticket_validations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_activity_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_details" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_favorite_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_fcm_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stripe_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."wallet_passes" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































GRANT ALL ON FUNCTION "public"."generate_timestamptz"("year" integer, "month" integer, "day" integer, "hour" integer, "minute" integer, "tz" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_timestamptz"("year" integer, "month" integer, "day" integer, "hour" integer, "minute" integer, "tz" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_timestamptz"("year" integer, "month" integer, "day" integer, "hour" integer, "minute" integer, "tz" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_timestamptz"("year" numeric, "month" numeric, "day" numeric, "hour" numeric, "minute" numeric, "tz" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_timestamptz"("year" numeric, "month" numeric, "day" numeric, "hour" numeric, "minute" numeric, "tz" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_timestamptz"("year" numeric, "month" numeric, "day" numeric, "hour" numeric, "minute" numeric, "tz" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profile_events"("username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_profile_events"("username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profile_events"("username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_username_events"("username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_username_events"("username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_username_events"("username" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."email_blast_configs" TO "anon";
GRANT ALL ON TABLE "public"."email_blast_configs" TO "authenticated";
GRANT ALL ON TABLE "public"."email_blast_configs" TO "service_role";



GRANT ALL ON TABLE "public"."email_blast_deliveries" TO "anon";
GRANT ALL ON TABLE "public"."email_blast_deliveries" TO "authenticated";
GRANT ALL ON TABLE "public"."email_blast_deliveries" TO "service_role";



GRANT ALL ON TABLE "public"."email_blasts" TO "anon";
GRANT ALL ON TABLE "public"."email_blasts" TO "authenticated";
GRANT ALL ON TABLE "public"."email_blasts" TO "service_role";



GRANT ALL ON TABLE "public"."event_comment_reactions" TO "anon";
GRANT ALL ON TABLE "public"."event_comment_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_comment_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."event_comments" TO "anon";
GRANT ALL ON TABLE "public"."event_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."event_comments" TO "service_role";



GRANT ALL ON TABLE "public"."event_contributions" TO "anon";
GRANT ALL ON TABLE "public"."event_contributions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_contributions" TO "service_role";



GRANT ALL ON TABLE "public"."event_gallery" TO "anon";
GRANT ALL ON TABLE "public"."event_gallery" TO "authenticated";
GRANT ALL ON TABLE "public"."event_gallery" TO "service_role";



GRANT ALL ON TABLE "public"."event_gallery_reactions" TO "anon";
GRANT ALL ON TABLE "public"."event_gallery_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_gallery_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."event_hosts" TO "anon";
GRANT ALL ON TABLE "public"."event_hosts" TO "authenticated";
GRANT ALL ON TABLE "public"."event_hosts" TO "service_role";



GRANT ALL ON TABLE "public"."event_invitees" TO "anon";
GRANT ALL ON TABLE "public"."event_invitees" TO "authenticated";
GRANT ALL ON TABLE "public"."event_invitees" TO "service_role";



GRANT ALL ON TABLE "public"."event_invites" TO "anon";
GRANT ALL ON TABLE "public"."event_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."event_invites" TO "service_role";



GRANT ALL ON TABLE "public"."event_payment_confirmations" TO "anon";
GRANT ALL ON TABLE "public"."event_payment_confirmations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_payment_confirmations" TO "service_role";



GRANT ALL ON TABLE "public"."event_rsvps" TO "anon";
GRANT ALL ON TABLE "public"."event_rsvps" TO "authenticated";
GRANT ALL ON TABLE "public"."event_rsvps" TO "service_role";



GRANT ALL ON TABLE "public"."event_settings" TO "anon";
GRANT ALL ON TABLE "public"."event_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."event_settings" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."feedback" TO "anon";
GRANT ALL ON TABLE "public"."feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."feedback" TO "service_role";



GRANT ALL ON TABLE "public"."follows" TO "anon";
GRANT ALL ON TABLE "public"."follows" TO "authenticated";
GRANT ALL ON TABLE "public"."follows" TO "service_role";



GRANT ALL ON TABLE "public"."notifications_incoming" TO "anon";
GRANT ALL ON TABLE "public"."notifications_incoming" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications_incoming" TO "service_role";



GRANT ALL ON TABLE "public"."ticket_validations" TO "anon";
GRANT ALL ON TABLE "public"."ticket_validations" TO "authenticated";
GRANT ALL ON TABLE "public"."ticket_validations" TO "service_role";



GRANT ALL ON TABLE "public"."tickets" TO "anon";
GRANT ALL ON TABLE "public"."tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."tickets" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity_log" TO "anon";
GRANT ALL ON TABLE "public"."user_activity_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_details" TO "anon";
GRANT ALL ON TABLE "public"."user_details" TO "authenticated";
GRANT ALL ON TABLE "public"."user_details" TO "service_role";



GRANT ALL ON TABLE "public"."user_favorite_events" TO "anon";
GRANT ALL ON TABLE "public"."user_favorite_events" TO "authenticated";
GRANT ALL ON TABLE "public"."user_favorite_events" TO "service_role";



GRANT ALL ON TABLE "public"."user_fcm_tokens" TO "anon";
GRANT ALL ON TABLE "public"."user_fcm_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_fcm_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."user_stripe_settings" TO "anon";
GRANT ALL ON TABLE "public"."user_stripe_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stripe_settings" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_emails" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_emails" TO "service_role";



GRANT ALL ON TABLE "public"."wallet_passes" TO "anon";
GRANT ALL ON TABLE "public"."wallet_passes" TO "authenticated";
GRANT ALL ON TABLE "public"."wallet_passes" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
