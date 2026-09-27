const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  conn.exec(`docker exec welfare-postgres psql -U postgres -d medusa -c "SELECT id, name, handle, is_active, is_internal FROM product_category;"`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      console.log(data.toString());
    }).stderr.on('data', (data) => {
      console.log(data.toString());
    });
  });
}).connect({
  host: '169.58.163.109',
  port: 22,
  username: 'root',
  password: 'Vykuj3546@'
});
