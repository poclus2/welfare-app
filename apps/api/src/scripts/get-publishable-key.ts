import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query('SELECT token FROM api_key WHERE type = $1 LIMIT 1', ['publishable']);
    if (res.rows.length > 0) {
      console.log('EXISTING_KEY=' + res.rows[0].token);
    } else {
      console.log('NO KEY FOUND. Generating one in DB directly for test purposes is not recommended. Please use Medusa CLI or Admin.');
    }
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
