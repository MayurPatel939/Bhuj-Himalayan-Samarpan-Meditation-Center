import type { APIRoute } from 'astro';

export const PUT: APIRoute = async ({ params, request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const bookingId = params.id;
  if (!bookingId) {
    return new Response(JSON.stringify({ error: 'Booking ID is required' }), { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { action } = body; // 'cancel'
  if (action !== 'cancel') {
    return new Response(JSON.stringify({ error: 'Invalid action. Only "cancel" supported.' }), { status: 400 });
  }

  const supabase = locals.supabase;

  // 1. Fetch current booking
  const { data: booking, error: bookErr } = await supabase
    .from('transport_bookings')
    .select('id, schedule_id, seeker_id, status')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookErr || !booking) {
    return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 });
  }

  // 2. Mark cancelled
  const { error: cancelErr } = await supabase
    .from('transport_bookings')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      waitlist_position: null,
    })
    .eq('id', bookingId);

  if (cancelErr) {
    return new Response(JSON.stringify({ error: cancelErr.message }), { status: 500 });
  }

  let promotedSeeker = null;

  // 3. If was confirmed, check for waitlist promotion
  if (booking.status === 'confirmed') {
    const { data: nextWaitlisted } = await supabase
      .from('transport_bookings')
      .select('id, seeker_id, seekers(first_name_en, last_name_en, mobile)')
      .eq('schedule_id', booking.schedule_id)
      .eq('status', 'waitlisted')
      .order('waitlist_position', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextWaitlisted) {
      // Promote waitlisted seeker
      await supabase
        .from('transport_bookings')
        .update({
          status: 'confirmed',
          waitlist_position: null,
        })
        .eq('id', nextWaitlisted.id);

      promotedSeeker = nextWaitlisted.seekers;

      // Re-index remaining waitlist positions
      const { data: remaining } = await supabase
        .from('transport_bookings')
        .select('id, waitlist_position')
        .eq('schedule_id', booking.schedule_id)
        .eq('status', 'waitlisted')
        .order('waitlist_position', { ascending: true });

      if (remaining) {
        for (let i = 0; i < remaining.length; i++) {
          await supabase
            .from('transport_bookings')
            .update({ waitlist_position: i + 1 })
            .eq('id', remaining[i].id);
        }
      }
    } else {
      // No one waiting on waitlist, decrement booked_seats on schedule
      const { data: schedule } = await supabase
        .from('transport_schedules')
        .select('booked_seats')
        .eq('id', booking.schedule_id)
        .maybeSingle();

      if (schedule && schedule.booked_seats > 0) {
        await supabase
          .from('transport_schedules')
          .update({
            booked_seats: schedule.booked_seats - 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', booking.schedule_id);
      }
    }
  }

  return new Response(
    JSON.stringify({
      message: 'Booking cancelled successfully',
      promoted_seeker: promotedSeeker,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
