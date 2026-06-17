import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/auth';
import { deleteDynamicTemplate } from '@/lib/templates-db';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const { id } = await params;
  const { error } = await deleteDynamicTemplate(id);
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
