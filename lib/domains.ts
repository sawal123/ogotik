// Centralized domain configuration so production hostnames can change easily.
export const DOMAINS = {
  app: 'links.go-tik.com',
  short: 'o.go-tik.com',
  bio: 'bio.go-tik.com',
} as const;

// Base URL for building absolute short/bio URLs shown in the UI.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

// In production these become o.go-tik.com/{code}. In preview/dev we display
// the internal fallback path so links remain testable before DNS is wired.
export function shortUrlFor(code: string): string {
  return `${DOMAINS.short}/${code}`;
}

export function bioUrlFor(slug: string): string {
  return `${DOMAINS.bio}/${slug}`;
}

// Absolute, clickable URLs that work in the current environment.
export function shortHref(code: string): string {
  return `${SITE_URL}/r/${code}`;
}

export function bioHref(slug: string): string {
  return `${SITE_URL}/p/${slug}`;
}
