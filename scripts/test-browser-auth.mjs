import { createBrowserClient } from '@supabase/ssr';
const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
const { data, error } = await supabase.auth.signInWithPassword({ email: 'demo@gotiklinks.com', password: 'demo12345' });
if (error) { console.error('SIGN-IN FAILED:', error.message); process.exit(1); }
console.log('SIGN-IN OK. user:', data.user?.email, 'has_session:', !!data.session?.access_token);
// confirm RLS-scoped read works with this session
const { data: links } = await supabase.from('short_links').select('short_code,total_clicks').order('total_clicks', { ascending: false });
console.log('own links visible:', JSON.stringify(links));
