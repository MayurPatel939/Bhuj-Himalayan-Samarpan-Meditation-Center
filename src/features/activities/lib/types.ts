export type ActivityType = 'ratri_sadhna' | 'sports' | 'community' | 'other';
export type ActivityRegStatus = 'registered' | 'attended' | 'cancelled';

export interface Activity {
  id: string;
  title_en: string;
  title_gu?: string | null;
  activity_type: ActivityType;
  description_en?: string | null;
  description_gu?: string | null;
  venue_en?: string | null;
  venue_gu?: string | null;
  center_id?: string | null;
  start_datetime: string;
  end_datetime?: string | null;
  max_capacity?: number | null;
  is_recurring: boolean;
  recurrence_rule?: string | null;
  created_at: string;
  centers?: {
    id: string;
    name_en: string;
    name_gu?: string | null;
  } | null;
  registration_count?: number;
}

export interface ActivityRegistration {
  id: string;
  activity_id: string;
  seeker_id: string;
  status: ActivityRegStatus;
  registered_at: string;
  attended_at?: string | null;
  seekers?: {
    id: string;
    seeker_id: string;
    first_name_en: string;
    last_name_en: string;
    first_name_gu?: string | null;
    mobile?: string | null;
  };
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, { en: string; gu: string; color: 'saffron' | 'blue' | 'sage' | 'gray' }> = {
  ratri_sadhna: { en: 'Ratri Sadhna', gu: 'રાત્રિ સાધના', color: 'saffron' },
  sports: { en: 'Spiritual Sports / Seva', gu: 'રમત-ગમત / સેવા', color: 'blue' },
  community: { en: 'Community Outreach', gu: 'સમાજ સેવા પ્રવૃત્તિ', color: 'sage' },
  other: { en: 'Special Activity', gu: 'વિશેષ પ્રવૃત્તિ', color: 'gray' },
};
