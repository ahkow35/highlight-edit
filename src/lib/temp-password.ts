import { randomBytes } from 'node:crypto';

/** Generate a 14-char alphanumeric temp password (+ "A1" to satisfy basic policies). Server-side. */
export function tempPassword(): string {
  return randomBytes(12).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 14) + 'A1';
}
