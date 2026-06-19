/* SG INWW "Non-Local Secondment - Employment Contract (Outsourcing)".
 * Tokenised from the official .docx; sample values (Louboutin / Client Advisor / S$2,650 +
 * S$150 travel / S$700 guaranteed commission / 31 Aug bonus / 13 days leave) replaced with
 * {tokens}. Three pay clauses are OPTIONAL, gated by checkbox toggles that drive docxtemplater
 * conditional sections: travel allowance, first-3-months guaranteed commission, discretionary bonus. */

import { amountToWords } from '../amount-to-words';
import { longOrdinal, parseISO } from '../format';
import { isSgNricFormat, isValidSgNric } from '../validators';
import type { FormValues, TemplateDef, TokenMap } from '../types';

function fmtFigure(input: string): string {
  const n = Math.floor(Number(String(input).replace(/[^0-9.]/g, '')));
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('en-SG') : '';
}

const on = (f: FormValues, id: string) => !!(f[id] ?? '').trim();
const posAmount = (s: string) => parseFloat(String(s).replace(/[^0-9.]/g, '')) > 0;

function validate(f: FormValues): string[] {
  const errs: string[] = [];
  if (!f.name?.trim()) errs.push('Employee name is required.');
  if (!f.address?.trim()) errs.push('Home address is required.');
  if (!f.client?.trim()) errs.push('Client (assigned company) is required.');
  if (!f.designation?.trim()) errs.push('Designation is required.');
  if (!posAmount(f.salaryFigure)) errs.push('Monthly basic salary must be a positive number.');
  if (!f.salaryWords?.trim()) errs.push('Salary in words is required (auto-filled — please verify).');

  // Optional clauses validate only when their toggle is on.
  if (on(f, 'hasTravelAllowance')) {
    if (!posAmount(f.travelFigure)) errs.push('Travel allowance must be a positive number.');
    if (!f.travelWords?.trim()) errs.push('Travel allowance in words is required (auto-filled — please verify).');
  }
  if (on(f, 'hasCommissionScheme') && on(f, 'hasGuaranteedCommission') && !posAmount(f.guaranteedFigure))
    errs.push('Guaranteed commission must be a positive number.');
  if (on(f, 'hasDiscretionaryBonus') && !f.bonusDate?.trim())
    errs.push('Discretionary bonus qualifying date is required (e.g. 31 August).');

  if (!parseISO(f.startDate)) errs.push('Start date is required.');
  if (!parseISO(f.endDate)) errs.push('End date is required.');
  if (parseISO(f.startDate) && parseISO(f.endDate) && f.endDate < f.startDate)
    errs.push('End date must be on or after the start date.');
  if (!(parseFloat(f.annualLeave) > 0)) errs.push('Annual leave days must be a positive number.');

  if (f.nric?.trim()) {
    if (!isSgNricFormat(f.nric)) errs.push('NRIC/FIN format looks wrong (expected e.g. S1234567D).');
    else if (!isValidSgNric(f.nric)) errs.push('NRIC check digit looks wrong — please re-check.');
  }
  return errs;
}

function tokens(f: FormValues): TokenMap {
  const travel = on(f, 'hasTravelAllowance');
  const scheme = on(f, 'hasCommissionScheme');
  const guaranteed = scheme && on(f, 'hasGuaranteedCommission'); // guarantee only within the scheme
  const bonus = on(f, 'hasDiscretionaryBonus');
  return {
    letterDate: longOrdinal(f.letterDate) ?? '',
    name: f.name.trim(),
    salutation: f.name.trim(), // header "Dear XXXXXX," — full name, matching Local Secondment
    address: f.address.trim(), // newlines -> line breaks at render time
    client: f.client.trim(),
    designation: f.designation.trim(),
    salaryFigure: fmtFigure(f.salaryFigure),
    salaryWords: f.salaryWords?.trim() || amountToWords(f.salaryFigure),
    // Optional sections: boolean flag + its values (blank when off).
    hasTravelAllowance: travel,
    travelFigure: travel ? fmtFigure(f.travelFigure) : '',
    travelWords: travel ? (f.travelWords?.trim() || amountToWords(f.travelFigure)) : '',
    hasCommissionScheme: scheme,
    hasGuaranteedCommission: guaranteed,
    guaranteedFigure: guaranteed ? fmtFigure(f.guaranteedFigure) : '',
    hasDiscretionaryBonus: bonus,
    bonusDate: bonus ? f.bonusDate.trim() : '',
    startDate: longOrdinal(f.startDate) ?? '',
    endDate: longOrdinal(f.endDate) ?? '',
    annualLeave: String(parseInt(f.annualLeave, 10) || ''),
  };
}

function fileName(f: FormValues): string {
  return `Non-Local Secondment - Employment Contract - ${f.name.trim()}.docx`;
}

export const sgNonLocalSecondment: TemplateDef = {
  id: 'sg-non-local-secondment',
  title: 'SG — Non-Local Secondment Employment Contract (Outsourcing)',
  jurisdiction: 'SG',
  templateFile: 'sg-non-local-secondment.tokenised.docx',
  ocr: true,
  fields: [
    { id: 'letterDate', label: 'Letter date', type: 'date', required: true },
    { id: 'name', label: 'Employee full name', type: 'text', required: true, ocrSource: 'name' },
    { id: 'address', label: 'Home address', type: 'textarea', required: true, ocrSource: 'address' },
    { id: 'client', label: 'Client (assigned company)', type: 'text', required: true,
      help: 'e.g. Louboutin Singapore Pte. Limited' },
    { id: 'designation', label: 'Designation', type: 'text', required: true, default: 'Client Advisor' },
    { id: 'salaryFigure', label: 'Monthly basic salary (S$)', type: 'currency', required: true },
    { id: 'salaryWords', label: 'Basic salary in words', type: 'text', required: true,
      help: 'Auto-filled from the figure — verify before generating.' },

    { id: 'hasTravelAllowance', label: 'Include monthly travel allowance', type: 'checkbox',
      help: 'Adds the travel-allowance clause to the salary paragraph.' },
    { id: 'travelFigure', label: 'Monthly travel allowance (S$)', type: 'currency', required: true,
      showIf: 'hasTravelAllowance' },
    { id: 'travelWords', label: 'Travel allowance in words', type: 'text', required: true,
      showIf: 'hasTravelAllowance', help: 'Auto-filled from the figure — verify before generating.' },

    { id: 'hasCommissionScheme', label: 'Include sales commission scheme', type: 'checkbox',
      help: 'Adds the Sales Commission Scheme participation clause. Leave off for hires with no commission.' },
    { id: 'hasGuaranteedCommission', label: 'Include first-3-months guaranteed commission', type: 'checkbox',
      showIf: 'hasCommissionScheme',
      help: 'Adds the guaranteed-commission clause (S$/month for the first 3 months).' },
    { id: 'guaranteedFigure', label: 'Guaranteed commission per month (S$)', type: 'currency', required: true,
      showIf: 'hasGuaranteedCommission' },

    { id: 'hasDiscretionaryBonus', label: 'Include discretionary bonus clause', type: 'checkbox',
      help: 'Adds the discretionary-bonus arrangement with a qualifying date.' },
    { id: 'bonusDate', label: 'Bonus qualifying date', type: 'text', required: true,
      showIf: 'hasDiscretionaryBonus', help: 'e.g. 31 August — the date the employee must remain in service by.' },

    { id: 'startDate', label: 'Contract start date', type: 'date', required: true },
    { id: 'endDate', label: 'Contract end date', type: 'date', required: true },
    { id: 'annualLeave', label: 'Annual leave (working days)', type: 'number', required: true, default: '13' },
    { id: 'nric', label: 'NRIC / FIN (optional)', type: 'nric', ocrSource: 'nric',
      help: 'Not printed in the contract body; for your record / OCR check only.' },
  ],
  validate,
  tokens,
  fileName,
};
