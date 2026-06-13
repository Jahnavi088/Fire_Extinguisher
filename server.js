const http = require('http');
http.createServer((req, res) => {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    console.log("RECEIVED:", body);
    res.end('ok');
    process.exit(0);
  });
}).listen(9999, () => console.log('Listening on 9999'));
