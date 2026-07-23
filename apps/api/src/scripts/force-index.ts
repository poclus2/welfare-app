import { Pool } from 'pg';

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    console.log("Fetching products from DB...");
    const res = await pool.query(`
      SELECT p.id, p.title, p.description, p.thumbnail, p.handle
      FROM product p
      WHERE p.deleted_at IS NULL
    `);
    
    console.log(`Found ${res.rows.length} products. Pushing to Meilisearch...`);
    
    const documents = res.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      thumbnail: row.thumbnail,
      handle: row.handle
    }));
    
    const fetchResponse = await fetch("http://localhost:7700/indexes/products/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer meilisearch_super_secret"
      },
      body: JSON.stringify(documents)
    });
    
    const result = await fetchResponse.json();
    console.log("Meilisearch response:", result);
    
  } catch(e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}
run();
