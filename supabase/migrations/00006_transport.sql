-- Migration 00006: Transportation (Dhyan Rath & Event Buses)
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE TYPE vehicle_type AS ENUM ('dhyan_rath', 'bus', 'other');
CREATE TYPE booking_status AS ENUM ('confirmed', 'waitlisted', 'cancelled');

CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    vehicle_type vehicle_type NOT NULL,
    registration_number TEXT,
    seat_capacity INT NOT NULL,
    driver_name TEXT,
    driver_contact TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_gu TEXT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    pickup_points JSONB,
    distance_km DECIMAL(8,2),
    estimated_duration_minutes INT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.transport_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE RESTRICT,
    route_id UUID NOT NULL REFERENCES public.routes(id) ON DELETE RESTRICT,
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    departure_datetime TIMESTAMPTZ NOT NULL,
    return_datetime TIMESTAMPTZ,
    available_seats INT NOT NULL,
    booked_seats INT DEFAULT 0,
    booking_open BOOLEAN DEFAULT true,
    is_free BOOLEAN DEFAULT true,
    fare_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT seats_check CHECK (booked_seats <= available_seats)
);

CREATE TABLE IF NOT EXISTS public.transport_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.transport_schedules(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES public.seekers(id) ON DELETE CASCADE,
    pickup_point TEXT,
    status booking_status DEFAULT 'confirmed',
    waitlist_position INT,
    booked_at TIMESTAMPTZ DEFAULT now(),
    cancelled_at TIMESTAMPTZ,
    booked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(schedule_id, seeker_id)
);

CREATE INDEX IF NOT EXISTS idx_transport_sched_departure ON public.transport_schedules(departure_datetime);
CREATE INDEX IF NOT EXISTS idx_transport_bookings_sched ON public.transport_bookings(schedule_id);
