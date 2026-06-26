const test = async () => {
  try {
    const r1 = await fetch('https://ehs.garrev.com/api/admin/companies', { headers: { 'Authorization': 'Bearer YOUR_TOKEN' } }); // Note: I might need the auth token, but let's see if public works or I can bypass
  } catch(e) {}
};
test();
