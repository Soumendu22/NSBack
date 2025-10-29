-- Migration: Add Wazuh credentials columns to users table
-- Run this SQL query in your Supabase SQL editor

-- Check if columns already exist before adding them
DO $$ 
BEGIN
    -- Add wazuh_username column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'wazuh_username'
    ) THEN
        ALTER TABLE users ADD COLUMN wazuh_username VARCHAR(255) NULL;
        RAISE NOTICE 'Added wazuh_username column to users table';
    ELSE
        RAISE NOTICE 'wazuh_username column already exists in users table';
    END IF;

    -- Add wazuh_password column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'wazuh_password'
    ) THEN
        ALTER TABLE users ADD COLUMN wazuh_password VARCHAR(255) NULL;
        RAISE NOTICE 'Added wazuh_password column to users table';
    ELSE
        RAISE NOTICE 'wazuh_password column already exists in users table';
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN users.wazuh_username IS 'Wazuh manager username for SIEM/EDR integration';
COMMENT ON COLUMN users.wazuh_password IS 'Encrypted Wazuh manager password for SIEM/EDR integration (bcrypt hashed)';

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('wazuh_username', 'wazuh_password')
ORDER BY column_name;
