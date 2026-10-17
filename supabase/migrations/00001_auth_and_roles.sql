-- Migration 00001: Authentication, Profiles, Roles, and Permissions
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Hierarchy Enum
CREATE TYPE app_role_type AS ENUM (
    'super_admin',
    'admin',
    'center_coordinator',
    'event_coordinator',
    'ratri_sadhna_coordinator',
    'bus_coordinator',
    'dhyan_rath_coordinator',
    'product_coordinator',
    'sahitya_coordinator'
);

-- Profiles Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    display_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferred_language TEXT DEFAULT 'en' CHECK (preferred_language IN ('en', 'gu')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id SERIAL PRIMARY KEY,
    name app_role_type UNIQUE NOT NULL,
    display_name_en TEXT NOT NULL,
    display_name_gu TEXT NOT NULL,
    description TEXT,
    hierarchy_level INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles Table (Mapping users to roles, optionally center-scoped)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    center_id UUID, -- Foreign key added in migration 00002
    assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id SERIAL PRIMARY KEY,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    UNIQUE(module, action)
);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id INT REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES public.permissions(id) ON DELETE CASCADE,
    scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'center', 'own')),
    PRIMARY KEY (role_id, permission_id)
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Initial Roles
INSERT INTO public.roles (name, display_name_en, display_name_gu, description, hierarchy_level) VALUES
('super_admin', 'Super Admin', 'સુપર એડમિન', 'IT team with unrestricted access to all data and system configurations', 1),
('admin', 'Admin', 'એડમિન', 'Center leadership managing coordinators, approvals, and reports', 2),
('center_coordinator', 'Center Coordinator', 'કેન્દ્ર સંયોજક', 'Manages seekers and operations for an assigned meditation center', 3),
('event_coordinator', 'Event Coordinator', 'ઇવેન્ટ સંયોજક', 'Manages event creation, registrations, attendance, and expenses', 4),
('ratri_sadhna_coordinator', 'Ratri Sadhna Coordinator', 'રાત્રિ સાધના સંયોજક', 'Manages night meditation sessions and community activities', 5),
('bus_coordinator', 'Bus Coordinator', 'બસ સંયોજક', 'Coordinates event buses and passenger lists', 5),
('dhyan_rath_coordinator', 'Dhyan Rath Coordinator', 'ધ્યાન રથ સંયોજક', 'Coordinates Dhyan Rath vehicle routes and bookings', 5),
('product_coordinator', 'Product Coordinator', 'પ્રોડક્ટ સંયોજક', 'Coordinates seasonal fruits and Dhyansthali products', 5),
('sahitya_coordinator', 'Sahitya Coordinator', 'સાહિત્ય સંયોજક', 'Coordinates spiritual literature, Granths, and distribution', 5)
ON CONFLICT (name) DO NOTHING;

-- RLS Helper Functions (SECURITY DEFINER for performance and security)
CREATE OR REPLACE FUNCTION auth.user_has_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND r.name::TEXT = ANY(allowed_roles)
          AND ur.is_active = true
    );
$$;

CREATE OR REPLACE FUNCTION auth.user_has_center_access(target_center_id UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
          AND ur.is_active = true
          AND (
              r.name IN ('super_admin', 'admin')
              OR ur.center_id = target_center_id
          )
    );
$$;

CREATE OR REPLACE FUNCTION auth.user_has_permission(target_module TEXT, target_action TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
          AND ur.is_active = true
          AND p.module = target_module
          AND p.action = target_action
    );
$$;
