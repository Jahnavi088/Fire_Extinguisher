const axios = require('axios');

async function fetchModules() {
  const BASE_URL = 'https://ehs.garrev.com/app1/v1';
  // I don't have a token here, but maybe it works without one or I can see the error
  try {
    const response = await axios.get(`${BASE_URL}/admin/modules-list`);
    console.log(JSON.stringify(response.data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Data:', err.response.data);
    }
  }
}

fetchModules();
