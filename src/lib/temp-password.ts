import { randomBytes } from 'node:crypto';

/** Generate a temp password that always satisfies the lower+upper+digit policy. Server-side. */
export function tempPassword(): string {
  const core = randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 14);
  return `${core}aA1`; // guarantees a lowercase, an uppercase, and a digit
}
