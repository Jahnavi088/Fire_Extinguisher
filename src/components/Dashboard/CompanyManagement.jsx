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
    return (
      <div className="ea-page" style={{ padding: '24px', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
        <div className="setup-header" style={{ marginBottom: '24px' }}>
          <button className="setup-back-btn" onClick={() => setSelectedLocationCompany(null)} title="Back to Companies">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="setup-header-info" style={{ flex: 1 }}>
            <div>
              <div className="setup-title" style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', letterSpacing: '-0.3px' }}>📍 Location & Department Setup Workspace</div>
              <div className="setup-sub" style={{ fontSize: '12.5px', opacity: 0.7, color: '#94a3b8', marginTop: '3px' }}>
                Configuring hierarchy for: <strong style={{ color: '#3b82f6' }}>{selectedLocationCompany.name}</strong> ({selectedLocationCompany.comapany_ref || selectedLocationCompany.company_ref || selectedLocationCompany.company_id || selectedLocationCompany.companyId})
              </div>
            </div>
          </div>
          <button className="ea-add-nav-btn" onClick={saveLocationSetup} style={{ background: '#10b981', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s ease', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Workspace Configuration
          </button>
        </div>
        <div style={{ background: '#ffffff', padding: '32px 40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '100%', boxSizing: 'border-box' }}>
          
          {/* SECTION 1: Location Hierarchy Tree */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '18px' }}>🏢</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px', textTransform: 'uppercase' }}>Branches, Zones & Areas Hierarchy</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(15, 23, 42, 0.15)' }} />
            </div>
            
            {locationForm.buildings.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
                  {locationForm.buildings.map((bld) => {
                    const bldZones = locationForm.zones.filter(z => z.building_id === bld.id);
                    return (
                      <div key={bld.id} style={{ display: 'flex', flexDirection: 'column', padding: '14px 16px', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {editingItemId === bld.id ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                  type="text"
                                  className="cm-input"
                                  value={editingItemValue}
                                  onChange={(e) => setEditingItemValue(e.target.value)}
                                  style={{ padding: '4px 8px', fontSize: '12px', width: '220px', height: '30px', minHeight: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    ApiService.updateBranch(bld.id, { name: editingItemValue }).catch(err => console.error("API PATCH branch failed:", err));
                                  } catch (e) {}
                                  const updated = locationForm.buildings.map(b => b.id === bld.id ? { ...b, name: editingItemValue } : b);
                                  setLocationForm(f => ({ ...f, buildings: updated }));
                                  setEditingItemId(null);
                                }}
                                style={{ background: '#10b981', border: 'none', color: '#fff', fontSize: '11px', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', height: '30px', fontWeight: 'bold' }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItemId(null)}
                                style={{ background: '#64748b', border: 'none', color: '#fff', fontSize: '11px', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', height: '30px' }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ opacity: 0.8 }}>🏢</span> {bld.name}</span>
                          )}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {editingItemId !== bld.id && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItemId(bld.id);
                                  setEditingItemValue(bld.name);
                                }}
                                style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                title="Edit Branch"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const remainingBld = locationForm.buildings.filter(b => b.id !== bld.id);
                                const remainingZn = locationForm.zones.filter(z => z.building_id !== bld.id);
                                const remainingAr = locationForm.areas.filter(a => {
                                   const targetZone = locationForm.zones.find(z => z.id === a.zone_id);
                                   return targetZone ? targetZone.building_id !== bld.id : true;
                                });
                                setLocationForm(f => ({ ...f, buildings: remainingBld, zones: remainingZn, areas: remainingAr }));
                              }}
                              style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Delete Branch"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {bldZones.map(zn => {
                          const znAreas = locationForm.areas.filter(a => a.zone_id === zn.id);
                          return (
                            <div key={zn.id} style={{ paddingLeft: '24px', marginTop: '10px', borderLeft: '2px solid #e2e8f0' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '6px 12px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                                {editingItemId === zn.id ? (
                                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      className="cm-input"
                                      value={editingItemValue}
                                      onChange={(e) => setEditingItemValue(e.target.value)}
                                      style={{ padding: '4px 8px', fontSize: '11px', width: '180px', height: '28px', minHeight: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = locationForm.zones.map(z => z.id === zn.id ? { ...z, name: editingItemValue } : z);
                                        setLocationForm(f => ({ ...f, zones: updated }));
                                        setEditingItemId(null);
                                      }}
                                      style={{ background: '#10b981', border: 'none', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', height: '28px', fontWeight: 'bold' }}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingItemId(null)}
                                      style={{ background: '#64748b', border: 'none', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', height: '28px' }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#3b82f6', opacity: 0.8 }}>▸</span> {zn.name}</span>
                                )}
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  {editingItemId !== zn.id && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingItemId(zn.id);
                                        setEditingItemValue(zn.name);
                                      }}
                                      style={{ background: 'rgba(59, 130, 246, 0.08)', border: 'none', color: '#3b82f6', borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      title="Edit Zone"
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                      </svg>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete zone "${zn.name}"?`)) {
                                        try {
                                          ApiService.deleteBranchZone(bld.id, zn.id).catch(err => console.error("API DELETE zone failed:", err));
                                        } catch (e) {}
                                        const remainingZn = locationForm.zones.filter(z => z.id !== zn.id);
                                        const remainingAr = locationForm.areas.filter(a => a.zone_id !== zn.id);
                                        setLocationForm(f => ({ ...f, zones: remainingZn, areas: remainingAr }));
                                      }
                                    }}
                                    style={{ background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="Delete Zone"
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="11" height="11">
                                      <polyline points="3 6 5 6 21 6" />
                                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              {znAreas.map(ar => (
                                <div key={ar.id} style={{ paddingLeft: '24px', fontSize: '11.5px', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', background: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                                  {editingItemId === ar.id ? (
                                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                      <input
                                        type="text"
                                        className="cm-input"
                                        value={editingItemValue}
                                        onChange={(e) => setEditingItemValue(e.target.value)}
                                        style={{ padding: '2px 6px', fontSize: '10px', width: '150px', height: '24px', minHeight: 'auto', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = locationForm.areas.map(a => a.id === ar.id ? { ...a, name: editingItemValue } : a);
                                          setLocationForm(f => ({ ...f, areas: updated }));
                                          setEditingItemId(null);
                                        }}
                                        style={{ background: '#10b981', border: 'none', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', height: '24px', fontWeight: 'bold' }}
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingItemId(null)}
                                        style={{ background: '#64748b', border: 'none', color: '#fff', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', height: '24px' }}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ color: '#10b981', opacity: 0.7 }}>•</span> {ar.name}</span>
                                  )}
                                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    {editingItemId !== ar.id && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingItemId(ar.id);
                                          setEditingItemValue(ar.name);
                                        }}
                                        style={{ background: 'rgba(59, 130, 246, 0.08)', border: 'none', color: '#3b82f6', borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        title="Edit Area"
                                      >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="9" height="9">
                                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const remainingAr = locationForm.areas.filter(a => a.id !== ar.id);
                                        setLocationForm(f => ({ ...f, areas: remainingAr }));
                                      }}
                                      style={{ background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: '#ef4444', borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                      title="Delete Area"
                                    >
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="9" height="9">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                      </svg>
                                    </button>
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
              </div>
            )}

            {/* Dedicated location creator block */}
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>➕</span> Add New Branch / Zone / Area
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>Building/Branch Name</label>
                  <input
                    className="cm-input"
                    type="text"
                    placeholder="e.g. Block B"
                    value={locationForm.new_building}
                    onChange={(e) => setLocationForm(f => ({ ...f, new_building: e.target.value }))}
                    style={{ padding: '8px 12px', fontSize: '12px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>Zone/Wing Name</label>
                  <input
                    className="cm-input"
                    type="text"
                    placeholder="e.g. OT Wing"
                    value={locationForm.new_zone}
                    onChange={(e) => setLocationForm(f => ({ ...f, new_zone: e.target.value }))}
                    style={{ padding: '8px 12px', fontSize: '12px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>Area/Spot Name</label>
                  <input
                    className="cm-input"
                    type="text"
                    placeholder="e.g. OT Room 3"
                    value={locationForm.new_area}
                    onChange={(e) => setLocationForm(f => ({ ...f, new_area: e.target.value }))}
                    style={{ padding: '8px 12px', fontSize: '12px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px' }}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const bldName = locationForm.new_building.trim();
                  const znName = locationForm.new_zone.trim();
                  const arName = locationForm.new_area.trim();
                  if (!bldName) { alert('Please enter at least a Building/Branch name.'); return; }
                  
                  const newBuildings = [...locationForm.buildings];
                  const newZones = [...locationForm.zones];
                  const newAreas = [...locationForm.areas];
                  
                  let bldId = '';
                  const existingBld = newBuildings.find(b => b.name.toLowerCase() === bldName.toLowerCase());
                  if (existingBld) {
                    bldId = existingBld.id;
                  } else {
                    bldId = `BLD-${Date.now()}`;
                    newBuildings.push({ id: bldId, name: bldName });
                  }
                  
                  let znId = '';
                  if (znName) {
                    const existingZn = newZones.find(z => z.name.toLowerCase() === znName.toLowerCase() && z.building_id === bldId);
                    if (existingZn) {
                      znId = existingZn.id;
                    } else {
                      znId = `ZN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                      try {
                        ApiService.createBranchZone(bldId, { name: znName }).catch(err => console.error("API POST zone failed:", err));
                      } catch (e) {}
                      newZones.push({ id: znId, name: znName, building_id: bldId });
                    }
                  }
                  
                  if (arName && znId) {
                    newAreas.push({
                      id: `AREA-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                      name: arName,
                      zone_id: znId
                    });
                  }
                  
                  setLocationForm(f => ({
                    ...f,
                    buildings: newBuildings,
                    zones: newZones,
                    areas: newAreas,
                    new_building: '',
                    new_zone: '',
                    new_area: ''
                  }));
                }}
                style={{ width: 'fit-content', padding: '10px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end', transition: 'background 0.2s', boxShadow: '0 4px 10px rgba(59,130,246,0.15)' }}
              >
                + Add to Setup Hierarchy
              </button>
            </div>
          </div>

          {/* SECTION 2: Floor Heights Configuration */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '18px' }}>🏢</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px', textTransform: 'uppercase' }}>Floor Heights Configuration</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(15, 23, 42, 0.15)' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '18px', background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '4px' }}>Total Floors Quick-Set</label>
                <input
                  className="cm-input"
                  type="number"
                  placeholder="e.g. 5"
                  value={locationForm.number_of_floors}
                  onChange={(e) => {
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
                    setLocationForm((f) => ({ ...f, number_of_floors: val, floors: generatedFloors }));
                  }}
                  style={{ width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', height: '36px', fontSize: '13px' }}
                />
              </div>
            </div>

            {locationForm.floors && locationForm.floors.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {locationForm.floors.map((flr) => (
                    <div key={flr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#0f172a', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                      {editingItemId === flr.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="cm-input"
                            value={editingItemValue}
                            onChange={(e) => setEditingItemValue(e.target.value)}
                            style={{ padding: '2px 6px', fontSize: '11px', width: '180px', minHeight: 'auto', height: '24px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = locationForm.floors.map(f => f.id === flr.id ? { ...f, name: editingItemValue } : f);
                              setLocationForm(f => ({ ...f, floors: updated }));
                              setEditingItemId(null);
                            }}
                            style={{ background: '#10b981', border: 'none', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', height: '24px', fontWeight: 'bold' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            style={{ background: '#64748b', border: 'none', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', height: '24px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>🏢 {flr.name}</span>
                      )}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {editingItemId !== flr.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(flr.id);
                              setEditingItemValue(flr.name);
                            }}
                            style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit Floor"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete floor "${flr.name}"?`)) {
                              const firstBldId = locationForm.buildings[0]?.id;
                              if (firstBldId) {
                                try {
                                  ApiService.deleteBranchFloor(firstBldId, flr.id).catch(err => console.error("API DELETE floor failed:", err));
                                } catch (e) {}
                              }
                              const remainingFloors = locationForm.floors.filter(f => f.id !== flr.id);
                              setLocationForm(f => ({ ...f, floors: remainingFloors }));
                            }
                          }}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete Floor"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated floor creator block */}
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>➕</span> Add Custom Floor
              </span>
              <div>
                <label style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>Floor Name</label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. Mezzanine Floor"
                  value={locationForm.new_floor || ''}
                  onChange={(e) => setLocationForm(f => ({ ...f, new_floor: e.target.value }))}
                  style={{ padding: '8px 12px', fontSize: '12px', width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px' }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const flrName = (locationForm.new_floor || '').trim();
                  if (!flrName) { alert('Please enter a floor name.'); return; }
                  const newFloors = [...(locationForm.floors || [])];
                  const existingFlr = newFloors.find(f => f.name.toLowerCase() === flrName.toLowerCase());
                  if (existingFlr) {
                    alert('Floor already exists.');
                    return;
                  }
                  const firstBldId = locationForm.buildings[0]?.id;
                  if (firstBldId) {
                    try {
                      ApiService.createBranchFloor(firstBldId, { name: flrName }).catch(err => console.error("API POST floor failed:", err));
                    } catch (e) {}
                  }
                  newFloors.push({
                    id: `FLR-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: flrName
                  });
                  setLocationForm(f => ({
                    ...f,
                    floors: newFloors,
                    new_floor: ''
                  }));
                }}
                style={{ width: 'fit-content', padding: '10px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end', transition: 'background 0.2s', boxShadow: '0 4px 10px rgba(59,130,246,0.15)' }}
              >
                + Add Floor
              </button>
            </div>
          </div>

          {/* SECTION 3: Departments Setup */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <span style={{ fontSize: '18px' }}>🏢</span>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', letterSpacing: '1px', textTransform: 'uppercase' }}>Departments Setup</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(15, 23, 42, 0.15)' }} />
            </div>
            
            {locationForm.departments && locationForm.departments.length > 0 && (
              <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto' }}>
                  {(locationForm.departments || []).map((dept) => (
                    <div key={dept.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#0f172a', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
                      {editingItemId === dept.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input
                            type="text"
                            className="cm-input"
                            value={editingItemValue}
                            onChange={(e) => setEditingItemValue(e.target.value)}
                            style={{ padding: '2px 6px', fontSize: '11px', width: '180px', minHeight: 'auto', height: '24px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = locationForm.departments.map(d => d.id === dept.id ? { ...d, name: editingItemValue } : d);
                              setLocationForm(f => ({ ...f, departments: updated }));
                              setEditingItemId(null);
                            }}
                            style={{ background: '#10b981', border: 'none', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', height: '24px', fontWeight: 'bold' }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            style={{ background: '#64748b', border: 'none', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', height: '24px' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: '600', color: '#0f172a' }}>🏢 {dept.name}</span>
                      )}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {editingItemId !== dept.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingItemId(dept.id);
                              setEditingItemValue(dept.name);
                            }}
                            style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Edit Department"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
                              try {
                                ApiService.deleteDepartment(dept.id).catch(err => console.error("API DELETE department failed:", err));
                              } catch (e) {}
                              const remainingDept = locationForm.departments.filter(d => d.id !== dept.id);
                              setLocationForm(f => ({ ...f, departments: remainingDept }));
                            }
                          }}
                          style={{ background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: '#ef4444', borderRadius: '6px', cursor: 'pointer', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete Department"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated department creator block */}
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px' }}>➕</span> Register New Department
              </span>
              <div>
                <label style={{ fontSize: '9.5px', textTransform: 'uppercase', color: '#475569', fontWeight: '700', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>Department Name</label>
                <input
                  className="cm-input"
                  type="text"
                  placeholder="e.g. Granulation Department"
                  value={locationForm.new_department || ''}
                  onChange={(e) => setLocationForm(f => ({ ...f, new_department: e.target.value }))}
                  style={{ padding: '8px 12px', fontSize: '12px', width: '100%', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '6px' }}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const deptName = (locationForm.new_department || '').trim();
                  if (!deptName) { alert('Please enter a department name.'); return; }
                  const newDepts = [...(locationForm.departments || [])];
                  const existingDept = newDepts.find(d => d.name.toLowerCase() === deptName.toLowerCase());
                  if (existingDept) {
                    alert('Department already exists.');
                    return;
                  }
                  try {
                    ApiService.createDepartment({ name: deptName }).catch(err => console.error("API POST department failed:", err));
                  } catch (e) {}
                  newDepts.push({
                    id: `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    name: deptName
                  });
                  setLocationForm(f => ({
                    ...f,
                    departments: newDepts,
                    new_department: ''
                  }));
                }}
                style={{ width: 'fit-content', padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', alignSelf: 'flex-end', transition: 'background 0.2s', boxShadow: '0 4px 10px rgba(16,185,129,0.15)' }}
              >
                + Add Department
              </button>
            </div>
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
