import { createClient } from '@supabase/supabase-js';
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
async function findUser(email){let p=1;while(true){const {data}=await admin.auth.admin.listUsers({page:p,perPage:200});const u=data.users.find(x=>x.email===email);if(u)return u;if(data.users.length<200)return null;p++;}}
const u = await findUser('demo@gotiklinks.com');
console.log('demo user exists:', !!u, u?.id);
if(u){
  const {data:links}=await admin.from('short_links').select('id,short_code,total_clicks').eq('user_id',u.id);
  console.log('links:', JSON.stringify(links));
  const {data:pages}=await admin.from('bio_pages').select('id,slug,is_published').eq('user_id',u.id);
  console.log('pages:', JSON.stringify(pages));
  if(pages?.[0]){const {count}=await admin.from('page_views').select('*',{count:'exact',head:true}).eq('bio_page_id',pages[0].id);console.log('page_views:',count);}
  const {data:blocks}=pages?.[0]?await admin.from('bio_blocks').select('id,type,position').eq('bio_page_id',pages[0].id).order('position'):{data:[]};
  console.log('blocks:', blocks?.length);
}
