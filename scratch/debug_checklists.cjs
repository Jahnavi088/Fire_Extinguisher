const axios = require('axios');

async function checkChecklists() {
  const BASE_URL = 'https://ehs.garrev.com/app1/v1';
  // Note: This script might need a token if the endpoint is protected
  // But based on the code, some endpoints might be public or use a stored token
  // I'll try to fetch the list of available checklists
  try {
    const response = await axios.get(`${BASE_URL}/admin/checklists`);
    console.log('Available Checklist Types:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Also check for some specific IDs
    const ids = [30, 3, 2, 4, 10]; 
    for (const id of ids) {
        try {
            const res = await axios.get(`${BASE_URL}/modules/${id}/checklists`);
            console.log(`Module ${id} has ${res.data.length || (res.data.items ? res.data.items.length : 0)} items`);
        } catch (e) {
            console.log(`Module ${id} check failed: ${e.message}`);
        }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkChecklists();
