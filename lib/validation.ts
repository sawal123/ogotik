import { z } from 'zod';
import { isReserved } from './reserved';

const DANGEROUS = /^(javascript|data|file|vbscript):/i;

// Server-side destination URL validation. Allows http/https only.
export function validateDestination(raw: string): { ok: true; url: string } | { ok: false; error: string } {
  const value = (raw || '').trim();
  if (!value) return { ok: false, error: 'Destination URL is required' };
  if (DANGEROUS.test(value)) return { ok: false, error: 'That URL scheme is not allowed' };
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { ok: false, error: 'Please enter a valid URL (include http:// or https://)' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, error: 'Only http and https URLs are allowed' };
  }
  return { ok: true, url: parsed.toString() };
}

export const aliasSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Minimum 3 characters')
  .max(40, 'Maximum 40 characters')
  .regex(/^[a-z0-9-]+$/, 'Only a-z, 0-9 and - allowed')
  .refine((v) => !isReserved(v), 'That alias is reserved');

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Minimum 3 characters')
  .max(40, 'Maximum 40 characters')
  .regex(/^[a-z0-9-]+$/, 'Only a-z, 0-9 and - allowed')
  .refine((v) => !isReserved(v), 'That slug is reserved');

export function normalizeAlias(v: string): string {
  return v.trim().toLowerCase();
}
