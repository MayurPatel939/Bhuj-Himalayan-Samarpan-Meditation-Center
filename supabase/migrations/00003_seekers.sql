-- Migration 00003: Seekers Management
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE SEQUENCE IF NOT EXISTS seeker_id_seq START WITH 1;

CREATE TABLE IF NOT EXISTS public.seekers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id TEXT UNIQUE NOT NULL,
    first_name_en TEXT NOT NULL,
    last_name_en TEXT NOT NULL,
    first_name_gu TEXT,
    last_name_gu TEXT,
    mobile TEXT,
    email TEXT,
    date_of_birth DATE,
    anniversary_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address_en TEXT,
    address_gu TEXT,
    city TEXT DEFAULT 'Bhuj',
    pincode TEXT,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    guardian_id UUID REFERENCES public.seekers(id) ON DELETE SET NULL,
    guardian_relation TEXT,
    guardian_consent BOOLEAN DEFAULT false,
    is_minor BOOLEAN DEFAULT false,
    notification_consent BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{"birthday": true, "anniversary": true, "events": true, "general": true}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    registration_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger for auto-generating seeker_id in BHJ-XXXX format
CREATE OR REPLACE FUNCTION generate_seeker_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.seeker_id IS NULL OR NEW.seeker_id = '' THEN
        NEW.seeker_id := 'BHJ-' || LPAD(nextval('seeker_id_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generate_seeker_id ON public.seekers;
CREATE TRIGGER trg_generate_seeker_id
BEFORE INSERT ON public.seekers
FOR EACH ROW
EXECUTE FUNCTION generate_seeker_id();

-- Indexes for fast searches and duplicate detection
CREATE INDEX IF NOT EXISTS idx_seekers_mobile ON public.seekers(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_seekers_name_en ON public.seekers(lower(first_name_en), lower(last_name_en));
CREATE INDEX IF NOT EXISTS idx_seekers_center_id ON public.seekers(center_id);
CREATE INDEX IF NOT EXISTS idx_seekers_status ON public.seekers(status);
CREATE INDEX IF NOT EXISTS idx_seekers_dob ON public.seekers(EXTRACT(MONTH FROM date_of_birth), EXTRACT(DAY FROM date_of_birth));
CREATE INDEX IF NOT EXISTS idx_seekers_anniversary ON public.seekers(EXTRACT(MONTH FROM anniversary_date), EXTRACT(DAY FROM anniversary_date));
