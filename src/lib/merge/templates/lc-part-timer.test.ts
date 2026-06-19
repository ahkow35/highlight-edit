import { describe, expect, it } from 'vitest';
import { lcPartTimer } from './lc-part-timer';

// Ported from CoWork/Employment Contract/contract-merge.test.js
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

describe('lcPartTimer.tokens', () => {
  const t = lcPartTimer.tokens(sarah);
  it('rate -> "15.00"', () => expect(t.rate).toBe('15.00'));
  it('threshold -> "8"', () => expect(t.threshold).toBe('8'));
  it('salutation -> "Sarah" (operator-set, not derived)', () => expect(t.salutation).toBe('Sarah'));
  it('duration', () => expect(t.duration).toBe('5th May 2026 – 31st May 2026'));
});

describe('lcPartTimer.fileName', () => {
  it('matches the LC convention', () =>
    expect(lcPartTimer.fileName(sarah)).toBe(
      'LC Part Timer - Sarah Binti Johan Shah (5 May 2026 - 31 May 2026).docx',
    ));
});

describe('lcPartTimer.validate', () => {
  const base = { name: 'A', salutation: 'A', address: 'B', jobTitle: 'C', client: 'D', startDate: '2026-05-05', endDate: '2026-05-31', rate: '15', threshold: '8' };
  it('valid form -> no errors', () => expect(lcPartTimer.validate(base)).toHaveLength(0));
  it('end before start -> error', () =>
    expect(lcPartTimer.validate({ ...base, startDate: '2026-05-31', endDate: '2026-05-05' }).some((e) => /End date/.test(e))).toBe(true));
  it('bad rate -> error', () =>
    expect(lcPartTimer.validate({ ...base, rate: 'x' }).some((e) => /rate/.test(e))).toBe(true));
});
