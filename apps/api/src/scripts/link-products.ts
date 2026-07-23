import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const scId = 'sc_01KXZ8HFZCD3P5PZSHBW819M5A';
    const products = await pool.query('SELECT id FROM product');
    console.log(`Linking ${products.rows.length} products to SC ${scId}`);
    
    for (const p of products.rows) {
      const linkId = 'prodsc_' + Math.random().toString(36).substring(2, 15);
      await pool.query('INSERT INTO product_sales_channel (id, product_id, sales_channel_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [linkId, p.id, scId]);
    }
    
    console.log("Done");
  } finally {
    await pool.end();
  }
}
run();
