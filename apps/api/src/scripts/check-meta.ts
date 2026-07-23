import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/medusa-welfare' });
  const res = await pool.query("SELECT metadata FROM product LIMIT 5");
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

run();
