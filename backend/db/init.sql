-- Run this script in your Supabase SQL Editor

-- 1. Enable PostGIS extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create the rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    ulpin VARCHAR(14) UNIQUE NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    floor_level INTEGER,
    base_elevation DOUBLE PRECISION,
    ceiling_height DOUBLE PRECISION,
    is_public BOOLEAN DEFAULT false,
    name VARCHAR(255),
    building_id VARCHAR(50),
    geom geometry(POLYGONZ, 4326), -- 3D PostGIS geometry
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create a spatial index for fast geographic queries
CREATE INDEX IF NOT EXISTS rooms_geom_idx ON rooms USING GIST (geom);

-- Note: We assume that the building_id can be used to group rooms inside a specific structure.
