import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './CompanyManagement.css';
const API_BASE = 'https://ehs.garrev.com';

const resolveLogoUrl = (input) => {
  if (!input) return null;
  let logo = '';
  if (typeof input === 'string') {
    logo = input;
  } else if (typeof input === 'object') {
    logo = input.logo_url || input.logo || input.company_logo || input.company_logo_url || (input.data && (input.data.logo_url || input.data.logo));
  }
  if (!logo) return null;
  if (logo.startsWith('http')) return logo;
  if (logo.startsWith('/uploads/logos/')) return `${API_BASE}${logo}`;
  if (logo.startsWith('uploads/logos/')) return `${API_BASE}/${logo}`;
  return `${API_BASE}/uploads/logos/${logo}`;
};

const CompanyManagement = ({ onBack, onNavigate }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', emailDomains: '', building_name: '', zone_name: '', area_name: '', department_name: '', number_of_floors: '5' });
  const [editForm, setEditForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', emailDomains: '', buildings: [], zones: [], areas: [], departments: [], number_of_floors: '5', new_building: '', new_zone: '', new_area: '', new_department: '' });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({ name: '', companyId: '', email: '', phone: '' });
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemValue, setEditingItemValue] = useState('');
  const [selectedLocationCompany, setSelectedLocationCompany] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  const [locationForm, setLocationForm] = useState({
    branches: [],
    buildings: [],
    floors: [],
    zones: [],
    departments: [],
    new_branch: '',
    new_building: '',
    new_floor: '',
    new_zone: '',
    new_department: ''
  });

  const [selectedParentBr, setSelectedParentBr] = useState('');
  const [selectedParentBld, setSelectedParentBld] = useState('');
  const [selectedParentFl, setSelectedParentFl] = useState('');
  const [selectedParentZn, setSelectedParentZn] = useState('');
  const [creatorMode, setCreatorMode] = useState('branch'); // 'branch', 'building', 'floor', 'zone', 'department'
  const [expandedBranches, setExpandedBranches] = useState([]);

  const addFileRef = useRef();
  const editFileRef = useRef();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const refreshHierarchy = async () => {
    if (!selectedLocationCompany) return;
    const companyId = selectedLocationCompany.id || selectedLocationCompany.company_id;
    try {
      // 1. Fetch branches for the company
      const branchesRes = await ApiService.getBranches({ company_id: companyId });
      const branchesList = (Array.isArray(branchesRes) ? branchesRes : (branchesRes?.branches || branchesRes?.data || []))
        .filter(b => !companyId || String(b.company_id) === String(companyId));
      
      let allBuildings = [];
      let allFloors = [];
      let allZones = [];
      let allDepartments = [];
      
      // 2. Extract Buildings directly from Branches
      branchesList.forEach(branch => {
        const bList = Array.isArray(branch.buildings) ? branch.buildings : [];
        allBuildings = allBuildings.concat(bList.map(b => ({ id: b.id, name: b.building_name || b.name, branch_id: branch.id, floors: b.floors })));
      });

      // 3. Extract Floors
      allBuildings.forEach(bld => {
        const fList = Array.isArray(bld.floors) ? bld.floors : [];
        allFloors = allFloors.concat(fList.map(f => ({ id: f.id, name: f.floor_name || f.name, building_id: bld.id, zones: f.zones })));
      });

      // 4. Extract Zones
      allFloors.forEach(fl => {
        const zList = Array.isArray(fl.zones) ? fl.zones : [];
        allZones = allZones.concat(zList.map(z => ({ id: z.id, name: z.zone_name || z.name, floor_id: fl.id, departments: z.departments })));
      });

      // 5. Extract Departments
      allZones.forEach(zn => {
        const dList = Array.isArray(zn.departments) ? zn.departments : [];
        allDepartments = allDepartments.concat(dList.map(d => ({ id: d.id, name: d.department_name || d.name, zone_id: zn.id })));
      });
      
      setLocationForm(f => ({
        ...f,
        branches: branchesList.map(b => ({ id: b.id, name: b.branch_name || b.name || `Branch #${b.id}` })),
        buildings: allBuildings,
        floors: allFloors,
        zones: allZones,
        departments: allDepartments
      }));
    } catch (err) {
      console.error("Failed to load hierarchy details:", err);
    }
  };

  useEffect(() => {
    if (selectedLocationCompany) {
      refreshHierarchy();
    }
  }, [selectedLocationCompany]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getAdminCompanies();
      const list = Array.isArray(data) ? data : (data?.companies || data?.data || []);

      // Fetch detailed records for each company to get full data (like logo, address, email)
      const detailedCompanies = await Promise.all(
        list.map(async (c) => {
          try {
            const detail = await ApiService.getAdminCompanyById(c.id || c.company_id);
            return { ...c, ...(detail?.data || detail || {}) };
          } catch (e) {
            console.warn(`Failed to fetch full details for company ${c.id}`, e);
            return c;
          }
        })
      );

      setCompanies(detailedCompanies);
      setError(null);
    } catch (err) {
      setError('Failed to load companies. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e, isEdit) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (isEdit) {
        setEditForm((f) => ({ ...f, logo: file, logoPreview: ev.target.result }));
      } else {
        setAddForm((f) => ({ ...f, logo: file, logoPreview: ev.target.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const openAdd = () => {
    setFormErrors({ name: '', companyId: '', email: '', phone: '' });
    setAddForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', emailDomains: '', building_name: '', zone_name: '', area_name: '', department_name: '', number_of_floors: '5' });
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setFormErrors({ name: '', companyId: '', email: '', phone: '' });
    setShowAddModal(false);
    setAddForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', emailDomains: '', building_name: '', zone_name: '', area_name: '', department_name: '', number_of_floors: '5' });
  };

  const saveAdd = async () => {
    setFormErrors({ name: '', companyId: '', email: '', phone: '' });
    const errors = {};
    const requestedName = addForm.name.trim();
    const requestedRef = addForm.companyId.trim();

    if (!requestedName) {
      errors.name = 'Company Name is required.';
    }
    if (!requestedRef) {
      errors.companyId = 'Company ID is required.';
    }

    const emailVal = addForm.email.trim();
    if (emailVal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        errors.email = 'Invalid email address.';
      }
    }

    const phoneVal = addForm.phone.trim();
    if (phoneVal) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(phoneVal)) {
        errors.phone = 'Invalid phone number.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    try {
      // Fetch fresh list to avoid stale duplicate checks
      const freshData = await ApiService.getAdminCompanies();
      const allCompanies = Array.isArray(freshData) ? freshData : (freshData?.companies || freshData?.data || []);

      const duplicateId = allCompanies.find((company) => {
        const id = String(company.comapany_ref || company.company_ref || company.company_id || company.companyId || '').trim().toLowerCase();
        return id === requestedRef.toLowerCase();
      });

      if (duplicateId) {
        setFormErrors(prev => ({ ...prev, companyId: 'Company ID is already taken.' }));
        setSaving(false);
        return;
      }

      const duplicateName = allCompanies.find((company) => {
        const name = String(company.name || '').trim().toLowerCase();
        return name === requestedName.toLowerCase();
      });

      if (duplicateName) {
        setFormErrors(prev => ({ ...prev, name: 'Company Name is already taken.' }));
        setSaving(false);
        return;
      }

      const company = await ApiService.createAdminCompany({
        name: requestedName,
        comapany_ref: requestedRef,
        email: addForm.email.trim(),
        email_domains: addForm.emailDomains.trim(),
        address: addForm.address.trim(),
        phone: addForm.phone.trim()
      });

      // Initialize default onboarding locations
      try {
        const localLocs = JSON.parse(localStorage.getItem('local_onboarding_locations') || '{}');
        if (!localLocs[requestedRef]) {
          const generatedFloors = [
            { id: 'FLR-GF', name: 'Ground Floor' },
            { id: 'FLR-1', name: '1st Floor' },
            { id: 'FLR-2', name: '2nd Floor' },
            { id: 'FLR-3', name: '3rd Floor' },
            { id: 'FLR-4', name: '4th Floor' },
            { id: 'FLR-01', name: 'Basement' }
          ];
          localLocs[requestedRef] = {
            buildings: [],
            zones: [],
            areas: [],
            departments: [],
            floors: generatedFloors
          };
          localStorage.setItem('local_onboarding_locations', JSON.stringify(localLocs));
        }
      } catch (e) {
        console.error('Failed to initialize local locations:', e);
      }

      const companyId = company?.data?.id || company?.id;
      if (addForm.logo && companyId) {
        try {
          const formData = new FormData();
          formData.append('logo', addForm.logo);
          await ApiService.uploadCompanyLogo(companyId, formData);
        } catch (uploadErr) {
          alert(`Company created, but logo upload failed: ${uploadErr.message}`);
        }
      }

      await fetchCompanies();
      showToast('Company created successfully.');
      closeAdd();
    } catch (err) {
      const msg = err.message || '';
      const isGeneric500 = msg === 'HTTP error! status: 500' || msg === `HTTP error! status: 500`;
      if (isGeneric500) {
        alert('Server Error (500): The server failed to save this company. The Company ID or Name may already be taken. Please try a different ID or name.');
      } else {
        alert(msg || 'Failed to create company.');
      }
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (company) => {
    setFormErrors({ name: '', companyId: '', email: '', phone: '' });
    setEditTarget(company);

    let bldList = [];
    let znList = [];
    let arList = [];
    let dpList = [];
    let flCount = '5';
    try {
      const localLocs = JSON.parse(localStorage.getItem('local_onboarding_locations') || '{}');
      const match = localLocs[company.comapany_ref || company.company_ref || ''];
      if (match) {
        bldList = match.buildings || [];
        znList = match.zones || [];
        arList = match.areas || [];
        dpList = match.departments || [];
        if (match.floors) {
          flCount = String(match.floors.length - 1);
        }
      }
    } catch (e) { }

    setEditForm({
      name: company.name,
      companyId: company.comapany_ref || company.company_ref || '',
      logo: null,
      logoPreview: resolveLogoUrl(company),
      email: company.email || '',
      address: company.address || '',
      phone: company.phone || '',
      emailDomains: company.email_domains || '',
      buildings: bldList,
      zones: znList,
      areas: arList,
      departments: dpList,
      number_of_floors: flCount,
      new_building: '',
      new_zone: '',
      new_area: '',
      new_department: ''
    });
    setShowEditModal(true);
  };

  const closeEdit = () => {
    setFormErrors({ name: '', companyId: '', email: '', phone: '' });
    setShowEditModal(false);
    setEditTarget(null);
    setEditForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', emailDomains: '', buildings: [], zones: [], areas: [], departments: [], number_of_floors: '5', new_building: '', new_zone: '', new_area: '', new_department: '' });
  };

  const saveEdit = async () => {
    setFormErrors({ name: '', companyId: '', email: '', phone: '' });
    const errors = {};
    const requestedName = editForm.name.trim();
    const requestedRef = editForm.companyId.trim();

    if (!requestedName) {
      errors.name = 'Company Name is required.';
    }
    if (!requestedRef) {
      errors.companyId = 'Company ID is required.';
    }

    const emailVal = editForm.email.trim();
    if (emailVal) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailVal)) {
        errors.email = 'Invalid email address.';
      }
    }

    const phoneVal = editForm.phone.trim();
    if (phoneVal) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(phoneVal)) {
        errors.phone = 'Invalid phone number.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const originalRef = String(editTarget.comapany_ref || editTarget.company_ref || editTarget.company_id || editTarget.companyId || '').trim();
    const originalName = String(editTarget.name || '').trim();
    const refChanged = requestedRef !== originalRef;
    const nameChanged = requestedName !== originalName;

    const otherCompanies = companies.filter(c => c.id !== editTarget.id);

    if (refChanged) {
      const duplicateId = otherCompanies.find((company) => {
        const id = String(company.comapany_ref || company.company_ref || company.company_id || company.companyId || '').trim().toLowerCase();
        return id === requestedRef.toLowerCase();
      });
      if (duplicateId) {
        setFormErrors(prev => ({ ...prev, companyId: 'Company ID is already taken.' }));
        return;
      }
    }

    if (nameChanged) {
      const duplicateName = otherCompanies.find((company) => {
        const name = String(company.name || '').trim().toLowerCase();
        return name === requestedName.toLowerCase();
      });
      if (duplicateName) {
        setFormErrors(prev => ({ ...prev, name: 'Company Name already exists.' }));
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        email: editForm.email.trim(),
        email_domains: editForm.emailDomains.trim(),
        address: editForm.address.trim(),
        phone: editForm.phone.trim()
      };
      if (nameChanged) payload.name = requestedName;
      if (refChanged) payload.comapany_ref = requestedRef;

      await ApiService.updateAdminCompany(editTarget.id, payload);

      // Save local onboarding locations on edit
      try {
        const localLocs = JSON.parse(localStorage.getItem('local_onboarding_locations') || '{}');
        const numFloors = parseInt(editForm.number_of_floors) || 5;
        const generatedFloors = [];
        generatedFloors.push({ id: 'FLR-GF', name: 'Ground Floor' });
        for (let f = 1; f < numFloors; f++) {
          const suffix = f === 1 ? 'st' : f === 2 ? 'nd' : f === 3 ? 'rd' : 'th';
          generatedFloors.push({ id: `FLR-${f}`, name: `${f}${suffix} Floor` });
        }
        generatedFloors.push({ id: 'FLR-01', name: 'Basement' });

        localLocs[requestedRef] = {
          buildings: editForm.buildings,
          zones: editForm.zones,
          areas: editForm.areas,
          departments: editForm.departments || [],
          floors: generatedFloors
        };
        localStorage.setItem('local_onboarding_locations', JSON.stringify(localLocs));
      } catch (e) {
        console.error('Failed to update local locations:', e);
      }

      if (editForm.logo) {
        try {
          const formData = new FormData();
          formData.append('logo', editForm.logo);
          await ApiService.uploadCompanyLogo(editTarget.id, formData);
        } catch (uploadErr) {
          alert(`Company updated, but logo upload failed: ${uploadErr.message}`);
        }
      }

      await fetchCompanies();
      showToast('Company updated successfully.');
      closeEdit();
    } catch (err) {
      const msg = err.message || '';
      const isGeneric500 = msg === 'HTTP error! status: 500';
      if (isGeneric500) {
        alert('Server Error (500): Failed to update company. The Company ID or Name may conflict with an existing record.');
      } else {
        alert(msg || 'Failed to update company.');
      }
    } finally {
      setSaving(false);
    }
  };

  const openLocationSetup = (company) => {
    setSelectedLocationCompany(company);
    setSelectedParentBr('');
    setSelectedParentBld('');
    setSelectedParentFl('');
    setSelectedParentZn('');
    setCreatorMode('branch');
    setLocationForm({
      branches: [],
      buildings: [],
      floors: [],
      zones: [],
      departments: [],
      new_branch: '',
      new_building: '',
      new_floor: '',
      new_zone: '',
      new_department: ''
    });
  };

  const saveLocationSetup = () => {
    setSelectedLocationCompany(null);
  };

  const confirmDeleteCompany = (company) => {
    setDeleteConfirm({ type: 'company', company });
  };

  const executeDeleteCompany = async (company) => {
    try {
      await ApiService.deleteAdminCompany(company.id);
      await fetchCompanies();
      showToast('Company deleted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to delete company.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const confirmDeleteItem = (type, id, name) => {
    setDeleteConfirm({ type: 'item', itemType: type, id, name });
  };

  const executeDeleteItem = async (item) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      if (item.itemType === 'branch') await ApiService.deleteBranch(item.id);
      else if (item.itemType === 'building') await ApiService.deleteBuilding(item.id);
      else if (item.itemType === 'floor') await ApiService.deleteFloor(item.id);
      else if (item.itemType === 'zone') await ApiService.deleteZone(item.id);
      else if (item.itemType === 'department') await ApiService.deleteDepartmentHierarchy(item.id);

      await refreshHierarchy();
      setActionSuccess(`${item.itemType.charAt(0).toUpperCase() + item.itemType.slice(1)} deleted successfully.`);
    } catch (err) {
      setActionError(err.message || 'Deletion failed.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (selectedLocationCompany) {
    const smlInput = {
      padding: '6px 10px', fontSize: '12px', background: '#fff',
      border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px',
      height: '32px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
      width: '100%'
    };
    const addBtn = (bg) => ({
      padding: '0 14px', background: bg, color: '#fff', border: 'none',
      borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
      height: '32px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '5px',
      flexShrink: 0
    });
    const iconEditBtn = {
      background: 'rgba(59,130,246,0.1)', border: 'none', color: '#3b82f6',
      borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
    };
    const iconDelBtn = {
      background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444',
      borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
    };
    const secLabel = {
      fontSize: '10px', fontWeight: '800', color: '#64748b', letterSpacing: '0.8px',
      textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px'
    };
    const listBox = {
      background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px',
      maxHeight: '400px', overflowY: 'auto', fontSize: '12px', padding: '8px 12px'
    };
    const rowBase = (indentLeft, bg) => ({
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      paddingTop: '5px', paddingBottom: '5px', paddingRight: '10px',
      paddingLeft: indentLeft,
      borderBottom: '1px solid #f1f5f9', background: bg || '#fff',
      color: '#334155', minHeight: '32px'
    });
    const inlineEdit = (w) => ({
      ...smlInput, height: '24px', width: w, fontSize: '11px', padding: '2px 6px'
    });
    const smallSave = { background: '#10b981', border: 'none', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', height: '24px', fontWeight: '600' };
    const smallCancel = { background: '#64748b', border: 'none', color: '#fff', fontSize: '10px', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', height: '24px' };

    const handleCreateItem = async () => {
      setActionError(null);
      setActionSuccess(null);
      try {
        const companyId = selectedLocationCompany.id || selectedLocationCompany.company_id;
        if (creatorMode === 'branch') {
          const name = locationForm.new_branch.trim();
          if (!name) { setActionError('Please enter a branch name.'); return; }
          await ApiService.createBranch({ branch_name: name, company_id: Number(companyId) });
          setLocationForm(f => ({ ...f, new_branch: '' }));
          setActionSuccess('Branch created successfully.');
        } else if (creatorMode === 'building') {
          const name = locationForm.new_building.trim();
          if (!name) { setActionError('Please enter a building name.'); return; }
          if (!selectedParentBr) { setActionError('Please select a branch first.'); return; }
          await ApiService.createBuilding({ building_name: name, branch_id: Number(selectedParentBr) });
          setLocationForm(f => ({ ...f, new_building: '' }));
          setActionSuccess('Building created successfully.');
        } else if (creatorMode === 'floor') {
          const name = locationForm.new_floor.trim();
          if (!name) { setActionError('Please enter a floor name.'); return; }
          if (!selectedParentBld) { setActionError('Please select a building first.'); return; }
          await ApiService.createFloor({ floor_name: name, building_id: Number(selectedParentBld) });
          setLocationForm(f => ({ ...f, new_floor: '' }));
          setActionSuccess('Floor created successfully.');
        } else if (creatorMode === 'zone') {
          const name = locationForm.new_zone.trim();
          if (!name) { setActionError('Please enter a zone name.'); return; }
          if (!selectedParentFl) { setActionError('Please select a floor first.'); return; }
          await ApiService.createZone({ zone_name: name, floor_id: Number(selectedParentFl) });
          setLocationForm(f => ({ ...f, new_zone: '' }));
          setActionSuccess('Zone created successfully.');
        } else if (creatorMode === 'department') {
          const name = locationForm.new_department.trim();
          if (!name) { setActionError('Please enter a department name.'); return; }
          if (!selectedParentZn) { setActionError('Please select a zone first.'); return; }
          await ApiService.createDepartmentHierarchy({ department_name: name, zone_id: Number(selectedParentZn) });
          setLocationForm(f => ({ ...f, new_department: '' }));
          setActionSuccess('Department created successfully.');
        }
        await refreshHierarchy();
      } catch (err) {
        setActionError(err.message || 'Action failed.');
      }
    };

    const handleUpdateItem = async (type, id, newValue) => {
      setActionError(null);
      setActionSuccess(null);
      try {
        if (type === 'branch') {
          await ApiService.updateBranch(id, { branch_name: newValue });
        } else if (type === 'building') {
          await ApiService.updateBuilding(id, { building_name: newValue });
        } else if (type === 'floor') {
          await ApiService.updateFloor(id, { floor_name: newValue });
        } else if (type === 'zone') {
          await ApiService.updateZone(id, { zone_name: newValue });
        } else if (type === 'department') {
          await ApiService.updateDepartmentHierarchy(id, { department_name: newValue });
        }
        setEditingItemId(null);
        await refreshHierarchy();
        setActionSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully.`);
      } catch (err) {
        setActionError(err.message || 'Failed to update item.');
      }
    };



    return (
      <div className="ea-page" style={{ padding: '16px 20px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <button className="setup-back-btn" onClick={() => { setSelectedLocationCompany(null); setActionError(null); }} title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.2px' }}>
              EHS Location &amp; Department Setup Workspace
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Configuring: <strong style={{ color: '#3b82f6' }}>{selectedLocationCompany.name}</strong>
            </div>
          </div>
        </div>

        {/* Error response display */}
        {actionError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            padding: '10px 14px',
            fontSize: '12.5px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <span><strong>Error:</strong> {actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Success response display */}
        {actionSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            color: '#059669',
            padding: '10px 14px',
            fontSize: '12.5px',
            marginBottom: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>✅</span>
              <span><strong>Success:</strong> {actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              style={{ background: 'transparent', border: 'none', color: '#059669', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}
            >
              &times;
            </button>
          </div>
        )}

        {/* Content panel */}
        <div style={{ background: '#fff', padding: '18px 22px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }}>
          
          {/* LEFT COLUMN: Tabbed Configuration Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderRight: '1px solid #f1f5f9', paddingRight: '16px' }}>
            <div style={secLabel}>Hierarchy Level Setup</div>
            
            {/* Creator Mode Tabs */}
            <div style={{ display: 'flex', gap: '3px', background: '#f1f5f9', padding: '3px', borderRadius: '7px' }}>
              {[
                { mode: 'branch', label: 'Branch' },
                { mode: 'building', label: 'Building' },
                { mode: 'floor', label: 'Floor' },
                { mode: 'zone', label: 'Zone' },
                { mode: 'department', label: 'Department' }
              ].map(opt => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setCreatorMode(opt.mode)}
                  style={{
                    flex: 1,
                    background: creatorMode === opt.mode ? '#fff' : 'transparent',
                    color: creatorMode === opt.mode ? '#0f172a' : '#64748b',
                    border: 'none', borderRadius: '5px', padding: '6px 0',
                    fontSize: '11px', fontWeight: creatorMode === opt.mode ? '700' : '500',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: creatorMode === opt.mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Form Fields depending on Creator Mode */}
            {creatorMode === 'branch' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Branch / Plant Name</label>
                  <input
                    style={smlInput}
                    placeholder="e.g. Main Plant, Branch Office"
                    value={locationForm.new_branch}
                    onChange={e => setLocationForm(f => ({ ...f, new_branch: e.target.value }))}
                  />
                </div>
                <button type="button" style={{ ...addBtn('#e11d48'), alignSelf: 'flex-start', marginTop: '6px' }} onClick={handleCreateItem}>
                  + Add Branch
                </button>
              </div>
            )}
            {creatorMode === 'building' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Select Branch / Plant</label>
                  <select style={{ ...smlInput, color: '#0f172a', background: '#ffffff' }} value={selectedParentBr} onChange={e => setSelectedParentBr(e.target.value)}>
                    <option value="" style={{ color: '#0f172a', background: '#ffffff' }}>— Select Branch —</option>
                    {locationForm.branches.map(b => (
                      <option key={b.id} value={b.id} style={{ color: '#0f172a', background: '#ffffff' }}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Building Name</label>
                  <input
                    style={smlInput}
                    placeholder="e.g. Production Building, R&D Hub"
                    value={locationForm.new_building}
                    onChange={e => setLocationForm(f => ({ ...f, new_building: e.target.value }))}
                  />
                </div>
                <button type="button" style={{ ...addBtn('#2563eb'), alignSelf: 'flex-start', marginTop: '6px' }} onClick={handleCreateItem}>
                  + Add Building
                </button>
              </div>
            )}

            {creatorMode === 'floor' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Select Building</label>
                  <select style={{ ...smlInput, color: '#0f172a', background: '#ffffff' }} value={selectedParentBld} onChange={e => setSelectedParentBld(e.target.value)}>
                    <option value="" style={{ color: '#0f172a', background: '#ffffff' }}>— Select Building —</option>
                    {locationForm.buildings.map(b => (
                      <option key={b.id} value={b.id} style={{ color: '#0f172a', background: '#ffffff' }}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Floor Name</label>
                  <input
                    style={smlInput}
                    placeholder="e.g. Ground Floor, 1st Floor"
                    value={locationForm.new_floor}
                    onChange={e => setLocationForm(f => ({ ...f, new_floor: e.target.value }))}
                  />
                </div>
                <button type="button" style={{ ...addBtn('#10b981'), alignSelf: 'flex-start', marginTop: '6px' }} onClick={handleCreateItem}>
                  + Add Floor
                </button>
              </div>
            )}

            {creatorMode === 'zone' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Select Floor</label>
                  <select style={{ ...smlInput, color: '#0f172a', background: '#ffffff' }} value={selectedParentFl} onChange={e => setSelectedParentFl(e.target.value)}>
                    <option value="" style={{ color: '#0f172a', background: '#ffffff' }}>— Select Floor —</option>
                    {locationForm.floors.map(f => {
                      const bld = locationForm.buildings.find(b => b.id === f.building_id);
                      return (
                        <option key={f.id} value={f.id} style={{ color: '#0f172a', background: '#ffffff' }}>
                          {bld ? `${bld.name} > ` : ''}{f.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Zone Name</label>
                  <input
                    style={smlInput}
                    placeholder="e.g. Zone A, Clean Room 1"
                    value={locationForm.new_zone}
                    onChange={e => setLocationForm(f => ({ ...f, new_zone: e.target.value }))}
                  />
                </div>
                <button type="button" style={{ ...addBtn('#f59e0b'), alignSelf: 'flex-start', marginTop: '6px' }} onClick={handleCreateItem}>
                  + Add Zone
                </button>
              </div>
            )}

            {creatorMode === 'department' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Select Zone</label>
                  <select style={{ ...smlInput, color: '#0f172a', background: '#ffffff' }} value={selectedParentZn} onChange={e => setSelectedParentZn(e.target.value)}>
                    <option value="" style={{ color: '#0f172a', background: '#ffffff' }}>— Select Zone —</option>
                    {locationForm.zones.map(z => {
                      const fl = locationForm.floors.find(f => f.id === z.floor_id);
                      const bld = fl ? locationForm.buildings.find(b => b.id === fl.building_id) : null;
                      return (
                        <option key={z.id} value={z.id} style={{ color: '#0f172a', background: '#ffffff' }}>
                          {bld ? `${bld.name} > ` : ''}{fl ? `${fl.name} > ` : ''}{z.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>Department Name</label>
                  <input
                    style={smlInput}
                    placeholder="e.g. Granulation, Quality Control"
                    value={locationForm.new_department}
                    onChange={e => setLocationForm(f => ({ ...f, new_department: e.target.value }))}
                  />
                </div>
                <button type="button" style={{ ...addBtn('#7c3aed'), alignSelf: 'flex-start', marginTop: '6px' }} onClick={handleCreateItem}>
                  + Add Department
                </button>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Hierarchical Tree Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={secLabel}>Location Hierarchy Preview</div>
            
            {locationForm.branches.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', border: '1px dashed #cbd5e1', borderRadius: '8px', fontSize: '12px' }}>
                No branches setup for this company. Create a Branch/Plant using the "Branch" tab first.
              </div>
            ) : (
              <div style={listBox}>
                {locationForm.branches.map(br => {
                  const brBuildings = locationForm.buildings.filter(b => b.branch_id === br.id);
                  return (
                    <div key={br.id} style={{ marginBottom: '10px' }}>
                      <div style={{ ...rowBase(0, 'transparent'), fontWeight: '700', fontSize: '13px', color: '#1e3a8a', borderBottom: 'none', minHeight: '28px', paddingTop: '2px', paddingBottom: '2px' }}>
                        <span 
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                          onClick={() => {
                            if (editingItemId !== br.id) {
                              setExpandedBranches(prev => 
                                prev.includes(br.id) ? prev.filter(id => id !== br.id) : [...prev, br.id]
                              );
                            }
                          }}
                        >
                          <span style={{ fontSize: '10px' }}>{expandedBranches.includes(br.id) ? '▼' : '▶'}</span>
                          <span>📍</span>
                          {editingItemId === br.id ? (
                            <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('150px')} autoFocus onClick={e => e.stopPropagation()} />
                          ) : br.name}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {editingItemId === br.id ? (
                            <>
                              <button style={smallSave} onClick={() => handleUpdateItem('branch', br.id, editingItemValue)}>Save</button>
                              <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button style={iconEditBtn} onClick={() => { setEditingItemId(br.id); setEditingItemValue(br.name); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                              <button style={iconDelBtn} onClick={() => confirmDeleteItem('branch', br.id, br.name)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg></button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Buildings */}
                      {expandedBranches.includes(br.id) && (
                      <div style={{ paddingLeft: '16px', borderLeft: '1px dashed #cbd5e1', marginLeft: '6px' }}>
                        {brBuildings.map(bld => {
                          const bldFloors = locationForm.floors.filter(f => f.building_id === bld.id);
                          return (
                            <div key={bld.id}>
                              <div style={rowBase(6, 'transparent')}>
                                <span style={{ fontWeight: '600', color: '#334155', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <span>🏢</span>
                                  {editingItemId === bld.id ? (
                                    <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('150px')} autoFocus />
                                  ) : bld.name}
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {editingItemId === bld.id ? (
                                    <>
                                      <button style={smallSave} onClick={() => handleUpdateItem('building', bld.id, editingItemValue)}>Save</button>
                                      <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <button style={iconEditBtn} onClick={() => { setEditingItemId(bld.id); setEditingItemValue(bld.name); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                                      <button style={iconDelBtn} onClick={() => confirmDeleteItem('building', bld.id, bld.name)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg></button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Floors */}
                              <div style={{ paddingLeft: '16px', borderLeft: '1px dashed #cbd5e1', marginLeft: '6px' }}>
                                {bldFloors.map(flr => {
                                  const flrZones = locationForm.zones.filter(z => z.floor_id === flr.id);
                                  return (
                                    <div key={flr.id}>
                                      <div style={rowBase(6, 'transparent')}>
                                        <span style={{ color: '#475569', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                          <span>🪜</span>
                                          {editingItemId === flr.id ? (
                                            <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('140px')} autoFocus />
                                          ) : flr.name}
                                        </span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          {editingItemId === flr.id ? (
                                            <>
                                              <button style={smallSave} onClick={() => handleUpdateItem('floor', flr.id, editingItemValue)}>Save</button>
                                              <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                                            </>
                                          ) : (
                                            <>
                                              <button style={iconEditBtn} onClick={() => { setEditingItemId(flr.id); setEditingItemValue(flr.name); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                                              <button style={iconDelBtn} onClick={() => confirmDeleteItem('floor', flr.id, flr.name)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg></button>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {/* Zones */}
                                      <div style={{ paddingLeft: '16px', borderLeft: '1px dashed #cbd5e1', marginLeft: '6px' }}>
                                        {flrZones.map(zn => {
                                          const znDepts = locationForm.departments.filter(d => d.zone_id === zn.id);
                                          return (
                                            <div key={zn.id}>
                                              <div style={rowBase(6, 'transparent')}>
                                                <span style={{ color: '#475569', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                  <span>🔘</span>
                                                  {editingItemId === zn.id ? (
                                                    <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('130px')} autoFocus />
                                                  ) : zn.name}
                                                </span>
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                  {editingItemId === zn.id ? (
                                                    <>
                                                      <button style={smallSave} onClick={() => handleUpdateItem('zone', zn.id, editingItemValue)}>Save</button>
                                                      <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <button style={iconEditBtn} onClick={() => { setEditingItemId(zn.id); setEditingItemValue(zn.name); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                                                      <button style={iconDelBtn} onClick={() => confirmDeleteItem('zone', zn.id, zn.name)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg></button>
                                                    </>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Departments */}
                                              <div style={{ paddingLeft: '16px', borderLeft: '1px dashed #cbd5e1', marginLeft: '6px' }}>
                                                {znDepts.map(dept => (
                                                  <div key={dept.id} style={rowBase(6, 'transparent')}>
                                                    <span style={{ color: '#64748b', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                      <span>◈</span>
                                                      {editingItemId === dept.id ? (
                                                        <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('120px')} autoFocus />
                                                      ) : dept.name}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                      {editingItemId === dept.id ? (
                                                        <>
                                                          <button style={smallSave} onClick={() => handleUpdateItem('department', dept.id, editingItemValue)}>Save</button>
                                                          <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                                                        </>
                                                      ) : (
                                                        <>
                                                          <button style={iconEditBtn} onClick={() => { setEditingItemId(dept.id); setEditingItemValue(dept.name); }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg></button>
                                                          <button style={iconDelBtn} onClick={() => confirmDeleteItem('department', dept.id, dept.name)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg></button>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>

                                            </div>
                                          );
                                        })}
                                      </div>

                                    </div>
                                  );
                                })}
                              </div>

                            </div>
                          );
                        })}
                      </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>

      </div>

      {deleteConfirm && (
        <div className="cm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cm-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="cm-modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <span className="cm-modal-icon" style={{ fontSize: '20px' }}>⚠️</span>
              <span className="cm-modal-title" style={{ color: '#991b1b' }}>Confirm Deletion</span>
            </div>
            <div className="cm-modal-body">
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#1f2937' }}>
                {deleteConfirm.type === 'company' 
                  ? `Are you sure you want to delete the company "${deleteConfirm.company.name}"? This action cannot be undone.`
                  : `Are you sure you want to delete the ${deleteConfirm.itemType} "${deleteConfirm.name}"? This action cannot be undone.`
                }
              </p>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-cancel-btn" style={{ color: '#374151', border: '1px solid #d1d5db', background: '#fff' }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="cm-save-btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => {
                if (deleteConfirm.type === 'company') executeDeleteCompany(deleteConfirm.company);
                else executeDeleteItem(deleteConfirm);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

  return (
    <div className="ea-page">
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 20px', borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontWeight: '500', animation: 'fe-fade 0.3s ease-out'
        }}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.message}
        </div>
      )}
      <div className="setup-header">
        <button className="setup-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="setup-header-info" style={{ flex: 1 }}>

          <div>
            <div className="setup-title">Company Management</div>

          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="ea-add-nav-btn" onClick={() => onNavigate && onNavigate('setup-domains')} style={{ background: '#0284c7', color: '#fff', border: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            View Domain
          </button>
          <button className="ea-add-nav-btn" onClick={openAdd} style={{ background: '#0284c7', color: '#fff', border: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Company
          </button>
        </div>
      </div>

      <div className="ea-body">
        <div className="ea-integrated-list">
          {loading ? (
            <div className="ea-list-loading">
              <div className="ea-spinner" />
              <span>Synchronizing company data...</span>
            </div>
          ) : error ? (
            <div className="ea-error-bar">
              ⚠️ {error}
              <button onClick={fetchCompanies} className="ea-retry-btn">Retry</button>
            </div>
          ) : (
            <div className="ea-table-wrap">
              <table className="ea-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px', textAlign: 'center' }}>S.No</th>
                    <th>Company Details</th>
                    <th>Contact Info</th>
                    <th>Address</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="ea-empty">No companies found. Click "Add Company" to get started.</td>
                    </tr>
                  ) : (
                    companies
                      .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                      .map((company, idx) => (
                        <tr key={company.id} className="cm-tr">
                          <td style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </td>
                          <td>
                            <div className="cm-company-cell">
                              <div className="cm-logo-thumb">
                                {resolveLogoUrl(company) ? (
                                  <img src={resolveLogoUrl(company)} alt={company.name} />
                                ) : (
                                  <span className="cm-logo-placeholder">🏢</span>
                                )}
                              </div>
                              <div className="cm-info-cell">
                                <div className="cm-company-name">{company.name}</div>
                                <div className="cm-company-sub">
                                  {(company.comapany_ref || company.company_ref || company.company_id || company.companyId) && (
                                    <span className="cm-id-badge">{company.comapany_ref || company.company_ref || company.company_id || company.companyId}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="cm-email-text">{company.email || 'N/A'}</div>
                            <div className="cm-phone-text" style={{ fontSize: '11.5px', color: '#64748b' }}>{company.phone || 'No phone'}</div>
                          </td>
                          <td className="ea-date-cell" style={{ maxWidth: '200px', whiteSpace: 'normal' }}>
                            {company.address || '—'}
                          </td>
                          <td>
                            <div className="ea-actions">
                              <button className="cm-action-btn cm-location-btn" title="Configure Locations & Departments" onClick={() => openLocationSetup(company)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
                                  <circle cx="12" cy="10" r="3" />
                                </svg>
                              </button>
                              <button className="cm-action-btn cm-edit-btn" title="Edit" onClick={() => openEdit(company)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button className="ea-action-btn delete" title="Delete" onClick={() => confirmDeleteCompany(company)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" /><path d="M14 11v6" />
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}>
                      {companies.length > itemsPerPage && (
                        <div className="ea-pagination">
                          <button
                            className="ea-pg-btn"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            ← Previous
                          </button>
                          <span className="ea-pg-info">
                            Page <strong>{currentPage}</strong> of {Math.ceil(companies.length / itemsPerPage)}
                          </span>
                          <button
                            className="ea-pg-btn"
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(companies.length / itemsPerPage), p + 1))}
                            disabled={currentPage === Math.ceil(companies.length / itemsPerPage)}
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ADD COMPANY MODAL */}
      {showAddModal && (
        <div className="cm-modal-overlay" onClick={closeAdd}>
          <div className="cm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <span className="cm-modal-icon">🏢</span>
              <span className="cm-modal-title">Add Company</span>
            </div>
            <div className="cm-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="cm-field">
                <label className="cm-label">Company Name <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. Continental Hospitals"
                  value={addForm.name}
                  onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                />
                {formErrors.name && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
              </div>
              <div className="cm-field">
                <label className="cm-label">Company ID <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. CH-2024-001"
                  value={addForm.companyId}
                  onChange={(e) => setAddForm((f) => ({ ...f, companyId: e.target.value }))}
                />
                {formErrors.companyId && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.companyId}</span>}
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Gmail</label>
                <input
                  className="cm-input"
                  type="email"
                  placeholder="e.g. contact@company.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                />
                {formErrors.email && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.email}</span>}
              </div>

              <div className="cm-field">
                <label className="cm-label">Email Domains</label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. garrev.com, example.com"
                  value={addForm.emailDomains}
                  onChange={(e) => setAddForm((f) => ({ ...f, emailDomains: e.target.value }))}
                />
              </div>

              <div className="cm-field">
                <label className="cm-label">Company Address</label>
                <textarea
                  className="cm-input cm-textarea"
                  placeholder="Street, City, State, ZIP"
                  value={addForm.address}
                  onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Contact Number</label>
                <input
                  className="cm-input"
                  type="tel"
                  placeholder="+91 XXXXXXXXXX"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                />
                {formErrors.phone && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.phone}</span>}
              </div>


              <div className="cm-field">
                <label className="cm-label">Company Logo</label>
                <div className="cm-logo-upload" onClick={() => addFileRef.current.click()}>
                  {addForm.logoPreview ? (
                    <img src={addForm.logoPreview} alt="Preview" className="cm-logo-preview-img" />
                  ) : (
                    <div className="cm-logo-upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Click to upload logo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={addFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLogoChange(e, false)}
                />
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-cancel-btn" onClick={closeAdd}>Cancel</button>
              <button className="cm-save-btn" onClick={saveAdd} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT COMPANY MODAL */}
      {showEditModal && (
        <div className="cm-modal-overlay" onClick={closeEdit}>
          <div className="cm-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <span className="cm-modal-icon">✏️</span>
              <span className="cm-modal-title">Edit Company</span>
            </div>
            <div className="cm-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div className="cm-field">
                <label className="cm-label">Company Name <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. Continental Hospitals"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
                {formErrors.name && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.name}</span>}
              </div>
              <div className="cm-field">
                <label className="cm-label">Company ID <span className="cm-required">*</span></label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. CH-2024-001"
                  value={editForm.companyId}
                  onChange={(e) => setEditForm((f) => ({ ...f, companyId: e.target.value }))}
                />
                {formErrors.companyId && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.companyId}</span>}
              </div>
              <div className="cm-field">
                <label className="cm-label">Company Gmail</label>
                <input
                  className="cm-input"
                  type="email"
                  placeholder="e.g. contact@company.com"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                />
                {formErrors.email && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.email}</span>}
              </div>

              <div className="cm-field">
                <label className="cm-label">Email Domains</label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. garrev.com, example.com"
                  value={editForm.emailDomains}
                  onChange={(e) => setEditForm((f) => ({ ...f, emailDomains: e.target.value }))}
                />
              </div>

              <div className="cm-field">
                <label className="cm-label">Company Address</label>
                <textarea
                  className="cm-input cm-textarea"
                  placeholder="Street, City, State, ZIP"
                  value={editForm.address}
                  onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))}
                  style={{ minHeight: '60px', resize: 'vertical' }}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Contact Number</label>
                <input
                  className="cm-input"
                  type="tel"
                  placeholder="+1 234 567"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
                {formErrors.phone && <span className="cm-error-text" style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>{formErrors.phone}</span>}
              </div>



              <div className="cm-field" style={{ marginTop: '16px' }}>
                <label className="cm-label">Company Logo</label>
                <div className="cm-logo-upload" onClick={() => editFileRef.current.click()}>
                  {editForm.logoPreview ? (
                    <img src={editForm.logoPreview} alt="Preview" className="cm-logo-preview-img" />
                  ) : (
                    <div className="cm-logo-upload-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>Click to upload logo</span>
                    </div>
                  )}
                </div>
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleLogoChange(e, true)}
                />
              </div>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-cancel-btn" onClick={closeEdit}>Cancel</button>
              <button className="cm-save-btn" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteConfirm && (
        <div className="cm-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="cm-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="cm-modal-header" style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
              <span className="cm-modal-icon" style={{ fontSize: '20px' }}>⚠️</span>
              <span className="cm-modal-title" style={{ color: '#991b1b' }}>Confirm Deletion</span>
            </div>
            <div className="cm-modal-body">
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#1f2937' }}>
                {deleteConfirm.type === 'company' 
                  ? `Are you sure you want to delete the company "${deleteConfirm.company.name}"? This action cannot be undone.`
                  : `Are you sure you want to delete the ${deleteConfirm.itemType} "${deleteConfirm.name}"? This action cannot be undone.`
                }
              </p>
            </div>
            <div className="cm-modal-actions">
              <button className="cm-cancel-btn" style={{ color: '#374151', border: '1px solid #d1d5db', background: '#fff' }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="cm-save-btn" style={{ background: '#ef4444', color: '#fff', border: 'none' }} onClick={() => {
                if (deleteConfirm.type === 'company') executeDeleteCompany(deleteConfirm.company);
                else executeDeleteItem(deleteConfirm);
              }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
