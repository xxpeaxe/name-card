import { NextResponse } from 'next/server';

import { isAdminEmail } from '@/lib/admin-auth';
import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const form = await request.formData();
  const emailValue = form.get('email');
  const passwordValue = form.get('password');
  const email = typeof emailValue === 'string' ? emailValue.trim() : '';
  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const errorUrl = new URL('/admin/login?error=1', request.url);

  if (!isAdminEmail(email) || !password) {
    return NextResponse.redirect(errorUrl, 303);
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !isAdminEmail(data.user?.email)) {
      await supabase.auth.signOut();
      return NextResponse.redirect(errorUrl, 303);
    }

    return NextResponse.redirect(new URL('/admin', request.url), 303);
  } catch {
    return NextResponse.redirect(
      new URL('/admin/login?error=config', request.url),
      303,
    );
  }
}
