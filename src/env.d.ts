/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type KVNamespace = import("@cloudflare/workers-types").KVNamespace;
type ENV = {
  PUBLIC_SUPABASE_URL: string;
  PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_API_VERSION?: string;
  PUBLIC_APP_URL?: string;
  APP_SECRET_KEY?: string;
};

type Runtime = {
  env: ENV;
  waitUntil?: (promise: Promise<any>) => void;
  passThroughOnException?: () => void;
};

declare namespace App {
  interface Locals {
    runtime: Runtime;
    supabase: import("@supabase/supabase-js").SupabaseClient;
    user: import("@supabase/supabase-js").User | null;
    profile: {
      id: string;
      full_name: string;
      display_name: string | null;
      phone: string | null;
      avatar_url: string | null;
      preferred_language: 'en' | 'gu';
      is_active: boolean;
    } | null;
    roles: Array<{
      role_name: string;
      center_id: string | null;
      hierarchy_level: number;
    }>;
    locale: 'en' | 'gu';
    t: (key: string, params?: Record<string, string | number>) => string;
  }
}
