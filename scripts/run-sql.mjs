import pg from 'pg';
import { readFileSync } from 'node:fs';
const { Client } = pg;

const url = process.env.SUPABASE_DB_URL;
if (!url) { console.error('SUPABASE_DB_URL missing'); process.exit(1); }

const file = process.argv[2];
if (!file) { console.error('usage: node run-sql.mjs <path.sql>'); process.exit(1); }
const sql = readFileSync(file, 'utf8');

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(sql);
  console.log('MIGRATION APPLIED OK:', file);
} catch (e) {
  console.error('MIGRATION FAILED:', e.message);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
