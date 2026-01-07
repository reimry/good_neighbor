-- Audit Logging Schema
-- Tracks all critical actions in the system for security and compliance
-- NOTE: This schema requires osbb_organizations table to exist.
-- Run osbb-registration-schema.sql first if you haven't already.

-- Ensure osbb_organizations table exists (create if missing)
CREATE TABLE IF NOT EXISTS osbb_organizations (
    id SERIAL PRIMARY KEY,
    edrpou VARCHAR(8) UNIQUE NOT NULL,
    full_name VARCHAR(500) NOT NULL,
    address_city VARCHAR(100),
    address_street VARCHAR(200),
    address_building VARCHAR(50),
    authorized_person VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW(),
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES users(id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,  -- NULL for system actions
    osbb_id INTEGER REFERENCES osbb_organizations(id) ON DELETE SET NULL,  -- NULL for super_admin actions
    action_type VARCHAR(50) NOT NULL,  -- 'login', 'login_failed', 'approve_registration', 'reject_registration', 'create_voting', 'create_news', etc.
    entity_type VARCHAR(50),  -- 'user', 'voting', 'news', 'osbb_registration', 'apartment', etc.
    entity_id INTEGER,  -- ID of the affected entity
    old_data JSONB,  -- Previous state (for updates)
    new_data JSONB,  -- New state (for creates/updates)
    metadata JSONB,  -- IP address, user-agent, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_osbb ON audit_logs(osbb_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- Add super_admin role support to users table
DO $$ 
BEGIN
    -- Update role check constraint to include 'super_admin'
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    ALTER TABLE users 
    ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'owner', 'tenant', 'super_admin'));
END $$;

-- Ensure super_admin users have osbb_id = NULL
DO $$
BEGIN
    UPDATE users SET osbb_id = NULL WHERE role = 'super_admin' AND osbb_id IS NOT NULL;
END $$;

