# Cloudflare Workers Setup & Deployment Guide
## Bhuj Himalayan Samarpan Meditation Center Management System

**Version**: 1.0  
**Date**: October 2026  

---

## 1. Prerequisites

- A [Cloudflare](https://dash.cloudflare.com/) account.
- Node.js 18+ and npm.
- Domain name managed or proxied via Cloudflare (optional for `.workers.dev`, required for custom domain).

---

## 2. Step 1: Install Wrangler CLI & Authenticate

Cloudflare Wrangler is installed as a development dependency in the project.

Authenticate your terminal session:
```bash
npx wrangler login
```
This opens a browser window asking you to authorize Wrangler with your Cloudflare account.

Verify authorization:
```bash
npx wrangler whoami
```

---

## 3. Step 2: Configure `wrangler.jsonc`

The project uses `wrangler.jsonc` configured with `@astrojs/cloudflare` and Cron Triggers.

Ensure the configuration includes:
- **`name`**: `bhuj-meditation-center`
- **`compatibility_date`**: `2026-10-13` (or recent stable)
- **`compatibility_flags`**: `["nodejs_compat"]`
- **`triggers.crons`**:
  - `"0 1 * * *"` — Triggers daily at 01:00 UTC (06:30 IST) for birthday/anniversary WhatsApp greetings.
  - `"0 */6 * * *"` — Triggers every 6 hours for event reminders and retrying queued messages.
- **`vars`**:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_APP_URL`

---

## 4. Step 3: Configure Cloudflare Secrets

Sensitive keys should **never** be committed to version control or stored in plain variables. Set them using Wrangler:

```bash
# Supabase Anon Key (used server-side with cookie-based SSR)
npx wrangler secret put PUBLIC_SUPABASE_ANON_KEY

# Supabase Service Role Key (used only for scheduled worker / cron jobs)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# WhatsApp Business API Credentials
npx wrangler secret put WHATSAPP_ACCESS_TOKEN
npx wrangler secret put WHATSAPP_PHONE_NUMBER_ID

# Application encryption / session secret
npx wrangler secret put APP_SECRET_KEY
```

Wrangler prompts you to enter the secret value securely in the terminal.

---

## 5. Step 4: Local Development with Cloudflare Proxy

To test Cloudflare bindings, cron triggers, and environment variables locally:

```bash
# Run local dev server with platformProxy enabled
npm run dev
```

The `@astrojs/cloudflare` adapter runs Astro SSR with Cloudflare runtime emulation.

---

## 6. Step 5: Building & Deploying to Cloudflare Workers

1. Build the Astro project:
   ```bash
   npm run build
   ```
2. Deploy to Cloudflare Workers:
   ```bash
   npx wrangler deploy
   ```
3. Cloudflare will output the deployed URL:
   `https://bhuj-meditation-center.<your-subdomain>.workers.dev`

---

## 7. Step 6: Custom Domain Setup

To point your custom domain (e.g., `bhujdhyan.org` or `center.bhujdhyan.org`):

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Click your Worker: `bhuj-meditation-center`.
3. Go to **Settings** > **Domains & Routes**.
4. Click **Add** > **Custom Domain**.
5. Enter your domain/subdomain (e.g., `app.bhujdhyan.org`).
6. Cloudflare automatically configures DNS records and provisions free SSL/TLS certificates.

---

## 8. Step 7: Continuous Deployment via GitHub Actions

The repository includes `.github/workflows/deploy.yml` for automated CI/CD:

1. In GitHub repository: Go to **Settings** > **Secrets and variables** > **Actions**.
2. Add the following repository secrets:
   - `CLOUDFLARE_API_TOKEN` — Created in Cloudflare dashboard with *Workers Edit* permission.
   - `CLOUDFLARE_ACCOUNT_ID` — Found on your Cloudflare dashboard overview.
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `WHATSAPP_ACCESS_TOKEN`
   - `WHATSAPP_PHONE_NUMBER_ID`
3. Every push to `main` builds the application, validates types, and deploys directly to Cloudflare Workers.
