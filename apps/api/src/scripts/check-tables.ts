import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/medusa-welfare' });
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE '%sales_channel%'");
  console.log(res.rows);
  pool.end();
}
run().catch(console.error);
