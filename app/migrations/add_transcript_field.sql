-- Migration: Add transcript field to tours table
-- Date: 2025-07-01
-- Description: Add JSONB transcript field to store timestamped transcript segments

-- Add the transcript column (nullable to maintain backwards compatibility)
ALTER TABLE tours ADD COLUMN IF NOT EXISTS transcript JSONB;

-- Add an index for transcript queries (optional optimization)
CREATE INDEX IF NOT EXISTS idx_tours_transcript ON tours USING GIN (transcript);

-- Add a comment for documentation
COMMENT ON COLUMN tours.transcript IS 'Array of transcript segments with startTime, endTime, and text fields';