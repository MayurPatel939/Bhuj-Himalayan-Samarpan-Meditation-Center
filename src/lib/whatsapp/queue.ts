import { createSupabaseAdminClient } from '../supabase/admin';
import { sendWhatsAppTemplateMessage } from './client';

export async function handleScheduledNotifications(event: any, env: any) {
  console.log(`[Notification Queue] Starting scheduled job processing at ${new Date().toISOString()}`);
  
  let supabase: any;
  try {
    supabase = createSupabaseAdminClient(env);
  } catch (e) {
    console.warn('[Notification Queue] Could not initialize Supabase admin client. Skipping.');
    return;
  }

  const today = new Date();
  const currentMonth = today.getUTCMonth() + 1; // 1-12
  const currentDay = today.getUTCDate(); // 1-31

  // 1. Process Today's Birthday Greetings
  try {
    const { data: birthdaySeekers, error: bdayErr } = await supabase
      .from('seekers')
      .select('id, first_name_en, first_name_gu, mobile, notification_consent, preferred_language:center_id')
      .eq('status', 'active')
      .eq('notification_consent', true)
      .not('mobile', 'is', null)
      .not('date_of_birth', 'is', null);

    if (!bdayErr && birthdaySeekers) {
      const eligible = birthdaySeekers.filter((s: any) => {
        // Filter by month and day
        const dob = new Date(s.date_of_birth);
        return dob.getUTCMonth() + 1 === currentMonth && dob.getUTCDate() === currentDay;
      });

      console.log(`[Notification Queue] Found ${eligible.length} seekers with birthdays today.`);

      for (const seeker of eligible) {
        const name = seeker.first_name_gu || seeker.first_name_en;
        const res = await sendWhatsAppTemplateMessage({
          recipientPhone: seeker.mobile,
          templateName: 'seeker_birthday_greeting',
          languageCode: seeker.first_name_gu ? 'gu' : 'en',
          components: [
            {
              type: 'body',
              parameters: [{ type: 'text', text: name }],
            },
          ],
          env,
        });

        console.log(`[Notification Queue] Sent birthday message to ${seeker.mobile}: ${res.success ? 'OK' : res.error}`);
      }
    }
  } catch (err) {
    console.error('[Notification Queue] Error processing birthdays:', err);
  }
}
