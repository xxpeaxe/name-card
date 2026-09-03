import { createSupabaseAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    supabaseSecret: Boolean(process.env.SUPABASE_SECRET_KEY?.trim()),
    database: false,
    submitFunction: false,
    email: Boolean(
      process.env.EMAIL_TO?.trim() &&
        process.env.EMAILJS_SERVICE_ID?.trim() &&
        process.env.EMAILJS_TEMPLATE_ID?.trim() &&
        process.env.EMAILJS_PUBLIC_KEY?.trim(),
    ),
  };

  if (!checks.supabaseSecret) {
    return Response.json({ ok: false, checks }, { status: 503 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error: databaseError } = await supabase
      .from('application_batches')
      .select('id', { count: 'exact', head: true });
    checks.database = !databaseError;

    if (checks.database) {
      const { error: functionError } = await supabase.rpc(
        'submit_business_card_application',
        {
          p_batch_id: '00000000-0000-0000-0000-000000000000',
          p_receipt_number: 'HEALTH-CHECK',
          p_created_at: new Date().toISOString(),
          p_applicants: [],
        },
      );
      checks.submitFunction = functionError?.code === 'P0001';
    }
  } catch {
    // Only boolean readiness is returned; credentials and provider errors stay private.
  }

  const ok = Object.values(checks).every(Boolean);
  return Response.json({ ok, checks }, { status: ok ? 200 : 503 });
}
