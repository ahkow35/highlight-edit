import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/supabase/auth';
import { createDynamicTemplate, listDynamicTemplates } from '@/lib/templates-db';
import type { FieldDef, FieldType } from '@/lib/merge/types';

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const rows = await listDynamicTemplates();
  return NextResponse.json({
    templates: rows.map((r) => ({
      id: r.id, title: r.title, jurisdiction: r.jurisdiction,
      fieldCount: (r.fields ?? []).length, ocr: r.ocr, created_at: r.created_at,
    })),
  });
}

const FIELD_TYPES: FieldType[] = ['text', 'textarea', 'date', 'nric', 'currency', 'number', 'select'];

function sanitizeFields(input: unknown): FieldDef[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 100).map((f, i) => {
    const o = (f ?? {}) as Record<string, unknown>;
    const type = FIELD_TYPES.includes(o.type as FieldType) ? (o.type as FieldType) : 'text';
    return {
      id: String(o.id ?? `field_${i + 1}`).slice(0, 60),
      label: String(o.label ?? `Field ${i + 1}`).slice(0, 120),
      type,
      required: o.required !== false,
      ocrSource: o.ocrSource === 'name' || o.ocrSource === 'nric' || o.ocrSource === 'address' ? o.ocrSource : undefined,
    } as FieldDef;
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const title = String(body.title ?? '').trim();
  const jurisdiction = ['SG', 'MY', 'NONE'].includes(body.jurisdiction) ? body.jurisdiction : 'NONE';
  const fields = sanitizeFields(body.fields);
  const docx_b64 = String(body.docxBase64 ?? '');
  const ocr = body.ocr === true;
  const filename_pattern = body.filenamePattern ? String(body.filenamePattern).slice(0, 200) : null;

  if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
  if (!fields.length) return NextResponse.json({ error: 'No highlighted fields were detected.' }, { status: 400 });
  if (!docx_b64) return NextResponse.json({ error: 'Missing document.' }, { status: 400 });
  if (docx_b64.length > 8_000_000) return NextResponse.json({ error: 'Document too large (max ~6MB).' }, { status: 400 });

  const { id, error } = await createDynamicTemplate({
    title, jurisdiction, fields, docx_b64, ocr, filename_pattern, created_by: user.id,
  });
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ id });
}
