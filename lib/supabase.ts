import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

function browserConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) {
    throw new Error('Supabase public configuration is missing.');
  }
  return { url, key };
}

export async function createSupabaseServerClient() {
  const { url, key } = browserConfig();
  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot always write refreshed cookies.
        }
      },
    },
  });
}

export function createSupabaseAdminClient() {
  const { url } = browserConfig();
  const secret = process.env.SUPABASE_SECRET_KEY?.trim();
  if (!secret) {
    throw new Error('Supabase secret key is missing.');
  }

  return createClient(url, secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
