import type { APIRoute } from 'astro';

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

  const { records, default_center_id } = body;
  if (!Array.isArray(records) || records.length === 0) {
    return new Response(JSON.stringify({ error: 'No records provided for import' }), { status: 400 });
  }

  const supabase = locals.supabase;
  let successCount = 0;
  let skippedDuplicatesCount = 0;
  const errors: string[] = [];

  // Fetch all centers for name resolution
  const { data: allCenters } = await supabase.from('centers').select('id, name_en, name_gu');
  const centerMap = new Map<string, string>();
  (allCenters || []).forEach((c: any) => {
    centerMap.set(c.name_en.toLowerCase().trim(), c.id);
    centerMap.set(c.name_gu.toLowerCase().trim(), c.id);
  });

  // Fetch all existing mobiles to avoid duplicates
  const { data: existingSeekers } = await supabase
    .from('seekers')
    .select('mobile')
    .eq('status', 'active')
    .not('mobile', 'is', null);

  const existingMobiles = new Set(
    (existingSeekers || []).map((s: any) => s.mobile?.trim()).filter(Boolean)
  );

  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const toInsert: any[] = [];

    for (const row of batch) {
      const firstName = row.first_name || row.firstName || row['First Name'] || '';
      const lastName = row.last_name || row.lastName || row['Last Name'] || '';
      const mobile = (row.mobile || row.phone || row['Mobile'] || '').toString().trim();

      if (!firstName || !lastName) {
        errors.push(`Row missing first or last name`);
        continue;
      }

      if (mobile && existingMobiles.has(mobile)) {
        skippedDuplicatesCount++;
        continue;
      }

      let centerId = default_center_id || null;
      const centerName = (row.center || row.center_name || row['Center'] || '').toLowerCase().trim();
      if (centerName && centerMap.has(centerName)) {
        centerId = centerMap.get(centerName);
      }

      toInsert.push({
        first_name_en: firstName,
        last_name_en: lastName,
        first_name_gu: row.first_name_gu || null,
        last_name_gu: row.last_name_gu || null,
        mobile: mobile || null,
        email: row.email || null,
        date_of_birth: row.date_of_birth || row.dob || null,
        anniversary_date: row.anniversary_date || null,
        gender: row.gender?.toLowerCase() || null,
        address_en: row.address || null,
        city: row.city || 'Bhuj',
        pincode: row.pincode || null,
        center_id: centerId,
        status: 'active',
        created_by: locals.user.id,
      });

      if (mobile) {
        existingMobiles.add(mobile);
      }
    }

    if (toInsert.length > 0) {
      const { error: insertErr } = await supabase.from('seekers').insert(toInsert);
      if (insertErr) {
        errors.push(`Batch error: ${insertErr.message}`);
      } else {
        successCount += toInsert.length;
      }
    }
  }

  return new Response(
    JSON.stringify({
      success: true,
      importedCount: successCount,
      skippedDuplicates: skippedDuplicatesCount,
      errors: errors.slice(0, 10),
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
