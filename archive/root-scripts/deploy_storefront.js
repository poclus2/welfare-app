const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const deployCommand = `
    cd /opt/welfare-app || cd /root/welfare* || cd /var/www/welfare* || exit 1
    echo "Dossier trouvé: $(pwd)"
    git pull origin main
    echo "Git pull terminé."
    docker compose -f docker-compose.prod.yml up -d --build storefront
    echo "Déploiement terminé !"
  `;
  conn.exec(deployCommand, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '169.58.163.109',
  port: 22,
  username: 'root',
  password: 'Vykuj3546@'
});
