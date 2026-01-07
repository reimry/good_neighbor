-- Add updated_at column to osbb_registration_requests if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'osbb_registration_requests' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE osbb_registration_requests ADD COLUMN updated_at TIMESTAMP;
    END IF;
END $$;

