// Event & Registration Validation Schemas
// Phase 3 — Events & WhatsApp

import { z } from 'zod';

export const eventSchema = z.object({
  title_en: z.string().min(3, 'Event title must be at least 3 characters'),
  title_gu: z.string().optional().nullable(),
  description_en: z.string().optional().nullable(),
  description_gu: z.string().optional().nullable(),
  event_type: z.enum(['local', 'outstation', 'meditation_program', 'special', 'other']),
  status: z.enum(['draft', 'published', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled']).default('draft'),
  venue_en: z.string().optional().nullable(),
  venue_gu: z.string().optional().nullable(),
  venue_address: z.string().optional().nullable(),
  center_id: z.string().uuid().optional().nullable(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  registration_start: z.string().optional().nullable(),
  registration_end: z.string().optional().nullable(),
  max_capacity: z.coerce.number().int().positive().optional().nullable(),
  requires_transport: z.boolean().default(false),
  is_public: z.boolean().default(false),
}).refine(data => new Date(data.end_date) >= new Date(data.start_date), {
  message: 'End date must be on or after start date',
  path: ['end_date'],
});

export const registrationSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  seeker_id: z.string().uuid('Invalid seeker ID'),
  notes: z.string().optional().nullable(),
});

export const bulkAttendanceSchema = z.object({
  event_id: z.string().uuid('Invalid event ID'),
  registrations: z.array(z.object({
    registration_id: z.string().uuid(),
    attended: z.boolean(),
  })).min(1, 'At least one registration required'),
});
