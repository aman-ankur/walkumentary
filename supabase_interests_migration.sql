-- Supabase Migration: Fix interests column type from TEXT[] to JSONB
-- Run this in your Supabase SQL Editor
-- This fixes the "column interests is of type text[] but expression is of type json" error

-- Step 1: Check current column type (for verification)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' AND column_name = 'interests';

-- Step 2: Add a temporary column with JSONB type
ALTER TABLE tours ADD COLUMN IF NOT EXISTS interests_temp JSONB;

-- Step 3: Convert existing TEXT[] data to JSONB format
-- This handles the conversion from PostgreSQL array to JSON array
UPDATE tours 
SET interests_temp = 
    CASE 
        WHEN interests IS NULL THEN '[]'::jsonb
        WHEN array_length(interests, 1) IS NULL THEN '[]'::jsonb
        ELSE to_jsonb(interests)
    END
WHERE interests_temp IS NULL;

-- Step 4: Drop the old column
ALTER TABLE tours DROP COLUMN IF EXISTS interests;

-- Step 5: Rename the temporary column to the original name
ALTER TABLE tours RENAME COLUMN interests_temp TO interests;

-- Step 6: Set default value for new records
ALTER TABLE tours ALTER COLUMN interests SET DEFAULT '[]'::jsonb;

-- Step 7: Add constraint to ensure it's always a JSON array
ALTER TABLE tours ADD CONSTRAINT interests_is_array 
    CHECK (jsonb_typeof(interests) = 'array');

-- Step 8: Update any existing NULL values to empty array
UPDATE tours SET interests = '[]'::jsonb WHERE interests IS NULL;

-- Step 9: Add comment for documentation
COMMENT ON COLUMN tours.interests IS 'Array of user interests stored as JSONB for compatibility with SQLAlchemy JSON column type';

-- Step 10: Verify the migration worked
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tours' AND column_name = 'interests';

-- Step 11: Check sample data to ensure conversion worked
SELECT id, title, interests 
FROM tours 
LIMIT 5;