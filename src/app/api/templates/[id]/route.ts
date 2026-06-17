import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/auth';
import { getDynamicTemplate } from '@/lib/templates-db';

/** Full template row (incl. base64 .docx) for filling. Any signed-in user. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const row = await getDynamicTemplate(id);
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(row);
}
