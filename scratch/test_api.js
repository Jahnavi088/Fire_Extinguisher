// Using built-in fetch

const BASE_URL = 'https://ehs.garrev.com/app1/v1';

async function testApi() {
  const endpoints = [
    { name: 'Health Check', path: '/health', method: 'GET' },
    { name: 'Platform Dashboard', path: '/dashboard', method: 'GET', auth: true },
    { name: 'Alerts Summary', path: '/alerts/summary', method: 'GET' },
    { name: 'Pending Updates', path: '/updates/pending', method: 'GET', auth: true },
  ];

  console.log('--- SOS API CONNECTIVITY TEST ---');
  
  for (const ep of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          // We don't have a real token here, so we expect 401 for auth endpoints
          // but a success for public ones.
        }
      });
      
      console.log(`[${ep.name}] Status: ${response.status} ${response.statusText}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`   Data received: ${JSON.stringify(data).substring(0, 50)}...`);
      }
    } catch (err) {
      console.error(`[${ep.name}] FAILED: ${err.message}`);
    }
  }
}

testApi();
