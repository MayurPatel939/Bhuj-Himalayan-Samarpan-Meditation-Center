import type { APIRoute } from 'astro';
import { centerSchema } from '@/features/centers/lib/validations';
import { canAccessCenter, isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ params, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing center ID' }), { status: 400 });
  }

  const supabase = locals.supabase;
  const { data: center, error } = await supabase
    .from('centers')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !center) {
    return new Response(JSON.stringify({ error: 'Center not found' }), { status: 404 });
  }

  // Count seekers at this center
  const { count: seekerCount } = await supabase
    .from('seekers')
    .select('id', { count: 'exact', head: true })
    .eq('center_id', id)
    .eq('status', 'active');

  return new Response(JSON.stringify({ center: { ...center, seeker_count: seekerCount || 0 } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing center ID' }), { status: 400 });
  }

  // Check authorization: Admins or assigned Center Coordinator
  if (!locals.user || !canAccessCenter(locals.roles, id)) {
    return new Response(JSON.stringify({ error: 'Unauthorized to edit this center' }), { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const result = centerSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.errors[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const validatedData = result.data;
  const supabase = locals.supabase;

  const { data: updated, error } = await supabase
    .from('centers')
    .update({
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
      meditation_days: validatedData.meditation_days,
      session_timings: validatedData.session_timings || null,
      instructions_en: validatedData.instructions_en || null,
      instructions_gu: validatedData.instructions_gu || null,
      is_active: validatedData.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, center: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user || !isAdminOrAbove(locals.roles)) {
    return new Response(JSON.stringify({ error: 'Only Admins can deactivate centers' }), { status: 403 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing center ID' }), { status: 400 });
  }

  const supabase = locals.supabase;
  const { error } = await supabase
    .from('centers')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
