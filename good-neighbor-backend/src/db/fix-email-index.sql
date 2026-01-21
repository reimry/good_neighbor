-- Fix: Add index on email column only if it exists
-- This is a follow-up to fix-login-id-migration.sql

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email'
    ) THEN
        -- Email column exists, create index if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'users' AND indexname = 'idx_users_email'
        ) THEN
            CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
            RAISE NOTICE 'Email index created successfully';
        ELSE
            RAISE NOTICE 'Email index already exists';
        END IF;
    ELSE
        RAISE NOTICE 'Email column does not exist. Run osbb-registration-schema.sql first if needed.';
    END IF;
END $$;
