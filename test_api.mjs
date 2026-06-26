import { ApiService } from './src/services/apiService.js';

async function test() {
  try {
    const companies = await ApiService.getAdminCompanies();
    const c = companies.companies ? companies.companies[0] : companies[0];
    if (c) {
      console.log('Company ID:', c.id || c.company_id);
      const details = await ApiService.getAdminCompanyById(c.id || c.company_id);
      console.log('Company details keys:', Object.keys(details));
      if (details.modules) {
        console.log('Modules length:', details.modules.length);
      }
      
      const adminModules = await ApiService.getAdminModules({ company_id: c.id || c.company_id });
      console.log('Admin Modules length:', adminModules.length || (adminModules.data && adminModules.data.length));
    }
  } catch (e) {
    console.error(e);
  }
}
test();
