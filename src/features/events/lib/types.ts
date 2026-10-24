// Event & Registration Types
// Phase 3 — Events & WhatsApp

export type EventType = 'local' | 'outstation' | 'meditation_program' | 'special' | 'other';
export type EventStatus = 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed' | 'cancelled';
export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show';

export interface MeditationEvent {
  id: string;
  title_en: string;
  title_gu?: string | null;
  description_en?: string | null;
  description_gu?: string | null;
  event_type: EventType;
  status: EventStatus;
  venue_en?: string | null;
  venue_gu?: string | null;
  venue_address?: string | null;
  center_id?: string | null;
  start_date: string;
  end_date: string;
  registration_start?: string | null;
  registration_end?: string | null;
  max_capacity?: number | null;
  requires_transport: boolean;
  is_public: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  centers?: { id: string; name_en: string; name_gu?: string } | null;
  registration_count?: number;
  waitlist_count?: number;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  seeker_id: string;
  status: RegistrationStatus;
  registered_at: string;
  cancelled_at?: string | null;
  attended_at?: string | null;
  waitlist_position?: number | null;
  notes?: string | null;
  registered_by?: string | null;
  // Joined fields
  seekers?: {
    id: string;
    seeker_id: string;
    first_name_en: string;
    last_name_en: string;
    first_name_gu?: string | null;
    mobile?: string | null;
    center_id?: string | null;
  } | null;
}

export const EVENT_TYPE_LABELS: Record<EventType, { en: string; gu: string }> = {
  local: { en: 'Local Event', gu: 'સ્થાનિક કાર્યક્રમ' },
  outstation: { en: 'Outstation Trip', gu: 'બહારગામ પ્રવાસ' },
  meditation_program: { en: 'Meditation Program', gu: 'ધ્યાન કાર્યક્રમ' },
  special: { en: 'Special Program', gu: 'વિશેષ કાર્યક્રમ' },
  other: { en: 'Other', gu: 'અન્ય' },
};

export const EVENT_STATUS_LABELS: Record<EventStatus, { en: string; gu: string; color: string }> = {
  draft: { en: 'Draft', gu: 'ડ્રાફ્ટ', color: 'gray' },
  published: { en: 'Published', gu: 'પ્રકાશિત', color: 'blue' },
  registration_open: { en: 'Registration Open', gu: 'નોંધણી ખુલ્લી', color: 'green' },
  registration_closed: { en: 'Registration Closed', gu: 'નોંધણી બંધ', color: 'amber' },
  ongoing: { en: 'Ongoing', gu: 'ચાલુ', color: 'purple' },
  completed: { en: 'Completed', gu: 'પૂર્ણ', color: 'emerald' },
  cancelled: { en: 'Cancelled', gu: 'રદ', color: 'red' },
};

export const REGISTRATION_STATUS_LABELS: Record<RegistrationStatus, { en: string; gu: string; color: string }> = {
  registered: { en: 'Registered', gu: 'નોંધાયેલ', color: 'green' },
  waitlisted: { en: 'Waitlisted', gu: 'પ્રતિક્ષા યાદીમાં', color: 'amber' },
  cancelled: { en: 'Cancelled', gu: 'રદ', color: 'red' },
  attended: { en: 'Attended', gu: 'ઉપસ્થિત', color: 'emerald' },
  no_show: { en: 'No Show', gu: 'ગેરહાજર', color: 'gray' },
};
