-- Migration 00002: Meditation Centers and Coordinators
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE TABLE IF NOT EXISTS public.centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_gu TEXT NOT NULL,
    contact_number TEXT,
    email TEXT,
    address_en TEXT,
    address_gu TEXT,
    city TEXT DEFAULT 'Bhuj',
    state TEXT DEFAULT 'Gujarat',
    pincode TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    shanchalak_name TEXT,
    shanchalak_contact TEXT,
    meditation_days TEXT[],
    session_timings JSONB,
    instructions_en TEXT,
    instructions_gu TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint to user_roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_user_roles_center'
    ) THEN
        ALTER TABLE public.user_roles
        ADD CONSTRAINT fk_user_roles_center
        FOREIGN KEY (center_id) REFERENCES public.centers(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.center_coordinators (
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'coordinator',
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (center_id, user_id)
);
