import type { APIRoute } from 'astro';

/**
 * PUT /api/events/registrations/[id]
 * Cancel a registration and auto-promote the next waitlisted seeker.
 */
export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const registrationId = params.id;
  if (!registrationId) {
    return new Response(JSON.stringify({ error: 'Registration ID is required' }), { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { action } = body; // 'cancel' | 'attend' | 'no_show'
  if (!['cancel', 'attend', 'no_show'].includes(action)) {
    return new Response(JSON.stringify({ error: 'Invalid action. Use "cancel", "attend", or "no_show"' }), { status: 400 });
  }

  const supabase = locals.supabase;

  // Fetch current registration
  const { data: reg, error: regErr } = await supabase
    .from('event_registrations')
    .select('id, event_id, seeker_id, status')
    .eq('id', registrationId)
    .maybeSingle();

  if (regErr || !reg) {
    return new Response(JSON.stringify({ error: 'Registration not found' }), { status: 404 });
  }

  if (action === 'cancel') {
    // Cancel the registration
    const { error: cancelErr } = await supabase
      .from('event_registrations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (cancelErr) {
      return new Response(JSON.stringify({ error: cancelErr.message }), { status: 500 });
    }

    // Auto-promote next waitlisted seeker if the cancelled registration was 'registered' or 'attended'
    let promotedSeeker = null;
    if (['registered', 'attended'].includes(reg.status)) {
      const { data: nextWaitlisted } = await supabase
        .from('event_registrations')
        .select('id, seeker_id, seekers(first_name_en, last_name_en, seeker_id)')
        .eq('event_id', reg.event_id)
        .eq('status', 'waitlisted')
        .order('waitlist_position', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (nextWaitlisted) {
        const { error: promoteErr } = await supabase
          .from('event_registrations')
          .update({
            status: 'registered',
            waitlist_position: null,
          })
          .eq('id', nextWaitlisted.id);

        if (!promoteErr) {
          promotedSeeker = nextWaitlisted.seekers;

          // Recalculate remaining waitlist positions
          const { data: remainingWaitlist } = await supabase
            .from('event_registrations')
            .select('id, waitlist_position')
            .eq('event_id', reg.event_id)
            .eq('status', 'waitlisted')
            .order('waitlist_position', { ascending: true });

          if (remainingWaitlist) {
            for (let i = 0; i < remainingWaitlist.length; i++) {
              await supabase
                .from('event_registrations')
                .update({ waitlist_position: i + 1 })
                .eq('id', remainingWaitlist[i].id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registration cancelled',
        promotedSeeker,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (action === 'attend') {
    const { error } = await supabase
      .from('event_registrations')
      .update({
        status: 'attended',
        attended_at: new Date().toISOString(),
      })
      .eq('id', registrationId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Marked as attended' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (action === 'no_show') {
    const { error } = await supabase
      .from('event_registrations')
      .update({ status: 'no_show' })
      .eq('id', registrationId);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, message: 'Marked as no-show' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
};
