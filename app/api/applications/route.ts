import { createSupabaseAdminClient } from '@/lib/supabase';

type ApplicantInput = {
  nameKo: string;
  nameEn: string;
  position: string;
  division: string;
  team: string;
  extension: string;
  mobile: string;
  email: string;
};

const requiredFields: Array<keyof ApplicantInput> = [
  'nameKo',
  'nameEn',
  'position',
  'division',
  'team',
  'mobile',
  'email',
];

function isApplicant(value: unknown): value is ApplicantInput {
  if (!value || typeof value !== 'object') return false;
  const applicant = value as Record<string, unknown>;
  return (
    typeof applicant.extension === 'string' &&
    applicant.extension.trim().length <= 120 &&
    requiredFields.every(
      (field) =>
        typeof applicant[field] === 'string' &&
        applicant[field].trim().length > 0 &&
        applicant[field].trim().length <= 120,
    )
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      applicants?: unknown;
      submissionKey?: unknown;
    };
    if (
      typeof body.submissionKey !== 'string' ||
      !/^[a-zA-Z0-9-]{20,80}$/.test(body.submissionKey) ||
      !Array.isArray(body.applicants) ||
      body.applicants.length < 1 ||
      body.applicants.length > 20 ||
      !body.applicants.every(isApplicant)
    ) {
      return Response.json(
        { message: '신청 정보를 다시 확인해 주세요.' },
        { status: 400 },
      );
    }

    const applicants = body.applicants.map((applicant) =>
      Object.fromEntries(
        Object.entries(applicant).map(([key, value]) => [key, value.trim()]),
      ) as ApplicantInput,
    );
    if (!applicants.every((applicant) => /^\S+@\S+\.\S+$/.test(applicant.email))) {
      return Response.json(
        { message: '메일주소 형식을 확인해 주세요.' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const batchId = body.submissionKey;
    const now = new Date();
    const proposedReceiptNumber = `BC-${now.toISOString().slice(0, 10).replaceAll('-', '')}-${batchId.slice(0, 6).toUpperCase()}`;
    const { data: batch, error: submissionError } = await supabase
      .rpc('submit_business_card_application', {
        p_batch_id: batchId,
        p_receipt_number: proposedReceiptNumber,
        p_created_at: now.toISOString(),
        p_applicants: applicants,
      })
      .single();
    if (submissionError || !batch) throw submissionError;

    const batchRow = batch as {
      receipt_number: string;
      email_status: string;
    };
    const receiptNumber = batchRow.receipt_number;
    if (batchRow.email_status === 'sent') {
      return Response.json({ receiptNumber, applicantCount: applicants.length });
    }

    const emailResult = await sendApplicationEmail(receiptNumber, applicants);
    const { error: updateError } = await supabase
      .from('application_batches')
      .update({
        email_status: emailResult.ok ? 'sent' : 'failed',
        email_id: emailResult.id,
        emailed_at: emailResult.ok ? new Date().toISOString() : null,
      })
      .eq('id', batchId);
    if (updateError) throw updateError;

    if (!emailResult.ok) {
      return Response.json({ message: emailResult.message }, { status: 502 });
    }

    return Response.json({ receiptNumber, applicantCount: applicants.length });
  } catch {
    return Response.json(
      { message: '접수 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}

async function sendApplicationEmail(
  receiptNumber: string,
  applicants: ApplicantInput[],
) {
  const serviceId = process.env.EMAILJS_SERVICE_ID?.trim();
  const templateId = process.env.EMAILJS_TEMPLATE_ID?.trim();
  const publicKey = process.env.EMAILJS_PUBLIC_KEY?.trim();
  const privateKey = process.env.EMAILJS_PRIVATE_KEY?.trim();
  const to = process.env.EMAIL_TO?.trim();
  if (!serviceId || !templateId || !publicKey || !to) {
    return {
      ok: false,
      id: null,
      message: '메일 발송 설정이 아직 완료되지 않았습니다. 관리자에게 문의해 주세요.',
    };
  }

  const csv = createCsv(applicants);
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      ...(privateKey ? { accessToken: privateKey } : {}),
      template_params: {
        to_email: to,
        subject: `[명함 신청] ${receiptNumber} · ${applicants.length}명`,
        receipt_number: receiptNumber,
        applicant_count: applicants.length,
        submitted_at: new Intl.DateTimeFormat('ko-KR', {
          dateStyle: 'long',
          timeStyle: 'short',
          timeZone: 'Asia/Seoul',
        }).format(new Date()),
        applicants,
        application_html: createEmailHtml(receiptNumber, applicants),
        csv_filename: `${receiptNumber}.csv`,
        csv_attachment: `data:text/csv;base64,${toBase64(`\uFEFF${csv}`)}`,
      },
    }),
  });
  const result = await response.text();
  return response.ok
    ? { ok: true, id: `emailjs:${receiptNumber}`, message: '' }
    : {
        ok: false,
        id: null,
        message: result || '담당자 메일 발송에 실패했습니다.',
      };
}

function createCsv(applicants: ApplicantInput[]) {
  const headings = [
    '이름',
    '영어 이름',
    '직책',
    '사업부/실 이름',
    '팀 이름',
    '사내번호',
    '휴대폰번호',
    '메일주소',
  ];
  const rows = applicants.map((applicant) => [
    applicant.nameKo,
    applicant.nameEn,
    applicant.position,
    applicant.division,
    applicant.team,
    applicant.extension,
    applicant.mobile,
    applicant.email,
  ]);
  return [headings, ...rows]
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\n');
}

function createEmailHtml(receiptNumber: string, applicants: ApplicantInput[]) {
  const rows = applicants
    .map(
      (applicant, index) => `
        <tr>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${index + 1}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb"><strong>${escapeHtml(applicant.nameKo)}</strong><br>${escapeHtml(applicant.nameEn)}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(applicant.division)}<br>${escapeHtml(applicant.team)}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(applicant.position)}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(applicant.mobile)}${applicant.extension ? `<br>내선 ${escapeHtml(applicant.extension)}` : ''}</td>
          <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(applicant.email)}</td>
        </tr>`,
    )
    .join('');
  return `
    <div style="font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#172033;max-width:920px;margin:auto">
      <div style="background:#102642;color:white;padding:24px 28px;border-radius:16px 16px 0 0">
        <p style="margin:0 0 6px;font-size:12px;opacity:.7">MISTO BUSINESS CARD REQUEST</p>
        <h1 style="margin:0;font-size:22px">새 명함 신청 ${applicants.length}건</h1>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:0;padding:24px 28px">
        <p style="margin:0 0 18px">접수번호 <strong>${escapeHtml(receiptNumber)}</strong></p>
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f4f6f8;text-align:left"><th style="padding:10px">#</th><th style="padding:10px">성명</th><th style="padding:10px">조직</th><th style="padding:10px">직책</th><th style="padding:10px">연락처</th><th style="padding:10px">메일</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:20px 0 0;color:#64748b;font-size:12px">전체 신청 내역은 첨부된 CSV 파일에서도 확인할 수 있습니다.</p>
      </div>
    </div>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return entities[character];
  });
}

function toBase64(value: string) {
  return Buffer.from(value, 'utf8').toString('base64');
}
