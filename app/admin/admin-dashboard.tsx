'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  MailCheck,
  Search,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type AdminRecord = {
  batchId: string;
  receiptNumber: string;
  createdAt: string;
  status: string;
  emailStatus: string;
  nameKo: string;
  nameEn: string;
  position: string;
  division: string;
  team: string;
  extension: string;
  mobile: string;
  email: string;
};

export function AdminDashboard({
  records,
  currentEmail,
  dataReady,
}: {
  records: AdminRecord[];
  currentEmail: string;
  dataReady: boolean;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return records;
    return records.filter((record) =>
      [
        record.receiptNumber,
        record.nameKo,
        record.nameEn,
        record.division,
        record.team,
        record.email,
        record.mobile,
      ].some((value) => value.toLowerCase().includes(keyword)),
    );
  }, [query, records]);

  const batchCount = new Set(records.map((record) => record.batchId)).size;
  const emailedCount = new Set(
    records
      .filter((record) => record.emailStatus === 'sent')
      .map((record) => record.batchId),
  ).size;

  function downloadCsv() {
    const headings = [
      '접수번호',
      '접수일시',
      '메일상태',
      '이름',
      '영어 이름',
      '직책',
      '사업부/실 이름',
      '팀 이름',
      '사내번호',
      '휴대폰번호',
      '메일주소',
    ];
    const rows = filtered.map((record) => [
      record.receiptNumber,
      formatDate(record.createdAt),
      emailStatusLabel(record.emailStatus),
      record.nameKo,
      record.nameEn,
      record.position,
      record.division,
      record.team,
      record.extension,
      record.mobile,
      record.email,
    ]);
    const csv = [headings, ...rows]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `명함신청_관리자내역_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-17 max-w-[1500px] items-center justify-between px-5 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-[#102642] text-sm font-black text-white">BC</div>
            <div>
              <p className="text-sm font-extrabold text-[#102642]">명함 신청 관리자</p>
              <p className="text-[10px] font-medium tracking-[0.1em] text-slate-400">MISTO WORKPLACE</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-semibold text-slate-400 sm:block">{currentEmail}</span>
            <form action="/api/admin/logout" method="post">
              <button type="submit" className="hidden h-9 items-center rounded-xl px-3 text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-slate-700 sm:inline-flex">
                로그아웃
              </button>
            </form>
            <Link href="/" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 hover:bg-slate-50">
              <ArrowLeft className="size-3.5" />
              신청 화면
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-5 py-8 lg:px-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-extrabold tracking-[0.12em] text-slate-400">ADMIN DASHBOARD</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.05em] text-[#102642]">명함 신청 내역</h1>
            <p className="mt-2 text-sm text-slate-500">접수된 임직원 명함과 담당자 메일 발송 상태를 확인합니다.</p>
          </div>
          <Button type="button" onClick={downloadCsv} disabled={!filtered.length} className="h-10 rounded-xl bg-[#102642] px-4">
            <Download />
            현재 내역 CSV
          </Button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          <Metric icon={CheckCircle2} label="총 접수" value={`${batchCount}건`} tone="navy" />
          <Metric icon={Users} label="신청 인원" value={`${records.length}명`} tone="lime" />
          <Metric icon={MailCheck} label="메일 발송 완료" value={`${emailedCount}건`} tone="blue" />
        </div>

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-extrabold text-[#102642]">전체 신청자</p>
              <p className="mt-0.5 text-xs text-slate-400">검색 결과 {filtered.length}명</p>
            </div>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 팀, 메일, 접수번호 검색" className="h-10 rounded-xl border-slate-200 pl-9" />
            </div>
          </div>

          {!dataReady ? (
            <div className="p-10 text-center">
              <p className="font-bold text-slate-700">데이터 저장소 연결을 준비 중입니다.</p>
              <p className="mt-1 text-sm text-slate-400">배포 설정이 완료되면 신청 내역이 이곳에 표시됩니다.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-400">표시할 신청 내역이 없습니다.</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="pl-5">접수번호 / 일시</TableHead>
                  <TableHead>신청자</TableHead>
                  <TableHead>조직 / 직책</TableHead>
                  <TableHead>연락처</TableHead>
                  <TableHead>메일 발송</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((record, index) => (
                  <TableRow key={`${record.batchId}-${record.email}-${index}`}>
                    <TableCell className="pl-5">
                      <p className="font-mono text-xs font-bold text-[#102642]">{record.receiptNumber}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{formatDate(record.createdAt)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-slate-800">{record.nameKo}</p>
                      <p className="text-[11px] text-slate-400">{record.nameEn}</p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-64 truncate text-xs font-semibold text-slate-700">{record.division} · {record.team}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{record.position}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-slate-700">{record.mobile}</p>
                      <p className="mt-1 text-[11px] text-slate-400">{record.extension ? `내선 ${record.extension} · ` : ''}{record.email}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.emailStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone: 'navy' | 'lime' | 'blue' }) {
  const colors = {
    navy: 'bg-[#102642] text-white',
    lime: 'bg-lime-100 text-lime-900',
    blue: 'bg-blue-100 text-blue-900',
  };
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white bg-white p-5 shadow-sm">
      <span className={`grid size-11 place-items-center rounded-xl ${colors[tone]}`}><Icon className="size-5" /></span>
      <div><p className="text-xs font-semibold text-slate-400">{label}</p><p className="mt-0.5 text-2xl font-black tracking-[-0.04em] text-[#102642]">{value}</p></div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const sent = status === 'sent';
  const failed = status === 'failed';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${sent ? 'bg-emerald-50 text-emerald-700' : failed ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
      {emailStatusLabel(status)}
    </span>
  );
}

function emailStatusLabel(status: string) {
  if (status === 'sent') return '발송 완료';
  if (status === 'failed') return '발송 실패';
  return '발송 대기';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}
