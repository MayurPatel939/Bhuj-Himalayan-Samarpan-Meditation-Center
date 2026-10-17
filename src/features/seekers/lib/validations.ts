import { z } from 'zod';

export const seekerSchema = z.object({
  first_name_en: z.string().min(1, 'First name (English) is required').max(100),
  last_name_en: z.string().min(1, 'Last name (English) is required').max(100),
  first_name_gu: z.string().max(100).optional().nullable(),
  last_name_gu: z.string().max(100).optional().nullable(),
  mobile: z
    .string()
    .regex(/^[0-9+\s\-]{10,15}$/, 'Invalid mobile phone number format')
    .optional()
    .nullable()
    .or(z.literal('')),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  date_of_birth: z.string().optional().nullable().or(z.literal('')),
  anniversary_date: z.string().optional().nullable().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional().nullable(),
  address_en: z.string().optional().nullable(),
  address_gu: z.string().optional().nullable(),
  city: z.string().default('Bhuj'),
  pincode: z.string().max(10).optional().nullable(),
  center_id: z.string().uuid('Invalid center ID').optional().nullable().or(z.literal('')),
  is_minor: z.boolean().default(false),
  guardian_id: z.string().uuid().optional().nullable().or(z.literal('')),
  guardian_name: z.string().optional().nullable(),
  guardian_relation: z.string().optional().nullable(),
  guardian_consent: z.boolean().default(false),
  notification_consent: z.boolean().default(true),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => {
    if (data.is_minor) {
      return Boolean(data.guardian_id || data.guardian_name);
    }
    return true;
  },
  {
    message: 'Guardian name or linked guardian is required for minor seekers',
    path: ['guardian_name'],
  }
);

export type SeekerFormData = z.infer<typeof seekerSchema>;
