// Minimal, fast, self-contained HTML for short-link error states.
// No React / no heavy bundle on the hot redirect path.
type Kind = 'not-found' | 'disabled' | 'expired';

const COPY: Record<Kind, { code: number; title: string; message: string }> = {
  'not-found': { code: 404, title: 'Link not found', message: 'This short link doesn\u2019t exist or was removed.' },
  disabled: { code: 410, title: 'Link unavailable', message: 'This link has been disabled by its owner.' },
  expired: { code: 410, title: 'Link expired', message: 'This link is no longer active.' },
};

export function linkErrorResponse(kind: Kind): Response {
  const { code, title, message } = COPY[kind];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${title} \u2014 Go Tik Links</title>
<style>
:root{color-scheme:light}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F7F8FA;
font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#2F2E2E}
.card{max-width:420px;width:calc(100% - 32px);background:#fff;border:1px solid #eceef2;border-radius:20px;
padding:40px 32px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.04)}
.logo{width:44px;height:44px;border-radius:12px;background:#EC5B00;display:grid;place-items:center;margin:0 auto 20px}
.logo svg{color:#fff}
h1{font-size:20px;margin:0 0 8px;font-weight:700}
p{margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.5}
a{display:inline-block;background:#EC5B00;color:#fff;text-decoration:none;padding:10px 20px;
border-radius:10px;font-weight:600;font-size:14px}
.badge{font-size:12px;color:#9ca3af;margin-top:20px}
</style></head><body>
<div class="card">
<div class="logo"><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 17H7A5 5 0 0 1 7 7h2"/><path d="M15 7h2a5 5 0 1 1 0 10h-2"/><line x1="8" x2="16" y1="12" y2="12"/></svg></div>
<h1>${title}</h1>
<p>${message}</p>
<a href="${process.env.NEXT_PUBLIC_SITE_URL || '/'}">Go to Go Tik Links</a>
<div class="badge">Powered by Go Tik Links</div>
</div></body></html>`;
  return new Response(html, {
    status: code,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
