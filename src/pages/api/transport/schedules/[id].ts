import type { APIRoute } from 'astro';
import { isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const scheduleId = params.id;
  if (!scheduleId) {
    return new Response(JSON.stringify({ error: 'Schedule ID is required' }), { status: 400 });
  }

  const supabase = locals.supabase;

  // 1. Fetch schedule details
  const { data: schedule, error: schedErr } = await supabase
    .from('transport_schedules')
    .select(`
      *,
      vehicles (*),
      routes (*),
      events (id, title_en, title_gu)
    `)
    .eq('id', scheduleId)
    .maybeSingle();

  if (schedErr || !schedule) {
    return new Response(JSON.stringify({ error: 'Schedule not found' }), { status: 404 });
  }

  // 2. Fetch passenger bookings
  const { data: bookings, error: bookErr } = await supabase
    .from('transport_bookings')
    .select(`
      id,
      schedule_id,
      seeker_id,
      pickup_point,
      status,
      waitlist_position,
      booked_at,
      seekers (
        id,
        seeker_id,
        first_name_en,
        last_name_en,
        first_name_gu,
        mobile
      )
    `)
    .eq('schedule_id', scheduleId)
    .order('booked_at', { ascending: true });

  if (bookErr) {
    return new Response(JSON.stringify({ error: bookErr.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({
      schedule,
      bookings: bookings || [],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const scheduleId = params.id;
  if (!scheduleId) {
    return new Response(JSON.stringify({ error: 'Schedule ID is required' }), { status: 400 });
  }

  const allowedRoles = ['super_admin', 'admin', 'dhyan_rath_coordinator', 'bus_coordinator', 'event_coordinator'];
  if (!isAdminOrAbove(locals.roles) && !locals.roles.some((r) => allowedRoles.includes(r.role_name))) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const supabase = locals.supabase;
  const { data, error } = await supabase
    .from('transport_schedules')
    .update({
      booking_open: body.booking_open !== undefined ? body.booking_open : undefined,
      notes: body.notes !== undefined ? body.notes : undefined,
      fare_amount: body.fare_amount !== undefined ? body.fare_amount : undefined,
      return_datetime: body.return_datetime !== undefined ? body.return_datetime : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
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
