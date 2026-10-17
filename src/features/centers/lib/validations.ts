import { z } from 'zod';

export const centerSchema = z.object({
  name_en: z.string().min(1, 'Center name (English) is required').max(150),
  name_gu: z.string().min(1, 'Center name (Gujarati) is required').max(150),
  contact_number: z.string().optional().nullable().or(z.literal('')),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address_en: z.string().optional().nullable(),
  address_gu: z.string().optional().nullable(),
  city: z.string().default('Bhuj'),
  state: z.string().default('Gujarat'),
  pincode: z.string().optional().nullable(),
  shanchalak_name: z.string().optional().nullable(),
  shanchalak_contact: z.string().optional().nullable(),
  meditation_days: z.array(z.string()).default(['Daily']),
  session_timings: z.any().optional().nullable(),
  instructions_en: z.string().optional().nullable(),
  instructions_gu: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export type CenterFormData = z.infer<typeof centerSchema>;
