-- Migration 00010: Row Level Security (RLS) Policies on All Tables
-- Bhuj Himalayan Samarpan Meditation Center Management System

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.center_coordinators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seekers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 1. Profiles & Roles Policies
--------------------------------------------------------------------------------
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid() OR auth.user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Anyone authenticated can view roles" ON public.roles
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins can view and manage user roles" ON public.user_roles
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin']));

CREATE POLICY "Users can view their own assigned roles" ON public.user_roles
FOR SELECT TO authenticated
USING (user_id = auth.uid());

--------------------------------------------------------------------------------
-- 2. Centers Policies
--------------------------------------------------------------------------------
-- Public can view active centers
CREATE POLICY "Public can view active centers" ON public.centers
FOR SELECT TO anon, authenticated
USING (is_active = true);

-- Admins manage centers
CREATE POLICY "Admins can manage centers" ON public.centers
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin']));

--------------------------------------------------------------------------------
-- 3. Seekers Policies
--------------------------------------------------------------------------------
-- Seekers Read: Super Admins and Admins can view all; Center coordinators view their assigned center's seekers
CREATE POLICY "Seekers read access" ON public.seekers
FOR SELECT TO authenticated
USING (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (
        auth.user_has_role(ARRAY['center_coordinator'])
        AND (center_id IS NULL OR auth.user_has_center_access(center_id))
    )
    OR auth.user_has_permission('seekers', 'read')
);

-- Seekers Create & Update
CREATE POLICY "Seekers write access" ON public.seekers
FOR INSERT TO authenticated
WITH CHECK (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (
        auth.user_has_role(ARRAY['center_coordinator'])
        AND (center_id IS NULL OR auth.user_has_center_access(center_id))
    )
);

CREATE POLICY "Seekers update access" ON public.seekers
FOR UPDATE TO authenticated
USING (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (
        auth.user_has_role(ARRAY['center_coordinator'])
        AND (center_id IS NULL OR auth.user_has_center_access(center_id))
    )
)
WITH CHECK (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (
        auth.user_has_role(ARRAY['center_coordinator'])
        AND (center_id IS NULL OR auth.user_has_center_access(center_id))
    )
);

--------------------------------------------------------------------------------
-- 4. Events & Registrations Policies
--------------------------------------------------------------------------------
CREATE POLICY "Public can view published public events" ON public.events
FOR SELECT TO anon, authenticated
USING (is_public = true AND status IN ('published', 'registration_open', 'registration_closed', 'ongoing', 'completed'));

CREATE POLICY "Coordinators and admins can view all events" ON public.events
FOR SELECT TO authenticated
USING (
    auth.user_has_role(ARRAY['super_admin', 'admin', 'event_coordinator', 'center_coordinator'])
);

CREATE POLICY "Admins and Event Coordinators can manage events" ON public.events
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'event_coordinator']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'event_coordinator']));

CREATE POLICY "Event registrations view and manage" ON public.event_registrations
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'event_coordinator', 'center_coordinator']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'event_coordinator', 'center_coordinator']));

--------------------------------------------------------------------------------
-- 5. Transport Policies
--------------------------------------------------------------------------------
CREATE POLICY "Transport view access" ON public.transport_schedules
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Transport manage access" ON public.transport_schedules
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'dhyan_rath_coordinator', 'bus_coordinator']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'dhyan_rath_coordinator', 'bus_coordinator']));

CREATE POLICY "Transport bookings manage" ON public.transport_bookings
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'dhyan_rath_coordinator', 'bus_coordinator', 'event_coordinator', 'center_coordinator']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'dhyan_rath_coordinator', 'bus_coordinator', 'event_coordinator', 'center_coordinator']));

--------------------------------------------------------------------------------
-- 6. Products & Inventory Policies
--------------------------------------------------------------------------------
CREATE POLICY "Anyone authenticated can view products and variants" ON public.products
FOR SELECT TO authenticated
USING (is_active = true OR auth.user_has_role(ARRAY['super_admin', 'admin', 'product_coordinator', 'sahitya_coordinator']));

CREATE POLICY "Anyone authenticated can view variants" ON public.product_variants
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Product coordinators manage products" ON public.products
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'product_coordinator', 'sahitya_coordinator']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'product_coordinator', 'sahitya_coordinator']));

CREATE POLICY "Product coordinators manage variants" ON public.product_variants
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'product_coordinator', 'sahitya_coordinator']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'product_coordinator', 'sahitya_coordinator']));

CREATE POLICY "Orders management" ON public.orders
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'product_coordinator', 'sahitya_coordinator', 'center_coordinator']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'product_coordinator', 'sahitya_coordinator', 'center_coordinator']));

--------------------------------------------------------------------------------
-- 7. Finance Policies
--------------------------------------------------------------------------------
CREATE POLICY "Finance view" ON public.event_expenses
FOR SELECT TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin', 'event_coordinator']));

CREATE POLICY "Finance coordinator insert" ON public.event_expenses
FOR INSERT TO authenticated
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin', 'event_coordinator']));

CREATE POLICY "Finance coordinator update draft only" ON public.event_expenses
FOR UPDATE TO authenticated
USING (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (submitted_by = auth.uid() AND status = 'draft')
)
WITH CHECK (
    auth.user_has_role(ARRAY['super_admin', 'admin'])
    OR (submitted_by = auth.uid() AND status = 'draft')
);

-- Public can view published financial summaries
CREATE POLICY "Public can view published summaries" ON public.financial_summaries
FOR SELECT TO anon, authenticated
USING (is_published = true);

CREATE POLICY "Admins can manage financial summaries" ON public.financial_summaries
FOR ALL TO authenticated
USING (auth.user_has_role(ARRAY['super_admin', 'admin']))
WITH CHECK (auth.user_has_role(ARRAY['super_admin', 'admin']));
