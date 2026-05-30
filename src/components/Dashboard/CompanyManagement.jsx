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

const CompanyManagement = ({ onBack }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const [addForm, setAddForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', building_name: '', zone_name: '', area_name: '', department_name: '', number_of_floors: '5' });
  const [editForm, setEditForm] = useState({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', buildings: [], zones: [], areas: [], departments: [], number_of_floors: '5', new_building: '', new_zone: '', new_area: '', new_department: '' });
  const [saving, setSaving] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemValue, setEditingItemValue] = useState('');
  const [selectedLocationCompany, setSelectedLocationCompany] = useState(null);
  const [locationForm, setLocationForm] = useState({ buildings: [], zones: [], areas: [], departments: [], number_of_floors: '5', new_building: '', new_zone: '', new_area: '', new_department: '' });
  
  // Local parent selection states for hierarchal location creation
  const [selectedParentBld, setSelectedParentBld] = useState('');
  const [selectedParentZn, setSelectedParentZn] = useState('');
  const [creatorMode, setCreatorMode] = useState('building'); // 'building', 'zone', 'area'

  const addFileRef = useRef();
  const editFileRef = useRef();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!selectedLocationCompany) return;
    const fetchRemoteData = async () => {
      const blds = locationForm.buildings || [];
      if (blds.length === 0) return;

      // Update building names with fresh GET data
      let updatedBlds = [...blds];
      let bldsChanged = false;
      for (let i = 0; i < updatedBlds.length; i++) {
        try {
          const res = await ApiService.getBranchById(updatedBlds[i].id);
          if (res && res.name && res.name !== updatedBlds[i].name) {
            updatedBlds[i] = { ...updatedBlds[i], name: res.name };
            bldsChanged = true;
          }
        } catch (e) {
          console.warn(`Failed to fetch branch details for ${updatedBlds[i].id}:`, e);
        }
      }

      let allZones = [...(locationForm.zones || [])];
      let loadedAny = false;
      for (const bld of updatedBlds) {
        try {
          const res = await ApiService.getBranchZones(bld.id);
          const branchZones = Array.isArray(res) ? res : (res?.data || res?.zones || []);
          if (branchZones.length > 0) {
            branchZones.forEach(z => {
              const exists = allZones.some(az => az.id === z.id || az.name.toLowerCase() === z.name.toLowerCase());
              if (!exists) {
                loadedAny = true;
                allZones.push({
                  id: z.id || `ZN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                  name: z.name,
                  building_id: bld.id
                });
              }
            });
          }
        } catch (e) {
          console.warn(`Failed to fetch zones for branch ${bld.id}:`, e);
        }
      }

      if (bldsChanged || loadedAny) {
        setLocationForm(f => ({
          ...f,
          ...(bldsChanged ? { buildings: updatedBlds } : {}),
          ...(loadedAny ? { zones: allZones } : {})
        }));
      }
    };
    fetchRemoteData();
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
    setAddForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', building_name: '', zone_name: '', area_name: '', department_name: '', number_of_floors: '5' });
    setShowAddModal(true);
  };

  const closeAdd = () => {
    setShowAddModal(false);
    setAddForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', building_name: '', zone_name: '', area_name: '', department_name: '', number_of_floors: '5' });
  };

  const saveAdd = async () => {
    if (!addForm.name.trim()) return;
    const requestedRef = addForm.companyId.trim();
    const requestedName = addForm.name.trim();

    if (!requestedRef) {
      alert('Please enter a unique Company ID.');
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
        alert(`Company ID "${requestedRef}" is already registered to "${duplicateId.name}". Please use a unique ID.`);
        setSaving(false);
        return;
      }

      const duplicateName = allCompanies.find((company) => {
        const name = String(company.name || '').trim().toLowerCase();
        return name === requestedName.toLowerCase();
      });

      if (duplicateName) {
        alert(`A company named "${requestedName}" is already registered. Please use a unique name.`);
        setSaving(false);
        return;
      }

      const company = await ApiService.createAdminCompany({
        name: requestedName,
        comapany_ref: requestedRef,
        email: addForm.email.trim(),
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
    } catch (e) {}

    setEditForm({
      name: company.name,
      companyId: company.comapany_ref || company.company_ref || '',
      logo: null,
      logoPreview: resolveLogoUrl(company),
      email: company.email || '',
      address: company.address || '',
      phone: company.phone || '',
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
    setShowEditModal(false);
    setEditTarget(null);
    setEditForm({ name: '', companyId: '', logo: null, logoPreview: null, email: '', address: '', phone: '', buildings: [], zones: [], areas: [], departments: [], number_of_floors: '5', new_building: '', new_zone: '', new_area: '', new_department: '' });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editTarget) return;
    const requestedRef = editForm.companyId.trim();
    const requestedName = editForm.name.trim();

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
        alert(`Company ID "${requestedRef}" is already used by "${duplicateId.name}".`);
        return;
      }
    }

    if (nameChanged) {
      const duplicateName = otherCompanies.find((company) => {
        const name = String(company.name || '').trim().toLowerCase();
        return name === requestedName.toLowerCase();
      });
      if (duplicateName) {
        alert(`A company named "${requestedName}" already exists.`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        email: editForm.email.trim(),
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
    let bldList = [];
    let znList = [];
    let arList = [];
    let dpList = [];
    let flList = [];
    let flCount = '5';
    try {
      const localLocs = JSON.parse(localStorage.getItem('local_onboarding_locations') || '{}');
      const match = localLocs[company.comapany_ref || company.company_ref || ''];
      if (match) {
        bldList = match.buildings || [];
        znList = match.zones || [];
        arList = match.areas || [];
        dpList = match.departments || [];
        flList = match.floors || [];
        if (match.floors) {
          flCount = String(match.floors.length - 1);
        }
      }
    } catch (e) {}

    if (flList.length === 0) {
      flList.push({ id: 'FLR-GF', name: 'Ground Floor' });
      const numFloors = parseInt(flCount) || 5;
      for (let f = 1; f < numFloors; f++) {
        const suffix = f === 1 ? 'st' : f === 2 ? 'nd' : f === 3 ? 'rd' : 'th';
        flList.push({ id: `FLR-${f}`, name: `${f}${suffix} Floor` });
      }
      flList.push({ id: 'FLR-01', name: 'Basement' });
    }

    setLocationForm({
      buildings: bldList,
      zones: znList,
      areas: arList,
      departments: dpList,
      floors: flList,
      number_of_floors: flCount,
      new_building: '',
      new_zone: '',
      new_area: '',
      new_department: '',
      new_floor: ''
    });
  };

  const saveLocationSetup = () => {
    if (!selectedLocationCompany) return;
    const ref = selectedLocationCompany.comapany_ref || selectedLocationCompany.company_ref || '';
    try {
      const localLocs = JSON.parse(localStorage.getItem('local_onboarding_locations') || '{}');
      localLocs[ref] = {
        buildings: locationForm.buildings,
        zones: locationForm.zones,
        areas: locationForm.areas,
        departments: locationForm.departments || [],
        floors: locationForm.floors || []
      };
      localStorage.setItem('local_onboarding_locations', JSON.stringify(localLocs));
      alert('Location and Department configurations saved successfully!');
      setSelectedLocationCompany(null);
    } catch (e) {
      console.error(e);
      alert('Failed to save configurations.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company?')) return;
    try {
      await ApiService.deleteAdminCompany(id);
      await fetchCompanies();
    } catch (err) {
      alert(err.message || 'Failed to delete company.');
    }
  };

  if (selectedLocationCompany) {
    const smlInput = {
      padding: '6px 10px', fontSize: '12px', background: '#fff',
      border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px',
      height: '32px', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit'
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
      maxHeight: '200px', overflowY: 'auto', fontSize: '12px'
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

    return (
      <div className="ea-page" style={{ padding: '16px 20px', overflowY: 'auto', boxSizing: 'border-box' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <button className="setup-back-btn" onClick={() => setSelectedLocationCompany(null)} title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '-0.2px' }}>
              Location & Department Setup Workspace
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              Configuring: <strong style={{ color: '#3b82f6' }}>{selectedLocationCompany.name}</strong>
              {' '}({selectedLocationCompany.comapany_ref || selectedLocationCompany.company_ref || selectedLocationCompany.company_id || selectedLocationCompany.companyId})
            </div>
          </div>
          <button
            onClick={saveLocationSetup}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '7px', fontWeight: '600', fontSize: '12px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.2)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Configuration
          </button>
        </div>

        {/* Content panel */}
        <div style={{ background: '#fff', padding: '18px 22px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* SECTION 1: Branches / Zones / Areas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={secLabel}>
              <span>Branches, Zones &amp; Areas</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            {/* Mode tabs */}
            <div style={{ display: 'flex', gap: '3px', background: '#f1f5f9', padding: '3px', borderRadius: '7px', width: 'fit-content' }}>
              {[
                { mode: 'building', label: '1. Branch / Building' },
                { mode: 'zone',     label: '2. Zone / Wing' },
                { mode: 'area',     label: '3. Area / Spot' }
              ].map(opt => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setCreatorMode(opt.mode)}
                  style={{
                    background: creatorMode === opt.mode ? '#fff' : 'transparent',
                    color: creatorMode === opt.mode ? '#0f172a' : '#64748b',
                    border: 'none', borderRadius: '5px', padding: '4px 12px',
                    fontSize: '11px', fontWeight: creatorMode === opt.mode ? '700' : '500',
                    cursor: 'pointer', transition: 'all 0.15s',
                    boxShadow: creatorMode === opt.mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Creator row — Building */}
            {creatorMode === 'building' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  style={{ ...smlInput, flex: 1 }}
                  placeholder="Branch / Building name  (e.g. Block B, Main Building)"
                  value={locationForm.new_building}
                  onChange={e => setLocationForm(f => ({ ...f, new_building: e.target.value }))}
                />
                <button type="button" style={addBtn('#3b82f6')} onClick={() => {
                  const name = locationForm.new_building.trim();
                  if (!name) { alert('Please enter a building or branch name.'); return; }
                  if (locationForm.buildings.some(b => b.name.toLowerCase() === name.toLowerCase())) { alert('Building/Branch already exists.'); return; }
                  setLocationForm(f => ({ ...f, buildings: [...f.buildings, { id: `BLD-${Date.now()}`, name }], new_building: '' }));
                }}>
                  + Add Branch
                </button>
              </div>
            )}

            {/* Creator row — Zone */}
            {creatorMode === 'zone' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select style={{ ...smlInput, minWidth: '170px' }} value={selectedParentBld} onChange={e => setSelectedParentBld(e.target.value)}>
                  <option value="">— Select Branch —</option>
                  {locationForm.buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <input
                  style={{ ...smlInput, flex: 1 }}
                  placeholder="Zone / Wing name  (e.g. OT Wing, North Block)"
                  value={locationForm.new_zone}
                  onChange={e => setLocationForm(f => ({ ...f, new_zone: e.target.value }))}
                />
                <button type="button" style={addBtn('#10b981')} onClick={() => {
                  if (!selectedParentBld) { alert('Please select a branch first.'); return; }
                  const name = locationForm.new_zone.trim();
                  if (!name) { alert('Please enter a zone name.'); return; }
                  if (locationForm.zones.some(z => z.name.toLowerCase() === name.toLowerCase() && z.building_id === selectedParentBld)) { alert('Zone already exists under this branch.'); return; }
                  const id = `ZN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                  try { ApiService.createBranchZone(selectedParentBld, { name }).catch(() => {}); } catch (e) {}
                  setLocationForm(f => ({ ...f, zones: [...f.zones, { id, name, building_id: selectedParentBld }], new_zone: '' }));
                }}>
                  + Add Zone
                </button>
              </div>
            )}

            {/* Creator row — Area */}
            {creatorMode === 'area' && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select style={{ ...smlInput, minWidth: '150px' }} value={selectedParentBld} onChange={e => { setSelectedParentBld(e.target.value); setSelectedParentZn(''); }}>
                  <option value="">— Select Branch —</option>
                  {locationForm.buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <select style={{ ...smlInput, minWidth: '150px', opacity: selectedParentBld ? 1 : 0.5 }} value={selectedParentZn} onChange={e => setSelectedParentZn(e.target.value)} disabled={!selectedParentBld}>
                  <option value="">— Select Zone —</option>
                  {locationForm.zones.filter(z => z.building_id === selectedParentBld).map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
                <input
                  style={{ ...smlInput, flex: 1, opacity: selectedParentZn ? 1 : 0.5 }}
                  placeholder="Area / Spot name  (e.g. OT Room 3)"
                  value={locationForm.new_area}
                  onChange={e => setLocationForm(f => ({ ...f, new_area: e.target.value }))}
                  disabled={!selectedParentZn}
                />
                <button type="button" style={{ ...addBtn('#f59e0b'), opacity: selectedParentZn ? 1 : 0.5 }} disabled={!selectedParentZn} onClick={() => {
                  if (!selectedParentZn) return;
                  const name = locationForm.new_area.trim();
                  if (!name) { alert('Please enter an area name.'); return; }
                  if (locationForm.areas.some(a => a.name.toLowerCase() === name.toLowerCase() && a.zone_id === selectedParentZn)) { alert('Area already exists under this zone.'); return; }
                  setLocationForm(f => ({ ...f, areas: [...f.areas, { id: `AREA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, name, zone_id: selectedParentZn }], new_area: '' }));
                }}>
                  + Add Area
                </button>
              </div>
            )}

            {/* Created hierarchy — dropdown list */}
            {locationForm.buildings.length > 0 && (
              <div style={listBox}>
                {locationForm.buildings.map(bld => {
                  const bldZones = locationForm.zones.filter(z => z.building_id === bld.id);
                  return (
                    <div key={bld.id}>
                      <div style={rowBase(10, '#f8fafc')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#0f172a', fontSize: '12px' }}>
                          <span>🏢</span>
                          {editingItemId === bld.id
                            ? <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('160px')} autoFocus />
                            : bld.name}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {editingItemId === bld.id ? (
                            <>
                              <button style={smallSave} onClick={() => {
                                try { ApiService.updateBranch(bld.id, { name: editingItemValue }).catch(() => {}); } catch (e) {}
                                setLocationForm(f => ({ ...f, buildings: f.buildings.map(b => b.id === bld.id ? { ...b, name: editingItemValue } : b) }));
                                setEditingItemId(null);
                              }}>Save</button>
                              <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button style={iconEditBtn} title="Edit" onClick={() => { setEditingItemId(bld.id); setEditingItemValue(bld.name); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                              </button>
                              <button style={iconDelBtn} title="Delete" onClick={() => {
                                setLocationForm(f => ({
                                  ...f,
                                  buildings: f.buildings.filter(b => b.id !== bld.id),
                                  zones: f.zones.filter(z => z.building_id !== bld.id),
                                  areas: f.areas.filter(a => { const tz = f.zones.find(z => z.id === a.zone_id); return tz ? tz.building_id !== bld.id : true; })
                                }));
                              }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {bldZones.map(zn => {
                        const znAreas = locationForm.areas.filter(a => a.zone_id === zn.id);
                        return (
                          <div key={zn.id}>
                            <div style={rowBase(26, '#fff')}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#334155' }}>
                                <span style={{ color: '#3b82f6', fontSize: '10px' }}>▸</span>
                                {editingItemId === zn.id
                                  ? <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('140px')} autoFocus />
                                  : zn.name}
                              </span>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                {editingItemId === zn.id ? (
                                  <>
                                    <button style={smallSave} onClick={() => {
                                      setLocationForm(f => ({ ...f, zones: f.zones.map(z => z.id === zn.id ? { ...z, name: editingItemValue } : z) }));
                                      setEditingItemId(null);
                                    }}>Save</button>
                                    <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                                  </>
                                ) : (
                                  <>
                                    <button style={iconEditBtn} title="Edit" onClick={() => { setEditingItemId(zn.id); setEditingItemValue(zn.name); }}>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                    </button>
                                    <button style={iconDelBtn} title="Delete" onClick={() => {
                                      if (window.confirm(`Delete zone "${zn.name}"?`)) {
                                        try { ApiService.deleteBranchZone(bld.id, zn.id).catch(() => {}); } catch (e) {}
                                        setLocationForm(f => ({ ...f, zones: f.zones.filter(z => z.id !== zn.id), areas: f.areas.filter(a => a.zone_id !== zn.id) }));
                                      }
                                    }}>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                            {znAreas.map(ar => (
                              <div key={ar.id} style={rowBase(44, '#fff')}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#64748b' }}>
                                  <span style={{ color: '#10b981', fontSize: '9px' }}>●</span>
                                  {editingItemId === ar.id
                                    ? <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('120px')} autoFocus />
                                    : ar.name}
                                </span>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                  {editingItemId === ar.id ? (
                                    <>
                                      <button style={smallSave} onClick={() => {
                                        setLocationForm(f => ({ ...f, areas: f.areas.map(a => a.id === ar.id ? { ...a, name: editingItemValue } : a) }));
                                        setEditingItemId(null);
                                      }}>Save</button>
                                      <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <button style={iconEditBtn} title="Edit" onClick={() => { setEditingItemId(ar.id); setEditingItemValue(ar.name); }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                                      </button>
                                      <button style={iconDelBtn} title="Delete" onClick={() => {
                                        setLocationForm(f => ({ ...f, areas: f.areas.filter(a => a.id !== ar.id) }));
                                      }}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: '#f1f5f9' }} />

          {/* SECTION 2: Floor Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={secLabel}>
              <span>Floor Configuration</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Quick-set Total Floors</label>
                <input
                  type="number"
                  style={{ ...smlInput, width: '130px' }}
                  placeholder="e.g. 5"
                  value={locationForm.number_of_floors}
                  onChange={e => {
                    const val = e.target.value;
                    const numFloors = parseInt(val) || 0;
                    const generatedFloors = [];
                    if (numFloors > 0) {
                      generatedFloors.push({ id: 'FLR-GF', name: 'Ground Floor' });
                      for (let f = 1; f < numFloors; f++) {
                        const suffix = f === 1 ? 'st' : f === 2 ? 'nd' : f === 3 ? 'rd' : 'th';
                        generatedFloors.push({ id: `FLR-${f}`, name: `${f}${suffix} Floor` });
                      }
                      generatedFloors.push({ id: 'FLR-01', name: 'Basement' });
                    }
                    setLocationForm(f => ({ ...f, number_of_floors: val, floors: generatedFloors }));
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                <label style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>Custom Floor Name</label>
                <input
                  style={{ ...smlInput, width: '100%' }}
                  placeholder="e.g. Mezzanine Floor, Rooftop"
                  value={locationForm.new_floor || ''}
                  onChange={e => setLocationForm(f => ({ ...f, new_floor: e.target.value }))}
                />
              </div>
              <button type="button" style={addBtn('#3b82f6')} onClick={() => {
                const name = (locationForm.new_floor || '').trim();
                if (!name) { alert('Please enter a floor name.'); return; }
                const floors = locationForm.floors || [];
                if (floors.some(f => f.name.toLowerCase() === name.toLowerCase())) { alert('Floor already exists.'); return; }
                const firstBldId = locationForm.buildings[0]?.id;
                if (firstBldId) { try { ApiService.createBranchFloor(firstBldId, { name }).catch(() => {}); } catch (e) {} }
                setLocationForm(f => ({ ...f, floors: [...(f.floors || []), { id: `FLR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, name }], new_floor: '' }));
              }}>
                + Add Floor
              </button>
            </div>

            {locationForm.floors && locationForm.floors.length > 0 && (
              <div style={listBox}>
                {[...locationForm.floors]
                  .sort((a, b) => {
                    const an = a.name.toLowerCase(), bn = b.name.toLowerCase();
                    if (an.includes('basement')) return -1; if (bn.includes('basement')) return 1;
                    if (an.includes('ground')) return -0.5; if (bn.includes('ground')) return 0.5;
                    return (parseInt(an) || 0) - (parseInt(bn) || 0);
                  })
                  .map(flr => {
                    const isBasement = flr.name.toLowerCase().includes('basement');
                    const isGround = flr.name.toLowerCase().includes('ground');
                    return (
                      <div key={flr.id} style={rowBase(10, isBasement ? '#f1f5f9' : isGround ? '#eff6ff' : '#fff')}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: isGround ? '#1e40af' : '#334155' }}>
                          <span>{isBasement ? '🕳️' : '🏢'}</span>
                          {editingItemId === flr.id
                            ? <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('150px')} autoFocus />
                            : flr.name}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {editingItemId === flr.id ? (
                            <>
                              <button style={smallSave} onClick={() => {
                                setLocationForm(f => ({ ...f, floors: f.floors.map(fl => fl.id === flr.id ? { ...fl, name: editingItemValue } : fl) }));
                                setEditingItemId(null);
                              }}>Save</button>
                              <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button style={iconEditBtn} title="Edit" onClick={() => { setEditingItemId(flr.id); setEditingItemValue(flr.name); }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                              </button>
                              <button style={iconDelBtn} title="Delete" onClick={() => {
                                if (window.confirm(`Delete floor "${flr.name}"?`)) {
                                  const firstBldId = locationForm.buildings[0]?.id;
                                  if (firstBldId) { try { ApiService.deleteBranchFloor(firstBldId, flr.id).catch(() => {}); } catch (e) {} }
                                  setLocationForm(f => ({ ...f, floors: f.floors.filter(fl => fl.id !== flr.id) }));
                                }
                              }}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          <div style={{ height: '1px', background: '#f1f5f9' }} />

          {/* SECTION 3: Departments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={secLabel}>
              <span>Departments</span>
              <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                style={{ ...smlInput, flex: 1 }}
                placeholder="Department name  (e.g. Granulation Department, Cardiology)"
                value={locationForm.new_department || ''}
                onChange={e => setLocationForm(f => ({ ...f, new_department: e.target.value }))}
              />
              <button type="button" style={addBtn('#10b981')} onClick={() => {
                const name = (locationForm.new_department || '').trim();
                if (!name) { alert('Please enter a department name.'); return; }
                const depts = locationForm.departments || [];
                if (depts.some(d => d.name.toLowerCase() === name.toLowerCase())) { alert('Department already exists.'); return; }
                try { ApiService.createDepartment({ name }).catch(() => {}); } catch (e) {}
                setLocationForm(f => ({ ...f, departments: [...(f.departments || []), { id: `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, name }], new_department: '' }));
              }}>
                + Add Department
              </button>
            </div>

            {locationForm.departments && locationForm.departments.length > 0 && (
              <div style={listBox}>
                {locationForm.departments.map(dept => (
                  <div key={dept.id} style={rowBase(10, '#fff')}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '500', color: '#0f172a' }}>
                      <span style={{ color: '#10b981', fontSize: '11px' }}>◈</span>
                      {editingItemId === dept.id
                        ? <input value={editingItemValue} onChange={e => setEditingItemValue(e.target.value)} style={inlineEdit('180px')} autoFocus />
                        : dept.name}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {editingItemId === dept.id ? (
                        <>
                          <button style={smallSave} onClick={() => {
                            setLocationForm(f => ({ ...f, departments: f.departments.map(d => d.id === dept.id ? { ...d, name: editingItemValue } : d) }));
                            setEditingItemId(null);
                          }}>Save</button>
                          <button style={smallCancel} onClick={() => setEditingItemId(null)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button style={iconEditBtn} title="Edit" onClick={() => { setEditingItemId(dept.id); setEditingItemValue(dept.name); }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                          </button>
                          <button style={iconDelBtn} title="Delete" onClick={() => {
                            if (window.confirm(`Delete department "${dept.name}"?`)) {
                              try { ApiService.deleteDepartment(dept.id).catch(() => {}); } catch (e) {}
                              setLocationForm(f => ({ ...f, departments: f.departments.filter(d => d.id !== dept.id) }));
                            }
                          }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="ea-page">
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
        <button className="ea-add-nav-btn" onClick={openAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Company
        </button>
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
                                <div className="ea-user-name">{company.name}</div>
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
                              <button className="ea-action-btn delete" title="Delete" onClick={() => handleDelete(company.id)}>
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
                  placeholder="+1 234 567"
                  value={addForm.phone}
                  onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                />
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
    </div>
  );
};

export default CompanyManagement;
