ALTER TABLE "artifacts" ALTER COLUMN "url" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "storage" text DEFAULT 'url' NOT NULL;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "filename" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "mime" text DEFAULT 'application/octet-stream' NOT NULL;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "content_base64" text DEFAULT '' NOT NULL;