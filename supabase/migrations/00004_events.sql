-- Migration 00004: Events, Registrations, and Attendance
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE TYPE event_type AS ENUM ('local', 'outstation', 'meditation_program', 'special', 'other');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show');

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL,
    title_gu TEXT,
    description_en TEXT,
    description_gu TEXT,
    event_type event_type NOT NULL,
    status event_status DEFAULT 'draft',
    venue_en TEXT,
    venue_gu TEXT,
    venue_address TEXT,
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    registration_start TIMESTAMPTZ,
    registration_end TIMESTAMPTZ,
    max_capacity INT,
    requires_transport BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES public.seekers(id) ON DELETE CASCADE,
    status registration_status DEFAULT 'registered',
    registered_at TIMESTAMPTZ DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    attended_at TIMESTAMPTZ,
    waitlist_position INT,
    notes TEXT,
    registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(event_id, seeker_id)
);

CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_event_regs_event_id ON public.event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_regs_seeker_id ON public.event_registrations(seeker_id);
