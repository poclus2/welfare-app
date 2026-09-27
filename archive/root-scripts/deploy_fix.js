const fs = require('fs');
const { Client } = require('ssh2');

const fileContent = fs.readFileSync('apps/storefront/app/shop/[id]/page.tsx', 'utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const remotePath = '/opt/welfare-app/apps/storefront/app/shop/[id]/page.tsx';
    const writeStream = sftp.createWriteStream(remotePath);
    writeStream.on('close', () => {
      console.log('Fichier transféré.');
      conn.exec('cd /opt/welfare-app && docker compose -f docker-compose.prod.yml up -d --build storefront', (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
          console.log('Build terminé.');
          conn.end();
        }).on('data', (data) => {
          process.stdout.write(data);
        }).stderr.on('data', (data) => {
          process.stderr.write(data);
        });
      });
    });
    writeStream.on('error', (err) => {
        console.error('SFTP Error: ', err);
    });
    writeStream.write(fileContent);
    writeStream.end();
  });
}).connect({
  host: '169.58.163.109',
  port: 22,
  username: 'root',
  password: 'Vykuj3546@'
});
