/* Unifies the two kinds of template the app fills:
 *  - STATIC: code-defined contracts in the registry (smart validation/computed tokens).
 *  - DYNAMIC: admin-uploaded highlight templates stored in the DB (generic fields).
 * Both resolve to a RuntimeTemplate the IntakeForm fills identically. Client-side. */

import { longOrdinal, parseISO } from './format';
import { getTemplate } from './registry';
import type { FieldDef, FormValues, TemplateDef, TokenMap } from './types';
import { isSgNricFormat, isValidSgNric } from './validators';

export interface RuntimeTemplate {
  id: string;
  title: string;
  jurisdiction: string;
  ocr: boolean;
  fields: FieldDef[];
  validate: (v: FormValues) => string[];
  tokens: (v: FormValues) => TokenMap;
  fileName: (v: FormValues) => string;
  getDocxBytes: () => Promise<ArrayBuffer>;
}

export interface DynamicRow {
  id: string;
  title: string;
  jurisdiction: string;
  ocr: boolean;
  fields: FieldDef[];
  docx_b64: string;
  filename_pattern?: string | null;
}

function fromStatic(t: TemplateDef): RuntimeTemplate {
  return {
    id: t.id, title: t.title, jurisdiction: t.jurisdiction, ocr: t.ocr, fields: t.fields,
    validate: t.validate, tokens: t.tokens, fileName: t.fileName,
    getDocxBytes: async () => {
      const r = await fetch(`/templates/${t.templateFile}`);
      if (!r.ok) throw new Error(`Template file not found (${r.status}).`);
      return r.arrayBuffer();
    },
  };
}

function b64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function genericValidate(fields: FieldDef[], v: FormValues): string[] {
  const errs: string[] = [];
  for (const f of fields) {
    const val = (v[f.id] ?? '').trim();
    if (f.required && !val) errs.push(`${f.label} is required.`);
    if (!val) continue;
    if (f.type === 'date' && !parseISO(val)) errs.push(`${f.label} must be a valid date.`);
    if (f.type === 'nric') {
      if (!isSgNricFormat(val)) errs.push(`${f.label}: NRIC format looks wrong (e.g. S1234567D).`);
      else if (!isValidSgNric(val)) errs.push(`${f.label}: NRIC check digit looks wrong.`);
    }
    if (f.type === 'currency' && !(parseFloat(val.replace(/[^0-9.]/g, '')) >= 0))
      errs.push(`${f.label} must be a number.`);
  }
  return errs;
}

function genericTokens(fields: FieldDef[], v: FormValues): TokenMap {
  const out: TokenMap = {};
  for (const f of fields) {
    let val = (v[f.id] ?? '').trim();
    if (f.type === 'date') val = longOrdinal(val) ?? val;
    out[f.id] = val;
  }
  return out;
}

function genericFileName(row: DynamicRow, v: FormValues): string {
  if (row.filename_pattern?.trim()) {
    const filled = row.filename_pattern.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? '').trim());
    return filled.endsWith('.docx') ? filled : `${filled}.docx`;
  }
  return `${row.title}.docx`;
}

export function fromDynamic(row: DynamicRow): RuntimeTemplate {
  return {
    id: row.id, title: row.title, jurisdiction: row.jurisdiction, ocr: row.ocr, fields: row.fields,
    validate: (v) => genericValidate(row.fields, v),
    tokens: (v) => genericTokens(row.fields, v),
    fileName: (v) => genericFileName(row, v),
    getDocxBytes: async () => b64ToArrayBuffer(row.docx_b64),
  };
}

/** Resolve a template id to a fillable RuntimeTemplate (static registry first, then DB). */
export async function resolveTemplate(id: string): Promise<RuntimeTemplate | null> {
  const s = getTemplate(id);
  if (s) return fromStatic(s);
  const r = await fetch(`/api/templates/${encodeURIComponent(id)}`);
  if (!r.ok) return null;
  return fromDynamic((await r.json()) as DynamicRow);
}
