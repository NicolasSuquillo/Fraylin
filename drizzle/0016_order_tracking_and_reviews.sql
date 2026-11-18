ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_note" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_orders_fulfillment_status'
  ) THEN
    ALTER TABLE "orders" ADD CONSTRAINT "chk_orders_fulfillment_status"
      CHECK ("fulfillment_status" IN ('nuevo', 'preparando', 'coordinado', 'entregado'));
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_image_src" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_category" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_description" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "product_specs" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
  "status_from" text,
  "status_to" text,
  "fulfillment_from" text,
  "fulfillment_to" text,
  "title" text NOT NULL,
  "description" text,
  "actor" text DEFAULT 'sistema' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_events_order_idx" ON "order_events" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "order_events_created_idx" ON "order_events" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "order_id" uuid REFERENCES "orders"("id") ON DELETE set null;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "client_transaction_id" text;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "reviews_order_idx" ON "reviews" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_order_id_uq" ON "reviews" ("order_id") WHERE "order_id" IS NOT NULL;

