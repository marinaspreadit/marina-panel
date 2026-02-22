CREATE TABLE "spotify_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"refresh_token" text DEFAULT '' NOT NULL,
	"scope" text DEFAULT '' NOT NULL,
	"token_type" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
