import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_80%_10%,rgba(236,72,153,0.1),transparent_28%),#f2f4f7] px-5">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-white bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <div className="bg-[#102642] px-7 py-6 text-white">
          <div className="mb-5 grid size-10 place-items-center rounded-xl bg-white/10 text-sm font-black">BC</div>
          <p className="text-xs font-bold tracking-[0.12em] text-slate-400">MISTO WORKPLACE</p>
          <h1 className="mt-1 text-2xl font-black tracking-[-0.04em]">관리자 로그인</h1>
        </div>
        <form action="/api/admin/login" method="post" className="space-y-5 p-7">
          <div>
            <label htmlFor="email" className="text-sm font-bold text-slate-700">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="kenneth.shin@mistobrand.com"
              autoComplete="username"
              required
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#102642] focus:ring-3 focus:ring-slate-900/10"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-bold text-slate-700">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-[#102642] focus:ring-3 focus:ring-slate-900/10"
            />
          </div>
          {params.error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              이메일 또는 비밀번호가 올바르지 않습니다.
            </p>
          )}
          <button type="submit" className="h-11 w-full rounded-xl bg-[#102642] text-sm font-bold text-white transition hover:bg-[#173553]">
            로그인
          </button>
          <Link href="/" className="block text-center text-xs font-semibold text-slate-400 hover:text-slate-700">신청 화면으로 돌아가기</Link>
        </form>
      </div>
    </main>
  );
}
