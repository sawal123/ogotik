import pg from 'pg';
const { Client } = pg;

const url = process.env.SUPABASE_DB_URL;
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  const res = await client.query('select version(), current_database(), now()');
  console.log('CONNECTED OK');
  console.log(res.rows[0]);
} catch (e) {
  console.error('CONNECTION FAILED:', e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
