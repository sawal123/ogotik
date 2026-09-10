import { UAParser } from 'ua-parser-js';

export type RequestMeta = {
  referrer: string | null;
  country: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
};

// Extract safe analytics metadata from request headers. Never stores IP.
export function extractMeta(headers: Headers): RequestMeta {
  const ua = headers.get('user-agent') || '';
  const referrer = headers.get('referer');
  // Country from common CDN/edge headers when available; otherwise null.
  const country =
    headers.get('x-vercel-ip-country') ||
    headers.get('cf-ipcountry') ||
    headers.get('x-country') ||
    null;

  let device_type: string | null = null;
  let browser: string | null = null;
  let os: string | null = null;

  try {
    const parsed = new UAParser(ua).getResult();
    device_type = parsed.device.type || 'desktop';
    browser = parsed.browser.name || null;
    os = parsed.os.name || null;
  } catch {
    // parsing must fail gracefully
  }

  return {
    referrer: referrer && referrer.length > 0 ? referrer.slice(0, 500) : null,
    country: country && country !== 'XX' ? country : null,
    device_type,
    browser,
    os,
  };
}
