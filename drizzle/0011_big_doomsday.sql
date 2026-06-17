CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"avatar_url" text,
	"approved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "reviews_approved_idx" ON "reviews" USING btree ("approved");