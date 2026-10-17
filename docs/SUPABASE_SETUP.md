# Supabase Setup Guide
## Bhuj Himalayan Samarpan Meditation Center Management System

**Version**: 1.0  
**Date**: October 2026  

---

## 1. Prerequisites

- A [Supabase](https://supabase.com/) account.
- Node.js 18+ and npm installed locally.
- Supabase CLI installed locally (optional, or run via `npx supabase`).

---

## 2. Step 1: Create a Supabase Project

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Click **New project**.
3. Select your organization.
4. Fill in project details:
   - **Name**: `bhuj-meditation-center` (or your preferred name)
   - **Database Password**: Generate a secure password and save it in a password manager.
   - **Region**: Choose **Mumbai (ap-south-1)** for best latency in Gujarat, India.
   - **Pricing Plan**: Free tier (can upgrade to Pro if database exceeds 500MB or needs daily backups).
5. Click **Create new project** and wait 1–2 minutes for provisioning.

---

## 3. Step 2: Retrieve API Keys & Connection Strings

Navigate to **Project Settings** > **API**:

| Key | Usage | Where to Store |
|-----|-------|----------------|
| **Project URL** (`https://xyzcompany.supabase.co`) | Public endpoint | `PUBLIC_SUPABASE_URL` in `.env` and `wrangler.jsonc` |
| **anon key** (`eyJ...`) | Public client access with RLS | `PUBLIC_SUPABASE_ANON_KEY` in `.env` and `wrangler secret` |
| **service_role key** (`eyJ...`) | Bypasses RLS. Server & cron only! | `SUPABASE_SERVICE_ROLE_KEY` (NEVER commit, server only) |

---

## 4. Step 3: Configure Authentication Providers

In Supabase Dashboard, navigate to **Authentication** > **Providers**:

### 4.1 Email & Password / Magic Link
1. Click **Email**.
2. **Enable Email provider**: Turn ON.
3. **Confirm email**: Recommended ON for production, but can be OFF during initial testing.
4. **Secure email change**: ON.
5. In **URL Configuration**:
   - **Site URL**: `https://your-domain.com` (or `http://localhost:4321` for local development).
   - **Redirect URLs**: Add:
     - `http://localhost:4321/api/auth/callback`
     - `https://*.workers.dev/api/auth/callback`
     - `https://your-domain.com/api/auth/callback`

### 4.2 Phone / Mobile OTP (SMS)
1. In **Authentication** > **Providers**, click **Phone**.
2. Enable Phone Provider.
3. Select an SMS gateway (e.g., **Twilio**, **MessageBird**, or **Vonage**).
4. Enter your SMS Provider credentials:
   - For Twilio: Account SID, Auth Token, Message Service SID (or Twilio Phone Number).
5. Configure SMS message template:
   - `Your Bhuj Meditation Center verification code is {{ .Code }}`.

### 4.3 Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new OAuth 2.0 Client ID (Web application).
3. Authorized redirect URI:
   - `https://<your-project-id>.supabase.co/auth/v1/callback`
4. Copy **Client ID** and **Client Secret**.
5. In Supabase Dashboard > **Authentication** > **Providers** > **Google**:
   - Enable Google.
   - Paste **Client ID** and **Client Secret**.
   - Save changes.

---

## 5. Step 4: Storage Buckets Configuration

Navigate to **Storage** > **Buckets** in Supabase:

1. Click **New bucket**.
2. **Name**: `receipts`
3. **Public bucket**: Keep **OFF** (Private).
4. **Allowed MIME types**: `image/jpeg, image/png, image/webp, application/pdf`.
5. **Max file size**: `5MB`.
6. Storage policies will automatically restrict access to authenticated coordinators with financial upload/view permissions using signed URLs.

---

## 6. Step 5: Applying Database Migrations

### Option A: Using the Supabase CLI (Recommended)

1. Link local repository to your Supabase project:
   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-id>
   ```
2. Push all migrations:
   ```bash
   npx supabase db push
   ```

### Option B: Using Supabase SQL Editor
1. In the Supabase Dashboard, go to **SQL Editor**.
2. Run the SQL files from `supabase/migrations/` in numerical order:
   - `00001_auth_and_roles.sql`
   - `00002_centers.sql`
   - `00003_seekers.sql`
   - `00004_events.sql`
   - `00005_notifications.sql`
   - `00006_transport.sql`
   - `00007_activities.sql`
   - `00008_products_inventory.sql`
   - `00009_finance.sql`
   - `00010_rls_policies.sql`

---

## 7. Step 6: Initial Admin User Setup

After migrations are applied and the first user signs up (e.g., via the app login/register screen):
1. In **SQL Editor**, assign the `super_admin` role to your user UUID:
   ```sql
   INSERT INTO public.user_roles (user_id, role_id, is_active)
   SELECT
       id AS user_id,
       (SELECT id FROM public.roles WHERE name = 'super_admin'),
       true
   FROM auth.users
   WHERE email = 'your-admin-email@example.com';
   ```
