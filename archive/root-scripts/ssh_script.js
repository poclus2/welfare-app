const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const deployCommand = `
    cd /root/welfare* || cd /var/www/welfare* || exit 1
    echo "Dossier trouvé: $(pwd)"
    git pull origin main
    echo "Git pull terminé."
    # On relance les services selon ce qui tourne (docker ou pnpm/pm2)
    if [ -f "docker-compose.prod.yml" ]; then
      docker compose -f docker-compose.prod.yml up -d --build
    elif [ -f "docker-compose.yml" ]; then
      docker compose up -d --build
    else
      pnpm install
      pnpm run build
      pm2 restart all || echo "PM2 not found or nothing to restart"
    fi
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
  host: '207.180.196.12',
  port: 22,
  username: 'root',
  password: 'Vykuj3546@'
});
