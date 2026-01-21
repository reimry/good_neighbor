-- =========================================================
-- Good Neighbor MVP Schema - Complete Setup Script
-- =========================================================

-- ⚠️ WARNING: This will DELETE all existing data in these tables!
-- Run this only when you want a fresh start.

-- 1. CLEANUP (Drop tables in correct order to avoid foreign key errors)
DROP TABLE IF EXISTS invitation_codes CASCADE;
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS votings CASCADE;
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS apartments CASCADE;

-- 2. CREATE TABLES

-- Apartments (Квартири)
CREATE TABLE apartments (
    id SERIAL PRIMARY KEY,
    number VARCHAR(10) NOT NULL,        -- "42", "15A"
    area DECIMAL(6,2) NOT NULL,         -- 65.50 м²
    balance DECIMAL(10,2) DEFAULT 0,    -- -540.50 грн (debt)
    osbb_id INTEGER DEFAULT 1,          -- for MVP always 1
    created_at TIMESTAMP DEFAULT NOW()
);

-- Users (Користувачі)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(13),                  -- +380xxxxxxxxx (optional, kept for compatibility)
    login_id VARCHAR(50) UNIQUE NOT NULL,  -- User login ID for authentication
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'owner', 'tenant', 'super_admin')),
    apartment_id INTEGER REFERENCES apartments(id),
    osbb_id INTEGER,                    -- For super_admin and organization-level admins
    created_at TIMESTAMP DEFAULT NOW()
);

-- News (Новини)
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT FALSE,
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Votings (Голосування)
CREATE TABLE votings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('simple', 'legal')),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'finished')),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Votes (Голоси)
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    voting_id INTEGER REFERENCES votings(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    choice VARCHAR(20) NOT NULL CHECK (choice IN ('for', 'against', 'abstain')),
    voted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(voting_id, user_id)
);

-- Invitation Codes (Коди запрошення)
CREATE TABLE invitation_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(8) UNIQUE NOT NULL,
    apartment_id INTEGER REFERENCES apartments(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'tenant', 'admin')), -- Added 'admin' just for initial setup
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. SEED DATA (Test Data)

-- Create Apartments
INSERT INTO apartments (number, area, balance) VALUES 
('ADMIN', 0, 0),       -- System apartment for admin
('42', 65.5, -540.50), -- Deptor
('15', 48.0, 120.00),  -- Paid
('101', 50.0, 0.00);   -- Empty

-- Create Invitation Codes (Use these to create users!)
-- 1. ADMIN CODE: Use this to create your first Admin account
INSERT INTO invitation_codes (code, apartment_id, role) 
VALUES ('ADMIN001', (SELECT id FROM apartments WHERE number = 'ADMIN'), 'admin');

-- 2. OWNER CODE: Use this to create a resident account
INSERT INTO invitation_codes (code, apartment_id, role) 
VALUES ('OWNER101', (SELECT id FROM apartments WHERE number = '101'), 'owner');

-- Summary output
SELECT 'Database reset complete. Use code ADMIN001 to register as Admin. Use code OWNER101 to register as Owner.' as status;
