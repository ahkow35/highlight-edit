import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { describe, expect, it } from 'vitest';
import {
  csBvlgari, csChanel, csCoach, csGivenchy, csGuerlain,
} from './contract-staff';
import type { TemplateDef } from '../types';

function renderText(file: string, data: Record<string, string | boolean>): string {
  const buf = readFileSync(join(process.cwd(), 'public/templates', file));
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

const common = {
  letterDate: '2026-07-01',
  name: 'Tan Mei Ling',
  salutation: 'Mei Ling',
  address: 'No 1 Jalan Test\nTaman Contoh\n50000 Kuala Lumpur',
  startDate: '2026-07-15',
  endDate: '2027-07-14',
  nric: '',
};

/** Every brand: tokens fully resolve, header is correct, validate passes, LC boilerplate intact. */
function sharedAssertions(tpl: TemplateDef, file: string, form: Record<string, string>) {
  const text = renderText(file, tpl.tokens(form));
  expect(text, 'no unresolved tokens').not.toMatch(/\{[#/]?[a-zA-Z]+\}/);
  expect(text).toContain('Tan Mei Ling');
  expect(text).toContain('Dear Mei Ling,');
  expect(text).toContain('Jalan Test');
  expect(text).toContain('Agensi Pekerjaan Luxury Careers Sdn. Bhd.');
  expect(text).toContain('Personal Data Protection Act (2010)');
  expect(tpl.validate(form)).toHaveLength(0);
  return text;
}

describe('MY Contract Staff — per-brand render', () => {
  it('Bvlgari: salary + 3 allowances, client + dates', () => {
    const form = {
      ...common, designation: 'Client Advisor',
      salaryFigure: '2,500', salaryWords: 'Two Thousand and Five Hundred',
      transportFigure: '200', transportWords: 'Two Hundred',
      mealFigure: '200', mealWords: 'Two Hundred',
      groomingFigure: '100', groomingWords: 'One Hundred',
    };
    const text = sharedAssertions(csBvlgari, 'my-cs-bvlgari.docx', form);
    expect(text).toContain('Bvlgari Malaysia Sdn Bhd'); // fixed brand
    expect(text).toContain('Client Advisor');
    expect(text).toContain('RM2,500');
    expect(text).toContain('as Transport Allowance');
    expect(text).toContain('as Meal Allowance');
    expect(text).toContain('as Grooming Allowance');
    expect(text).toContain('15th July 2026'); // effect + duration start
    expect(text).toContain('14th July 2027'); // duration end
  });

  it('Chanel: role in intro, en-dash duration, salary only', () => {
    const form = { ...common, designation: 'Contract Beauty Advisor', salaryFigure: '4,400' };
    const text = sharedAssertions(csChanel, 'my-cs-chanel.docx', form);
    expect(text).toContain('Chanel (Kuala Lumpur)'); // fixed brand
    expect(text).toContain('as a Contract Beauty Advisor');
    expect(text).toContain('RM 4,400 per month');
    expect(text).toContain('I, Tan Mei Ling, confirm'); // name in confirm line
  });

  it('Coach: salary + one allowance', () => {
    const form = {
      ...common, designation: 'Talent Acquisition Assistant',
      salaryFigure: '4,000', salaryWords: 'Four Thousand',
      allowanceFigure: '100', allowanceWords: 'One Hundred',
    };
    const text = sharedAssertions(csCoach, 'my-cs-coach.docx', form);
    expect(text).toContain('Coach Malaysia Sdn Bhd');
    expect(text).toContain('RM4,000');
    expect(text).toContain('RM100');
  });

  it('Givenchy: 2 allowances, open-ended (no end date), LVMH co-signatory', () => {
    const form = {
      ...common, designation: 'Beauty Advisor',
      salaryFigure: '3,000', salaryWords: 'Three Thousand',
      travelFigure: '500', travelWords: 'Five Hundred',
      groomingFigure: '100', groomingWords: 'One Hundred',
    };
    const text = sharedAssertions(csGivenchy, 'my-cs-givenchy.docx', form);
    expect(text).toContain('LVMH Fragrances Brands');
    expect(text).toContain('Yelena TAN'); // fixed client co-signatory
    expect(text).toContain('as Travelling Allowance');
    expect(text).toContain('I, Tan Mei Ling, confirm');
    // fixed-term: inserted Contract Duration clause with both dates
    expect(text).toContain('The agreed employment duration is from 15th July 2026 to 14th July 2027');
  });

  it('Guerlain: initial + post-probation salary/allowance', () => {
    const form = {
      ...common, designation: 'Beauty Consultant',
      salaryFigure: '2,000', salaryWords: 'Two Thousand',
      travelFigure: '400', travelWords: 'Four Hundred',
      postProbSalaryFigure: '2,300', postProbSalaryWords: 'Two Thousand Three Hundred',
      postProbTravelFigure: '600', postProbTravelWords: 'Six Hundred',
    };
    const text = sharedAssertions(csGuerlain, 'my-cs-guerlain.docx', form);
    expect(text).toContain('LVMH Perfumes & Cosmetics Travel Retail');
    expect(text).toContain('Post-Probation Salary Adjustment');
    expect(text).toContain('revised to RM2,300');
    expect(text).toContain('Annual Wage Supplement'); // fixed clause
    expect(text).toContain('Product Allowance'); // fixed annex clause
    // fixed-term: inserted Contract Duration clause with both dates
    expect(text).toContain('The agreed employment duration is from 15th July 2026 to 14th July 2027');
  });

  it('validate flags missing required fields', () => {
    const errs = csBvlgari.validate({ ...common, name: '' });
    expect(errs.some((e) => /name is required/i.test(e))).toBe(true);
  });
});
