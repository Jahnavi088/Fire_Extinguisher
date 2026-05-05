const BASE_URL = 'https://ehs.garrev.com/app1/v1';
const token = 'YOUR_TOKEN_HERE'; // I don't have the token here, but I can try without it if public or check console later

async function checkModule(id) {
  try {
    const res = await fetch(`${BASE_URL}/modules/${id}/summary`);
    console.log(`Module ${id}: ${res.status}`);
    if (res.ok) {
      const data = await res.json();
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (e) {
    console.log(`Module ${id} error: ${e.message}`);
  }
}

// I can't run this directly as a script that hits external URLs easily if fetch isn't available in the environment.
// But I can use the browser subagent to check.
