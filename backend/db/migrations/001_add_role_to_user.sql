-- Migration: Add role column to user table
-- Run this in your PostgreSQL database (oddox)

-- Create the user_role enum type (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');
    END IF;
END$$;

-- Add role column to user table
ALTER TABLE "user" 
ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'USER';
