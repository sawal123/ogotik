import pg from 'pg';
const { Client } = pg;

const ref = 'pavqlwzymonssakyhigw';
const password = '@@Nayaka2024';
const regions = ['ap-southeast-1','ap-southeast-2','ap-south-1','ap-northeast-1','us-east-1','us-west-1','eu-central-1','eu-west-1','ap-northeast-2','us-east-2','eu-west-2'];
const prefixes = ['aws-0','aws-1'];

for (const r of regions) {
  for (const p of prefixes) {
    const host = `${p}-${r}.pooler.supabase.com`;
    const client = new Client({
      host, port: 5432, user: `postgres.${ref}`, password, database: 'postgres',
      ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 6000,
    });
    try {
      await client.connect();
      const res = await client.query('select current_database()');
      console.log(`SUCCESS => host=${host} port=5432 db=${res.rows[0].current_database}`);
      await client.end();
      process.exit(0);
    } catch (e) {
      console.log(`fail ${host}:5432 -> ${e.message}`);
      await client.end().catch(()=>{});
    }
  }
}
console.log('NO REGION WORKED');
process.exit(1);
