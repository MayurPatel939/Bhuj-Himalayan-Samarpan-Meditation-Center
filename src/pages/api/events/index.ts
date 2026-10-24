import type { APIRoute } from 'astro';
import { eventSchema } from '@/features/events/lib/validations';
import { isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const status = url.searchParams.get('status') || '';
  const eventType = url.searchParams.get('event_type') || '';
  const centerId = url.searchParams.get('center_id') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '12')));
  const offset = (page - 1) * limit;

  const supabase = locals.supabase;

  let query = supabase
    .from('events')
    .select('*, centers(id, name_en, name_gu)', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (eventType && eventType !== 'all') {
    query = query.eq('event_type', eventType);
  }

  if (centerId && centerId !== 'all') {
    query = query.eq('center_id', centerId);
  }

  if (search.trim()) {
    query = query.or(
      `title_en.ilike.%${search}%,title_gu.ilike.%${search}%,venue_en.ilike.%${search}%`
    );
  }

  const { data, count, error } = await query
    .order('start_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Fetch registration counts for each event
  const enrichedData = [];
  for (const event of data || []) {
    const { count: regCount } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .in('status', ['registered', 'attended']);

    const { count: waitCount } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('status', 'waitlisted');

    enrichedData.push({
      ...event,
      registration_count: regCount || 0,
      waitlist_count: waitCount || 0,
    });
  }

  return new Response(
    JSON.stringify({
      data: enrichedData,
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

  // Only admin+ or event coordinators can create events
  if (!isAdminOrAbove(locals.roles)) {
    const hasEventRole = locals.roles.some(
      (r) => ['event_coordinator', 'center_coordinator'].includes(r.role_name)
    );
    if (!hasEventRole) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions to create events' }), { status: 403 });
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

  const validatedData = result.data;

  const supabase = locals.supabase;
  const { data: inserted, error: insertError } = await supabase
    .from('events')
    .insert({
      ...validatedData,
      created_by: locals.user.id,
    })
    .select()
    .single();

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, event: inserted }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
