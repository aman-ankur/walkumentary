-- Simplified Walkumentary Database Setup
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    full_name VARCHAR,
    avatar_url VARCHAR,
    preferences JSONB DEFAULT '{
        "interests": [], 
        "language": "en", 
        "default_tour_duration": 30, 
        "audio_speed": 1.0, 
        "theme": "light"
    }',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    country VARCHAR,
    city VARCHAR,
    location_type VARCHAR,
    metadata JSONB DEFAULT '{}',
    image_url VARCHAR,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    audio_url VARCHAR,
    duration_minutes INTEGER NOT NULL,
    interests TEXT[] DEFAULT '{}',
    language VARCHAR DEFAULT 'en',
    llm_provider VARCHAR,
    llm_model VARCHAR,
    generation_params JSONB DEFAULT '{}',
    status VARCHAR DEFAULT 'generating',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_tours_user_id ON tours(user_id);
CREATE INDEX IF NOT EXISTS idx_tours_location_id ON tours(location_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own tours" ON tours;
DROP POLICY IF EXISTS "Users can create own tours" ON tours;
DROP POLICY IF EXISTS "Users can update own tours" ON tours;
DROP POLICY IF EXISTS "Users can delete own tours" ON tours;
DROP POLICY IF EXISTS "Anyone can view locations" ON locations;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for tours table
CREATE POLICY "Users can view own tours" ON tours
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own tours" ON tours
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own tours" ON tours
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own tours" ON tours
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- Public read access for locations
CREATE POLICY "Anyone can view locations" ON locations
    FOR SELECT USING (true);

-- Function for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TRIGGER IF EXISTS update_tours_updated_at ON tours;

-- Create triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at 
    BEFORE UPDATE ON locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tours_updated_at 
    BEFORE UPDATE ON tours 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();