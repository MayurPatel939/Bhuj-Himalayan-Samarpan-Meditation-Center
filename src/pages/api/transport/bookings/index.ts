import type { APIRoute } from 'astro';
import { bookingSchema } from '@/features/transport/lib/validations';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp/client';

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

  const result = bookingSchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ error: result.error.issues[0]?.message || 'Validation error' }), {
      status: 400,
    });
  }

  const { schedule_id, seeker_id, pickup_point } = result.data;
  const supabase = locals.supabase;

  // 1. Fetch schedule
  const { data: schedule, error: schedErr } = await supabase
    .from('transport_schedules')
    .select(`
      id,
      available_seats,
      booked_seats,
      booking_open,
      departure_datetime,
      vehicles (name, vehicle_type),
      routes (name_en, name_gu, origin, destination)
    `)
    .eq('id', schedule_id)
    .maybeSingle();

  if (schedErr || !schedule) {
    return new Response(JSON.stringify({ error: 'Transport schedule not found' }), { status: 404 });
  }

  if (!schedule.booking_open) {
    return new Response(JSON.stringify({ error: 'Booking is closed for this schedule' }), { status: 400 });
  }

  // 2. Check if seeker already booked
  const { data: existingBooking } = await supabase
    .from('transport_bookings')
    .select('id, status')
    .eq('schedule_id', schedule_id)
    .eq('seeker_id', seeker_id)
    .maybeSingle();

  if (existingBooking && existingBooking.status !== 'cancelled') {
    return new Response(
      JSON.stringify({ error: `Seeker already has a ${existingBooking.status} booking for this trip` }),
      { status: 409 }
    );
  }

  // 3. Determine if seats are available
  const isFull = schedule.booked_seats >= schedule.available_seats;
  const bookingStatus = isFull ? 'waitlisted' : 'confirmed';

  let waitlistPosition: number | null = null;
  if (isFull) {
    const { count: waitlistCount } = await supabase
      .from('transport_bookings')
      .select('id', { count: 'exact', head: true })
      .eq('schedule_id', schedule_id)
      .eq('status', 'waitlisted');

    waitlistPosition = (waitlistCount || 0) + 1;
  }

  // 4. Save booking
  let booking;
  if (existingBooking) {
    const { data, error } = await supabase
      .from('transport_bookings')
      .update({
        status: bookingStatus,
        waitlist_position: waitlistPosition,
        pickup_point: pickup_point || null,
        booked_at: new Date().toISOString(),
        cancelled_at: null,
      })
      .eq('id', existingBooking.id)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    booking = data;
  } else {
    const { data, error } = await supabase
      .from('transport_bookings')
      .insert({
        schedule_id,
        seeker_id,
        pickup_point: pickup_point || null,
        status: bookingStatus,
        waitlist_position: waitlistPosition,
        booked_by: locals.user.id,
      })
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    booking = data;
  }

  // 5. If confirmed, increment booked_seats on schedule
  if (bookingStatus === 'confirmed') {
    await supabase
      .from('transport_schedules')
      .update({
        booked_seats: schedule.booked_seats + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule_id);
  }

  // 6. Optional WhatsApp confirmation to seeker
  const { data: seeker } = await supabase
    .from('seekers')
    .select('id, first_name_en, first_name_gu, mobile, notification_consent')
    .eq('id', seeker_id)
    .maybeSingle();

  if (seeker?.mobile && seeker.notification_consent) {
    const vehicleName = (schedule.vehicles as any)?.name || 'Dhyan Rath';
    const dateStr = new Date(schedule.departure_datetime).toLocaleDateString('en-IN');
    const pickup = pickup_point || (schedule.routes as any)?.origin || 'Bhuj Center';
    const timeStr = new Date(schedule.departure_datetime).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      await sendWhatsAppTemplateMessage({
        recipientPhone: seeker.mobile,
        templateName: 'transport_booking_confirmed',
        languageCode: seeker.first_name_gu ? 'gu' : 'en',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: seeker.first_name_gu || seeker.first_name_en },
              { type: 'text', text: vehicleName },
              { type: 'text', text: dateStr },
              { type: 'text', text: pickup },
              { type: 'text', text: timeStr },
            ],
          },
        ],
        env: locals.runtime?.env,
      });
    } catch (e) {
      console.warn('[Transport Booking] WhatsApp alert error:', e);
    }
  }

  return new Response(
    JSON.stringify({
      data: booking,
      status: bookingStatus,
      waitlist_position: waitlistPosition,
      message:
        bookingStatus === 'confirmed'
          ? 'Seat booked successfully!'
          : `Trip is full. Seeker added to waitlist at position #${waitlistPosition}.`,
    }),
    { status: 201, headers: { 'Content-Type': 'application/json' } }
  );
};
