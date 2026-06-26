const https = require('https');

https.get('https://ehs.garrev.com/app1/v1/alerts?module_id=31&limit=1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("RESPONSE:", data);
  });
}).on('error', err => {
  console.log("ERROR:", err.message);
});
