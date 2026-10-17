import type { APIRoute } from 'astro';
import { seekerSchema } from '@/features/seekers/lib/validations';
import { canAccessCenter } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing seeker ID' }), { status: 400 });
  }

  const supabase = locals.supabase;
  const { data: seeker, error } = await supabase
    .from('seekers')
    .select('*, centers(id, name_en, name_gu)')
    .eq('id', id)
    .single();

  if (error || !seeker) {
    return new Response(JSON.stringify({ error: 'Seeker not found' }), { status: 404 });
  }

  // Check center-scoped access
  if (seeker.center_id && !canAccessCenter(locals.roles, seeker.center_id)) {
    return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
  }

  return new Response(JSON.stringify({ seeker }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing seeker ID' }), { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const result = seekerSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.errors[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const validatedData = result.data;
  const supabase = locals.supabase;

  // Retrieve current seeker to verify permissions
  const { data: currentSeeker } = await supabase
    .from('seekers')
    .select('center_id')
    .eq('id', id)
    .single();

  if (currentSeeker?.center_id && !canAccessCenter(locals.roles, currentSeeker.center_id)) {
    return new Response(JSON.stringify({ error: 'Access denied to update this seeker' }), { status: 403 });
  }

  if (validatedData.center_id && !canAccessCenter(locals.roles, validatedData.center_id)) {
    return new Response(JSON.stringify({ error: 'Access denied to assign seeker to this center' }), { status: 403 });
  }

  const { data: updated, error: updateError } = await supabase
    .from('seekers')
    .update({
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
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, seeker: updated }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing seeker ID' }), { status: 400 });
  }

  const supabase = locals.supabase;

  // Soft-delete: update status to 'archived'
  const { error } = await supabase
    .from('seekers')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
