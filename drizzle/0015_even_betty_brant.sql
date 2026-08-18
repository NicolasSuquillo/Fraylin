ALTER TABLE "products" ADD COLUMN "show_on_web" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "show_in_catalog" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "internal_notes" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "specs" text;--> statement-breakpoint
CREATE INDEX "products_show_on_web_idx" ON "products" USING btree ("show_on_web");--> statement-breakpoint
CREATE INDEX "products_show_in_catalog_idx" ON "products" USING btree ("show_in_catalog");