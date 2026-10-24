import type { APIRoute } from 'astro';
import { activityRegistrationSchema } from '@/features/activities/lib/validations';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const activityId = url.searchParams.get('activity_id');
  if (!activityId) {
    return new Response(JSON.stringify({ error: 'activity_id parameter required' }), { status: 400 });
  }

  const { data, error } = await locals.supabase
    .from('activity_registrations')
    .select(`
      id,
      activity_id,
      seeker_id,
      status,
      registered_at,
      attended_at,
      seekers (
        id,
        seeker_id,
        first_name_en,
        last_name_en,
        first_name_gu,
        mobile
      )
    `)
    .eq('activity_id', activityId)
    .order('registered_at', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ data: data || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

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

  const result = activityRegistrationSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const { activity_id, seeker_id } = result.data;
  const supabase = locals.supabase;

  // Check if existing registration
  const { data: existing } = await supabase
    .from('activity_registrations')
    .select('id, status')
    .eq('activity_id', activity_id)
    .eq('seeker_id', seeker_id)
    .maybeSingle();

  if (existing && existing.status !== 'cancelled') {
    return new Response(JSON.stringify({ error: 'Seeker already registered for this activity' }), { status: 409 });
  }

  let reg;
  if (existing) {
    const { data, error } = await supabase
      .from('activity_registrations')
      .update({
        status: 'registered',
        registered_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    reg = data;
  } else {
    const { data, error } = await supabase
      .from('activity_registrations')
      .insert({
        activity_id,
        seeker_id,
        status: 'registered',
        registered_by: locals.user.id,
      })
      .select()
      .single();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    reg = data;
  }

  return new Response(JSON.stringify({ data: reg }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { registration_id, status } = body;
  if (!registration_id || !['registered', 'attended', 'cancelled'].includes(status)) {
    return new Response(JSON.stringify({ error: 'Invalid registration_id or status' }), { status: 400 });
  }

  const { data, error } = await locals.supabase
    .from('activity_registrations')
    .update({
      status,
      attended_at: status === 'attended' ? new Date().toISOString() : null,
    })
    .eq('id', registration_id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
