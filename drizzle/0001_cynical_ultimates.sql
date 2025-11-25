CREATE TABLE "modifiers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text,
	"default_value" text,
	"icon_name" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sequences" ADD COLUMN "available_modifiers" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "modifiers" ADD CONSTRAINT "modifiers_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;