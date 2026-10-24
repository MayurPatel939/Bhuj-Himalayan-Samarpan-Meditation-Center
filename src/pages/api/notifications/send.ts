import type { APIRoute } from 'astro';
import { isAdminOrAbove } from '@/lib/auth/permissions';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp/client';
import { getAppEnv } from '@/lib/env';

/**
 * POST /api/notifications/send
 * Send a WhatsApp notification to selected seekers for an event.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isAdminOrAbove(locals.roles)) {
    const hasNotificationRole = locals.roles.some(
      (r) => ['event_coordinator', 'center_coordinator'].includes(r.role_name)
    );
    if (!hasNotificationRole) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
    }
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { template_name, seeker_ids, event_id, custom_params } = body;

  if (!template_name || !Array.isArray(seeker_ids) || seeker_ids.length === 0) {
    return new Response(
      JSON.stringify({ error: 'template_name and non-empty seeker_ids array required' }),
      { status: 400 }
    );
  }

  const supabase = locals.supabase;
  const cfEnv = await getAppEnv();

  // Fetch seekers with consent
  const { data: seekers, error: seekerErr } = await supabase
    .from('seekers')
    .select('id, first_name_en, first_name_gu, mobile, notification_consent')
    .in('id', seeker_ids)
    .eq('notification_consent', true)
    .not('mobile', 'is', null);

  if (seekerErr) {
    return new Response(JSON.stringify({ error: seekerErr.message }), { status: 500 });
  }

  if (!seekers || seekers.length === 0) {
    return new Response(
      JSON.stringify({ error: 'No eligible seekers found (missing consent or mobile number)' }),
      { status: 400 }
    );
  }

  // Create notification job
  const idempotencyKey = `${template_name}_${event_id || 'manual'}_${new Date().toISOString().split('T')[0]}_${locals.user.id}`;

  // Check for duplicate job today
  const { data: existingJob } = await supabase
    .from('notification_jobs')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existingJob) {
    return new Response(
      JSON.stringify({ error: 'A notification with this template was already sent today for this event' }),
      { status: 409 }
    );
  }

  // Fetch template for content
  const { data: template } = await supabase
    .from('notification_templates')
    .select('id, content_en, content_gu')
    .eq('name', template_name)
    .eq('is_active', true)
    .maybeSingle();

  const templateId = template?.id || null;

  const { data: job, error: jobErr } = await supabase
    .from('notification_jobs')
    .insert({
      template_id: templateId,
      job_type: template_name,
      scheduled_at: new Date().toISOString(),
      status: 'processing',
      target_criteria: { event_id, seeker_ids },
      total_recipients: seekers.length,
      idempotency_key: idempotencyKey,
      created_by: locals.user.id,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobErr) {
    return new Response(JSON.stringify({ error: jobErr.message }), { status: 500 });
  }

  // Process messages
  let sentCount = 0;
  let failedCount = 0;
  const results: any[] = [];

  for (const seeker of seekers) {
    const name = seeker.first_name_gu || seeker.first_name_en;

    const msgResult = await sendWhatsAppTemplateMessage({
      recipientPhone: seeker.mobile,
      templateName: template_name,
      languageCode: seeker.first_name_gu ? 'gu' : 'en',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: name },
            ...(custom_params || []).map((p: string) => ({ type: 'text' as const, text: p })),
          ],
        },
      ],
      env: cfEnv,
    });

    // Log the message
    await supabase.from('notification_logs').insert({
      job_id: job.id,
      seeker_id: seeker.id,
      phone_number: seeker.mobile,
      template_id: templateId,
      message_content: template?.content_en || template_name,
      whatsapp_message_id: msgResult.messageId || null,
      status: msgResult.success ? 'sent' : 'failed',
      error_message: msgResult.error || null,
      sent_at: msgResult.success ? new Date().toISOString() : null,
    });

    if (msgResult.success) {
      sentCount++;
    } else {
      failedCount++;
    }

    results.push({
      seeker_id: seeker.id,
      phone: seeker.mobile,
      success: msgResult.success,
      messageId: msgResult.messageId,
      error: msgResult.error,
    });
  }

  // Update job with final counts
  await supabase
    .from('notification_jobs')
    .update({
      status: failedCount === 0 ? 'completed' : (sentCount === 0 ? 'failed' : 'completed'),
      sent_count: sentCount,
      failed_count: failedCount,
      completed_at: new Date().toISOString(),
    })
    .eq('id', job.id);

  return new Response(
    JSON.stringify({
      success: true,
      job_id: job.id,
      total: seekers.length,
      sent: sentCount,
      failed: failedCount,
      results,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
