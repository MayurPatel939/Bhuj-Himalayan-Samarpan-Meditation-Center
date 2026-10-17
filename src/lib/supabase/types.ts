export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AppRoleType =
  | 'super_admin'
  | 'admin'
  | 'center_coordinator'
  | 'event_coordinator'
  | 'ratri_sadhna_coordinator'
  | 'bus_coordinator'
  | 'dhyan_rath_coordinator'
  | 'product_coordinator'
  | 'sahitya_coordinator';

export type EventType = 'local' | 'outstation' | 'meditation_program' | 'special' | 'other';
export type EventStatus = 'draft' | 'published' | 'registration_open' | 'registration_closed' | 'ongoing' | 'completed' | 'cancelled';
export type RegistrationStatus = 'registered' | 'waitlisted' | 'cancelled' | 'attended' | 'no_show';
export type VehicleType = 'dhyan_rath' | 'bus' | 'other';
export type BookingStatus = 'confirmed' | 'waitlisted' | 'cancelled';
export type ActivityType = 'ratri_sadhna' | 'sports' | 'community' | 'other';
export type ProductCategory = 'seasonal_fruit' | 'dhyansthali_product' | 'granth' | 'sahitya' | 'other';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'ready' | 'delivered' | 'cancelled';
export type ExpenseStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
export type TemplateType = 'birthday' | 'anniversary' | 'event_reminder' | 'event_announcement' | 'general' | 'booking_confirmation' | 'custom';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          display_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          preferred_language: 'en' | 'gu';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_language?: 'en' | 'gu';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          display_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          preferred_language?: 'en' | 'gu';
          is_active?: boolean;
          updated_at?: string;
        };
      };
      roles: {
        Row: {
          id: number;
          name: AppRoleType;
          display_name_en: string;
          display_name_gu: string;
          description: string | null;
          hierarchy_level: number;
          created_at: string;
        };
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: number;
          center_id: string | null;
          assigned_by: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      centers: {
        Row: {
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
          session_timings: Json | null;
          instructions_en: string | null;
          instructions_gu: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
      };
      seekers: {
        Row: {
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
          guardian_relation: string | null;
          guardian_consent: boolean;
          is_minor: boolean;
          notification_consent: boolean;
          notification_preferences: Json | null;
          status: 'active' | 'inactive' | 'archived';
          registration_date: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      events: {
        Row: {
          id: string;
          title_en: string;
          title_gu: string | null;
          description_en: string | null;
          description_gu: string | null;
          event_type: EventType;
          status: EventStatus;
          venue_en: string | null;
          venue_gu: string | null;
          venue_address: string | null;
          center_id: string | null;
          start_date: string;
          end_date: string;
          registration_start: string | null;
          registration_end: string | null;
          max_capacity: number | null;
          requires_transport: boolean;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}
