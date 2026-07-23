import { Pool } from 'pg';
import fs from 'fs';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sc = await pool.query('SELECT * FROM sales_channel LIMIT 1');
    const apiKeys = await pool.query('SELECT * FROM api_key');
    const links = await pool.query('SELECT * FROM product_sales_channel LIMIT 5');
    
    fs.writeFileSync('check.json', JSON.stringify({
      salesChannel: sc.rows,
      apiKeys: apiKeys.rows,
      productLinks: links.rows
    }, null, 2));
  } finally {
    await pool.end();
  }
}
run();
