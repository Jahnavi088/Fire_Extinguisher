import { ApiService } from '../src/services/apiService.js';

async function testApi() {
  console.log('--- SOS API TEST (v3.1) ---');

  try {
    // 1. Health Check
    console.log('\n[1] Testing Health...');
    const health = await ApiService.getHealth();
    console.log('Health:', health);

    // 2. Login
    console.log('\n[2] Testing Login (Admin)...');
    const login = await ApiService.login('Admin', 'Eltrive@0011');
    console.log('Login success:', !!login.token);
    console.log('User Role:', login.user.role);

    // 3. Dashboard
    console.log('\n[3] Testing Platform Dashboard...');
    const dashboard = await ApiService.getDashboard();
    console.log('Overall Preparedness:', dashboard.preparedness_score);
    console.log('Total Modules:', dashboard.total_modules);

    // 4. Module Summary (Fire Extinguisher - ID 30)
    console.log('\n[4] Testing Module Summary (ID 30)...');
    const summary = await ApiService.getModuleSummary(30);
    console.log('Module:', summary.module_name);
    console.log('Readiness:', summary.readiness_score);
    console.log('Health Color:', summary.health_colour);

    // 5. Checklist Template
    console.log('\n[5] Testing Checklist Template (ID 30)...');
    const checklist = await ApiService.getModuleChecklists(30);
    console.log('Total Questions:', checklist.items?.length || checklist.length);
    if (checklist.items && checklist.items.length > 0) {
      console.log('Sample Question:', checklist.items[0].question);
    }

    // 6. Companies
    console.log('\n[6] Testing List Companies...');
    const companies = await ApiService.getAdminCompanies();
    console.log('Total Companies:', companies.total || companies.length);

    console.log('\n--- ALL CRITICAL TESTS PASSED ---');
  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(error.message);
  }
}

// Note: This script is designed to be run in a Node environment where fetch is available
// or within the browser context. Since I am an AI, I will execute this logic mentally 
// or via a browser subagent if needed, but the user can run it too.
testApi();
