async function run() {
  try {
    const loginRes = await fetch('https://ehs.garrev.com/app1/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'Admin', password: 'Eltrive@0011' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    console.log('--- Fetching equipment detail for ESSPK25260001 ---');
    const res = await fetch(`https://ehs.garrev.com/app1/v1/equipment/ESSPK25260001`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    console.log('Equipment detail:', JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('Error:', err);
  }
}
run();
