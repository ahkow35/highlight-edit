import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { describe, expect, it } from 'vitest';
import { lcPartTimer } from './lc-part-timer';

/** End-to-end: real module + reconstructed tokenised .docx, rendered with Sarah's data. */
function renderText(data: Record<string, string | boolean>): string {
  const buf = readFileSync(join(process.cwd(), 'public/templates/lc-part-timer-my.docx'));
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

const sarah = {
  letterDate: '2026-04-28',
  name: 'Sarah Binti Johan Shah',
  salutation: 'Sarah',
  address: 'No 10, Jalan Saujana 2\nTaman Ampang Saujana\nHulu Langat\n68000 Selangor',
  jobTitle: 'Seasonal Part Time Assistant',
  client: 'Jimmy Choo, Pavilion Kuala Lumpur',
  startDate: '2026-05-05',
  endDate: '2026-05-31',
  rate: '15',
  threshold: '8',
  nric: '',
};

describe('LC Malaysia Part-Timer — end-to-end render', () => {
  const text = renderText(lcPartTimer.tokens(sarah));

  it('no unresolved {tokens} remain', () => {
    expect(text).not.toMatch(/\{[#/]?[a-zA-Z]+\}/);
  });
  it('header: letter date, name, salutation, client, job title', () => {
    expect(text).toContain('28th April 2026');
    expect(text).toContain('Sarah Binti Johan Shah');
    expect(text).toContain('Dear Sarah,');
    expect(text).toContain('as a Seasonal Part Time Assistant');
    expect(text).toContain('assigned exclusively to Jimmy Choo, Pavilion Kuala Lumpur');
  });
  it('duration, rate, OT threshold', () => {
    expect(text).toContain('5th May 2026 – 31st May 2026');
    expect(text).toContain('RM15.00 per hour');
    expect(text).toContain('more than 8 hours a day');
    expect(text).toContain('in excess of 8 hours');
  });
  it('keeps the fixed LC boilerplate (PDPA 2010, signatory, OT table)', () => {
    expect(text).toContain('Personal Data Protection Act (2010)');
    expect(text).toContain('Irene Law (Ms)');
    expect(text).toContain('Public Holiday (After Normal Hours)');
    expect(text).toContain('EPF, SOCSO & EIS');
  });
  it('addresses a surname-first name correctly via the salutation field', () => {
    const chen = renderText(
      lcPartTimer.tokens({ ...sarah, name: 'Chen Mei Jun', salutation: 'Mei Jun' }),
    );
    expect(chen).toContain('Dear Mei Jun,'); // not "Dear Chen,"
  });
  it('validate passes for Sarah', () => {
    expect(lcPartTimer.validate(sarah)).toHaveLength(0);
  });
});
