import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { describe, expect, it } from 'vitest';
import { tokeniseHighlights } from './highlight-tokenise';

const fixture = readFileSync(join(process.cwd(), 'src/lib/merge/__fixtures__/highlighted.docx'));

function textOf(buf: ArrayBuffer | Buffer): string {
  const xml = new PizZip(buf).file('word/document.xml')!.asText();
  return (xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
    .map((t) => t.replace(/<[^>]+>/g, '')).join('').replace(/&amp;/g, '&');
}

describe('tokeniseHighlights', () => {
  it('detects one field per yellow highlight, with labels', async () => {
    const { fields } = tokeniseHighlights(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength));
    expect(fields.map((f) => f.label)).toEqual(['Employee Name', 'Job Title', '4000']);
    expect(fields.map((f) => f.id)).toEqual(['field_1', 'field_2', 'field_3']);
  });

  it('produces a tokenised docx that fills and strips highlights', async () => {
    const { blob } = tokeniseHighlights(fixture.buffer.slice(fixture.byteOffset, fixture.byteOffset + fixture.byteLength));
    const buf = Buffer.from(await blob.arrayBuffer());

    // tokens present, highlights gone
    const tokenXml = new PizZip(buf).file('word/document.xml')!.asText();
    expect(tokenXml).toContain('{field_1}');
    expect(tokenXml).not.toMatch(/<w:highlight\b/);

    // renders with values
    const doc = new Docxtemplater(new PizZip(buf), { paragraphLoop: true, linebreaks: true, delimiters: { start: '{', end: '}' } });
    doc.render({ field_1: 'Jane Tan', field_2: 'Beauty Advisor', field_3: '3500' });
    const out = doc.getZip().generate({ type: 'nodebuffer' });
    const text = textOf(out);
    expect(text).toContain('Dear Jane Tan,');
    expect(text).toContain('Beauty Advisor');
    expect(text).toContain('S$3500');
    expect(text).not.toMatch(/\{field_\d\}/);
  });
});
