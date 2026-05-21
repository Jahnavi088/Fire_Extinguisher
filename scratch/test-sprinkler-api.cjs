async function run() {
  try {
    const loginRes = await fetch('https://ehs.garrev.com/app1/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Admin', password: 'Eltrive@0011' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log('--- Fetching equipment for module 31 (Sprinklers) ---');
    const res = await fetch(`https://ehs.garrev.com/app1/v1/equipment?module_id=31&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Equipment items sample:', JSON.stringify(data.items, null, 2));

    // Also test fetching with specific status filters
    for (let status of ['active', 'needs-service', 'needs_service', 'expired', 'due-inspection', 'due_inspection']) {
      const resFilter = await fetch(`https://ehs.garrev.com/app1/v1/equipment?module_id=31&status=${status}&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataFilter = await resFilter.json();
      console.log(`Status filter '${status}': total = ${dataFilter.total || 0}`);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}
run();
