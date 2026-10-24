import type { APIRoute } from 'astro';
import { centerSchema } from '@/features/centers/lib/validations';
import { isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ request, locals }) => {
  const url = new URL(request.url);
  const activeOnly = url.searchParams.get('active_only') === 'true';

  const supabase = locals.supabase;
  let query = supabase.from('centers').select('*');

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data: centers, error } = await query.order('name_en', { ascending: true });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ data: centers || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!locals.user || !isAdminOrAbove(locals.roles)) {
    return new Response(JSON.stringify({ error: 'Only Admins can create new meditation centers' }), {
      status: 403,
    });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const result = centerSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const validatedData = result.data;
  const supabase = locals.supabase;

  const { data: center, error } = await supabase
    .from('centers')
    .insert({
      name_en: validatedData.name_en,
      name_gu: validatedData.name_gu,
      contact_number: validatedData.contact_number || null,
      email: validatedData.email || null,
      address_en: validatedData.address_en || null,
      address_gu: validatedData.address_gu || null,
      city: validatedData.city || 'Bhuj',
      state: validatedData.state || 'Gujarat',
      pincode: validatedData.pincode || null,
      shanchalak_name: validatedData.shanchalak_name || null,
      shanchalak_contact: validatedData.shanchalak_contact || null,
      meditation_days: validatedData.meditation_days || ['Daily'],
      session_timings: validatedData.session_timings || null,
      instructions_en: validatedData.instructions_en || null,
      instructions_gu: validatedData.instructions_gu || null,
      is_active: validatedData.is_active,
    })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, center }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
};
