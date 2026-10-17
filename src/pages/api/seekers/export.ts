import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const url = new URL(request.url);
  const centerId = url.searchParams.get('center_id');
  const status = url.searchParams.get('status') || 'active';
  const supabase = locals.supabase;

  let query = supabase
    .from('seekers')
    .select('seeker_id, first_name_en, last_name_en, first_name_gu, last_name_gu, mobile, email, date_of_birth, anniversary_date, gender, city, status, registration_date, centers(name_en)');

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (centerId && centerId !== 'all') {
    query = query.eq('center_id', centerId);
  }

  const { data, error } = await query.order('seeker_id', { ascending: true });

  if (error || !data) {
    return new Response(JSON.stringify({ error: error?.message || 'Failed to fetch data' }), { status: 500 });
  }

  // Convert to CSV
  const headers = [
    'Seeker ID',
    'First Name (EN)',
    'Last Name (EN)',
    'First Name (GU)',
    'Last Name (GU)',
    'Mobile',
    'Email',
    'Date of Birth',
    'Anniversary Date',
    'Gender',
    'City',
    'Center',
    'Registration Date',
    'Status',
  ];

  const rows = data.map((s: any) => [
    s.seeker_id,
    `"${s.first_name_en || ''}"`,
    `"${s.last_name_en || ''}"`,
    `"${s.first_name_gu || ''}"`,
    `"${s.last_name_gu || ''}"`,
    s.mobile || '',
    s.email || '',
    s.date_of_birth || '',
    s.anniversary_date || '',
    s.gender || '',
    `"${s.city || ''}"`,
    `"${s.centers?.name_en || ''}"`,
    s.registration_date || '',
    s.status || '',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  return new Response('\uFEFF' + csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="seekers-export-${new Date().toISOString().split('T')[0]}.csv"`,
    },
  });
};
