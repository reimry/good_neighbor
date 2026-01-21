-- Migration: Fix login_id to be nullable (only superadmins use it)
-- Regular users (residents, admins) use phone/email for login
-- SuperAdmin users use login_id for login

-- Step 1: Make login_id nullable
ALTER TABLE users ALTER COLUMN login_id DROP NOT NULL;

-- Step 2: For existing regular users (non-super_admin), set login_id = phone if phone exists
-- This maintains backward compatibility temporarily
UPDATE users 
SET login_id = phone 
WHERE role != 'super_admin' 
  AND phone IS NOT NULL 
  AND login_id IS NULL;

-- Step 3: Add constraint: super_admin users MUST have login_id
-- First check if constraint already exists, then add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_superadmin_login_id'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT check_superadmin_login_id 
        CHECK (
          (role = 'super_admin' AND login_id IS NOT NULL) OR 
          (role != 'super_admin')
        );
    END IF;
END $$;

-- Step 4: Add index on phone for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;

-- Step 5: Add index on email for faster lookups (if email column exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;
    END IF;
END $$;

-- Summary
SELECT 
  'Migration complete. login_id is now nullable.' as status,
  COUNT(*) FILTER (WHERE role = 'super_admin' AND login_id IS NOT NULL) as superadmins_with_login_id,
  COUNT(*) FILTER (WHERE role != 'super_admin' AND phone IS NOT NULL) as regular_users_with_phone,
  COUNT(*) FILTER (WHERE role = 'super_admin' AND login_id IS NULL) as superadmins_missing_login_id
FROM users;
