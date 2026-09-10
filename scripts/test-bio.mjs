import { createClient } from '@supabase/supabase-js';

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const rand = Math.random().toString(36).slice(2, 8);
const email = `biotest_${rand}@example.com`;
const slug = `page${rand}`;
const code = `bl${rand}`;
let userId, pageId, linkId;
function assert(c, m) { console.log((c ? 'OK: ' : 'FAIL: ') + m); if (!c) process.exitCode = 1; }

const THEME = { bgColor: '#F7F8FA', bgGradient: true, bgColor2: '#FFF3EB', buttonStyle: 'solid', buttonRadius: 'md', textColor: '#2F2E2E', buttonColor: '#EC5B00', font: 'inter', align: 'center' };

try {
  const { data: u, error: ue } = await admin.auth.admin.createUser({ email, password: 'password1234', email_confirm: true });
  if (ue) throw ue; userId = u.user.id;
  assert(!!userId, 'created user');

  const { data: link } = await admin.from('short_links').insert({ user_id: userId, short_code: code, destination_url: 'https://go-tik.com/event/example', title: 'Buy Tickets' }).select('id').single();
  linkId = link.id;

  const { data: page, error: pe } = await admin.from('bio_pages').insert({ user_id: userId, slug, title: 'Go Tik Test', bio: 'Ticketing platform', is_published: true, theme_config: THEME, socials: [{ platform: 'instagram', url: 'https://instagram.com/gotik' }] }).select('id').single();
  if (pe) throw pe; pageId = page.id;

  await admin.from('bio_blocks').insert({ bio_page_id: pageId, type: 'link', position: 0, short_link_id: linkId, data: { label: 'Buy Tickets', shortCode: code, destination: 'https://go-tik.com/event/example', style: 'solid' } });
  await admin.from('bio_blocks').insert({ bio_page_id: pageId, type: 'heading', position: 1, data: { text: 'Upcoming Events' } });

  const res = await fetch(`http://localhost:3000/p/${slug}`);
  const body = await res.text();
  assert(res.status === 200, `public page returns 200 (got ${res.status})`);
  assert(body.includes('Go Tik Test'), 'public page shows title');
  assert(body.includes('Buy Tickets'), 'public page shows link block label');
  assert(body.includes('Upcoming Events'), 'public page shows heading block');
  assert(body.includes(`/r/${code}`), 'link block points to short-link redirect');
  assert(body.includes('Powered by Go Tik Links'), 'footer present');

  await new Promise(r => setTimeout(r, 1200));
  const { count } = await admin.from('page_views').select('*', { count: 'exact', head: true }).eq('bio_page_id', pageId);
  assert(count >= 1, `page_view recorded (got ${count})`);

  // unpublish -> public should show not found
  await admin.from('bio_pages').update({ is_published: false }).eq('id', pageId);
  const res2 = await fetch(`http://localhost:3000/p/${slug}`);
  const body2 = await res2.text();
  assert(body2.includes('Page not found'), 'unpublished page hidden from public');

  const resNF = await fetch(`http://localhost:3000/p/nonexistent-${rand}`);
  const bodyNF = await resNF.text();
  assert(bodyNF.includes('Page not found'), 'nonexistent slug shows not found');
} catch (e) {
  console.error('ERROR:', e.message || e); process.exitCode = 1;
} finally {
  if (pageId) await admin.from('bio_pages').delete().eq('id', pageId);
  if (linkId) await admin.from('short_links').delete().eq('id', linkId);
  if (userId) await admin.auth.admin.deleteUser(userId);
  console.log('cleanup done');
}
