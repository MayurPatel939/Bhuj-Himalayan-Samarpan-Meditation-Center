export interface MeditationCenter {
  id: string;
  name_en: string;
  name_gu: string;
  contact_number: string | null;
  email: string | null;
  address_en: string | null;
  address_gu: string | null;
  city: string;
  state: string;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  shanchalak_name: string | null;
  shanchalak_contact: string | null;
  meditation_days: string[] | null;
  session_timings: any;
  instructions_en: string | null;
  instructions_gu: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  seeker_count?: number;
}
