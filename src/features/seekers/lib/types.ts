export interface Seeker {
  id: string;
  seeker_id: string;
  first_name_en: string;
  last_name_en: string;
  first_name_gu: string | null;
  last_name_gu: string | null;
  mobile: string | null;
  email: string | null;
  date_of_birth: string | null;
  anniversary_date: string | null;
  gender: 'male' | 'female' | 'other' | null;
  address_en: string | null;
  address_gu: string | null;
  city: string;
  pincode: string | null;
  center_id: string | null;
  guardian_id: string | null;
  guardian_name?: string | null;
  guardian_relation: string | null;
  guardian_consent: boolean;
  is_minor: boolean;
  notification_consent: boolean;
  status: 'active' | 'inactive' | 'archived';
  registration_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  centers?: {
    id: string;
    name_en: string;
    name_gu: string;
  } | null;
}

export interface SeekerFilterParams {
  search?: string;
  center_id?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SeekerImportRow {
  first_name: string;
  last_name: string;
  first_name_gu?: string;
  last_name_gu?: string;
  mobile?: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  center_name?: string;
}
