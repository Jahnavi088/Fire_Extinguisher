const fs = require('fs');
const file = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard/UserManagement.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update EMPTY_FORM
content = content.replace(
  "const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'inspector', status: 'active', company_id: '', shift_id: '', supervisor_id: '', agm_id: '', availability_status: 'active', leave_start_at: '', leave_end_at: '', leave_reason: '' };",
  "const EMPTY_FORM = { name: '', username: '', email: '', password: '', role: 'inspector', status: 'active', company_id: '', branch_id: '', shift_id: '', supervisor_id: '', agm_id: '', availability_status: 'active', leave_start_at: '', leave_end_at: '', leave_reason: '' };"
);

// 2. Add branches state
content = content.replace(
  "const [agms, setAgms] = useState([]);",
  `const [agms, setAgms] = useState([]);\n  const [branches, setBranches] = useState([]);\n\n  useEffect(() => {\n    if (form.company_id) {\n      ApiService.getBranches({ company_id: form.company_id })\n        .then(data => {\n          setBranches(Array.isArray(data) ? data : (data?.branches || data?.data || []));\n        })\n        .catch(() => setBranches([]));\n    } else {\n      setBranches([]);\n    }\n  }, [form.company_id]);`
);

// 3. Update openEdit to load branch_id
content = content.replace(
  "company_id: u.company_id || '',\n      shift_id: u.shift_id || '',",
  "company_id: u.company_id || '',\n      branch_id: u.branch_id || '',\n      shift_id: u.shift_id || '',"
);

content = content.replace(
  "company_id: actualUser.company_id || '',\n        shift_id: actualUser.shift_id || '',",
  "company_id: actualUser.company_id || '',\n        branch_id: actualUser.branch_id || '',\n        shift_id: actualUser.shift_id || '',"
);

// 4. Update handleSave payload to include branch_id
content = content.replace(
  "company_id: form.company_id,\n          shift_id: form.shift_id ? Number(form.shift_id) : null,",
  "company_id: form.company_id,\n          branch_id: form.branch_id ? Number(form.branch_id) : null,\n          shift_id: form.shift_id ? Number(form.shift_id) : null,"
);

content = content.replace(
  "company_id: form.company_id,\n          shift_id: form.shift_id ? Number(form.shift_id) : null,",
  "company_id: form.company_id,\n          branch_id: form.branch_id ? Number(form.branch_id) : null,\n          shift_id: form.shift_id ? Number(form.shift_id) : null,"
);

fs.writeFileSync(file, content, 'utf8');
console.log('UserManagement updated with branch state and logic!');
