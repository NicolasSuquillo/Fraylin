CREATE TABLE "cache_meta" (
	"key" text PRIMARY KEY NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
