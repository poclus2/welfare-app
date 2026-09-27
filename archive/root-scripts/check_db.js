
const { Client } = require("ssh2");

const conn = new Client();
conn.on("ready", () => {
  console.log("Client :: ready");
  conn.exec("docker exec welfare-postgres psql -U postgres -d welfare -c \"SELECT * FROM ambassador_application LIMIT 10;\"", (err, stream) => {
    if (err) throw err;
    stream.on("close", (code, signal) => {
      console.log("Stream :: close :: code: " + code + ", signal: " + signal);
      conn.end();
    }).on("data", (data) => {
      console.log("STDOUT: " + data);
    }).stderr.on("data", (data) => {
      console.log("STDERR: " + data);
    });
  });
}).connect({
  host: "169.58.163.109",
  port: 22,
  username: "root",
  password: "Vykuj3546@"
});

