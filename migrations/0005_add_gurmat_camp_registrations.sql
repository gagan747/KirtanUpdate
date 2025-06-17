CREATE TABLE IF NOT EXISTS "gurmat_camp_registrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "age" text NOT NULL,
  "gender" text NOT NULL,
  "address" text NOT NULL,
  "father_name" text NOT NULL,
  "mother_name" text NOT NULL,
  "contact_number" text NOT NULL,
  "email" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "gurmat_camp_registrations_email_unique" UNIQUE("email")
); 