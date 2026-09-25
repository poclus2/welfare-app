const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://medusa:medusa_password@127.0.0.1:5432/medusa_welfare'
});
client.connect();
client.query('SELECT name, parent_category_id FROM product_category;', (err, res) => {
  if (err) throw err;
  console.log(res.rows);
  client.end();
});
