import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { describe, expect, it } from 'vitest';
import { sgLocalSecondment } from './sg-local-secondment';

/** End-to-end: real template module + real tokenised .docx, rendered with a fresh fake employee. */
function renderText(data: Record<string, string>): string {
  const buf = readFileSync(
    join(process.cwd(), 'public/templates/sg-local-secondment.tokenised.docx'),
  );
  const doc = new Docxtemplater(new PizZip(buf), {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{', end: '}' },
  });
  doc.render(data);
  const out = doc.getZip().generate({ type: 'nodebuffer' });
  const xml = new PizZip(out).file('word/document.xml')!.asText();
  return (xml.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [])
    .map((t) => t.replace(/<[^>]+>/g, ''))
    .join('')
    .replace(/&amp;/g, '&');
}

const form = {
  letterDate: '2026-07-01',
  name: 'Jane Tan Li Hua',
  address: '12 Marina Blvd\n#10-01\nSingapore 018980',
  client: 'Chanel Singapore Pte Ltd',
  designation: 'Beauty Advisor',
  salaryFigure: '3,500',
  salaryWords: 'Three Thousand and Five Hundred', // UI auto-fills this from the figure
  startDate: '2026-08-01',
  endDate: '2027-07-31',
  annualLeave: '14',
  nric: 'S1234567D',
};

describe('SG Local Secondment — end-to-end render', () => {
  const text = renderText(sgLocalSecondment.tokens(form));

  it('no unresolved {tokens} remain', () => {
    expect(text).not.toMatch(/\{[a-zA-Z]+\}/);
  });
  it('strips the original Estée Lauder sample values', () => {
    expect(text).not.toContain('Estee Lauder');
    expect(text).not.toContain('Marketing Executive');
  });
  it('injects the new client + designation', () => {
    expect(text).toContain('Chanel Singapore Pte Ltd');
    expect(text).toContain('Beauty Advisor');
  });
  it('formats dates as ordinals', () => {
    expect(text).toContain('1st August 2026');
    expect(text).toContain('31st July 2027');
    expect(text).toContain('1st July 2026'); // letter date
  });
  it('salary figure + auto words', () => {
    expect(text).toContain('S$3,500');
    expect(text).toContain('Three Thousand and Five Hundred');
  });
  it('annual leave injected', () => {
    expect(text).toContain('14 working days');
  });
  it('header shows full name + address (not the placeholder labels)', () => {
    expect(text).toContain('Jane Tan Li Hua'); // header name + salutation
    expect(text).toContain('Marina Blvd'); // header address
    expect(text).not.toContain('Full Name');
  });
  it('validate passes for this form', () => {
    expect(sgLocalSecondment.validate(form)).toHaveLength(0);
  });
});
