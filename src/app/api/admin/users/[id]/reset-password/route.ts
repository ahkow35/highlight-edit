import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/auth';
import { tempPassword } from '@/lib/temp-password';

/** Admin-initiated password reset: set a new temp password for a user (no email needed). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const caller = await getSessionUser();
  if (!caller || caller.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const password = tempPassword();
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ tempPassword: password });
}
