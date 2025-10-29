-- Create endpoint_users table for NexusSentinel endpoint user registration
CREATE TABLE IF NOT EXISTS public.endpoint_users (
    id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    organization_id UUID NOT NULL, -- Changed to reference auth.users instead
    organization_company_name TEXT NOT NULL,
    operating_system TEXT NOT NULL DEFAULT 'Unknown',
    os_version TEXT NOT NULL DEFAULT 'Unknown',
    ip_address TEXT NOT NULL DEFAULT 'Unknown',
    mac_address TEXT NOT NULL DEFAULT 'Unknown',
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Primary key
    CONSTRAINT endpoint_users_pkey PRIMARY KEY (id),

    -- Unique constraints
    CONSTRAINT endpoint_users_email_key UNIQUE (email),

    -- Foreign key constraint to public.users (where organization data is stored)
    CONSTRAINT fk_organization FOREIGN KEY (organization_id)
        REFERENCES public.users(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_endpoint_users_email ON public.endpoint_users(email);
CREATE INDEX IF NOT EXISTS idx_endpoint_users_organization ON public.endpoint_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_endpoint_users_approved ON public.endpoint_users(is_approved);
CREATE INDEX IF NOT EXISTS idx_endpoint_users_created_at ON public.endpoint_users(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
DROP TRIGGER IF EXISTS update_endpoint_users_updated_at ON public.endpoint_users;
CREATE TRIGGER update_endpoint_users_updated_at
    BEFORE UPDATE ON public.endpoint_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for security
ALTER TABLE public.endpoint_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow anyone to register (insert) - this is for endpoint users signing up anonymously
CREATE POLICY "Allow anonymous endpoint registration" ON public.endpoint_users
    FOR INSERT
    WITH CHECK (true);

-- Allow organization admins to view their endpoint users
CREATE POLICY "Organization admins can view their endpoint users" ON public.endpoint_users
    FOR SELECT
    USING (
        organization_id IN (
            SELECT id FROM public.users WHERE id = auth.uid()
        )
    );

-- Allow organization admins to update their endpoint users (approval status)
CREATE POLICY "Organization admins can update their endpoint users" ON public.endpoint_users
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT id FROM public.users WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT id FROM public.users WHERE id = auth.uid()
        )
    );

-- Allow organization admins to delete their endpoint users
CREATE POLICY "Organization admins can delete their endpoint users" ON public.endpoint_users
    FOR DELETE
    USING (
        organization_id IN (
            SELECT id FROM public.users WHERE id = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE public.endpoint_users IS 'Stores endpoint user registration requests for organizations';
COMMENT ON COLUMN public.endpoint_users.id IS 'Unique identifier for the endpoint user';
COMMENT ON COLUMN public.endpoint_users.full_name IS 'Full name of the endpoint user';
COMMENT ON COLUMN public.endpoint_users.email IS 'Email address of the endpoint user (unique)';
COMMENT ON COLUMN public.endpoint_users.phone_number IS 'Phone number of the endpoint user';
COMMENT ON COLUMN public.endpoint_users.organization_id IS 'ID of the organization admin from public.users';
COMMENT ON COLUMN public.endpoint_users.organization_company_name IS 'Company name of the organization';
COMMENT ON COLUMN public.endpoint_users.operating_system IS 'Operating system of the endpoint user device';
COMMENT ON COLUMN public.endpoint_users.os_version IS 'Version of the operating system';
COMMENT ON COLUMN public.endpoint_users.ip_address IS 'IP address of the endpoint user device';
COMMENT ON COLUMN public.endpoint_users.mac_address IS 'MAC address of the endpoint user device';
COMMENT ON COLUMN public.endpoint_users.is_approved IS 'Whether the endpoint user has been approved by the organization admin';
COMMENT ON COLUMN public.endpoint_users.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN public.endpoint_users.updated_at IS 'Timestamp when the record was last updated';
