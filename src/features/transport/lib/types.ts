export type VehicleType = 'dhyan_rath' | 'bus' | 'other';
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled';

export interface Vehicle {
  id: string;
  name: string;
  vehicle_type: VehicleType;
  registration_number?: string | null;
  seat_capacity: number;
  driver_name?: string | null;
  driver_contact?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Route {
  id: string;
  name_en: string;
  name_gu?: string | null;
  origin: string;
  destination: string;
  pickup_points?: Array<{ name: string; time?: string }> | null;
  distance_km?: number | null;
  estimated_duration_minutes?: number | null;
  is_active: boolean;
  created_at: string;
}

export interface TransportSchedule {
  id: string;
  vehicle_id: string;
  route_id: string;
  event_id?: string | null;
  departure_datetime: string;
  return_datetime?: string | null;
  available_seats: number;
  booked_seats: number;
  booking_open: boolean;
  is_free: boolean;
  fare_amount: number;
  notes?: string | null;
  created_at: string;
  vehicles?: Vehicle;
  routes?: Route;
  events?: {
    id: string;
    title_en: string;
    title_gu?: string | null;
  } | null;
  waitlist_count?: number;
}

export interface TransportBooking {
  id: string;
  schedule_id: string;
  seeker_id: string;
  pickup_point?: string | null;
  status: BookingStatus;
  waitlist_position?: number | null;
  booked_at: string;
  cancelled_at?: string | null;
  seekers?: {
    id: string;
    seeker_id: string;
    first_name_en: string;
    last_name_en: string;
    first_name_gu?: string | null;
    mobile?: string | null;
  };
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, { en: string; gu: string }> = {
  dhyan_rath: { en: 'Dhyan Rath', gu: 'ધ્યાન રથ' },
  bus: { en: 'Event Bus', gu: 'ઇવેન્ટ બસ' },
  other: { en: 'Other Vehicle', gu: 'અન્ય વાહન' },
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, { en: string; gu: string; color: 'sage' | 'warning' | 'danger' }> = {
  confirmed: { en: 'Confirmed', gu: 'મંજૂર', color: 'sage' },
  waitlisted: { en: 'Waitlisted', gu: 'પ્રતિક્ષામાં', color: 'warning' },
  cancelled: { en: 'Cancelled', gu: 'રદ', color: 'danger' },
};
