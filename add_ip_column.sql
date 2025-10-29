-- Add IP address column to profiles table
-- Run this in Supabase SQL Editor

-- Add the ip_address column to the profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN public.profiles.ip_address IS 'IP address of the admin user for security and tracking purposes';

-- Test the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'ip_address';
