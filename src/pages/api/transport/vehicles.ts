import type { APIRoute } from 'astro';
import { vehicleSchema } from '@/features/transport/lib/validations';
import { isAdminOrAbove } from '@/lib/auth/permissions';

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { data, error } = await locals.supabase
    .from('vehicles')
    .select('*')
    .eq('is_active', true)
    .order('name');

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

  const allowedRoles = ['super_admin', 'admin', 'dhyan_rath_coordinator', 'bus_coordinator'];
  if (!isAdminOrAbove(locals.roles) && !locals.roles.some((r) => allowedRoles.includes(r.role_name))) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const result = vehicleSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const { data, error } = await locals.supabase
    .from('vehicles')
    .insert(result.data)
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
