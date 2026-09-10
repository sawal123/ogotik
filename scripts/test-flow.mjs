import { createClient } from '@supabase/supabase-js';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const rand = Math.random().toString(36).slice(2, 8);
const email = `test_${rand}@example.com`;
const code = `tst${rand}`;
let userId, linkId;

function assert(cond, msg) { if (!cond) { console.error('FAIL:', msg); process.exitCode = 1; } else { console.log('OK:', msg); } }

try {
  // 1. create user
  const { data: u, error: ue } = await admin.auth.admin.createUser({ email, password: 'password1234', email_confirm: true, user_metadata: { display_name: 'Tester' } });
  if (ue) throw ue;
  userId = u.user.id;
  assert(!!userId, 'created auth user');

  // profile auto-created by trigger
  await new Promise(r => setTimeout(r, 800));
  const { data: prof } = await admin.from('profiles').select('*').eq('id', userId).maybeSingle();
  assert(!!prof, 'profile auto-created by trigger');

  // 2. create short link
  const { data: link, error: le } = await admin.from('short_links')
    .insert({ user_id: userId, short_code: code, destination_url: 'https://example.com/', title: 'Test' })
    .select('id, total_clicks').single();
  if (le) throw le;
  linkId = link.id;
  assert(link.total_clicks === 0, 'link starts with 0 clicks');

  // 3. hit redirect twice
  for (let i = 0; i < 2; i++) {
    const res = await fetch(`http://localhost:3000/r/${code}`, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (iPhone) Safari', 'referer': 'https://instagram.com/' } });
    assert(res.status === 302, `redirect #${i+1} returns 302 (got ${res.status})`);
    assert(res.headers.get('location') === 'https://example.com/', `redirect #${i+1} points to destination`);
  }

  await new Promise(r => setTimeout(r, 1000));

  // 4. verify analytics
  const { data: after } = await admin.from('short_links').select('total_clicks').eq('id', linkId).single();
  assert(after.total_clicks === 2, `total_clicks incremented atomically to 2 (got ${after.total_clicks})`);
  const { count } = await admin.from('click_events').select('*', { count: 'exact', head: true }).eq('short_link_id', linkId);
  assert(count === 2, `2 click_events recorded (got ${count})`);
  const { data: ev } = await admin.from('click_events').select('*').eq('short_link_id', linkId).limit(1).single();
  assert(ev.device_type === 'mobile', `device parsed as mobile (got ${ev.device_type})`);
  assert(ev.browser && ev.browser.toLowerCase().includes('safari'), `browser parsed (got ${ev.browser})`);

  // 5. disabled + expired behaviour
  await admin.from('short_links').update({ is_active: false }).eq('id', linkId);
  const d = await fetch(`http://localhost:3000/r/${code}`, { redirect: 'manual' });
  assert(d.status === 410, `disabled link returns 410 (got ${d.status})`);

} catch (e) {
  console.error('ERROR:', e.message || e);
  process.exitCode = 1;
} finally {
  if (linkId) await admin.from('short_links').delete().eq('id', linkId);
  if (userId) await admin.auth.admin.deleteUser(userId);
  console.log('cleanup done');
}
