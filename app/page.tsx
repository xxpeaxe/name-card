'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronLeft,
  Download,
  HelpCircle,
  Info,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type Applicant = {
  id: string;
  nameKo: string;
  nameEn: string;
  position: string;
  division: string;
  team: string;
  extension: string;
  mobile: string;
  email: string;
};

const sampleApplicant: Applicant = {
  id: 'applicant-1',
  nameKo: '',
  nameEn: '',
  position: '',
  division: '',
  team: '',
  extension: '',
  mobile: '',
  email: '',
};

const emptyApplicant = (id: string): Applicant => ({
  id,
  nameKo: '',
  nameEn: '',
  position: '',
  division: '',
  team: '',
  extension: '',
  mobile: '',
  email: '',
});

export default function Home() {
  const [applicants, setApplicants] = useState<Applicant[]>([sampleApplicant]);
  const [activeId, setActiveId] = useState(sampleApplicant.id);
  const [agreed, setAgreed] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [submissionKey, setSubmissionKey] = useState('');

  const activeApplicant =
    applicants.find((applicant) => applicant.id === activeId) ?? applicants[0];

  function updateApplicant(id: string, field: keyof Applicant, value: string) {
    setApplicants((current) =>
      current.map((applicant) =>
        applicant.id === id ? { ...applicant, [field]: value } : applicant,
      ),
    );
  }

  function addApplicant() {
    const id = `applicant-${Date.now()}`;
    setApplicants((current) => [...current, emptyApplicant(id)]);
    setActiveId(id);
  }

  function removeApplicant(id: string) {
    if (applicants.length === 1) return;
    const index = applicants.findIndex((applicant) => applicant.id === id);
    const nextApplicants = applicants.filter((applicant) => applicant.id !== id);
    setApplicants(nextApplicants);
    setActiveId(nextApplicants[Math.max(0, index - 1)].id);
  }

  function reviewApplication() {
    const fields: Array<keyof Omit<Applicant, 'id'>> = [
      'nameKo',
      'nameEn',
      'position',
      'division',
      'team',
      'mobile',
      'email',
    ];
    const invalidIndex = applicants.findIndex((applicant) =>
      fields.some((field) => !applicant[field].trim()),
    );

    if (invalidIndex >= 0) {
      setActiveId(applicants[invalidIndex].id);
      setValidationMessage(`${invalidIndex + 1}번째 신청자의 필수 정보를 모두 입력해 주세요.`);
      return;
    }

    const invalidEmailIndex = applicants.findIndex(
      (applicant) => !/^\S+@\S+\.\S+$/.test(applicant.email),
    );
    if (invalidEmailIndex >= 0) {
      setActiveId(applicants[invalidEmailIndex].id);
      setValidationMessage(`${invalidEmailIndex + 1}번째 신청자의 메일주소 형식을 확인해 주세요.`);
      return;
    }

    if (!agreed) {
      setValidationMessage('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    setValidationMessage('');
    setSubmissionError('');
    setReceiptNumber('');
    if (!submissionKey) setSubmissionKey(crypto.randomUUID());
    setReviewOpen(true);
  }

  function downloadCsv() {
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
    const csv = [headings, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `명함신청_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function submitApplication() {
    setSubmitting(true);
    setSubmissionError('');
    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionKey,
          applicants: applicants.map(({ id: _id, ...applicant }) => applicant),
        }),
      });
      const result = (await response.json()) as {
        receiptNumber?: string;
        message?: string;
      };
      if (!response.ok || !result.receiptNumber) {
        throw new Error(result.message || '접수에 실패했습니다.');
      }
      setReceiptNumber(result.receiptNumber);
    } catch (error) {
      setSubmissionError(
        error instanceof Error ? error.message : '접수에 실패했습니다.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_88%_7%,rgba(183,239,81,0.14),transparent_24%),linear-gradient(180deg,#f5f8fb_0%,#edf2f7_100%)] text-slate-950">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-17 max-w-[1380px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#102642] text-white shadow-sm">
              <span className="text-sm font-black tracking-[-0.08em]">BC</span>
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-[-0.03em] text-[#102642]">
                MISTO
              </p>
              <p className="text-[10px] font-medium tracking-[0.12em] text-slate-400">
                BUSINESS CARD REQUEST
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900 sm:flex"
            >
              <HelpCircle className="size-4" />
              관리자 페이지
            </Link>
            <div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-2 rounded-full bg-slate-100 py-1.5 pl-2 pr-3">
              <span className="grid size-6 place-items-center rounded-full bg-[#102642] text-[10px] font-bold text-white">
                사
              </span>
              <span className="text-xs font-semibold text-slate-700">임직원</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] px-5 pb-16 pt-7 lg:px-10 lg:pt-10">
        <button
          type="button"
          className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          <ChevronLeft className="size-4" />
          복지 서비스
        </button>

        <section className="mb-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs font-bold text-lime-800">
              <Sparkles className="size-3.5" />
              한 번에 여러 명 신청 가능
            </div>
            <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-black tracking-[-0.055em] text-[#102642]">
              임직원 명함 신청
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              명함 정보를 입력하면 오른쪽에서 실제 배치를 미리 확인할 수 있습니다.
            </p>
          </div>
          <ol className="flex items-center gap-2" aria-label="신청 단계">
            <Step number="1" label="정보 입력" active={!reviewOpen && !receiptNumber} />
            <span className="h-px w-5 bg-slate-300" />
            <Step number="2" label="내용 확인" active={reviewOpen && !receiptNumber} />
            <span className="h-px w-5 bg-slate-300" />
            <Step number="3" label="신청 완료" active={Boolean(receiptNumber)} />
          </ol>
        </section>

        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/90 px-4 py-3.5 text-sm text-blue-950 shadow-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-blue-600" />
          <p className="leading-5">
            <strong className="font-extrabold">제작 안내</strong>
            <span className="mx-2 text-blue-200">|</span>
            일괄 주문 형식으로 명함 제작에 평균 1-2주 내외 소요됩니다.
          </p>
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_520px]">
          <form
            className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,35,58,0.08)] sm:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              reviewApplication();
            }}
          >
            <div className="mb-7 flex flex-col justify-between gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-start">
              <div>
                <p className="text-lg font-extrabold tracking-[-0.025em] text-[#102642]">
                  명함 정보 입력
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  신청할 임직원을 한 명씩 추가해 주세요. 사내번호 외 항목은 필수입니다.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={addApplicant}
                className="h-10 shrink-0 rounded-xl border-slate-200 px-4 font-bold text-[#102642] hover:bg-slate-50"
              >
                <Plus />
                신청자 추가
              </Button>
            </div>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-1" aria-label="신청자 목록">
              {applicants.map((applicant, index) => (
                <button
                  type="button"
                  key={applicant.id}
                  onClick={() => setActiveId(applicant.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left transition ${
                    applicant.id === activeId
                      ? 'border-[#102642] bg-[#102642] text-white shadow-md shadow-slate-900/10'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span
                    className={`grid size-6 place-items-center rounded-full text-[11px] font-extrabold ${
                      applicant.id === activeId ? 'bg-white/15' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-xs font-bold">
                      {applicant.nameKo || `신청자 ${index + 1}`}
                    </span>
                    <span className={`block text-[10px] ${applicant.id === activeId ? 'text-slate-300' : 'text-slate-400'}`}>
                      {applicant.team || '정보 입력 중'}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            <div className="mb-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-full bg-[#102642] text-xs font-bold text-white">
                  {applicants.findIndex((applicant) => applicant.id === activeApplicant.id) + 1}
                </span>
                <p className="text-sm font-extrabold text-[#102642]">
                  {activeApplicant.nameKo || '새 신청자'}
                </p>
              </div>
              {applicants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeApplicant(activeApplicant.id)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 transition hover:text-rose-600"
                >
                  <Trash2 className="size-3.5" />
                  삭제
                </button>
              )}
            </div>

            <FieldGroup className="gap-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <ApplicantField applicant={activeApplicant} field="nameKo" label="이름" placeholder="예: 신정훈" onUpdate={updateApplicant} />
                <ApplicantField applicant={activeApplicant} field="nameEn" label="영어 이름" placeholder="예: Junghoon shin" onUpdate={updateApplicant} />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <ApplicantField applicant={activeApplicant} field="position" label="직책" placeholder="예: 팀장 / 팀원" onUpdate={updateApplicant} />
                <ApplicantField applicant={activeApplicant} field="division" label="사업부 / 실 이름" placeholder="예: 인사법무실" onUpdate={updateApplicant} />
              </div>
              <ApplicantField applicant={activeApplicant} field="team" label="팀 이름" placeholder="예: 인사팀" onUpdate={updateApplicant} />
              <div className="grid gap-5 sm:grid-cols-2">
                <ApplicantField applicant={activeApplicant} field="extension" label="사내번호" placeholder="선택 입력" type="tel" onUpdate={updateApplicant} required={false} />
                <ApplicantField applicant={activeApplicant} field="mobile" label="휴대폰번호" placeholder="예: 010-1234-5678" type="tel" onUpdate={updateApplicant} />
              </div>
              <ApplicantField applicant={activeApplicant} field="email" label="메일주소" placeholder="예: name@mistobrand.com" type="email" onUpdate={updateApplicant} />
            </FieldGroup>

            <div className="mt-7 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-slate-300">
              <Checkbox
                id="privacy-consent"
                checked={agreed}
                onCheckedChange={(checked) => setAgreed(checked === true)}
                aria-label="개인정보 수집 및 이용 동의"
                className="mt-0.5"
              />
              <label htmlFor="privacy-consent" className="cursor-pointer text-sm leading-5 text-slate-600">
                <strong className="font-bold text-slate-800">개인정보 수집 및 이용</strong>에 동의합니다.
                <span className="ml-1 text-xs text-slate-400">(명함 제작 및 전달 목적)</span>
              </label>
            </div>

            {validationMessage && (
              <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {validationMessage}
              </p>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="size-4 text-emerald-600" />
                입력 정보는 명함 제작 목적으로만 사용됩니다.
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 rounded-xl bg-[#102642] px-6 font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-[#173553]"
              >
                신청 내용 확인
                <ArrowRight />
              </Button>
            </div>
          </form>

          <aside className="space-y-4 xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-[28px] bg-[#102642] p-5 text-white shadow-[0_24px_70px_rgba(15,35,58,0.2)] sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">명함 미리보기</p>
                  <p className="mt-0.5 text-xs text-slate-400">현재 선택한 신청자의 앞면입니다.</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-300">
                  FRONT
                </span>
              </div>

              <BusinessCard applicant={activeApplicant} />

              <div className="mt-5 flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-xs text-slate-300">
                <BadgeCheck className="mt-0.5 size-4 shrink-0 text-lime-300" />
                <div className="space-y-1">
                  <p>제출 전 오탈자와 연락처를 꼭 확인해 주세요.</p>
                  <p className="text-[11px] leading-4 text-slate-400">
                    해당 이미지는 가상 시안으로 실제 명함과 다를 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Summary label="신청 인원" value={`${applicants.length}명`} />
              <Summary label="예상 제작" value="1~2주" />
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-h-[min(760px,calc(100vh-2rem))] overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
          {receiptNumber ? (
            <div className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-7" />
              </div>
              <DialogHeader className="mt-5 items-center">
                <DialogTitle className="text-2xl font-black tracking-[-0.04em] text-[#102642]">
                  명함 신청이 접수되었습니다
                </DialogTitle>
                <DialogDescription>
                  총 {applicants.length}명의 신청 정보를 정상적으로 저장했습니다.
                </DialogDescription>
              </DialogHeader>
              <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
                <p className="text-xs font-semibold text-slate-400">접수번호</p>
                <p className="mt-1 font-mono text-lg font-black tracking-wide text-[#102642]">
                  {receiptNumber}
                </p>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-500">
                명함은 일괄 주문으로 제작되며 평균 1-2주 내외 소요됩니다.
              </p>
              <div className="mt-7 flex justify-center gap-3">
                <Button type="button" variant="outline" onClick={downloadCsv} className="h-10 rounded-xl">
                  <Download />
                  CSV 내려받기
                </Button>
                <Button type="button" onClick={() => setReviewOpen(false)} className="h-10 rounded-xl bg-[#102642] px-5">
                  확인
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 pb-2 sm:p-8 sm:pb-3">
                <DialogHeader>
                  <DialogTitle className="text-xl font-black tracking-[-0.035em] text-[#102642]">
                    신청 내용을 확인해 주세요
                  </DialogTitle>
                  <DialogDescription>
                    총 {applicants.length}명의 명함을 신청합니다. 제출 후에는 담당 부서에 문의해 주세요.
                  </DialogDescription>
                </DialogHeader>
              </div>

              <div className="space-y-3 px-6 pb-6 sm:px-8">
                {applicants.map((applicant, index) => (
                  <div key={applicant.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 place-items-center rounded-full bg-[#102642] text-[11px] font-bold text-white">
                          {index + 1}
                        </span>
                        <p className="font-extrabold text-[#102642]">{applicant.nameKo}</p>
                      </div>
                      <p className="text-xs font-semibold text-slate-400">{applicant.nameEn}</p>
                    </div>
                    <dl className="grid gap-x-4 gap-y-2 text-xs sm:grid-cols-2">
                      <ReviewItem label="조직" value={`${applicant.division} · ${applicant.team}`} />
                      <ReviewItem label="직책" value={applicant.position} />
                      <ReviewItem label="연락처" value={`${applicant.mobile}${applicant.extension ? ` / 내선 ${applicant.extension}` : ''}`} />
                      <ReviewItem label="메일" value={applicant.email} />
                    </dl>
                  </div>
                ))}
                {submissionError && (
                  <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {submissionError}
                  </p>
                )}
              </div>

              <DialogFooter className="m-0 rounded-b-2xl px-6 py-4 sm:px-8">
                <Button type="button" variant="outline" onClick={downloadCsv} className="h-10 rounded-xl">
                  <Download />
                  CSV 내려받기
                </Button>
                <Button type="button" onClick={submitApplication} disabled={submitting} className="h-10 rounded-xl bg-[#102642] px-5">
                  {submitting ? <LoaderCircle className="animate-spin" /> : <Check />}
                  {submitting ? '접수 중...' : '최종 신청'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Step({ number, label, active = false }: { number: string; label: string; active?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${active ? 'text-[#102642]' : 'text-slate-400'}`}>
      <span className={`grid size-7 place-items-center rounded-full text-xs font-extrabold ${active ? 'bg-[#102642] text-white' : 'border border-slate-300 bg-white'}`}>
        {active ? <Check className="size-3.5" /> : number}
      </span>
      <span className={`hidden text-xs sm:block ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    </li>
  );
}

function ApplicantField({
  applicant,
  field,
  label,
  placeholder,
  onUpdate,
  type = 'text',
  uppercase = false,
  required = true,
}: {
  applicant: Applicant;
  field: keyof Applicant;
  label: string;
  placeholder: string;
  onUpdate: (id: string, field: keyof Applicant, value: string) => void;
  type?: string;
  uppercase?: boolean;
  required?: boolean;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={`${applicant.id}-${field}`} className="text-[13px] font-bold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </FieldLabel>
      <Input
        id={`${applicant.id}-${field}`}
        type={type}
        value={applicant[field]}
        onChange={(event) => onUpdate(applicant.id, field, uppercase ? event.target.value.toUpperCase() : event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 rounded-xl border-slate-200 bg-white px-3.5 text-[15px] shadow-none focus-visible:border-[#102642] focus-visible:ring-[#102642]/10"
      />
    </Field>
  );
}

function BusinessCard({ applicant }: { applicant: Applicant }) {
  return (
    <div className="relative aspect-[553/342] w-full overflow-hidden bg-white text-black shadow-[0_20px_45px_rgba(0,0,0,0.22)] [container-type:inline-size]">
      <Image
        src="/misto-card-template.png"
        alt="미스토코리아 명함 디자인"
        fill
        priority
        sizes="(min-width: 1280px) 464px, 90vw"
        className="object-cover"
      />

      <div className="absolute left-[4.8%] top-[8.8%] z-10 h-[23%] w-[37%] bg-white px-[2.5%] py-[1.8%]">
        <p className="truncate font-bold leading-[1.08] tracking-[-0.055em] text-black [font-size:4.8cqw]">
          {applicant.nameKo || '이름'}
        </p>
        <p className="mt-[2.3%] truncate font-medium leading-none tracking-[-0.025em] text-black [font-size:2.65cqw]">
          {applicant.nameEn || 'English Name'}
        </p>
      </div>

      <div className="absolute left-[50.2%] top-[11.3%] z-10 h-[23%] w-[43.2%] bg-white px-[1.1%] py-[0.7%] font-medium leading-[1.18] text-black [font-size:2.62cqw]">
        <p className="truncate">{applicant.division || '사업부 / 실 이름'}</p>
        <p className="truncate">{applicant.team || 'Team Name'}</p>
        <p className="truncate">{applicant.position || '팀장 / 팀원'}</p>
      </div>

      <div className="absolute left-[50.2%] top-[47.2%] z-10 h-[24%] w-[43.2%] bg-white px-[1.1%] py-[1%] font-medium leading-[1.2] text-black [font-size:2.58cqw]">
        <p className="truncate">{applicant.email || 'name@mistobrand.com'}</p>
        <p className="truncate">{formatMobile(applicant.mobile)}</p>
        {applicant.extension && (
          <p className="truncate">T. +82 2 2015 {applicant.extension}</p>
        )}
      </div>
    </div>
  );
}

function formatMobile(value: string) {
  if (!value) return '휴대폰번호';
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('010') && digits.length === 11) {
    return `+82 10 ${digits.slice(3, 7)} ${digits.slice(7)}`;
  }
  return value;
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-400">{label}</dt>
      <dd className="mt-0.5 break-words font-medium text-slate-700">{value}</dd>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/90 bg-white/80 px-3 py-3.5 text-center shadow-sm backdrop-blur">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-extrabold tracking-[-0.02em] text-[#102642]">{value}</p>
    </div>
  );
}
