# MISTO 임직원 명함 신청

임직원이 명함 정보를 입력하고 시안을 확인한 뒤 신청하는 내부 업무 사이트입니다. 신청 내용은 Supabase에 저장되고, 관리자는 로그인 후 신청 내역을 조회하거나 CSV로 내려받을 수 있습니다.

## Supabase 준비

1. Supabase 대시보드의 **SQL Editor**에서 `supabase/schema.sql`을 실행합니다.
2. **Authentication → Users**에서 관리자 이메일 계정을 생성합니다.
3. 관리자 비밀번호는 Supabase에서 설정하고 코드나 GitHub에 저장하지 않습니다.

## 환경변수

`.env.example`을 기준으로 로컬 `.env`와 Vercel의 Project Settings → Environment Variables에 값을 등록합니다.

- `ADMIN_EMAILS`: 관리자 이메일. 여러 명이면 쉼표로 구분
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase Publishable key
- `SUPABASE_SECRET_KEY`: Supabase Secret key. 서버 환경변수에만 저장
- `EMAIL_TO`: 신청 내용을 수신할 담당자 이메일
- `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`: EmailJS 설정

## 실행 및 배포

```bash
npm install
npm run dev
npm run build
```

GitHub 저장소를 Vercel에 Import하고 위 환경변수를 Production, Preview, Development에 등록하면 자동 배포됩니다.
