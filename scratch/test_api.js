const BASE_URL = 'https://ehs.garrev.com/app1/v1';

async function run() {
  try {
    console.log('Logging in...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'password' })
    });
    
    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token || loginData.data?.token;
    console.log('Login successful! Token acquired.');

    console.log('Fetching inspections...');
    const reportsRes = await fetch(`${BASE_URL}/reports/inspections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!reportsRes.ok) {
      throw new Error(`Failed to fetch reports: ${reportsRes.status} ${await reportsRes.text()}`);
    }

    const reportsData = await reportsRes.json();
    const inspections = Array.isArray(reportsData) ? reportsData : (reportsData.items || reportsData.reports || reportsData.inspections || reportsData.data || []);
    console.log(`Found ${inspections.length} inspections.`);
    
    if (inspections.length > 0) {
      const first = inspections[0];
      console.log('First inspection row summary:', first);
      
      console.log(`Fetching detailed inspection for ID: ${first.id}...`);
      const detailRes = await fetch(`${BASE_URL}/inspections/${first.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!detailRes.ok) {
        throw new Error(`Failed to fetch detail: ${detailRes.status} ${await detailRes.text()}`);
      }
      
      const detailData = await detailRes.json();
      console.log('Detailed inspection response:', JSON.stringify(detailData, null, 2));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
