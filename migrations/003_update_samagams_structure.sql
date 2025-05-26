-- Migration to update samagams table structure
-- Add color field and split time into timeFrom and timeTo

-- Add new columns
ALTER TABLE samagams ADD COLUMN time_from TEXT;
ALTER TABLE samagams ADD COLUMN time_to TEXT;
ALTER TABLE samagams ADD COLUMN color TEXT DEFAULT '#3B82F6';

-- Migrate existing time data (assuming format is like "7:00 PM - 9:00 PM")
UPDATE samagams 
SET 
  time_from = TRIM(SPLIT_PART(time, '-', 1)),
  time_to = TRIM(SPLIT_PART(time, '-', 2))
WHERE time IS NOT NULL;

-- For entries that don't have a dash separator, put the whole time in time_from
UPDATE samagams 
SET 
  time_from = time,
  time_to = time
WHERE time IS NOT NULL AND time NOT LIKE '%-%';

-- Set NOT NULL constraints after migration
ALTER TABLE samagams ALTER COLUMN time_from SET NOT NULL;
ALTER TABLE samagams ALTER COLUMN time_to SET NOT NULL;
ALTER TABLE samagams ALTER COLUMN color SET NOT NULL;

-- Drop the old time column
ALTER TABLE samagams DROP COLUMN time;
