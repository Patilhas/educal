CREATE TABLE "notification_reads" (
	"notification_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notification_reads_notification_id_user_id_pk" PRIMARY KEY("notification_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY NOT NULL,
	"occurrence_id" uuid NOT NULL,
	"occurrence_start_date_at_gen" timestamp with time zone NOT NULL,
	"lead_days_at_gen" integer,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "notifications_occurrence_id_unique" UNIQUE("occurrence_id")
);
--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_reads" ADD CONSTRAINT "notification_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_occurrence_id_event_occurrences_id_fk" FOREIGN KEY ("occurrence_id") REFERENCES "public"."event_occurrences"("id") ON DELETE cascade ON UPDATE no action;