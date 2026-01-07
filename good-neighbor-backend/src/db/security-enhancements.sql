-- Security Enhancements Migration
-- Adds OSBB tracking to votings and improves data integrity

-- Add osbb_id to votings table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'votings' AND column_name = 'osbb_id') THEN
        ALTER TABLE votings ADD COLUMN osbb_id INTEGER;
        -- For existing votings, set osbb_id to NULL (will be set when OSBBs are created)
        -- Don't set to 1 unless we know OSBB with id=1 exists
        UPDATE votings SET osbb_id = NULL WHERE osbb_id IS NULL;
    END IF;
END $$;

-- Add osbb_id to users table (link admin to their OSBB)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'osbb_id') THEN
        ALTER TABLE users ADD COLUMN osbb_id INTEGER REFERENCES osbb_organizations(id);
        -- Link existing admins to their OSBB through registration requests
        UPDATE users u
        SET osbb_id = r.osbb_id
        FROM osbb_registration_requests r
        WHERE u.id = r.user_id AND u.role = 'admin' AND r.status = 'approved';
    END IF;
END $$;

-- Add foreign key constraint for apartments.osbb_id
-- First, clean up any invalid osbb_id references
DO $$
BEGIN
    -- Set osbb_id to NULL for apartments that reference non-existent OSBBs
    UPDATE apartments 
    SET osbb_id = NULL 
    WHERE osbb_id IS NOT NULL 
      AND osbb_id NOT IN (SELECT id FROM osbb_organizations);
    
    -- If there are apartments with osbb_id = 1 but no OSBB with id=1 exists,
    -- create a default placeholder OSBB
    IF EXISTS (SELECT 1 FROM apartments WHERE osbb_id = 1) 
       AND NOT EXISTS (SELECT 1 FROM osbb_organizations WHERE id = 1) THEN
        -- Create a default OSBB for existing data
        -- Use explicit ID insertion and update sequence
        INSERT INTO osbb_organizations (id, edrpou, full_name, status)
        VALUES (1, '00000000', 'Default OSBB (Migration)', 'active')
        ON CONFLICT (id) DO NOTHING;
        
        -- Update the sequence to ensure next ID is correct
        SELECT setval('osbb_organizations_id_seq', 
                      GREATEST((SELECT MAX(id) FROM osbb_organizations), 1), 
                      true);
    END IF;
END $$;

-- Now add the foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'apartments_osbb_id_fkey'
    ) THEN
        ALTER TABLE apartments 
        ADD CONSTRAINT apartments_osbb_id_fkey 
        FOREIGN KEY (osbb_id) REFERENCES osbb_organizations(id);
    END IF;
END $$;

-- Add foreign key constraint for votings.osbb_id
-- First, clean up any invalid osbb_id references
DO $$
BEGIN
    -- Set osbb_id to NULL for votings that reference non-existent OSBBs
    UPDATE votings 
    SET osbb_id = NULL 
    WHERE osbb_id IS NOT NULL 
      AND osbb_id NOT IN (SELECT id FROM osbb_organizations);
END $$;

-- Now add the foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'votings_osbb_id_fkey'
    ) THEN
        ALTER TABLE votings 
        ADD CONSTRAINT votings_osbb_id_fkey 
        FOREIGN KEY (osbb_id) REFERENCES osbb_organizations(id);
    END IF;
END $$;

-- Add index for faster OSBB queries
CREATE INDEX IF NOT EXISTS idx_users_osbb_id ON users(osbb_id);
CREATE INDEX IF NOT EXISTS idx_votings_osbb_id ON votings(osbb_id);
CREATE INDEX IF NOT EXISTS idx_apartments_osbb_id ON apartments(osbb_id);

-- Add used_at timestamp to invitation_codes for better tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'invitation_codes' AND column_name = 'used_at') THEN
        ALTER TABLE invitation_codes ADD COLUMN used_at TIMESTAMP;
    END IF;
END $$;

