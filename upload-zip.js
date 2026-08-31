const { Client } = require('ssh2'); const fs = require('fs'); const conn = new Client(); conn.on('ready', () => { conn.sftp((err, sftp) => { 
  sftp.fastPut('api-update.zip', '/opt/welfare-app/apps/api/api-update.zip', () => {
    conn.exec('cd /opt/welfare-app/apps/api && unzip -o api-update.zip && cd /opt/welfare-app && docker compose -f docker-compose.prod.yml build api && docker compose -f docker-compose.prod.yml up -d api', (err, stream) => {
      stream.on('data', d => process.stdout.write(d.toString()));
      stream.stderr.on('data', d => process.stderr.write(d.toString()));
      stream.on('close', () => conn.end());
    });
  });
}); }).connect({ host: '169.58.163.109', port: 22, username: 'root', password: 'Vykuj3546@' });
