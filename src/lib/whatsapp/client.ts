export interface WhatsAppTemplateMessageOptions {
  recipientPhone: string; // e.g. "919876543210" without '+'
  templateName: string;
  languageCode?: string; // 'en' | 'gu'
  components?: Array<{
    type: 'header' | 'body' | 'button';
    sub_type?: string;
    index?: string;
    parameters: Array<{
      type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      text?: string;
      [key: string]: any;
    }>;
  }>;
  env?: {
    WHATSAPP_ACCESS_TOKEN?: string;
    WHATSAPP_PHONE_NUMBER_ID?: string;
    WHATSAPP_API_VERSION?: string;
  };
}

export interface WhatsAppApiResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export async function sendWhatsAppTemplateMessage(
  options: WhatsAppTemplateMessageOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = options.env?.WHATSAPP_ACCESS_TOKEN || import.meta.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = options.env?.WHATSAPP_PHONE_NUMBER_ID || import.meta.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = options.env?.WHATSAPP_API_VERSION || import.meta.env.WHATSAPP_API_VERSION || 'v22.0';

  if (!token || !phoneId) {
    console.warn('[WhatsApp Client] Missing API Token or Phone Number ID. Mocking response in development.');
    return {
      success: true,
      messageId: `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    };
  }

  // Sanitize phone number (strip spaces, dashes, leading +)
  let cleanPhone = options.recipientPhone.replace(/[\s\-\+]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`; // Default to India country code if 10 digits
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: options.templateName,
      language: {
        code: options.languageCode || 'en',
      },
      components: options.components || [],
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json() as any;

    if (!res.ok) {
      console.error('[WhatsApp Client Error]', data);
      return {
        success: false,
        error: data.error?.message || `HTTP error ${res.status}`,
      };
    }

    const messageId = data.messages?.[0]?.id;
    return {
      success: true,
      messageId,
    };
  } catch (err: any) {
    console.error('[WhatsApp Request Failed]', err);
    return {
      success: false,
      error: err.message || 'Unknown network error',
    };
  }
}
