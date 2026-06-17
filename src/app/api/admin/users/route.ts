import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/auth';
import { tempPassword } from '@/lib/temp-password';

async function requireAdmin() {
  const u = await getSessionUser();
  return u && u.role === 'admin' ? u : null;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const users = data.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: u.app_metadata?.role === 'admin' ? 'admin' : 'staff',
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at ?? null,
  }));
  return NextResponse.json({ users });
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const role = body.role === 'admin' ? 'admin' : 'staff';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required.' }, { status: 400 });
  }
  const password = tempPassword();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Return the temp password ONCE so the admin can hand it to the new user (they can reset later).
  return NextResponse.json({ user: { id: data.user.id, email, role }, tempPassword: password });
}
