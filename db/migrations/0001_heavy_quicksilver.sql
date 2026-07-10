ALTER TABLE "event_occurrences" ADD COLUMN "notify_days_before_override" integer;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "notify_days_before" integer;