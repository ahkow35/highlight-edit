import 'server-only';
import { createAdminClient, hasServiceRole } from './supabase/admin';
import { getTemplate } from './merge/registry';
import type { FieldDef } from './merge/types';

export interface TemplateRow {
  id: string;
  title: string;
  jurisdiction: string;
  fields: FieldDef[];
  ocr: boolean;
  filename_pattern: string | null;
  docx_b64?: string;
  created_at?: string;
}

/** Light list for the template picker (no docx bytes). Empty if Supabase isn't configured. */
export async function listDynamicTemplates(): Promise<TemplateRow[]> {
  if (!hasServiceRole) return [];
  const { data, error } = await createAdminClient()
    .from('templates')
    .select('id,title,jurisdiction,fields,ocr,filename_pattern,created_at')
    .order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []) as TemplateRow[];
}

/** Full row incl. the base64 .docx, for filling. */
export async function getDynamicTemplate(id: string): Promise<TemplateRow | null> {
  if (!hasServiceRole) return null;
  const { data, error } = await createAdminClient()
    .from('templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as TemplateRow;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'template';
}

export interface NewTemplate {
  title: string;
  jurisdiction: string;
  fields: FieldDef[];
  docx_b64: string;
  ocr: boolean;
  filename_pattern: string | null;
  created_by: string | null;
}

export async function createDynamicTemplate(t: NewTemplate): Promise<{ id?: string; error?: string }> {
  if (!hasServiceRole) return { error: 'Server not configured.' };
  const admin = createAdminClient();
  const base = slugify(t.title);
  // avoid clashing with static template ids or existing rows
  let id = base;
  let attempt = 0;
  while (getTemplate(id) || (await admin.from('templates').select('id').eq('id', id).maybeSingle()).data) {
    attempt += 1;
    id = `${base}-${attempt + 1}`;
    if (attempt > 50) return { error: 'Could not allocate a unique id.' };
  }
  const { error } = await admin.from('templates').insert({
    id,
    title: t.title,
    jurisdiction: t.jurisdiction,
    fields: t.fields,
    docx_b64: t.docx_b64,
    ocr: t.ocr,
    filename_pattern: t.filename_pattern,
    created_by: t.created_by,
  });
  if (error) return { error: error.message };
  return { id };
}

export async function deleteDynamicTemplate(id: string): Promise<{ error?: string }> {
  if (!hasServiceRole) return { error: 'Server not configured.' };
  const { error } = await createAdminClient().from('templates').delete().eq('id', id);
  return error ? { error: error.message } : {};
}
