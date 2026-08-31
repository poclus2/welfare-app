const { Client } = require('ssh2'); const conn = new Client(); conn.on('ready', () => { 
  conn.exec('docker logs --tail 200 welfare-api', (err, stream) => {
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
    stream.on('close', () => conn.end());
  });
}).connect({ host: '169.58.163.109', port: 22, username: 'root', password: 'Vykuj3546@' });
