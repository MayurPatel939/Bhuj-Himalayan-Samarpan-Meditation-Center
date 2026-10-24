import type { APIRoute } from 'astro';
import { eventSchema } from '@/features/events/lib/validations';
import { isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const eventId = params.id;
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event ID is required' }), { status: 400 });
  }

  const supabase = locals.supabase;

  const { data: event, error } = await supabase
    .from('events')
    .select('*, centers(id, name_en, name_gu)')
    .eq('id', eventId)
    .maybeSingle();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  if (!event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
  }

  // Fetch registrations for this event
  const { data: registrations, count: regCount } = await supabase
    .from('event_registrations')
    .select('*, seekers(id, seeker_id, first_name_en, last_name_en, first_name_gu, mobile, center_id)', { count: 'exact' })
    .eq('event_id', eventId)
    .order('registered_at', { ascending: true });

  return new Response(
    JSON.stringify({
      event,
      registrations: registrations || [],
      registration_count: regCount || 0,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const eventId = params.id;
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event ID is required' }), { status: 400 });
  }

  if (!isAdminOrAbove(locals.roles)) {
    const hasEventRole = locals.roles.some(
      (r) => ['event_coordinator', 'center_coordinator'].includes(r.role_name)
    );
    if (!hasEventRole) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
    }
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const result = eventSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const supabase = locals.supabase;
  const { data: updated, error: updateError } = await supabase
    .from('events')
    .update({
      ...result.data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, event: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (!isAdminOrAbove(locals.roles)) {
    return new Response(JSON.stringify({ error: 'Only admins can delete events' }), { status: 403 });
  }

  const eventId = params.id;
  if (!eventId) {
    return new Response(JSON.stringify({ error: 'Event ID is required' }), { status: 400 });
  }

  const supabase = locals.supabase;
  const { error } = await supabase
    .from('events')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', eventId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
