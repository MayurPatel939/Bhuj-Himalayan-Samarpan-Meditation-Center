import { z } from 'zod';

export const activitySchema = z.object({
  title_en: z.string().min(2, 'Title in English is required'),
  title_gu: z.string().optional().nullable(),
  activity_type: z.enum(['ratri_sadhna', 'sports', 'community', 'other']),
  description_en: z.string().optional().nullable(),
  description_gu: z.string().optional().nullable(),
  venue_en: z.string().optional().nullable(),
  venue_gu: z.string().optional().nullable(),
  center_id: z.string().uuid().optional().nullable(),
  start_datetime: z.string().min(10, 'Start date & time is required'),
  end_datetime: z.string().optional().nullable(),
  max_capacity: z.coerce.number().int().positive().optional().nullable(),
  is_recurring: z.boolean().default(false),
  recurrence_rule: z.string().optional().nullable(),
});

export const activityRegistrationSchema = z.object({
  activity_id: z.string().uuid('Invalid activity ID'),
  seeker_id: z.string().uuid('Invalid seeker ID'),
});
