import type { APIRoute } from 'astro';
import { activitySchema } from '@/features/activities/lib/validations';
import { isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || '';
  const centerId = url.searchParams.get('center_id') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const supabase = locals.supabase;

  let query = supabase
    .from('activities')
    .select('*, centers(id, name_en, name_gu)', { count: 'exact' });

  if (type && type !== 'all') {
    query = query.eq('activity_type', type);
  }

  if (centerId && centerId !== 'all') {
    query = query.eq('center_id', centerId);
  }

  const { data, count, error } = await query
    .order('start_datetime', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // Enrich with registration count
  const enriched = await Promise.all(
    (data || []).map(async (act) => {
      const { count: regCount } = await supabase
        .from('activity_registrations')
        .select('id', { count: 'exact', head: true })
        .eq('activity_id', act.id)
        .in('status', ['registered', 'attended']);

      return {
        ...act,
        registration_count: regCount || 0,
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

  const allowedRoles = ['super_admin', 'admin', 'ratri_sadhna_coordinator', 'center_coordinator'];
  if (!isAdminOrAbove(locals.roles) && !locals.roles.some((r) => allowedRoles.includes(r.role_name))) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const result = activitySchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const supabase = locals.supabase;
  const { data, error } = await supabase
    .from('activities')
    .insert({
      ...result.data,
      created_by: locals.user.id,
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
