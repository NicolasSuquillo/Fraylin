CREATE TABLE "pricing_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"shipping_zone_cents" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"installation_cents" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
