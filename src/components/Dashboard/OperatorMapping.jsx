import React, { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './OperatorMapping.css';

const ASSIGNABLE_BY = {
  superadmin: ['admin', 'agm', 'supervisor', 'inspector'],
  admin:      ['agm', 'supervisor', 'inspector'],
  agm:        ['supervisor', 'inspector'],
  supervisor: ['inspector'],
};

const ROLE_COLORS = {
  admin:      { bg: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  agm:        { bg: 'rgba(16,185,129,0.18)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
  supervisor: { bg: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  inspector:  { bg: 'rgba(139,92,246,0.18)', color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
};

const RoleBadge = ({ role }) => {
  const r = (role || '').toLowerCase();
  const style = ROLE_COLORS[r] || { bg: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.2)' };
  return (
    <span className="om-role-badge" style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
      {role}
    </span>
  );
};

const CustomSelect = ({ value, onChange, options, placeholder, icon, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className={`om-select-wrap ${disabled ? 'om-select-disabled' : ''}`} ref={ref}>
      {icon && <div className="om-select-icon">{icon}</div>}
      <div 
        className={`om-select ${!value ? 'om-select-placeholder' : ''}`} 
        onClick={() => !disabled && setOpen(!open)}
        style={{ cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
      >
        {selected ? selected.label : placeholder}
      </div>
      <svg className="om-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" onClick={() => !disabled && setOpen(!open)} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        <polyline points="6 9 12 15 18 9" style={{ transform: open ? 'rotate(180deg)' : 'none', transformOrigin: 'center', transition: 'transform 0.2s' }}/>
      </svg>
      {open && !disabled && (
        <div className="om-custom-dropdown">
          <div className="om-custom-option" onClick={() => { onChange(''); setOpen(false); }}>{placeholder}</div>
          {options.map(opt => (
            <div 
              key={opt.value} 
              className={`om-custom-option ${String(value) === String(opt.value) ? 'selected' : ''}`} 
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function OperatorMapping({ user: propUser, onBack, allowedModules = [] }) {
  const currentUser = propUser || JSON.parse(localStorage.getItem('auth_user') || '{}');
  const assignableRoles = ASSIGNABLE_BY[currentUser?.role] || [];

  const [rawMappings, setRawMappings] = useState([]);
  const [loading, setLoading]        = useState(true);
  const [saving, setSaving]          = useState(false);

  const [branches,  setBranches]  = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors,    setFloors]    = useState([]);
  const [zones,     setZones]     = useState([]);
  const [users,     setUsers]     = useState([]);
  const [availableModules, setAvailableModules] = useState([]);
  // buildingId → { branchId, branchName } — built at init so we can fill missing branch names
  const [buildingBranchMap, setBuildingBranchMap] = useState({});

  const [form, setForm] = useState({
    branch_id: '', building_id: '', floor_id: '', zone_id: '', user_id: '', module_ids: []
  });

  const [activeTab, setActiveTab]     = useState('team');
  const [searchQuery, setSearchQuery] = useState('');

  const companyId = currentUser?.company_id || currentUser?.companyId || currentUser?.company?.id || currentUser?.company?.company_id || '';

  const isMissing = React.useCallback((val) => {
    return !val || val === '—' || val === '-' || String(val).trim() === '' || String(val).toLowerCase() === 'null';
  }, []);

  // Enrich raw mappings: fill missing branch names and branchIds from branches list or buildingBranchMap
  const mappings = React.useMemo(() => rawMappings.map(m => {
    let branch = m.branch;
    let branchId = m.branchId;
    if (isMissing(branch) || !branchId) {
      // Try direct branch lookup by branchId
      if (branchId) {
        const found = branches.find(b => String(b.id) === String(branchId));
        if (found) branch = found.branch_name || found.name || '—';
      }
      // Fallback: derive branch and branchId from building via the buildingBranchMap
      if ((isMissing(branch) || !branchId) && (m.buildingId || !isMissing(m.building))) {
        const match = buildingBranchMap[String(m.buildingId)] || buildingBranchMap[String(m.building).toLowerCase()];
        if (match) {
          branch = match.branchName || branch || '—';
          branchId = match.branchId || branchId;
        }
      }
      // Final fallback: use current user's branch if it's still missing
      if (isMissing(branch)) {
        branch = currentUser?.branch_name || currentUser?.company_name || '—';
        if (!branchId) branchId = currentUser?.branch_id;
      }
    }
    return { ...m, branch, branchId };
  }), [rawMappings, branches, buildingBranchMap, currentUser, isMissing]);

  const companyMappings = companyId
    ? mappings.filter(m => !m.companyId || String(m.companyId) === String(companyId))
    : mappings;
  const myMappings = React.useMemo(() => {
    const explicit = companyMappings.filter(m => String(m.userId) === String(currentUser?.id));
    if ((currentUser?.role === 'admin' || currentUser?.role === 'superadmin') && explicit.length === 0) {
      const uniqueBldgs = [];
      const seenIds = new Set();
      Object.values(buildingBranchMap).forEach(b => {
        if (b.buildingId && !seenIds.has(b.buildingId)) {
          seenIds.add(b.buildingId);
          uniqueBldgs.push(b);
        }
      });
      if (uniqueBldgs.length > 0) {
        return uniqueBldgs.map((b) => ({
          id: `global-${b.buildingId}`,
          branchId: b.branchId,
          buildingId: b.buildingId,
          branch: b.branchName || '—',
          building: b.buildingName || '—',
          floor: 'All',
          zone: 'All',
          moduleName: 'All Modules'
        }));
      }
    }
    return explicit;
  }, [companyMappings, currentUser, buildingBranchMap]);

  const teamMappings = companyMappings.filter(m => {
    // Exclude the current user's own assignments from the team tab
    if (String(m.userId) === String(currentUser?.id)) return false;
    
    // Admins and superadmins see all team assignments in the company
    if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') return true;
    
    // Other roles (AGM, Supervisor) only see assignments they explicitly created
    return String(m.assignedBy) === String(currentUser?.id);
  });

  const filteredTeam = teamMappings.filter(m =>
    !searchQuery ||
    m.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.branch?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.building?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.floor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.zone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Branches — fetch then build a buildingId→branch lookup for enriching missing branch names
    ApiService.getBranches(companyId ? { company_id: companyId } : {})
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.branches || res?.data || []);
        const branchList = companyId ? list.filter(b => !b.company_id || String(b.company_id) === String(companyId)) : list;
        setBranches(branchList);

          // For each branch, fetch its buildings and build the lookup map
          Promise.all(
            branchList.map(branch =>
              ApiService.getBranchBuildings(branch.id)
                .then(bRes => {
                  const bldgs = Array.isArray(bRes) ? bRes : (bRes?.buildings || bRes?.data || []);
                  return bldgs.map(b => ({
                    buildingId: String(b.id),
                    buildingName: b.building_name || b.name || '',
                    branchId:   String(branch.id),
                    branchName: branch.branch_name || branch.name || '',
                  }));
                })
                .catch(() => [])
            )
          ).then(results => {
            const map = {};
            results.flat().forEach(entry => {
              map[entry.buildingId] = entry;
              if (entry.buildingName) {
                map[entry.buildingName.toLowerCase()] = entry;
              }
            });
            setBuildingBranchMap(map);
          });
        })
        .catch(() => {});

    // Users — pass company_id so the backend filters; also filter client-side by
    // company_id AND only assignable roles for this user's role level
    ApiService.getAdminUsers(companyId ? { company_id: companyId } : {})
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.users || res?.data || []);
        setUsers(
          list.filter(u =>
            assignableRoles.includes((u.role || '').toLowerCase()) &&
            (!companyId || !u.company_id || String(u.company_id) === String(companyId))
          )
        );
      })
      .catch(() => {});

    // Modules — pass company_id so the backend can filter; also guard client-side
    // so only this company's modules appear as chip options
    ApiService.getAdminModules(companyId ? { company_id: companyId } : {})
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.modules || []);
        let filtered = companyId
          ? list.filter(m => !m.company_id || String(m.company_id) === String(companyId))
          : list;
        // If the current user has restricted module access, only let them assign those modules
        if (currentUser?.role !== 'superadmin') {
          // The allowedModules array already contains exactly what the user is permitted to see.
          // If they have no allowed modules, it should be empty.
          filtered = Array.isArray(allowedModules) ? allowedModules : [];
        }
        
        setAvailableModules(filtered);
      })
      .catch(() => {});

    fetchMappings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── cascade: branch → buildings ──────────────────────────────────────────
  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'superadmin') return;
    
    if (myMappings && myMappings.length > 0) {
      const uniqueBranches = [...new Set(myMappings.map(m => m.branchId).filter(Boolean))];
      const uniqueBuildings = [...new Set(myMappings.map(m => m.buildingId).filter(Boolean))];
      
      setForm(prev => {
        let updates = {};
        if (uniqueBranches.length === 1 && !prev.branch_id) updates.branch_id = uniqueBranches[0];
        if (uniqueBuildings.length === 1 && !prev.building_id) updates.building_id = uniqueBuildings[0];
        return Object.keys(updates).length > 0 ? { ...prev, ...updates } : prev;
      });
    }
  }, [myMappings, currentUser?.role]);

  // ── cascade: branch → buildings ──────────────────────────────────────────
  useEffect(() => {
    if (!form.branch_id) { setBuildings([]); setFloors([]); setZones([]); return; }
    ApiService.getBranchBuildings(form.branch_id)
      .then(res => {
        setBuildings(Array.isArray(res) ? res : (res?.buildings || res?.data || []));
        setFloors([]); setZones([]);
      })
      .catch(() => {});
  }, [form.branch_id]);

  // ── cascade: building → floors ────────────────────────────────────────────
  useEffect(() => {
    if (!form.building_id) { setFloors([]); setZones([]); return; }
    ApiService.getBuildingFloors(form.building_id)
      .then(res => {
        setFloors(Array.isArray(res) ? res : (res?.floors || res?.data || []));
        setZones([]);
      })
      .catch(() => {});
  }, [form.building_id]);

  // ── cascade: floor → zones ────────────────────────────────────────────────
  useEffect(() => {
    if (!form.floor_id) { setZones([]); return; }
    ApiService.getFloorZones(form.floor_id)
      .then(res => setZones(Array.isArray(res) ? res : (res?.zones || res?.data || [])))
      .catch(() => {});
  }, [form.floor_id]);

  // ── fetch existing mappings ───────────────────────────────────────────────
  const fetchMappings = async () => {
    setLoading(true);
    try {
      // _injectCompanyId already adds company_id, but pass it explicitly for clarity
      const res = await ApiService.getOperatorMappings(companyId ? { company_id: companyId } : {});
      const raw = Array.isArray(res) ? res : (res?.data || res?.items || []);
      // Client-side guard: keep only records that belong to this company
      const scoped = companyId
        ? raw.filter(item => !item.company_id || String(item.company_id) === String(companyId))
        : raw;
      setRawMappings(scoped.map((item, i) => ({
        id:         item.id || Date.now() + i,
        branch:     item.branch_name   || item.branch   || '—',
        building:   item.building_name || item.building || '—',
        floor:      item.floor_name    || item.floor    || '—',
        zone:       item.zone_name     || item.zone     || '—',
        branchId:   item.branch_id,
        buildingId: item.building_id,
        floorId:    item.floor_id,
        zoneId:     item.zone_id,
        userName:   item.user_name || item.inspector || `User ${item.user_id}`,
        userRole:   item.user_role || '',
        userId:     item.user_id,
        companyId:  item.company_id,
        moduleId:   item.module_id,
        moduleName: item.module_name || (item.module_id ? `Module ${item.module_id}` : 'All Modules'),
        assignedBy: item.assigned_by || item.created_by,
        assignedByRole: item.assigned_by_role || item.creator_role || '',
      })));
    } catch {
      const local = localStorage.getItem('operator_mappings');
      setRawMappings(local ? JSON.parse(local) : []);
    } finally {
      setLoading(false);
    }
  };

  // ── add assignment ────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.user_id)    { alert('Please select a user to assign to.'); return; }
    if (!form.branch_id)  { alert('Please select at least a branch.');   return; }

    setSaving(true);
    try {
      const branch   = branches.find(b  => String(b.id)  === String(form.branch_id));
      const building = buildings.find(b => String(b.id)  === String(form.building_id));
      const floor    = floors.find(f    => String(f.id)  === String(form.floor_id));
      const zone     = zones.find(z     => String(z.id)  === String(form.zone_id));

      const basePayload = {
        company_id:    currentUser?.company_id,
        user_id:       Number(form.user_id),
        assigned_by:   currentUser.id,
        branch_id:     form.branch_id   || undefined,
        branch_name:   branch?.branch_name   || branch?.name   || undefined,
        building_id:   form.building_id || undefined,
        building_name: building?.building_name || building?.name || undefined,
        floor_id:      form.floor_id    || undefined,
        floor_name:    floor?.floor_name     || floor?.name     || undefined,
        zone_id:       form.zone_id     || undefined,
        zone_name:     zone?.zone_name       || zone?.name      || undefined,
      };

      const modsToAssign = form.module_ids.length > 0 ? form.module_ids : [null];

      await Promise.all(modsToAssign.map(modId => {
        const payload = { ...basePayload };
        if (modId) payload.module_id = Number(modId);
        const modObj = availableModules.find(m => String(m.id || m.module_id) === String(modId));
        if (modObj) payload.module_name = modObj.name;
        return ApiService.createOperatorMapping(payload);
      }));

      setForm({ branch_id: '', building_id: '', floor_id: '', zone_id: '', user_id: '', module_ids: [] });
      fetchMappings();
    } catch (e) {
      console.error(e);
      alert('Failed to save assignment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this location assignment?')) return;
    try {
      await ApiService.deleteOperatorMapping(id);
    } catch {
      // optimistic removal
    }
    setRawMappings(prev => prev.filter(m => m.id !== id));
  };

  const setField = (field, value, resetFields = []) => {
    const resets = Object.fromEntries(resetFields.map(f => [f, '']));
    setForm(prev => ({ ...prev, [field]: value, ...resets }));
  };

  const toggleModule = (modId) => {
    setForm(prev => {
      const ids = prev.module_ids || [];
      return {
        ...prev,
        module_ids: ids.includes(modId) ? ids.filter(id => id !== modId) : [...ids, modId],
      };
    });
  };

  const handleReset = () => {
    setForm({ branch_id: '', building_id: '', floor_id: '', zone_id: '', user_id: '', module_ids: [] });
  };

  return (
    <div className="om-page">

      {/* ── Page Header ── */}
      <div className="om-page-header">
        <div className="om-page-header-left">
          {onBack && (
            <button className="om-back-btn" onClick={onBack} title="Back to Dashboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
          )}
          <div>
            <h1 className="om-page-title">Location Management</h1>
            <p className="om-page-subtitle">View your locations and assign locations to your team</p>
          </div>
        </div>
        
        {activeTab === 'team' && (
          <div className="om-form-actions-top" style={{ margin: 0, padding: 0 }}>
            <button className="om-btn-reset" onClick={handleReset} disabled={saving}>
              Reset
            </button>
            <button
              className="om-btn-assign"
              onClick={handleAdd}
              disabled={saving || !form.user_id || !form.branch_id}
            >
              {saving ? (
                <>
                  <div className="om-mini-spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Assign Location
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="om-tabs-bar" style={{ justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className={`om-tab-btn${activeTab === 'team' ? ' om-tab-active' : ''}`}
            onClick={() => setActiveTab('team')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Team Assignments
            {teamMappings.length > 0 && <span className="om-tab-count">{teamMappings.length}</span>}
          </button>
          <button
            className={`om-tab-btn${activeTab === 'my' ? ' om-tab-active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            My Assigned Locations
            {myMappings.length > 0 && <span className="om-tab-count">{myMappings.length}</span>}
          </button>
        </div>

        {activeTab === 'team' && (
          <div className="om-search-wrap" style={{ marginBottom: '-6px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              className="om-search-input"
              placeholder="Search assignments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="om-search-clear" onClick={() => setSearchQuery('')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="om-body">

        {/* ══════════════════════════ TEAM TAB ══════════════════════════ */}
        {activeTab === 'team' && (
          <>
            {/* Assignment Form Card */}
            <div className="om-form-card" style={{ paddingTop: '20px' }}>
              <div className="om-location-grid">
                <div className="om-field-group">
                  <label className="om-field-label">Branch <span className="om-required">*</span></label>
                  {(() => {
                    const uniqueBranches = currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin' ? [...new Set(myMappings.map(m => m.branchId).filter(Boolean))] : [];
                    const isLocked = uniqueBranches.length === 1;
                    return (
                      <CustomSelect
                        value={form.branch_id}
                        onChange={v => setField('branch_id', v, ['building_id', 'floor_id', 'zone_id'])}
                        placeholder="Select Branch"
                        options={branches.map(b => ({ value: b.id, label: b.branch_name || b.name }))}
                        disabled={isLocked}
                        icon={
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9 22 9 12 15 12 15 22"/>
                          </svg>
                        }
                      />
                    );
                  })()}
                </div>

                <div className="om-field-group">
                  <label className="om-field-label">Building</label>
                  {(() => {
                    const uniqueBuildings = currentUser?.role !== 'admin' && currentUser?.role !== 'superadmin' ? [...new Set(myMappings.map(m => m.buildingId).filter(Boolean))] : [];
                    const isLocked = uniqueBuildings.length === 1;
                    return (
                      <CustomSelect
                        value={form.building_id}
                        onChange={v => setField('building_id', v, ['floor_id', 'zone_id'])}
                        placeholder="Any Building"
                        options={buildings.map(b => ({ value: b.id, label: b.building_name || b.name }))}
                        disabled={isLocked || !form.branch_id || buildings.length === 0}
                        icon={
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                            <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                          </svg>
                        }
                      />
                    );
                  })()}
                </div>

                <div className="om-field-group">
                  <label className="om-field-label">Floor</label>
                  <CustomSelect
                    value={form.floor_id}
                    onChange={v => setField('floor_id', v, ['zone_id'])}
                    placeholder="Any Floor"
                    options={floors.map(f => ({ value: f.id, label: f.floor_name || f.name }))}
                    disabled={!form.building_id || floors.length === 0}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"/>
                        <line x1="8" y1="12" x2="21" y2="12"/>
                        <line x1="8" y1="18" x2="21" y2="18"/>
                        <line x1="3" y1="6" x2="3.01" y2="6"/>
                        <line x1="3" y1="12" x2="3.01" y2="12"/>
                        <line x1="3" y1="18" x2="3.01" y2="18"/>
                      </svg>
                    }
                  />
                </div>

                <div className="om-field-group">
                  <label className="om-field-label">Zone</label>
                  <CustomSelect
                    value={form.zone_id}
                    onChange={v => setField('zone_id', v)}
                    placeholder="Any Zone"
                    options={zones.map(z => ({ value: z.id, label: z.zone_name || z.name }))}
                    disabled={!form.floor_id || zones.length === 0}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                      </svg>
                    }
                  />
                </div>

                <div className="om-field-group">
                  <label className="om-field-label">Module</label>
                  <CustomSelect
                    value={form.module_ids[0] || ''}
                    onChange={v => setField('module_ids', v ? [v] : [])}
                    placeholder="All Modules"
                    options={availableModules.map(m => ({ value: m.id || m.module_id, label: m.name || m.module_name }))}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                        <line x1="8" y1="21" x2="16" y2="21"/>
                        <line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                    }
                  />
                </div>

                <div className="om-field-group">
                  <label className="om-field-label">
                    Team Member <span className="om-required">*</span>
                  </label>
                  <CustomSelect
                    value={form.user_id}
                    onChange={v => setField('user_id', v)}
                    placeholder="Select Team Member"
                    options={users.map(u => ({ value: u.id, label: `${u.name || u.username} — ${u.role}` }))}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>

            {/* ── Team Assignments Table ── */}
            <div className="om-table-card">


              <div className="om-table-wrap">
                <table className="om-table">
                  <thead>
                    <tr>
                      <th className="om-th">S.No</th>
                      <th className="om-th">Assigned To</th>
                      <th className="om-th">Branch</th>
                      <th className="om-th">Building</th>
                      <th className="om-th">Floor</th>
                      <th className="om-th">Zone</th>
                      <th className="om-th">Module</th>
                      <th className="om-th om-th-action"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="om-td om-td-center">
                          <div className="om-table-loading">
                            <div className="om-mini-spinner" />
                            Loading assignments...
                          </div>
                        </td>
                      </tr>
                    ) : filteredTeam.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="om-td om-td-center">
                          <div className="om-empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                              <circle cx="12" cy="10" r="3"/>
                            </svg>
                            <p>{searchQuery ? 'No assignments match your search.' : 'No team location assignments yet.'}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredTeam.map((m, idx) => (
                        <tr key={m.id} className="om-tr">
                          <td className="om-td om-td-num">{String(idx + 1).padStart(2, '0')}</td>
                          <td className="om-td">
                            <div className="om-user-cell">
                              <div className="om-user-avatar">
                                {(m.userName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="om-user-name">{m.userName}</div>
                                {m.userRole && <RoleBadge role={m.userRole} />}
                              </div>
                            </div>
                          </td>
                          <td className="om-td">
                            {!isMissing(m.branch) ? (
                              <span className="om-location-cell om-loc-branch">
                                <span className="om-loc-dot"></span>
                                {m.branch}
                              </span>
                            ) : <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>}
                          </td>
                          <td className="om-td">
                            {!isMissing(m.building) ? (
                              <span className="om-location-cell om-loc-building">
                                <span className="om-loc-dot"></span>
                                {m.building}
                              </span>
                            ) : <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>}
                          </td>
                          <td className="om-td">
                            {!isMissing(m.floor) ? (
                              <span className="om-location-cell om-loc-floor">
                                <span className="om-loc-dot"></span>
                                {m.floor}
                              </span>
                            ) : <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>}
                          </td>
                          <td className="om-td">
                            {!isMissing(m.zone) ? (
                              <span className="om-location-cell om-loc-zone">
                                <span className="om-loc-dot"></span>
                                {m.zone}
                              </span>
                            ) : <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>}
                          </td>
                          <td className="om-td">
                            <span className="om-module-badge">{m.moduleName}</span>
                          </td>
                          <td className="om-td om-td-action">
                            {(() => {
                              const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
                              const isCreator = String(m.assignedBy) === String(currentUser?.id);
                              const assignedByAdmin = m.assignedByRole === 'admin' || m.assignedByRole === 'superadmin';
                              
                              // If current user is an admin, they can delete anything.
                              // If current user is not an admin, they CANNOT delete assignments made by admins.
                              // For simplicity and safety, they can only delete if they created it or if we are sure it wasn't an admin.
                              const canDelete = isAdmin || (!assignedByAdmin && (isCreator || !m.assignedBy));
                              
                              if (!canDelete) return null;
                              return (
                                <button
                                  className="om-remove-btn"
                                  onClick={() => handleDelete(m.id)}
                                  title="Remove assignment"
                                >
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6l-1 14H6L5 6"/>
                                    <path d="M10 11v6M14 11v6"/>
                                    <path d="M9 6V4h6v2"/>
                                  </svg>
                                </button>
                              );
                            })()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════ MY LOCATIONS TAB ══════════════════════════ */}
        {activeTab === 'my' && (() => {
          // Show columns hierarchically: if zone assigned → show all 4 levels;
          // if floor assigned → show branch+building+floor; if building → branch+building, etc.
          const hasZone     = myMappings.some(m => m.zoneId     || (m.zone     && m.zone     !== '—'));
          const hasFloor    = hasZone     || myMappings.some(m => m.floorId    || (m.floor    && m.floor    !== '—'));
          const hasBuilding = hasFloor    || myMappings.some(m => m.buildingId || (m.building && m.building !== '—'));
          const hasBranch   = hasBuilding || myMappings.some(m => m.branchId   || (m.branch   && m.branch   !== '—'));
          const colCount = 1 + [hasBranch, hasBuilding, hasFloor, hasZone].filter(Boolean).length + 1;

          const LocCell = ({ value, colorClass }) => !isMissing(value) ? (
            <span className={`om-location-cell ${colorClass}`}>
              <span className="om-loc-dot"></span>
              {value}
            </span>
          ) : (
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>
          );

          return (
            <div className="om-table-card">
              <div className="om-table-wrap">
                <table className="om-table">
                  <thead>
                    <tr>
                      <th className="om-th">S.No</th>
                      {hasBranch   && <th className="om-th">Branch</th>}
                      {hasBuilding && <th className="om-th">Building</th>}
                      {hasFloor    && <th className="om-th">Floor</th>}
                      {hasZone     && <th className="om-th">Zone</th>}
                      <th className="om-th">Module</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={colCount} className="om-td om-td-center">
                          <div className="om-table-loading">
                            <div className="om-mini-spinner" />
                            Loading your locations...
                          </div>
                        </td>
                      </tr>
                    ) : myMappings.length === 0 ? (
                      <tr>
                        <td colSpan={colCount} className="om-td om-td-center">
                          <div className="om-empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                              <circle cx="12" cy="7" r="4"/>
                            </svg>
                            <p>You have no assigned locations.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      myMappings.map((m, idx) => (
                        <tr key={m.id} className="om-tr">
                          <td className="om-td om-td-num">{String(idx + 1).padStart(2, '0')}</td>
                          {hasBranch   && <td className="om-td"><LocCell value={m.branch}   colorClass="om-loc-branch"   /></td>}
                          {hasBuilding && <td className="om-td"><LocCell value={m.building} colorClass="om-loc-building" /></td>}
                          {hasFloor    && <td className="om-td"><LocCell value={m.floor}    colorClass="om-loc-floor"    /></td>}
                          {hasZone     && <td className="om-td"><LocCell value={m.zone}     colorClass="om-loc-zone"     /></td>}
                          <td className="om-td">
                            <span className="om-module-badge">{m.moduleName}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
