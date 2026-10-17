import type { APIRoute } from 'astro';
import { seekerSchema } from '@/features/seekers/lib/validations';
import { canAccessCenter } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const centerId = url.searchParams.get('center_id');
  const status = url.searchParams.get('status') || 'active';
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '15')));
  const offset = (page - 1) * limit;

  const supabase = locals.supabase;

  // Build query with RLS automatically applied
  let query = supabase
    .from('seekers')
    .select('*, centers(id, name_en, name_gu)', { count: 'exact' });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (centerId && centerId !== 'all') {
    query = query.eq('center_id', centerId);
  }

  if (search.trim()) {
    query = query.or(
      `seeker_id.ilike.%${search}%,first_name_en.ilike.%${search}%,last_name_en.ilike.%${search}%,first_name_gu.ilike.%${search}%,mobile.ilike.%${search}%`
    );
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

  // Zod validation
  const result = seekerSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.errors[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const validatedData = result.data;

  // Check center-scoped authorization
  if (validatedData.center_id && !canAccessCenter(locals.roles, validatedData.center_id)) {
    return new Response(JSON.stringify({ error: 'You do not have permission to add seekers to this center' }), {
      status: 403,
    });
  }

  const supabase = locals.supabase;

  // Duplicate Check: Check if mobile number already exists (if provided and not forced)
  if (validatedData.mobile && !body.allow_duplicate) {
    const { data: existing } = await supabase
      .from('seekers')
      .select('id, seeker_id, first_name_en, last_name_en')
      .eq('mobile', validatedData.mobile)
      .eq('status', 'active')
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({
          error: 'duplicate_found',
          message: `A seeker with mobile ${validatedData.mobile} already exists: ${existing.first_name_en} ${existing.last_name_en} (${existing.seeker_id})`,
          existingSeeker: existing,
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const { data: inserted, error: insertError } = await supabase
    .from('seekers')
    .insert({
      first_name_en: validatedData.first_name_en,
      last_name_en: validatedData.last_name_en,
      first_name_gu: validatedData.first_name_gu || null,
      last_name_gu: validatedData.last_name_gu || null,
      mobile: validatedData.mobile || null,
      email: validatedData.email || null,
      date_of_birth: validatedData.date_of_birth || null,
      anniversary_date: validatedData.anniversary_date || null,
      gender: validatedData.gender || null,
      address_en: validatedData.address_en || null,
      address_gu: validatedData.address_gu || null,
      city: validatedData.city || 'Bhuj',
      pincode: validatedData.pincode || null,
      center_id: validatedData.center_id || null,
      is_minor: validatedData.is_minor,
      guardian_id: validatedData.guardian_id || null,
      guardian_relation: validatedData.guardian_relation || null,
      guardian_consent: validatedData.guardian_consent,
      notification_consent: validatedData.notification_consent,
      status: validatedData.status,
      notes: validatedData.notes || null,
      created_by: locals.user.id,
    })
    .select()
    .single();

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, seeker: inserted }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
