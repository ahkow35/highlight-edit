/* Curated template library. Each entry is a TemplateDef tying a blank tokenised .docx
 * to its form, validation, token map, and filename. Add HR letters + more contracts here. */

import type { TemplateDef } from './types';
import { sgLocalSecondment } from './templates/sg-local-secondment';
import { sgNonLocalSecondment } from './templates/sg-non-local-secondment';
import { sgInternalEmployee } from './templates/sg-internal-employee';
import { lcPartTimer } from './templates/lc-part-timer';
import { CONTRACT_STAFF } from './templates/contract-staff';

export const TEMPLATES: TemplateDef[] = [
  sgLocalSecondment,
  sgNonLocalSecondment,
  sgInternalEmployee,
  lcPartTimer, // MY — LC part-timer (real LC .docx)
  ...CONTRACT_STAFF, // MY — LC Contract Staff, one template per brand
];

export function getTemplate(id: string): TemplateDef | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
