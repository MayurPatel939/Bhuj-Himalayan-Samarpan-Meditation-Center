import type { APIRoute } from 'astro';
import { scheduleSchema } from '@/features/transport/lib/validations';
import { isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const vehicleType = url.searchParams.get('vehicle_type') || '';
  const eventId = url.searchParams.get('event_id') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const supabase = locals.supabase;

  let query = supabase
    .from('transport_schedules')
    .select(`
      *,
      vehicles (*),
      routes (*),
      events (id, title_en, title_gu)
    `, { count: 'exact' });

  if (eventId && eventId !== 'all') {
    query = query.eq('event_id', eventId);
  }

  const { data, count, error } = await query
    .order('departure_datetime', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Filter by vehicle_type in memory if specified
  let schedules = data || [];
  if (vehicleType && vehicleType !== 'all') {
    schedules = schedules.filter((s) => s.vehicles?.vehicle_type === vehicleType);
  }

  // Enrich with waitlist count
  const enriched = await Promise.all(
    schedules.map(async (sched) => {
      const { count: waitCount } = await supabase
        .from('transport_bookings')
        .select('id', { count: 'exact', head: true })
        .eq('schedule_id', sched.id)
        .eq('status', 'waitlisted');

      return {
        ...sched,
        waitlist_count: waitCount || 0,
      };
    })
  );

  return new Response(
    JSON.stringify({
      data: enriched,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
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

  const result = scheduleSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const supabase = locals.supabase;
  const { data, error } = await supabase
    .from('transport_schedules')
    .insert({
      ...result.data,
      created_by: locals.user.id,
      booked_seats: 0,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
