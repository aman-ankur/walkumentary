-- Add walkable tour fields to tours table
-- Migration: add_walkable_tour_fields.sql
-- Created: July 13, 2025

-- Add new columns for walkable tour functionality
ALTER TABLE tours ADD COLUMN IF NOT EXISTS walkable_stops JSONB DEFAULT '[]';
ALTER TABLE tours ADD COLUMN IF NOT EXISTS total_walking_distance VARCHAR(50);
ALTER TABLE tours ADD COLUMN IF NOT EXISTS estimated_walking_time VARCHAR(50);
ALTER TABLE tours ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'easy';
ALTER TABLE tours ADD COLUMN IF NOT EXISTS route_type VARCHAR(20) DEFAULT 'walkable';

-- Create index for walkable_stops JSONB queries (for future optimization)
CREATE INDEX IF NOT EXISTS idx_tours_walkable_stops ON tours USING GIN (walkable_stops);

-- Create index for route_type queries (for filtering walkable vs other tour types)
CREATE INDEX IF NOT EXISTS idx_tours_route_type ON tours (route_type);

-- Add comments for documentation
COMMENT ON COLUMN tours.walkable_stops IS 'JSONB array of walkable stops with coordinates and metadata';
COMMENT ON COLUMN tours.total_walking_distance IS 'Human-readable total walking distance (e.g., "1.2 km")';
COMMENT ON COLUMN tours.estimated_walking_time IS 'Human-readable estimated walking time (e.g., "15 minutes")';
COMMENT ON COLUMN tours.difficulty_level IS 'Walking difficulty: easy, moderate, or challenging';
COMMENT ON COLUMN tours.route_type IS 'Type of tour route: walkable, driving, or mixed';