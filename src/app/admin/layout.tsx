import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { getSessionUser } from '@/lib/supabase/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin-only when auth is on. In dev mode (no Supabase env) the area is open for local work.
  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (!user) redirect('/login');
    if (user.role !== 'admin') redirect('/');
  }
  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl w-full px-4 py-10">
        <nav className="mb-6 flex gap-4 text-sm">
          <Link href="/admin/templates" className="text-zinc-700 hover:text-zinc-900">Documents</Link>
          <Link href="/admin/users" className="text-zinc-700 hover:text-zinc-900">Users</Link>
          <Link href="/admin/usage" className="text-zinc-700 hover:text-zinc-900">Usage</Link>
          <Link href="/" className="text-zinc-400 hover:text-zinc-700">← App</Link>
        </nav>
        {children}
      </main>
    </>
  );
}
