
import https from 'https';

const BASE_URL = 'https://ehs.garrev.com/app1/v1';

function fetchSummary(id) {
  return new Promise((resolve) => {
    https.get(`${BASE_URL}/modules/${id}/summary`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve({ id, name: json.module_name || json.name || 'Unknown', data: json });
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    }).on('error', () => {
      resolve(null);
    });
  });
}

async function checkModules() {
  const promises = [];
  for (let i = 1; i <= 65; i++) {
    promises.push(fetchSummary(i));
  }
  const results = await Promise.all(promises);
  const filtered = results.filter(r => r !== null);
  console.log(JSON.stringify(filtered, null, 2));
}

checkModules();
