const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`docker exec welfare-api curl -s http://localhost:9000/store/product-categories`, (err, stream) => {
    if (err) throw err;
    let data = '';
    stream.on('close', (code) => {
      try {
        const parsed = JSON.parse(data);
        console.log("Categories found:", parsed.product_categories?.length || 0);
        console.log(JSON.stringify(parsed.product_categories, null, 2).substring(0, 1500)); // Print first part
      } catch(e) {
        console.log("Raw output:", data);
      }
      conn.end();
      process.exit(0);
    }).on('data', (d) => {
      data += d;
    }).stderr.on('data', (d) => {
      console.error(d.toString());
    });
  });
}).connect({ host: '169.58.163.109', port: 22, username: 'root', password: 'Vykuj3546@' });
