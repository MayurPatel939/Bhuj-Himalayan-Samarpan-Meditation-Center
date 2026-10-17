-- Migration 00005: WhatsApp Notification System
-- Bhuj Himalayan Samarpan Meditation Center Management System

CREATE TYPE template_type AS ENUM ('birthday', 'anniversary', 'event_reminder', 'event_announcement', 'general', 'booking_confirmation', 'custom');
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');
CREATE TYPE delivery_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed');

CREATE TABLE IF NOT EXISTS public.notification_templates (
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

CREATE TABLE IF NOT EXISTS public.notification_jobs (
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

CREATE TABLE IF NOT EXISTS public.notification_logs (
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

CREATE INDEX IF NOT EXISTS idx_notif_jobs_status_sched ON public.notification_jobs(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notif_logs_job_seeker ON public.notification_logs(job_id, seeker_id);
CREATE INDEX IF NOT EXISTS idx_notif_logs_status ON public.notification_logs(status);
