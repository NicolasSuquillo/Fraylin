ALTER TABLE "pricing_settings" ADD COLUMN "transfer_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "transfer_qr_image_url" text;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "transfer_bank_name" text;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "transfer_account_type" text;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "transfer_account_number" text;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "transfer_account_holder" text;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "transfer_account_id" text;--> statement-breakpoint
ALTER TABLE "pricing_settings" ADD COLUMN "transfer_instructions" text;