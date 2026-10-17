-- Migration 00007: Activities and Ratri Sadhna
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE TYPE activity_type AS ENUM ('ratri_sadhna', 'sports', 'community', 'other');

CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_gu TEXT,
    activity_type activity_type NOT NULL,
    description_en TEXT,
    description_gu TEXT,
    venue_en TEXT,
    venue_gu TEXT,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    start_datetime TIMESTAMPTZ NOT NULL,
    end_datetime TIMESTAMPTZ,
    max_capacity INT,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES public.seekers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT now(),
    attended_at TIMESTAMPTZ,
    registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(activity_id, seeker_id)
);

CREATE INDEX IF NOT EXISTS idx_activities_type_start ON public.activities(activity_type, start_datetime);
CREATE INDEX IF NOT EXISTS idx_act_regs_activity ON public.activity_registrations(activity_id);
