import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const EMAIL = 'demo@gotiklinks.com';
const PASSWORD = 'demo12345';
const THEME = { bgColor: '#FFF3EB', bgGradient: true, bgColor2: '#FFFFFF', buttonStyle: 'solid', buttonRadius: 'md', textColor: '#2F2E2E', buttonColor: '#EC5B00', font: 'inter', align: 'center' };

async function findUser(email) {
  let page = 1;
  while (true) {
    const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    const u = data.users.find((x) => x.email === email);
    if (u) return u;
    if (data.users.length < 200) return null;
    page++;
  }
}

// reset demo user for a clean, idempotent seed
const existing = await findUser(EMAIL);
if (existing) { await admin.auth.admin.deleteUser(existing.id); console.log('removed old demo user'); }

const { data: created, error } = await admin.auth.admin.createUser({ email: EMAIL, password: PASSWORD, email_confirm: true, user_metadata: { display_name: 'Go Tik' } });
if (error) { console.error(error); process.exit(1); }
const userId = created.user.id;
console.log('demo user:', userId);

const linkDefs = [
  { code: 'konser', dest: 'https://go-tik.com/event/konser-2026', title: 'Buy Tickets', hits: 34 },
  { code: 'gotik-ig', dest: 'https://instagram.com/gotik', title: 'Instagram', hits: 21 },
  { code: 'gotik-web', dest: 'https://go-tik.com', title: 'Website', hits: 12 },
  { code: 'gotik-wa', dest: 'https://wa.me/62800000000', title: 'Hubungi Kami', hits: 7 },
];
const linkIds = {};
for (const l of linkDefs) {
  const { data } = await admin.from('short_links').insert({ user_id: userId, short_code: l.code, destination_url: l.dest, title: l.title }).select('id').single();
  linkIds[l.code] = data.id;
}
console.log('links created');

// generate REAL clicks by hitting the redirect engine (spread across recent days via direct RPC for the chart)
const UAS = ['Mozilla/5.0 (iPhone; CPU iPhone OS 16_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile Safari/604.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'];
const REFS = ['https://instagram.com/', 'https://t.co/', null, 'https://facebook.com/'];
for (const l of linkDefs) {
  for (let i = 0; i < l.hits; i++) {
    await fetch(`http://localhost:3000/r/${l.code}`, { redirect: 'manual', headers: { 'user-agent': UAS[i % UAS.length], ...(REFS[i % REFS.length] ? { referer: REFS[i % REFS.length] } : {}) } });
  }
}
console.log('real clicks generated');

// bio page
const { data: page } = await admin.from('bio_pages').insert({ user_id: userId, slug: 'gotik', title: 'Go Tik', bio: 'Platform ticketing & event Indonesia', is_published: true, theme_config: THEME, socials: [{ platform: 'instagram', url: 'https://instagram.com/gotik' }, { platform: 'tiktok', url: 'https://tiktok.com/@gotik' }, { platform: 'website', url: 'https://go-tik.com' }] }).select('id').single();
const pageId = page.id;
const blocks = [
  { type: 'heading', data: { text: 'Upcoming Events' } },
  { type: 'link', short: 'konser', data: { label: 'Lihat Event', shortCode: 'konser', destination: 'https://go-tik.com/event/konser-2026', style: 'solid' } },
  { type: 'link', short: 'gotik-ig', data: { label: 'Instagram', shortCode: 'gotik-ig', destination: 'https://instagram.com/gotik', style: 'outline' } },
  { type: 'link', short: 'gotik-web', data: { label: 'Website', shortCode: 'gotik-web', destination: 'https://go-tik.com', style: 'soft' } },
  { type: 'link', short: 'gotik-wa', data: { label: 'Hubungi Kami', shortCode: 'gotik-wa', destination: 'https://wa.me/62800000000', style: 'solid' } },
];
let pos = 0;
for (const b of blocks) {
  await admin.from('bio_blocks').insert({ bio_page_id: pageId, type: b.type, position: pos++, short_link_id: b.short ? linkIds[b.short] : null, data: b.data });
}
// real page views
for (let i = 0; i < 48; i++) await fetch('http://localhost:3000/p/gotik', { headers: { 'user-agent': UAS[i % UAS.length] } });
console.log('bio page + real page views generated');
console.log('SEED DONE. Login:', EMAIL, '/', PASSWORD);
