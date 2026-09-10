import { randomInt } from 'node:crypto';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const DEFAULT_CODE_LENGTH = 7;

// Secure random lowercase alphanumeric code.
export function generateShortCode(length: number = DEFAULT_CODE_LENGTH): string {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}
