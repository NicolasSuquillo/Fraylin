CREATE TYPE "public"."payment_method" AS ENUM('payphone', 'transferencia');--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" "payment_method" DEFAULT 'payphone' NOT NULL;