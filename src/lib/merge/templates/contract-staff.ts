/* LC Malaysia "Contract Staff" employment contracts — monthly-salary secondments.
 * Each brand is its OWN template (they diverge in allowances, benefits, public-holiday
 * tables, and client co-signatories), so brand-specific content stays fixed in each
 * tokenised .docx and only per-employee fields are filled. A config-driven factory keeps
 * the validate/tokens logic in one place; each brand is just a field list + its .docx.
 *
 * Field-id convention drives generic behaviour:
 *   - type 'date'      -> rendered as an ordinal long date ("21st July 2025")
 *   - type 'currency'  -> rendered with thousands separators ("2,500")
 *   - id ending 'Words'-> salary/allowance in words; auto-filled in the form from the
 *                         matching '{prefix}Figure', operator-verifiable. */

import { amountToWords } from '../amount-to-words';
import { longOrdinal, longPlain, parseISO } from '../format';
import { isSgNricFormat, isValidSgNric } from '../validators';
import type { FieldDef, FormValues, TemplateDef, TokenMap } from '../types';

function fmtFigure(input: string): string {
  const n = Math.floor(Number(String(input).replace(/[^0-9.]/g, '')));
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('en-SG') : '';
}

function csValidate(fields: FieldDef[], f: FormValues): string[] {
  const errs: string[] = [];
  for (const field of fields) {
    const val = (f[field.id] ?? '').trim();
    if (field.required && !val) {
      errs.push(`${field.label} is required.`);
      continue;
    }
    if (!val) continue;
    if (field.type === 'date' && !parseISO(val)) errs.push(`${field.label} must be a valid date.`);
    if (field.type === 'currency' && !(parseFloat(val.replace(/[^0-9.]/g, '')) > 0))
      errs.push(`${field.label} must be a positive number.`);
    if (field.type === 'nric') {
      if (!isSgNricFormat(val)) errs.push(`${field.label}: format looks wrong (e.g. S1234567D).`);
      else if (!isValidSgNric(val)) errs.push(`${field.label}: check digit looks wrong.`);
    }
  }
  if (parseISO(f.startDate) && parseISO(f.endDate) && f.endDate < f.startDate)
    errs.push('End date must be on or after the start date.');
  return errs;
}

function csTokens(fields: FieldDef[], f: FormValues): TokenMap {
  const out: TokenMap = {};
  for (const field of fields) {
    const raw = (f[field.id] ?? '').trim();
    if (field.type === 'date') {
      out[field.id] = longOrdinal(raw) ?? '';
    } else if (field.type === 'currency') {
      out[field.id] = fmtFigure(raw);
    } else if (field.id.endsWith('Words')) {
      // Salary/allowance words: operator value if set, else derived from the sibling figure.
      const figId = `${field.id.slice(0, -'Words'.length)}Figure`;
      out[field.id] = raw || amountToWords(f[figId] ?? '');
    } else {
      out[field.id] = raw;
    }
  }
  return out;
}

export interface CSConfig {
  id: string;
  title: string;
  templateFile: string;
  brand: string; // for the download filename
  fields: FieldDef[];
}

function makeContractStaff(cfg: CSConfig): TemplateDef {
  return {
    id: cfg.id,
    title: cfg.title,
    jurisdiction: 'MY',
    templateFile: cfg.templateFile,
    ocr: true,
    fields: cfg.fields,
    validate: (f) => csValidate(cfg.fields, f),
    tokens: (f) => csTokens(cfg.fields, f),
    fileName: (f) => {
      const s = longPlain(f.startDate);
      const e = longPlain(f.endDate);
      const span = s && e ? ` (${s} - ${e})` : '';
      return `Employment Contract - ${cfg.brand} - ${(f.name || '').trim()}${span}.docx`;
    },
  };
}

// Shared header fields every brand uses.
const HEADER: FieldDef[] = [
  { id: 'letterDate', label: 'Letter date', type: 'date', required: true },
  { id: 'name', label: 'Employee full name', type: 'text', required: true, ocrSource: 'name' },
  { id: 'salutation', label: 'Salutation (given name)', type: 'text', required: true,
    help: 'How they are addressed in "Dear ___," — e.g. Nuo Xuan for surname-first names.' },
  { id: 'address', label: 'Home address', type: 'textarea', required: true, ocrSource: 'address' },
];
const DATES: FieldDef[] = [
  { id: 'startDate', label: 'Contract start date', type: 'date', required: true,
    help: 'Also used as the "with effect of" date.' },
  { id: 'endDate', label: 'Contract end date', type: 'date', required: true },
];
const NRIC: FieldDef = { id: 'nric', label: 'NRIC (optional)', type: 'nric', ocrSource: 'nric',
  help: 'Not printed in the contract body; for your record / OCR check only.' };

const salary = (label = 'Monthly basic salary (RM)'): FieldDef[] => [
  { id: 'salaryFigure', label, type: 'currency', required: true },
  { id: 'salaryWords', label: 'Basic salary in words', type: 'text', required: true,
    help: 'Auto-filled from the figure — verify before generating.' },
];
// `def` pre-fills the brand-standard amount (allowances are fixed policy per brand; the operator
// edits only if a hire differs). The words default is derived so both arrive pre-filled.
const allowance = (prefix: string, label: string, def?: string): FieldDef[] => [
  { id: `${prefix}Figure`, label: `${label} (RM)`, type: 'currency', required: true, default: def },
  { id: `${prefix}Words`, label: `${label} in words`, type: 'text', required: true,
    default: def ? amountToWords(def) : undefined,
    help: 'Auto-filled from the figure — verify before generating.' },
];

// Probation & termination-notice — operator-editable, printed in the probation/termination
// clauses. `def` pre-fills the brand's standard probation length; notice periods are entered
// per hire (no statutory default baked in). Optional: brands without a probation clause
// (e.g. Chanel, Guerlain) leave these blank and their .docx simply carries no matching token.
const probation = (def?: string): FieldDef[] => [
  { id: 'probationMonths', label: 'Probation period (months)', type: 'text', default: def,
    help: 'Number of months of probation (printed in the probation clause).' },
  { id: 'noticeProbation', label: 'Termination notice during probation (months)', type: 'text',
    help: "Months' notice required to terminate during probation." },
  { id: 'noticeAfterProbation', label: 'Termination notice after probation (months)', type: 'text',
    help: "Months' notice required to terminate after probation." },
];

export const csBvlgari = makeContractStaff({
  id: 'my-cs-bvlgari',
  title: 'MY Contract Staff — Bvlgari (Parfum Travel Retail)',
  templateFile: 'my-cs-bvlgari.docx',
  brand: 'Bvlgari',
  fields: [
    ...HEADER,
    { id: 'designation', label: 'Designation', type: 'text', required: true, default: 'Client Advisor' },
    ...salary(),
    ...allowance('transport', 'Transport Allowance', '200'),
    ...allowance('meal', 'Meal Allowance', '200'),
    ...allowance('grooming', 'Grooming Allowance', '100'),
    ...DATES,
    ...probation('3'),
    NRIC,
  ],
});

export const csChanel = makeContractStaff({
  id: 'my-cs-chanel',
  title: 'MY Contract Staff — Chanel (Kuala Lumpur)',
  templateFile: 'my-cs-chanel.docx',
  brand: 'Chanel',
  fields: [
    ...HEADER,
    { id: 'designation', label: 'Role / designation', type: 'text', required: true,
      default: 'Contract Beauty Advisor', help: 'Appears in the opening "employment with us as a ___" line.' },
    { id: 'salaryFigure', label: 'Monthly basic salary (RM)', type: 'currency', required: true },
    ...DATES,
    ...probation(),
    NRIC,
  ],
});

export const csCoach = makeContractStaff({
  id: 'my-cs-coach',
  title: 'MY Contract Staff — Coach',
  templateFile: 'my-cs-coach.docx',
  brand: 'Coach',
  fields: [
    ...HEADER,
    { id: 'designation', label: 'Designation', type: 'text', required: true, default: 'Talent Acquisition Assistant' },
    ...salary(),
    ...allowance('allowance', 'Monthly allowance', '100'),
    ...DATES,
    ...probation('6'),
    NRIC,
  ],
});

export const csGivenchy = makeContractStaff({
  id: 'my-cs-givenchy',
  title: 'MY Contract Staff — Givenchy (LVMH Fragrances)',
  templateFile: 'my-cs-givenchy.docx',
  brand: 'Givenchy',
  fields: [
    ...HEADER,
    { id: 'designation', label: 'Designation', type: 'text', required: true, default: 'Beauty Advisor' },
    ...salary(),
    ...allowance('travel', 'Travelling Allowance', '500'),
    ...allowance('grooming', 'Grooming Allowance', '100'),
    ...DATES,
    ...probation('3'),
    NRIC,
  ],
});

export const csGuerlain = makeContractStaff({
  id: 'my-cs-guerlain',
  title: 'MY Contract Staff — Guerlain (LVMH Travel Retail)',
  templateFile: 'my-cs-guerlain.docx',
  brand: 'Guerlain',
  fields: [
    ...HEADER,
    { id: 'designation', label: 'Designation', type: 'text', required: true, default: 'Beauty Consultant' },
    ...allowance('salary', 'Monthly basic salary — initial'),
    ...allowance('travel', 'Travelling Allowance — initial', '400'),
    ...allowance('postProbSalary', 'Post-probation monthly salary'),
    ...allowance('postProbTravel', 'Post-probation Travelling Allowance', '600'),
    ...DATES,
    ...probation(),
    NRIC,
  ],
});

export const CONTRACT_STAFF: TemplateDef[] = [
  csBvlgari, csChanel, csCoach, csGivenchy, csGuerlain,
];
