import { ApiService } from '../src/services/apiService.js';

async function debugCompanies() {
  try {
    const login = await ApiService.login('Admin', 'Eltrive@0011');
    console.log('Login successful');
    const data = await ApiService.getAdminCompanies();
    console.log('Raw data from getAdminCompanies:', JSON.stringify(data, null, 2));
    const companies = Array.isArray(data) ? data : (data?.companies || data?.data || []);
    console.log('Processed companies length:', companies.length);
    if (companies.length > 0) {
      console.log('First company properties:', Object.keys(companies[0]));
      console.log('First company sample:', companies[0]);
    }
  } catch (err) {
    console.error('Error fetching companies:', err.message);
  }
}

debugCompanies();
