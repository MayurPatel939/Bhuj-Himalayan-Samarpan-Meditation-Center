import { z } from 'zod';

export const vehicleSchema = z.object({
  name: z.string().min(2, 'Vehicle name required'),
  vehicle_type: z.enum(['dhyan_rath', 'bus', 'other']),
  registration_number: z.string().optional().nullable(),
  seat_capacity: z.coerce.number().int().positive('Seat capacity must be greater than 0'),
  driver_name: z.string().optional().nullable(),
  driver_contact: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const routeSchema = z.object({
  name_en: z.string().min(2, 'Route name (English) required'),
  name_gu: z.string().optional().nullable(),
  origin: z.string().min(2, 'Origin location required'),
  destination: z.string().min(2, 'Destination location required'),
  pickup_points: z.array(z.object({
    name: z.string().min(1, 'Pickup point name required'),
    time: z.string().optional(),
  })).optional().nullable(),
  distance_km: z.coerce.number().positive().optional().nullable(),
  estimated_duration_minutes: z.coerce.number().int().positive().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const scheduleSchema = z.object({
  vehicle_id: z.string().uuid('Invalid vehicle ID'),
  route_id: z.string().uuid('Invalid route ID'),
  event_id: z.string().uuid('Invalid event ID').optional().nullable(),
  departure_datetime: z.string().min(10, 'Valid departure date & time required'),
  return_datetime: z.string().optional().nullable(),
  available_seats: z.coerce.number().int().positive('Available seats must be greater than 0'),
  booking_open: z.boolean().default(true),
  is_free: z.boolean().default(true),
  fare_amount: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

export const bookingSchema = z.object({
  schedule_id: z.string().uuid('Invalid schedule ID'),
  seeker_id: z.string().uuid('Invalid seeker ID'),
  pickup_point: z.string().optional().nullable(),
});
