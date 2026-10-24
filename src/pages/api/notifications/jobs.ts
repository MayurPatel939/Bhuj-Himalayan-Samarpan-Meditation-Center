import type { APIRoute } from 'astro';

/**
 * GET /api/notifications/jobs
 * List notification jobs with pagination and status filter.
 */
export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
  const offset = (page - 1) * limit;

  const supabase = locals.supabase;

  let query = supabase
    .from('notification_jobs')
    .select('*, notification_templates(name, template_type, content_en)', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(
    JSON.stringify({
      data: data || [],
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
