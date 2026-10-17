# Database Schema Specification
## Bhuj Himalayan Samarpan Meditation Center Management System

**Version**: 1.0  
**Date**: October 2026  
**Engine**: PostgreSQL 15+ (Supabase)  
**Security Model**: Row Level Security (RLS) on all user and business tables  

---

## 1. Schema Overview

The database is structured around 12 operational modules supporting bilingual information (English and Gujarati), strict audit logging, soft-deletes where appropriate, and multi-tenant scoping by meditation center.

### 1.1 Custom Types & Enums

```sql
-- Role hierarchy levels: 1 = super_admin, 9 = lowest
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

-- Event enums
CREATE TYPE event_type AS ENUM ('local', 'outstation', 'meditation_program', 'special', 'other');
CREATE TYPE event_status AS ENUM ('draft', 'published', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled');
CREATE TYPE registration_status AS ENUM ('registered', 'waitlisted', 'cancelled', 'attended', 'no_show');

-- Transport enums
CREATE TYPE vehicle_type AS ENUM ('dhyan_rath', 'bus', 'other');
CREATE TYPE booking_status AS ENUM ('confirmed', 'waitlisted', 'cancelled');

-- Activity enums
CREATE TYPE activity_type AS ENUM ('ratri_sadhna', 'sports', 'community', 'other');

-- Product & inventory enums
CREATE TYPE product_category AS ENUM ('seasonal_fruit', 'dhyansthali_product', 'granth', 'sahitya', 'other');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'ready', 'delivered', 'cancelled');
CREATE TYPE movement_type AS ENUM ('stock_in', 'stock_out', 'adjustment', 'return');

-- Finance enums
CREATE TYPE expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid');
CREATE TYPE approval_action AS ENUM ('submitted', 'approved', 'rejected');
CREATE TYPE contributor_type AS ENUM ('anonymous', 'named', 'organization');

-- Notification enums
CREATE TYPE template_type AS ENUM ('birthday', 'anniversary', 'event_reminder', 'event_announcement', 'general', 'booking_confirmation', 'custom');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE delivery_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');
```

---

## 2. Table Definitions

### 2.1 Module A — Authentication & System Administration

#### `profiles`
Extends `auth.users` for application user details.
```sql
CREATE TABLE public.profiles (
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
```

#### `roles`
Stores standard system roles with bilingual titles and hierarchy.
```sql
CREATE TABLE public.roles (
    id SERIAL PRIMARY KEY,
    name app_role_type UNIQUE NOT NULL,
    display_name_en TEXT NOT NULL,
    display_name_gu TEXT NOT NULL,
    description TEXT,
    hierarchy_level INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_roles`
Maps users to roles, optionally scoped to a meditation center.
```sql
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES public.roles(id),
    center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role_id, center_id)
);
```

#### `permissions` & `role_permissions`
Granular permission actions by module.
```sql
CREATE TABLE public.permissions (
    id SERIAL PRIMARY KEY,
    module TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    UNIQUE(module, action)
);

CREATE TABLE public.role_permissions (
    role_id INT REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES public.permissions(id) ON DELETE CASCADE,
    scope TEXT DEFAULT 'global' CHECK (scope IN ('global', 'center', 'own')),
    PRIMARY KEY (role_id, permission_id)
);
```

#### `audit_logs`
Tracks audit trail for sensitive administrative and financial actions.
```sql
CREATE TABLE public.audit_logs (
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
```

---

### 2.2 Module B & C — Meditation Centers & Seekers

#### `centers`
Physical meditation center branches in Bhuj and surrounding areas.
```sql
CREATE TABLE public.centers (
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

CREATE TABLE public.center_coordinators (
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'coordinator',
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (center_id, user_id)
);
```

#### `seekers`
Meditation practitioners registered in the system.
```sql
CREATE SEQUENCE seeker_id_seq START WITH 1;

CREATE TABLE public.seekers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seeker_id TEXT UNIQUE NOT NULL, -- e.g. BHJ-0001
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

CREATE TRIGGER trg_generate_seeker_id
BEFORE INSERT ON public.seekers
FOR EACH ROW
EXECUTE FUNCTION generate_seeker_id();
```

---

### 2.3 Module D — Events & Registrations

```sql
CREATE TABLE public.events (
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

CREATE TABLE public.event_registrations (
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
```

---

### 2.4 Module E — WhatsApp Notifications

```sql
CREATE TABLE public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    template_type template_type NOT NULL,
    whatsapp_template_name TEXT,
    content_en TEXT NOT NULL,
    content_gu TEXT,
    variables TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.notification_templates(id),
    job_type TEXT NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status job_status DEFAULT 'pending',
    target_criteria JSONB,
    total_recipients INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.notification_jobs(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES public.seekers(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    template_id UUID REFERENCES public.notification_templates(id),
    message_content TEXT,
    whatsapp_message_id TEXT,
    status delivery_status DEFAULT 'queued',
    error_code TEXT,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(job_id, seeker_id)
);
```

---

### 2.5 Module F & G — Transportation (Dhyan Rath & Buses)

```sql
CREATE TABLE public.vehicles (
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

CREATE TABLE public.routes (
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

CREATE TABLE public.transport_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id),
    route_id UUID NOT NULL REFERENCES public.routes(id),
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

CREATE TABLE public.transport_bookings (
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
```

---

### 2.6 Module H — Activities (Ratri Sadhna & Community)

```sql
CREATE TABLE public.activities (
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

CREATE TABLE public.activity_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
    seeker_id UUID NOT NULL REFERENCES public.seekers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'cancelled')),
    registered_at TIMESTAMPTZ DEFAULT now(),
    attended_at TIMESTAMPTZ,
    registered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(activity_id, seeker_id)
);
```

---

### 2.7 Module I, J, K — Products, Seasonal Fruits & Sahitya

```sql
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_gu TEXT,
    category product_category NOT NULL,
    description_en TEXT,
    description_gu TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_name_en TEXT NOT NULL,
    variant_name_gu TEXT,
    sku TEXT UNIQUE,
    price DECIMAL(10,2) DEFAULT 0,
    unit TEXT,
    stock_quantity INT DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    is_available BOOLEAN DEFAULT true,
    booking_window_start TIMESTAMPTZ,
    booking_window_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0)
);

CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type movement_type NOT NULL,
    quantity INT NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE SEQUENCE order_number_seq START WITH 1;

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    seeker_id UUID NOT NULL REFERENCES public.seekers(id) ON DELETE RESTRICT,
    category product_category NOT NULL,
    status order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    ordered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'other')),
    payment_reference TEXT,
    payment_date TIMESTAMPTZ DEFAULT now(),
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 2.8 Module L — Finance & Transparency

```sql
CREATE TABLE public.expense_categories (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_gu TEXT,
    parent_id INT REFERENCES public.expense_categories(id),
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE public.event_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
    total_budget DECIMAL(12,2) NOT NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.event_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    category_id INT NOT NULL REFERENCES public.expense_categories(id),
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    vendor_name TEXT,
    transaction_date DATE NOT NULL,
    receipt_url TEXT,
    status expense_status DEFAULT 'draft',
    submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    contributor_type contributor_type DEFAULT 'anonymous',
    received_date DATE NOT NULL,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.expense_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.event_expenses(id) ON DELETE CASCADE,
    action approval_action NOT NULL,
    performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.financial_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    title_en TEXT NOT NULL,
    title_gu TEXT,
    summary_data JSONB NOT NULL,
    is_published BOOLEAN DEFAULT false,
    published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 3. Indexes & Performance Optimization

```sql
-- Seekers search & duplicate detection
CREATE INDEX idx_seekers_mobile ON public.seekers(mobile) WHERE mobile IS NOT NULL;
CREATE INDEX idx_seekers_name_en ON public.seekers(lower(first_name_en), lower(last_name_en));
CREATE INDEX idx_seekers_center_id ON public.seekers(center_id);
CREATE INDEX idx_seekers_status ON public.seekers(status);
CREATE INDEX idx_seekers_dob ON public.seekers(EXTRACT(MONTH FROM date_of_birth), EXTRACT(DAY FROM date_of_birth));
CREATE INDEX idx_seekers_anniversary ON public.seekers(EXTRACT(MONTH FROM anniversary_date), EXTRACT(DAY FROM anniversary_date));

-- Events & Registrations
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_events_start_date ON public.events(start_date);
CREATE INDEX idx_event_regs_event_id ON public.event_registrations(event_id);
CREATE INDEX idx_event_regs_seeker_id ON public.event_registrations(seeker_id);

-- Transport
CREATE INDEX idx_transport_sched_departure ON public.transport_schedules(departure_datetime);
CREATE INDEX idx_transport_bookings_sched ON public.transport_bookings(schedule_id);

-- Products & Orders
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_orders_seeker_id ON public.orders(seeker_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Notifications
CREATE INDEX idx_notif_jobs_status_sched ON public.notification_jobs(status, scheduled_at);
CREATE INDEX idx_notif_logs_job_seeker ON public.notification_logs(job_id, seeker_id);
CREATE INDEX idx_notif_logs_status ON public.notification_logs(status);
```

---

## 4. Row Level Security (RLS) Helper Functions

```sql
-- Helper 1: Check if the requesting user has one of the allowed role names
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

-- Helper 2: Check if user has permission for a specific center
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

-- Helper 3: Check granular module permission
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
```
