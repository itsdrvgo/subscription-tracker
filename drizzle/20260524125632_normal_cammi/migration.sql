ALTER TABLE "subscriptions" ADD COLUMN "kind" text DEFAULT 'subscription' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "end_date" timestamp;