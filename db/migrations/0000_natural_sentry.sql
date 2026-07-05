CREATE TYPE "public"."user_role" AS ENUM('viewer', 'editor', 'admin');--> statement-breakpoint
CREATE TABLE "sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"picture_path" text,
	"role" "user_role" NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "academic_years" (
	"start_year" integer PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"value" text PRIMARY KEY NOT NULL,
	"color" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classifications" (
	"value" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_occurrences" (
	"id" uuid PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"description" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"min_days" integer,
	"min_days_to_next" integer
);
--> statement-breakpoint
CREATE TABLE "event_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL,
	"type" text NOT NULL,
	"config" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" integer PRIMARY KEY NOT NULL,
	"academic_year_start" integer NOT NULL,
	"name" text NOT NULL,
	"objective" text NOT NULL,
	"category" text NOT NULL,
	"classification" text NOT NULL,
	"status" text NOT NULL,
	"responsible" text NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responsibles" (
	"value" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statuses" (
	"name" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vacation_periods" (
	"id" uuid PRIMARY KEY NOT NULL,
	"academic_year_start" integer NOT NULL,
	"label" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_occurrences" ADD CONSTRAINT "event_occurrences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_rules" ADD CONSTRAINT "event_rules_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_academic_year_start_academic_years_start_year_fk" FOREIGN KEY ("academic_year_start") REFERENCES "public"."academic_years"("start_year") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_categories_value_fk" FOREIGN KEY ("category") REFERENCES "public"."categories"("value") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_classification_classifications_value_fk" FOREIGN KEY ("classification") REFERENCES "public"."classifications"("value") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_status_statuses_name_fk" FOREIGN KEY ("status") REFERENCES "public"."statuses"("name") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_responsible_responsibles_value_fk" FOREIGN KEY ("responsible") REFERENCES "public"."responsibles"("value") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacation_periods" ADD CONSTRAINT "vacation_periods_academic_year_start_academic_years_start_year_fk" FOREIGN KEY ("academic_year_start") REFERENCES "public"."academic_years"("start_year") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "event_occurrences_event_id_idx" ON "event_occurrences" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_occurrences_date_range_idx" ON "event_occurrences" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "event_rules_event_id_idx" ON "event_rules" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "events_academic_year_idx" ON "events" USING btree ("academic_year_start");--> statement-breakpoint
CREATE INDEX "vacation_periods_academic_year_idx" ON "vacation_periods" USING btree ("academic_year_start");