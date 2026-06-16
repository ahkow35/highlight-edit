import Link from 'next/link';
import { getSessionUser } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { SignOutButton } from './SignOutButton';

export async function AppHeader() {
  const user = isSupabaseConfigured ? await getSessionUser() : null;
  return (
    <header className="border-b border-zinc-200">
      <div className="mx-auto max-w-3xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-block w-1.5 h-5 bg-yellow-400 rounded-sm" />
          Contract Manager
        </Link>
        {isSupabaseConfigured ? (
          user ? <SignOutButton email={user.email} /> : <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">Sign in</Link>
        ) : (
          <span className="text-xs rounded bg-yellow-50 text-yellow-800 border border-yellow-200 px-2 py-1">
            dev mode · auth off
          </span>
        )}
      </div>
    </header>
  );
}
