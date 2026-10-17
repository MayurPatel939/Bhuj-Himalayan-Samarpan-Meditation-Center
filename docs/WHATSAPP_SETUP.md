# WhatsApp Business Cloud API Setup Guide
## Bhuj Himalayan Samarpan Meditation Center Management System

**Version**: 1.0  
**Date**: October 2026  

---

## 1. Overview

The Bhuj Meditation Center Management System integrates with the **Meta WhatsApp Business Cloud API** (Graph API v22.0) to send:
1. Daily birthday greetings to seekers.
2. Daily marriage anniversary greetings to seekers.
3. Event announcements and confirmation messages.
4. Transport and Ratri Sadhna booking confirmations.

Because messages are sent via standard Cloudflare Workers `fetch()`, no bulky SDK or Node.js runtime servers are required.

---

## 2. Step 1: Meta Business Account & Developer Setup

1. **Meta Business Account**:
   - Go to [Meta Business Suite](https://business.facebook.com/).
   - Ensure your organization has a verified Business Account.
2. **Meta for Developers**:
   - Log in to [Meta for Developers](https://developers.facebook.com/).
   - Click **My Apps** > **Create App**.
   - Select **Other** as the use case, then choose **Business** app type.
   - App Name: `Bhuj Samarpan Meditation Center`.
   - Link your Meta Business Account.

---

## 3. Step 2: Add WhatsApp Product to App

1. In the App Dashboard left sidebar, find **WhatsApp** and click **Set up**.
2. Under **API Setup**:
   - Meta provides a temporary test token, test phone number, and Phone Number ID.
   - Add your personal phone number to the recipient test list to send sandbox test messages immediately.

---

## 4. Step 3: Register a Production Phone Number

1. In **WhatsApp** > **Configuration** or **API Setup**, click **Add phone number**.
2. Enter the phone number dedicated to the meditation center (must not be currently active on personal WhatsApp or WhatsApp Business mobile app).
3. Verify via SMS code or voice call.
4. Once verified, copy:
   - **Phone Number ID**: A numeric identifier (e.g., `109283746591029`).
   - **WhatsApp Business Account ID (WABA ID)**: Numeric identifier.

---

## 5. Step 4: Generate a Permanent System User Access Token

*Note: The temporary token in the API Setup page expires after 24 hours. You must create a permanent System User token.*

1. Go to **Meta Business Settings** (`business.facebook.com/settings`).
2. Go to **Users** > **System Users**.
3. Click **Add**, name the system user (e.g., `cf-worker-notifications`), role: **Admin** or **Employee**.
4. Click **Assign Assets**:
   - Assign the `Bhuj Samarpan Meditation Center` App with **Manage App** permissions.
   - Assign the WhatsApp Account with full access.
5. Click **Generate New Token**:
   - App: Select your app.
   - Token expiration: **Never** (or maximum allowable).
   - Select permissions:
     - `whatsapp_business_messaging`
     - `whatsapp_business_management`
6. Click **Generate Token** and copy it immediately.

---

## 6. Step 5: Create Required WhatsApp Message Templates

Meta requires pre-approved message templates for outbound business notifications. Create these in **WhatsApp Manager** > **Account Tools** > **Message Templates**:

### Template 1: Birthday Greeting
- **Name**: `seeker_birthday_greeting`
- **Category**: `UTILITY` (or `MARKETING`)
- **Languages**: English (`en`), Gujarati (`gu`)
- **English Body**:
  > `Jai Baba Swami {{1}}, Bhuj Himalayan Samarpan Meditation Center warmly wishes you a very Happy Birthday! May your spiritual journey be blessed with peace and divine grace.`
- **Gujarati Body**:
  > `જય બાબા સ્વામી {{1}}, ભુજ હિમાલયન સમર્પણ ધ્યાન કેન્દ્ર તરફથી આપને જન્મદિવસની હાર્દિક શુભકામનાઓ! આપની આધ્યાત્મિક યાત્રા શાંતિ અને ગુરુકૃપાથી પરિપૂર્ણ રહે તેવી પ્રાર્થના.`

### Template 2: Anniversary Greeting
- **Name**: `seeker_anniversary_greeting`
- **Category**: `UTILITY`
- **Languages**: English (`en`), Gujarati (`gu`)
- **English Body**:
  > `Jai Baba Swami {{1}}, Wishing you and your family a very happy Wedding Anniversary! Warm regards from Bhuj Himalayan Samarpan Meditation Center.`
- **Gujarati Body**:
  > `જય બાબા સ્વામી {{1}}, આપના લગ્ન દિવસની હાર્દિક શુભકામનાઓ! ભુજ હિમાલયન સમર્પણ ધ્યાન કેન્દ્ર પરિવાર તરફથી અનંત આશીર્વાદ.`

### Template 3: Event Announcement
- **Name**: `event_announcement_notice`
- **Category**: `UTILITY`
- **Body**:
  > `Jai Baba Swami {{1}}, You are cordially invited to {{2}} at {{3}} on {{4}}. Detailed info and registration: {{5}}`

---

## 7. Step 6: Test Integration Locally

The application provides a utility at `src/lib/whatsapp/client.ts`.

You can test by invoking the endpoint or script with:
```typescript
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp/client';

await sendWhatsAppTemplateMessage({
  recipientPhone: '919876543210',
  templateName: 'seeker_birthday_greeting',
  languageCode: 'gu',
  components: [
    {
      type: 'body',
      parameters: [{ type: 'text', text: 'રાજેશભાઈ' }]
    }
  ]
});
```

---

## 8. Webhook Configuration (Optional for Delivery Tracking)

To receive real-time delivery and read receipts (`delivered`, `read`, `failed`):
1. In Meta App Dashboard, go to **WhatsApp** > **Configuration**.
2. **Callback URL**: `https://<your-domain>/api/notifications/webhook`
3. **Verify Token**: A random string set in your environment variables.
4. **Webhook fields**: Subscribe to `messages`.
