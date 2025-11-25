-- Convert default_value from text to integer with explicit cast
-- Existing string values will be converted to NULL if they can't be parsed as integers
ALTER TABLE "modifiers" ALTER COLUMN "default_value" SET DATA TYPE integer USING (NULLIF(default_value, '')::integer);
