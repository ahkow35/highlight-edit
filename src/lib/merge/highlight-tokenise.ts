/* Browser port of the old highlight→form engine. Takes a .docx whose blanks are YELLOW-highlighted,
 * replaces each highlighted run with a {field_N} token (highlight stripped), and returns the tokenised
 * .docx plus the detected field list. Runs entirely client-side (pizzip). Each highlighted run = one
 * field — if a blank is split across runs, re-highlight it cleanly in one pass. */

import PizZip from 'pizzip';
import type { FieldDef } from './types';

const HIGHLIGHT_RE = /<w:highlight\s+w:val="[a-zA-Z]+"\s*\/>/g;
const YELLOW_RE = /<w:highlight\s+w:val="(?:yellow|darkYellow)"\s*\/>/;

export interface TokeniseResult {
  /** Tokenised blank .docx (highlights replaced by {field_N}, highlight formatting removed). */
  blob: Blob;
  /** One field per highlighted run, in document order. */
  fields: FieldDef[];
}

function runText(run: string): string {
  return (run.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
    .map((t) => t.replace(/<[^>]+>/g, ''))
    .join('')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

function cleanLabel(text: string, n: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  if (!t) return `Field ${n}`;
  return t.length > 60 ? t.slice(0, 57) + '…' : t;
}

export function tokeniseHighlights(bytes: ArrayBuffer): TokeniseResult {
  const zip = new PizZip(bytes);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('That file is not a valid .docx (no document.xml).');

  let xml = docFile.asText();
  const fields: FieldDef[] = [];
  let n = 0;

  xml = xml.replace(/<w:r\b[^>]*>[\s\S]*?<\/w:r>/g, (run) => {
    if (!YELLOW_RE.test(run)) return run;
    n += 1;
    const id = `field_${n}`;
    fields.push({ id, label: cleanLabel(runText(run), n), type: 'text', required: true });

    // Strip highlight formatting, then replace the run's text with the token (drop extra <w:t>).
    let out = run.replace(HIGHLIGHT_RE, '');
    let replaced = false;
    out = out.replace(/<w:t[^>]*>[\s\S]*?<\/w:t>/g, () => {
      if (replaced) return '';
      replaced = true;
      return `<w:t xml:space="preserve">{${id}}</w:t>`;
    });
    // Run had a highlight but no text node — inject one so the token renders.
    if (!replaced) {
      out = out.replace(/(<\/w:rPr>)/, `$1<w:t xml:space="preserve">{${id}}</w:t>`);
    }
    return out;
  });

  zip.file('word/document.xml', xml);
  const blob = zip.generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }) as Blob;

  return { blob, fields };
}
