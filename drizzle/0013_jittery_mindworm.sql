ALTER TABLE "pricing_settings" ADD COLUMN "shipping_zone_transfer_cents" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "installation_transfer_cents" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "payphone_fee_bps" integer DEFAULT 575 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "transfer_price_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "installation_transfer_cents" integer;--> statement-breakpoint
-- Backfill: el precio existente se conserva como precio TARJETA; el precio
-- transferencia se deriva = round(card * (1 - 0.0575)) = card * 0.9425.
UPDATE "products" SET "transfer_price_cents" = round("price_cents" * 0.9425) WHERE "price_cents" IS NOT NULL;--> statement-breakpoint
UPDATE "products" SET "installation_transfer_cents" = round("installation_cents" * 0.9425) WHERE "installation_cents" IS NOT NULL;--> statement-breakpoint
UPDATE "pricing_settings" SET "installation_transfer_cents" = round("installation_cents" * 0.9425);--> statement-breakpoint
UPDATE "pricing_settings" SET "shipping_zone_transfer_cents" = (
  SELECT COALESCE(jsonb_object_agg(key, round((value::numeric) * 0.9425)::int), '{}'::jsonb)
  FROM jsonb_each_text("shipping_zone_cents")
) WHERE "shipping_zone_cents" <> '{}'::jsonb;