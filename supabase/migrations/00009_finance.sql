-- Migration 00009: Event Budgets, Expenses, Receipts, Contributions, and Public Summaries
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE TYPE expense_status AS ENUM ('draft', 'submitted', 'approved', 'rejected', 'paid');
CREATE TYPE approval_action AS ENUM ('submitted', 'approved', 'rejected');
CREATE TYPE contributor_type AS ENUM ('anonymous', 'named', 'organization');

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id SERIAL PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_gu TEXT,
    parent_id INT REFERENCES public.expense_categories(id),
    is_active BOOLEAN DEFAULT true
);

-- Seed basic expense categories
INSERT INTO public.expense_categories (name_en, name_gu) VALUES
('Venue & Infrastructure', 'સ્થળ અને વ્યવસ્થા'),
('Sound & Audio-Visual', 'ધ્વનિ અને સાઉન્ડ સિસ્ટમ'),
('Transportation & Fuel', 'વાહનવ્યવહાર અને ઈંધણ'),
('Food & Mahaprasad', 'ભોજન અને મહાપ્રસાદ'),
('Printing, Banners & Sahitya', 'પ્રિન્ટિંગ, બેનર્સ અને સાહિત્ય'),
('Decoration & Flowers', 'શણગાર અને પુષ્પ વ્યવસ્થા'),
('Miscellaneous', 'પરચૂરણ ખર્ચ')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.event_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE UNIQUE,
    total_budget DECIMAL(12,2) NOT NULL,
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_expenses (
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

CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    contributor_type contributor_type DEFAULT 'anonymous',
    received_date DATE NOT NULL,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.expense_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.event_expenses(id) ON DELETE CASCADE,
    action approval_action NOT NULL,
    performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.financial_summaries (
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

CREATE INDEX IF NOT EXISTS idx_expenses_event ON public.event_expenses(event_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.event_expenses(status);
