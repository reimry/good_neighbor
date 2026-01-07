-- OSBB Registration Schema
-- Extends the database with OSBB and registration request tables

-- First, add email column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'email') THEN
        ALTER TABLE users ADD COLUMN email VARCHAR(255) UNIQUE;
    END IF;
END $$;

-- OSBB Organizations
-- Note: This table may also be created by audit-logging-schema.sql
-- Using CREATE TABLE IF NOT EXISTS to avoid conflicts
CREATE TABLE IF NOT EXISTS osbb_organizations (
    id SERIAL PRIMARY KEY,
    edrpou VARCHAR(8) UNIQUE NOT NULL,  -- 8-digit EDRPOU code
    full_name VARCHAR(500) NOT NULL,
    address_city VARCHAR(100),
    address_street VARCHAR(200),
    address_building VARCHAR(50),
    authorized_person VARCHAR(255),  -- Head's name from EDR
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id)
);

-- Add missing columns if they don't exist (for compatibility)
DO $$ 
BEGIN
    -- Add address column if it doesn't exist (some schemas use JSONB address)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'osbb_organizations' AND column_name = 'address'
    ) THEN
        -- Keep existing columns, address is split into address_city, address_street, address_building
    END IF;
END $$;

-- Registration Requests (Head of OSBB registration)
CREATE TABLE IF NOT EXISTS osbb_registration_requests (
    id SERIAL PRIMARY KEY,
    osbb_id INTEGER REFERENCES osbb_organizations(id) ON DELETE CASCADE,
    edrpou VARCHAR(8) NOT NULL,
    head_rnokpp VARCHAR(10) NOT NULL,  -- Tax ID of the Head
    head_full_name VARCHAR(255) NOT NULL,
    head_email VARCHAR(255) NOT NULL,
    head_phone VARCHAR(13) NOT NULL,
    protocol_path VARCHAR(500),  -- Path to uploaded PDF file (relative to uploads/)
    password_hash VARCHAR(255) NOT NULL,  -- Argon2 hashed password
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    -- Once approved, this creates a user account
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_osbb_edrpou ON osbb_organizations(edrpou);
CREATE INDEX IF NOT EXISTS idx_registration_status ON osbb_registration_requests(status);
CREATE INDEX IF NOT EXISTS idx_registration_osbb ON osbb_registration_requests(osbb_id);
