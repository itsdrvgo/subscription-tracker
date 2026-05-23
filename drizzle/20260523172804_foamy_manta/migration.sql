CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"monthly_limit" numeric(12,2),
	"yearly_limit" numeric(12,2),
	"warning_threshold" integer DEFAULT 80 NOT NULL,
	"critical_threshold" integer DEFAULT 95 NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"identifier" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"subscription_name" text NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"color" text,
	"icon" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_reminder_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"subscription_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reminder_type" text NOT NULL,
	"for_date" timestamp NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"email_sent_to" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"category_id" uuid,
	"payment_source_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"website_url" text,
	"logo_url" text,
	"tags" jsonb DEFAULT '[]' NOT NULL,
	"billing_cycle" text NOT NULL,
	"custom_interval_days" integer,
	"price" numeric(12,2) NOT NULL,
	"yearly_price" numeric(12,2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"tax_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(12,2) DEFAULT '0' NOT NULL,
	"start_date" timestamp NOT NULL,
	"next_renewal_date" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"is_trial" boolean DEFAULT false NOT NULL,
	"trial_end_date" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"reminder_enabled" boolean DEFAULT true NOT NULL,
	"reminder_days_before" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"last_reminder_sent_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "budgets_user_uidx" ON "budgets" ("user_id");--> statement-breakpoint
CREATE INDEX "payment_sources_user_idx" ON "payment_sources" ("user_id");--> statement-breakpoint
CREATE INDEX "payment_sources_type_idx" ON "payment_sources" ("type");--> statement-breakpoint
CREATE INDEX "subscription_activity_logs_user_idx" ON "subscription_activity_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_activity_logs_subscription_idx" ON "subscription_activity_logs" ("subscription_id");--> statement-breakpoint
CREATE INDEX "subscription_activity_logs_created_idx" ON "subscription_activity_logs" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_categories_user_slug_uidx" ON "subscription_categories" ("user_id","slug");--> statement-breakpoint
CREATE INDEX "subscription_categories_user_idx" ON "subscription_categories" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_reminder_sends_idempotent_uidx" ON "subscription_reminder_sends" ("subscription_id","reminder_type","for_date");--> statement-breakpoint
CREATE INDEX "subscription_reminder_sends_user_idx" ON "subscription_reminder_sends" ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_idx" ON "subscriptions" ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_next_renewal_idx" ON "subscriptions" ("next_renewal_date");--> statement-breakpoint
CREATE INDEX "subscriptions_category_idx" ON "subscriptions" ("category_id");--> statement-breakpoint
CREATE INDEX "subscriptions_payment_source_idx" ON "subscriptions" ("payment_source_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_status_idx" ON "subscriptions" ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uidx" ON "users" ("email");--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment_sources" ADD CONSTRAINT "payment_sources_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscription_activity_logs" ADD CONSTRAINT "subscription_activity_logs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscription_activity_logs" ADD CONSTRAINT "subscription_activity_logs_e6XjxOVcEa5I_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "subscription_categories" ADD CONSTRAINT "subscription_categories_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscription_reminder_sends" ADD CONSTRAINT "subscription_reminder_sends_WHx3QOtJBGY7_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscription_reminder_sends" ADD CONSTRAINT "subscription_reminder_sends_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_category_id_subscription_categories_id_fkey" FOREIGN KEY ("category_id") REFERENCES "subscription_categories"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_source_id_payment_sources_id_fkey" FOREIGN KEY ("payment_source_id") REFERENCES "payment_sources"("id") ON DELETE SET NULL;