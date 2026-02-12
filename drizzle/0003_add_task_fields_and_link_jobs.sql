ALTER TABLE "jobs" ADD COLUMN "task_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "log" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "owner" text DEFAULT 'Marina' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;