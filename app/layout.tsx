import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '임직원 명함 신청',
  description: '임직원 명함 간편 신청 서비스',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
