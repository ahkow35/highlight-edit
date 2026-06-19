/* LC Malaysia part-timer employment contract — the retained prior build.
 * Field set + token map + validation + filename ported from
 * CoWork/Employment Contract/contract-merge.js (design approved 2026-06-10).
 * The tokenised .docx is a content-faithful reconstruction of LC's supplied PDFs
 * (the original Word file was never provided). Swap in LC's real .docx if it surfaces. */

import { durationStr, longOrdinal, parseISO } from '../format';
import type { FormValues, TemplateDef, TokenMap } from '../types';

function validate(f: FormValues): string[] {
  const errs: string[] = [];
  if (!f.name?.trim()) errs.push('Employee name is required.');
  if (!f.salutation?.trim()) errs.push('Salutation (given name) is required.');
  if (!f.address?.trim()) errs.push('Home address is required.');
  if (!f.jobTitle?.trim()) errs.push('Job title is required.');
  if (!f.client?.trim()) errs.push('Client / brand is required.');
  if (!parseISO(f.startDate)) errs.push('Start date is required.');
  if (!parseISO(f.endDate)) errs.push('End date is required.');
  if (parseISO(f.startDate) && parseISO(f.endDate) && f.endDate < f.startDate)
    errs.push('End date must be on or after the start date.');
  const rate = parseFloat(f.rate);
  if (!(rate > 0)) errs.push('Hourly rate must be a positive number.');
  const thr = parseFloat(f.threshold);
  if (!(thr > 0)) errs.push('OT threshold (hours/day) must be a positive number.');
  return errs;
}

function tokens(f: FormValues): TokenMap {
  const rate = parseFloat(f.rate);
  return {
    letterDate: longOrdinal(f.letterDate) ?? '',
    name: f.name.trim(),
    salutation: f.salutation.trim(), // "Dear ___," — given name; operator-set (surname-first names)
    address: f.address.trim(), // newlines -> line breaks at render time
    jobTitle: f.jobTitle.trim(),
    client: f.client.trim(),
    duration: durationStr(f.startDate, f.endDate) ?? '',
    rate: rate.toFixed(2), // "15.00"
    threshold: String(parseFloat(f.threshold)),
    nric: (f.nric || '').trim(), // optional; blank -> signature line stays empty
  };
}

function fileName(f: FormValues): string {
  // "LC Part Timer - {Name} (5 May 2026 - 31 May 2026).docx" — plain (no ordinal) dates.
  const p = parseISO(f.startDate);
  const q = parseISO(f.endDate);
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const plain = (d: typeof p) => (d ? `${d.d} ${MONTHS[d.mo - 1]} ${d.y}` : '');
  return `LC Part Timer - ${f.name.trim()} (${plain(p)} - ${plain(q)}).docx`;
}

export const lcPartTimer: TemplateDef = {
  id: 'lc-part-timer-my',
  title: 'LC Malaysia — Part-Timer Employment Contract',
  jurisdiction: 'MY',
  templateFile: 'lc-part-timer-my.docx', // content-faithful reconstruction of LC's PDF
  ocr: true,
  fields: [
    { id: 'letterDate', label: 'Letter date', type: 'date', required: true },
    { id: 'name', label: 'Employee full name', type: 'text', required: true, ocrSource: 'name' },
    { id: 'salutation', label: 'Salutation (given name)', type: 'text', required: true,
      help: 'How they are addressed in "Dear ___," — e.g. Sarah, or Mei Jun for surname-first names.' },
    { id: 'address', label: 'Home address', type: 'textarea', required: true, ocrSource: 'address' },
    { id: 'jobTitle', label: 'Job title', type: 'text', required: true, default: 'Seasonal Part Time Assistant' },
    { id: 'client', label: 'Client / brand + mall', type: 'text', required: true },
    { id: 'startDate', label: 'Start date', type: 'date', required: true },
    { id: 'endDate', label: 'End date', type: 'date', required: true },
    { id: 'rate', label: 'Hourly rate', type: 'currency', required: true },
    { id: 'threshold', label: 'OT threshold (hours/day)', type: 'number', required: true, default: '8' },
    { id: 'nric', label: 'NRIC / MyKad (optional)', type: 'text', ocrSource: 'nric' },
  ],
  validate,
  tokens,
  fileName,
};
