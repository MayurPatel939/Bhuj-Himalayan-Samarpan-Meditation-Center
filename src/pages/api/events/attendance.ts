import type { APIRoute } from 'astro';
import { bulkAttendanceSchema } from '@/features/events/lib/validations';

/**
 * POST /api/events/attendance
 * Mark attendance for multiple registrations in bulk.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const result = bulkAttendanceSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const { event_id, registrations } = result.data;
  const supabase = locals.supabase;

  // Verify event exists
  const { data: event } = await supabase
    .from('events')
    .select('id, status')
    .eq('id', event_id)
    .maybeSingle();

  if (!event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
  }

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (const reg of registrations) {
    const newStatus = reg.attended ? 'attended' : 'no_show';
    const updateData: any = { status: newStatus };
    if (reg.attended) {
      updateData.attended_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('event_registrations')
      .update(updateData)
      .eq('id', reg.registration_id)
      .eq('event_id', event_id);

    if (error) {
      failCount++;
      errors.push(`Registration ${reg.registration_id}: ${error.message}`);
    } else {
      successCount++;
    }
  }

  return new Response(
    JSON.stringify({
      success: failCount === 0,
      message: `Attendance marked for ${successCount} seekers. ${failCount > 0 ? `${failCount} failed.` : ''}`,
      successCount,
      failCount,
      errors: errors.length > 0 ? errors : undefined,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
