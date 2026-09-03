import { redirect } from 'next/navigation';

import { isAdminEmail } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase';
import { AdminDashboard, type AdminRecord } from './admin-dashboard';

export const dynamic = 'force-dynamic';

type BatchRow = {
  id: string;
  receipt_number: string;
  created_at: string;
  status: string;
  email_status: string;
  business_cards: Array<{
    name_ko: string;
    name_en: string;
    position: string;
    division: string;
    team: string;
    extension: string;
    mobile: string;
    email: string;
  }>;
};

export default async function AdminPage() {
  const supabase = await createSupabaseServerClient().catch(() => null);
  if (!supabase) redirect('/admin/login?error=config');

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const currentEmail = user?.email ?? '';
  if (!isAdminEmail(currentEmail)) redirect('/admin/login');

  let records: AdminRecord[] = [];
  let dataReady = true;

  try {
    const { data, error } = await supabase
      .from('application_batches')
      .select(
        'id,receipt_number,created_at,status,email_status,business_cards(name_ko,name_en,position,division,team,extension,mobile,email)',
      )
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) throw error;

    records = ((data ?? []) as BatchRow[]).flatMap((batch) =>
      batch.business_cards.map((card) => ({
        batchId: batch.id,
        receiptNumber: batch.receipt_number,
        createdAt: batch.created_at,
        status: batch.status,
        emailStatus: batch.email_status,
        nameKo: card.name_ko,
        nameEn: card.name_en,
        position: card.position,
        division: card.division,
        team: card.team,
        extension: card.extension,
        mobile: card.mobile,
        email: card.email,
      })),
    );
  } catch {
    dataReady = false;
  }

  return (
    <AdminDashboard
      records={records}
      currentEmail={currentEmail}
      dataReady={dataReady}
    />
  );
}
