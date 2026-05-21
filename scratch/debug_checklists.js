async function checkChecklists() {
  const BASE_URL = 'https://ehs.garrev.com/app1/v1';
  try {
    const response = await fetch(`${BASE_URL}/admin/checklists`);
    const data = await response.json();
    console.log('Available Checklist Types:');
    console.log(JSON.stringify(data, null, 2));
    
    // Also check for some specific IDs
    const ids = [30, 3, 2, 4, 10]; 
    for (const id of ids) {
        try {
            const res = await fetch(`${BASE_URL}/modules/${id}/checklists`);
            const items = await res.json();
            const count = Array.isArray(items) ? items.length : (items.items ? items.items.length : 0);
            console.log(`Module ${id} has ${count} items`);
        } catch (e) {
            console.log(`Module ${id} check failed: ${e.message}`);
        }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkChecklists();
