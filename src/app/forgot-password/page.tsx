'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createRecoveryClient } from '@/lib/supabase/recovery';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    // Implicit client → the email link delivers hash tokens (no PKCE verifier needed).
    const { error } = await createRecoveryClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto flex max-w-sm flex-1 flex-col justify-center px-4">
      <div className="flex items-center gap-2 font-semibold tracking-tight">
        <span className="inline-block w-1.5 h-5 bg-yellow-400 rounded-sm" />
        Contract Manager
      </div>
      <h1 className="mt-6 text-lg font-semibold text-zinc-900">Reset your password</h1>

      {!isSupabaseConfigured ? (
        <p className="mt-3 text-sm text-zinc-500">Auth is not configured in this environment.</p>
      ) : sent ? (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          If an account exists for <strong>{email}</strong>, a reset link is on its way. Check your
          inbox (and spam) and follow the link to set a new password.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <p className="text-sm text-zinc-500">Enter your email and we’ll send a reset link.</p>
          <input
            type="email" required placeholder="you@withkinna.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={busy}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <Link href="/login" className="mt-4 text-sm text-zinc-500 hover:text-zinc-900">← Back to sign in</Link>
    </main>
  );
}
