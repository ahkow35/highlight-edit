import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { describe, expect, it } from 'vitest';
import { sgNonLocalSecondment } from './sg-non-local-secondment';

/** End-to-end: real module + real tokenised .docx, rendered with a fresh fake employee. */
function renderText(data: Record<string, string | boolean>): string {
  const buf = readFileSync(
    join(process.cwd(), 'public/templates/sg-non-local-secondment.tokenised.docx'),
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

const base = {
  letterDate: '2026-07-01',
  name: 'Aisha Binte Rahman',
  address: '5 Orchard Turn\n#12-34\nSingapore 238801',
  client: 'Christian Louboutin Singapore Pte Ltd',
  designation: 'Beauty Consultant',
  salaryFigure: '2,800',
  salaryWords: 'Two Thousand Eight Hundred',
  startDate: '2026-08-01',
  endDate: '2027-07-31',
  annualLeave: '13',
  nric: 'S1234567D',
};

describe('SG Non-Local Secondment — end-to-end render', () => {
  describe('all optional clauses OFF', () => {
    const text = renderText(sgNonLocalSecondment.tokens({ ...base }));

    it('no unresolved {tokens} remain', () => {
      expect(text).not.toMatch(/\{[#/]?[a-zA-Z]+\}/);
    });
    it('strips the original Louboutin/Client-Advisor sample values', () => {
      expect(text).not.toContain('Client Advisor'); // sample designation
      expect(text).not.toContain('2,650'); // sample basic salary
    });
    it('injects client, designation, salary', () => {
      expect(text).toContain('Christian Louboutin Singapore Pte Ltd');
      expect(text).toContain('Beauty Consultant');
      expect(text).toContain('S$2,800');
      expect(text).toContain('Two Thousand Eight Hundred');
    });
    it('header shows full name + address (not the placeholder labels)', () => {
      expect(text).toContain('Aisha Binte Rahman');
      expect(text).toContain('Orchard Turn');
      expect(text).not.toContain('Full Name');
    });
    it('formats dates + leave', () => {
      expect(text).toContain('1st August 2026');
      expect(text).toContain('31st July 2027');
      expect(text).toContain('13 working days');
    });
    it('omits every optional clause (travel, commission scheme, guarantee, bonus)', () => {
      expect(text).not.toContain('travel allowance');
      expect(text).not.toContain('Sales Commission Scheme');
      expect(text).not.toContain('guaranteed commission');
      expect(text).not.toContain('discretionary bonus');
    });
    it('validate passes for the OFF form', () => {
      expect(sgNonLocalSecondment.validate({ ...base })).toHaveLength(0);
    });
  });

  describe('all optional clauses ON', () => {
    const form = {
      ...base,
      hasTravelAllowance: '1',
      travelFigure: '200',
      travelWords: 'Two Hundred',
      hasCommissionScheme: '1',
      hasGuaranteedCommission: '1',
      guaranteedFigure: '800',
      hasDiscretionaryBonus: '1',
      bonusDate: '30 September',
    };
    const text = renderText(sgNonLocalSecondment.tokens(form));

    it('no unresolved {tokens} remain', () => {
      expect(text).not.toMatch(/\{[#/]?[a-zA-Z]+\}/);
    });
    it('includes the travel-allowance clause with the entered values', () => {
      expect(text).toContain('travel allowance');
      expect(text).toContain('S$200');
      expect(text).toContain('Two Hundred');
    });
    it('includes the commission scheme + guaranteed-commission clause', () => {
      expect(text).toContain('Sales Commission Scheme');
      expect(text).toContain('guaranteed commission');
      expect(text).toContain('S$800');
    });
    it('includes the discretionary-bonus clause with the entered date', () => {
      expect(text).toContain('discretionary bonus');
      expect(text).toContain('30 September');
    });
    it('validate passes for the ON form', () => {
      expect(sgNonLocalSecondment.validate(form)).toHaveLength(0);
    });
  });

  describe('commission scheme gating', () => {
    it('scheme on, guarantee off: scheme text present, no guaranteed-commission clause', () => {
      const text = renderText(sgNonLocalSecondment.tokens({ ...base, hasCommissionScheme: '1' }));
      expect(text).toContain('Sales Commission Scheme');
      expect(text).not.toContain('guaranteed commission');
    });
    it('scheme off suppresses the guarantee even if its flag lingers', () => {
      const text = renderText(
        sgNonLocalSecondment.tokens({ ...base, hasGuaranteedCommission: '1', guaranteedFigure: '800' }),
      );
      expect(text).not.toContain('Sales Commission Scheme');
      expect(text).not.toContain('guaranteed commission');
    });
  });

  describe('conditional validation', () => {
    it('flags a missing travel figure only when the toggle is on', () => {
      const errs = sgNonLocalSecondment.validate({ ...base, hasTravelAllowance: '1' });
      expect(errs.some((e) => /travel allowance must be/i.test(e))).toBe(true);
    });
    it('does not flag the guarantee figure when the scheme is off', () => {
      const errs = sgNonLocalSecondment.validate({ ...base, hasGuaranteedCommission: '1' });
      expect(errs.some((e) => /guaranteed commission must be/i.test(e))).toBe(false);
    });
  });
});
