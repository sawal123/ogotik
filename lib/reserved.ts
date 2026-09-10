// System names that must never be usable as short codes or bio slugs.
export const RESERVED = new Set<string>([
  'api', 'admin', 'auth', 'login', 'register', 'signin', 'signup', 'sign-in', 'sign-up',
  'dashboard', 'health', 'robots', 'favicon', 'settings', 'analytics', 'links', 'pages',
  'r', 'p', 'www', 'app', 'static', 'assets', 'about', 'help', 'support', 'terms', 'privacy',
  'go-tik', 'gotik', 'null', 'undefined', 'new', 'edit',
]);

export function isReserved(value: string): boolean {
  return RESERVED.has(value.toLowerCase());
}
