import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // Clear navigation still succeeds when the remote session is unavailable.
  }
  return NextResponse.redirect(new URL('/admin/login', request.url), 303);
}
