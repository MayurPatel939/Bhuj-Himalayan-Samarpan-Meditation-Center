import type { APIRoute } from 'astro';
import { registrationSchema, bulkAttendanceSchema } from '@/features/events/lib/validations';

/**
 * POST /api/events/registrations
 * Register a seeker for an event with automatic waitlisting when capacity is reached.
 */
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

  const result = registrationSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const { event_id, seeker_id, notes } = result.data;
  const supabase = locals.supabase;

  // 1. Fetch event to check capacity and registration window
  const { data: event, error: eventErr } = await supabase
    .from('events')
    .select('id, status, max_capacity, registration_start, registration_end, title_en')
    .eq('id', event_id)
    .maybeSingle();

  if (eventErr || !event) {
    return new Response(JSON.stringify({ error: 'Event not found' }), { status: 404 });
  }

  // Check if registration is open
  if (!['registration_open', 'published'].includes(event.status)) {
    return new Response(JSON.stringify({ error: 'Registration is not currently open for this event' }), { status: 400 });
  }

  // Check registration window
  const now = new Date();
  if (event.registration_start && new Date(event.registration_start) > now) {
    return new Response(JSON.stringify({ error: 'Registration has not started yet' }), { status: 400 });
  }
  if (event.registration_end && new Date(event.registration_end) < now) {
    return new Response(JSON.stringify({ error: 'Registration deadline has passed' }), { status: 400 });
  }

  // 2. Check if seeker is already registered
  const { data: existingReg } = await supabase
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', event_id)
    .eq('seeker_id', seeker_id)
    .maybeSingle();

  if (existingReg && existingReg.status !== 'cancelled') {
    return new Response(
      JSON.stringify({ error: `Seeker is already ${existingReg.status} for this event` }),
      { status: 409 }
    );
  }

  // 3. Count current registered (non-cancelled, non-waitlisted)
  const { count: registeredCount } = await supabase
    .from('event_registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', event_id)
    .in('status', ['registered', 'attended']);

  const currentCount = registeredCount || 0;
  const isAtCapacity = event.max_capacity !== null && currentCount >= event.max_capacity;
  const registrationStatus = isAtCapacity ? 'waitlisted' : 'registered';

  // 4. Calculate waitlist position if waitlisted
  let waitlistPosition: number | null = null;
  if (isAtCapacity) {
    const { count: waitlistCount } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event_id)
      .eq('status', 'waitlisted');

    waitlistPosition = (waitlistCount || 0) + 1;
  }

  // 5. Upsert registration (handle re-registration after cancellation)
  let registration;
  if (existingReg) {
    const { data, error } = await supabase
      .from('event_registrations')
      .update({
        status: registrationStatus,
        registered_at: new Date().toISOString(),
        cancelled_at: null,
        waitlist_position: waitlistPosition,
        notes: notes || null,
        registered_by: locals.user.id,
      })
      .eq('id', existingReg.id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    registration = data;
  } else {
    const { data, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id,
        seeker_id,
        status: registrationStatus,
        waitlist_position: waitlistPosition,
        notes: notes || null,
        registered_by: locals.user.id,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    registration = data;
  }

  return new Response(
    JSON.stringify({
      success: true,
      registration,
      wasWaitlisted: isAtCapacity,
      waitlistPosition,
      message: isAtCapacity
        ? `Seeker has been added to the waitlist at position ${waitlistPosition}`
        : 'Seeker registered successfully',
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
