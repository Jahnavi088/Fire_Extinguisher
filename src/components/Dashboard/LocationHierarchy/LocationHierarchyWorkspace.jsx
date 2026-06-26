import React, { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../../../services/apiService';
import SmartLocationInput from './SmartLocationInput';
import './LocationHierarchy.css';

const LEVEL = {
  branch:     { color: '#3b82f6', light: '#eff6ff', icon: '🏢', label: 'Branch',     nameKey: 'branch_name',     childLabel: 'Buildings'   },
  building:   { color: '#10b981', light: '#f0fdf4', icon: '🏛️', label: 'Building',   nameKey: 'building_name',   childLabel: 'Floors'      },
  floor:      { color: '#f59e0b', light: '#fffbeb', icon: '🔢', label: 'Floor',      nameKey: 'floor_name',      childLabel: 'Zones'       },
  zone:       { color: '#8b5cf6', light: '#f5f3ff', icon: '📍', label: 'Zone',       nameKey: 'zone_name',       childLabel: 'Departments' },
  department: { color: '#ec4899', light: '#fdf2f8', icon: '🗂️', label: 'Department', nameKey: 'department_name', childLabel: null          },
};

const PLACEHOLDER = {
  branch:     'e.g. Mumbai Andheri Branch — type to detect location',
  building:   'e.g. Main Office Building — type to detect location',
  floor:      'e.g. Ground Floor / Floor 3',
  zone:       'e.g. Zone A / North Wing',
  department: 'e.g. Safety Department',
};

const EMPTY_FORM = { name: '', latitude: '', longitude: '', geocodedFrom: '' };

function itemName(type, item) {
  return item?.[LEVEL[type]?.nameKey] || item?.name || '';
}

function normalizeList(res, ...keys) {
  if (Array.isArray(res)) return res;
  for (const key of keys) {
    if (Array.isArray(res?.[key])) return res[key];
  }
  if (Array.isArray(res?.data)) return res.data;
  return [];
}

export default function LocationHierarchyWorkspace({ selectedLocationCompany, onBack }) {
  const cid = selectedLocationCompany?.id || selectedLocationCompany?.company_id;

  // Per-level data
  const [branches,    setBranches]    = useState([]);
  const [buildings,   setBuildings]   = useState([]);
  const [floors,      setFloors]      = useState([]);
  const [zones,       setZones]       = useState([]);
  const [departments, setDepartments] = useState([]);

  // Navigation state
  const [selectedBranch,   setSelectedBranch]   = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedFloor,    setSelectedFloor]    = useState(null);
  const [selectedZone,     setSelectedZone]     = useState(null);

  // UI state
  const [loading,     setLoading]    = useState(true);
  const [navigating,  setNavigating] = useState(false);
  const [modal,       setModal]      = useState({ open: false, type: '', parent: null, item: null });
  const [form,        setForm]       = useState(EMPTY_FORM);
  const [saving,      setSaving]     = useState(false);
  const [toast,       setToast]      = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,    setDeleting]   = useState(false);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Current view derived from selection state ─────────────────────────────
  const getCurrentView = () => {
    if (selectedZone)     return { currentType: 'department', parent: selectedZone,     items: departments };
    if (selectedFloor)    return { currentType: 'zone',       parent: selectedFloor,    items: zones       };
    if (selectedBuilding) return { currentType: 'floor',      parent: selectedBuilding, items: floors      };
    if (selectedBranch)   return { currentType: 'building',   parent: selectedBranch,   items: buildings   };
    return                       { currentType: 'branch',     parent: null,             items: branches    };
  };
  const { currentType, parent, items } = getCurrentView();
  const cfg = LEVEL[currentType];

  // ── Data loaders ──────────────────────────────────────────────────────────
  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.getBranches({ company_id: cid });
      setBranches(normalizeList(res, 'branches', 'data'));
    } catch (e) {
      showToast('Failed to load branches: ' + e.message, 'error');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [cid, showToast]);

  const loadBuildings = async (branchId) => {
    setNavigating(true);
    try {
      const res = await ApiService.getBranchBuildings(branchId);
      setBuildings(normalizeList(res, 'buildings', 'data'));
    } catch (e) {
      showToast('Failed to load buildings: ' + e.message, 'error');
      setBuildings([]);
    } finally {
      setNavigating(false);
    }
  };

  const loadFloors = async (buildingId) => {
    setNavigating(true);
    try {
      const res = await ApiService.getBuildingFloors(buildingId);
      setFloors(normalizeList(res, 'floors', 'data'));
    } catch (e) {
      showToast('Failed to load floors: ' + e.message, 'error');
      setFloors([]);
    } finally {
      setNavigating(false);
    }
  };

  const loadZones = async (floorId) => {
    setNavigating(true);
    try {
      const res = await ApiService.getFloorZones(floorId);
      setZones(normalizeList(res, 'zones', 'data'));
    } catch (e) {
      showToast('Failed to load zones: ' + e.message, 'error');
      setZones([]);
    } finally {
      setNavigating(false);
    }
  };

  const loadDepartments = async (zoneId) => {
    setNavigating(true);
    try {
      const res = await ApiService.getZoneDepartments(zoneId);
      setDepartments(normalizeList(res, 'departments', 'data'));
    } catch (e) {
      showToast('Failed to load departments: ' + e.message, 'error');
      setDepartments([]);
    } finally {
      setNavigating(false);
    }
  };

  useEffect(() => { loadBranches(); }, [loadBranches]);

  // Refresh the currently displayed level
  const refreshCurrent = (selBranch, selBuilding, selFloor, selZone) => {
    const br  = selBranch   !== undefined ? selBranch   : selectedBranch;
    const bl  = selBuilding !== undefined ? selBuilding : selectedBuilding;
    const fl  = selFloor    !== undefined ? selFloor    : selectedFloor;
    const zn  = selZone     !== undefined ? selZone     : selectedZone;

    if (zn)  return loadDepartments(zn.id);
    if (fl)  return loadZones(fl.id);
    if (bl)  return loadFloors(bl.id);
    if (br)  return loadBuildings(br.id);
    return loadBranches();
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleCardClick = async (type, item) => {
    if (type === 'branch') {
      setSelectedBranch(item);
      setSelectedBuilding(null); setSelectedFloor(null); setSelectedZone(null);
      setBuildings([]); setFloors([]); setZones([]); setDepartments([]);
      await loadBuildings(item.id);
    } else if (type === 'building') {
      setSelectedBuilding(item);
      setSelectedFloor(null); setSelectedZone(null);
      setFloors([]); setZones([]); setDepartments([]);
      await loadFloors(item.id);
    } else if (type === 'floor') {
      setSelectedFloor(item);
      setSelectedZone(null);
      setZones([]); setDepartments([]);
      await loadZones(item.id);
    } else if (type === 'zone') {
      setSelectedZone(item);
      setDepartments([]);
      await loadDepartments(item.id);
    }
  };

  const goBack = () => {
    if (selectedZone) {
      setSelectedZone(null); setDepartments([]);
    } else if (selectedFloor) {
      setSelectedFloor(null); setSelectedZone(null); setZones([]); setDepartments([]);
    } else if (selectedBuilding) {
      setSelectedBuilding(null); setSelectedFloor(null); setSelectedZone(null);
      setFloors([]); setZones([]); setDepartments([]);
    } else if (selectedBranch) {
      setSelectedBranch(null); setSelectedBuilding(null); setSelectedFloor(null); setSelectedZone(null);
      setBuildings([]); setFloors([]); setZones([]); setDepartments([]);
    }
  };

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openModal = (type, parentItem, editItem = null) => {
    setModal({ open: true, type, parent: parentItem, item: editItem });
    setForm({
      name:         editItem ? itemName(type, editItem) : '',
      latitude:     editItem?.latitude  || '',
      longitude:    editItem?.longitude || '',
      geocodedFrom: '',
    });
  };

  const closeModal = () => {
    setModal({ open: false, type: '', parent: null, item: null });
    setForm(EMPTY_FORM);
  };

  const handleGeocode = (lat, lng, displayName) => {
    setForm(f => ({ ...f, latitude: String(lat), longitude: String(lng), geocodedFrom: displayName }));
  };

  // ── Save (create / update) ────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    const { type, parent: par, item } = modal;
    try {
      let payload = {};
      if (type === 'branch')     payload = { company_id: cid, branch_name: form.name, ...(form.latitude && { latitude: form.latitude }), ...(form.longitude && { longitude: form.longitude }) };
      if (type === 'building')   payload = { branch_id: par.id, building_name: form.name, ...(form.latitude && { latitude: form.latitude }), ...(form.longitude && { longitude: form.longitude }) };
      if (type === 'floor')      payload = { building_id: par.id, floor_name: form.name };
      if (type === 'zone')       payload = { floor_id: par.id, zone_name: form.name };
      if (type === 'department') payload = { zone_id: par.id, department_name: form.name };

      if (item) {
        if (type === 'branch')     await ApiService.updateBranch(item.id, payload);
        if (type === 'building')   await ApiService.updateBuilding(item.id, payload);
        if (type === 'floor')      await ApiService.updateFloor(item.id, payload);
        if (type === 'zone')       await ApiService.updateZone(item.id, payload);
        if (type === 'department') await ApiService.updateDepartmentHierarchy(item.id, payload);
        showToast(`${LEVEL[type].label} updated successfully!`);
      } else {
        if (type === 'branch')     await ApiService.createBranch(payload);
        if (type === 'building')   await ApiService.createBuilding(payload);
        if (type === 'floor')      await ApiService.createFloor(payload);
        if (type === 'zone')       await ApiService.createZone(payload);
        if (type === 'department') await ApiService.createDepartmentHierarchy(payload);
        showToast(`${LEVEL[type].label} created successfully!`);
      }
      closeModal();
      refreshCurrent();
    } catch (e) {
      showToast('Error: ' + (e.message || 'Server error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { type, id, name } = deleteTarget;
    try {
      if (type === 'branch')     await ApiService.deleteBranch(id);
      if (type === 'building')   await ApiService.deleteBuilding(id);
      if (type === 'floor')      await ApiService.deleteFloor(id);
      if (type === 'zone')       await ApiService.deleteZone(id);
      if (type === 'department') await ApiService.deleteDepartmentHierarchy(id);

      setDeleteTarget(null);
      showToast(`"${name}" deleted successfully!`);
      refreshCurrent();
    } catch (e) {
      showToast('Error deleting: ' + e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="lh-workspace">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="lh-header">
        <button className="lh-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>

        <div className="lh-header-info">
          <div className="lh-header-title">Location Management</div>
          <div className="lh-header-subtitle">
            🏭 {selectedLocationCompany?.name || selectedLocationCompany?.company_name || 'Company'}
          </div>
        </div>

        <button className="lh-reload-btn" onClick={() => refreshCurrent()} title="Refresh">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
            <path d="M4 4v5h5M20 20v-5h-5" /><path d="M4 9a8 8 0 0114.93-2M20 15a8 8 0 01-14.93 2" />
          </svg>
        </button>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <div className="lh-content">

        {/* Level header + action buttons */}
        <div className="lh-level-header">
          <div className="lh-level-title-wrap">
            <span style={{ fontSize: 28 }}>{cfg.icon}</span>
            <div>
              <div className="lh-level-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {cfg.label}s
                <span className="lh-level-badge" style={{ background: cfg.light, color: cfg.color }}>
                  {items.length}
                </span>
              </div>
              {parent && (
                <div className="lh-level-subtitle">
                  in {itemName(
                    currentType === 'building'   ? 'branch'   :
                    currentType === 'floor'      ? 'building' :
                    currentType === 'zone'       ? 'floor'    : 'zone',
                    parent
                  )}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {parent && (
              <button
                className="lh-action-btn edit"
                style={{ padding: '9px 16px', borderRadius: 8, fontWeight: 600, fontSize: 13 }}
                onClick={goBack}
              >
                ← Back
              </button>
            )}
            <button
              className="lh-add-btn"
              style={{ background: cfg.color, color: '#fff' }}
              onClick={() => openModal(currentType, parent)}
            >
              + Add {cfg.label}
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="lh-loading">
            <div className="lh-loading-spinner" />
            <span>Loading branches…</span>
          </div>
        ) : navigating ? (
          <div className="lh-loading">
            <div className="lh-loading-spinner" style={{ borderTopColor: cfg.color }} />
            <span>Loading {cfg.label}s…</span>
          </div>
        ) : (
          <div className="lh-table-container">
            <table className="lh-table">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>S.No</th>
                  <th>{cfg.label} Name</th>
                  {currentType !== 'department' && (
                    <th style={{ width: 160, textAlign: 'center' }}>Navigate</th>
                  )}
                  <th style={{ textAlign: 'right', width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={currentType !== 'department' ? 4 : 3} style={{ padding: '52px 20px' }}>
                      <div className="lh-empty" style={{ padding: 0, border: 'none', background: 'transparent' }}>
                        <div className="lh-empty-icon">{cfg.icon}</div>
                        <div className="lh-empty-title">No {cfg.label}s yet</div>
                        <div className="lh-empty-sub">
                          Click "+ Add {cfg.label}" above to create your first one
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const isLeaf = currentType === 'department';
                    return (
                      <tr
                        key={item.id}
                        className={isLeaf ? '' : 'lh-table-row-clickable'}
                        onClick={() => !isLeaf && handleCardClick(currentType, item)}
                      >
                        <td style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>
                          {index + 1}
                        </td>

                        <td>
                          <div className="lh-table-name-cell">
                            <span
                              className="lh-table-icon"
                              style={{ background: cfg.light, color: cfg.color }}
                            >
                              {cfg.icon}
                            </span>
                            <div>
                              <div style={{ fontWeight: 600, color: '#111827', fontSize: 14 }}>
                                {itemName(currentType, item)}
                              </div>
                              {(item.latitude && item.longitude) && (
                                <div style={{ fontSize: 11, color: '#10b981', marginTop: 3, fontFamily: 'monospace' }}>
                                  📍 {parseFloat(item.latitude).toFixed(4)}°N &nbsp;
                                  {parseFloat(item.longitude).toFixed(4)}°E
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {!isLeaf && (
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="lh-next-btn"
                              onClick={e => { e.stopPropagation(); handleCardClick(currentType, item); }}
                              style={{
                                background: cfg.light,
                                color: cfg.color,
                                border: `1.5px solid ${cfg.color}50`,
                                padding: '6px 16px',
                                borderRadius: 20,
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                fontFamily: 'inherit',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(0.92)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.filter = ''; e.currentTarget.style.transform = ''; }}
                            >
                              {cfg.childLabel} →
                            </button>
                          </td>
                        )}

                        <td style={{ textAlign: 'right' }}>
                          <div className="lh-table-actions">
                            <button
                              className="lh-action-btn edit"
                              onClick={e => { e.stopPropagation(); openModal(currentType, parent, item); }}
                            >
                              ✎ Edit
                            </button>
                            <button
                              className="lh-action-btn del"
                              onClick={e => {
                                e.stopPropagation();
                                setDeleteTarget({ type: currentType, id: item.id, name: itemName(currentType, item) });
                              }}
                            >
                              ✕ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ADD / EDIT MODAL ──────────────────────────────────────────────────── */}
      {modal.open && (() => {
        const mcfg = LEVEL[modal.type];
        const hasCoords = modal.type === 'branch' || modal.type === 'building';
        const coordsFilled = form.latitude && form.longitude;
        return (
          <div className="lh-overlay">
            <div className="lh-modal">
              <div className="lh-modal-header">
                <div className="lh-modal-header-icon" style={{ background: mcfg.light }}>
                  {mcfg.icon}
                </div>
                <div>
                  <div className="lh-modal-title">
                    {modal.item ? 'Edit' : 'Add'} {mcfg.label}
                  </div>
                  <div className="lh-modal-subtitle">
                    {modal.parent
                      ? `Under: ${itemName(
                          modal.type === 'building' ? 'branch' :
                          modal.type === 'floor'    ? 'building' :
                          modal.type === 'zone'     ? 'floor' : 'zone',
                          modal.parent
                        )}`
                      : (selectedLocationCompany?.name || selectedLocationCompany?.company_name)
                    }
                  </div>
                </div>
              </div>

              <div className="lh-modal-body">
                <div>
                  <label className="lh-field-label">
                    {mcfg.label} Name
                    {hasCoords && <span className="lh-field-hint">— type to auto-detect location</span>}
                  </label>
                  <SmartLocationInput
                    value={form.name}
                    onChange={v => setForm(f => ({ ...f, name: v }))}
                    placeholder={PLACEHOLDER[modal.type]}
                    onGeocode={hasCoords ? handleGeocode : undefined}
                  />
                </div>

                {hasCoords && coordsFilled && form.geocodedFrom && (
                  <div className="lh-coord-section">
                    <div className="lh-geocoded-badge">
                      <span style={{ fontSize: 18 }}>✅</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="place-name">
                          {form.geocodedFrom.split(',').slice(0, 3).join(', ')}
                        </div>
                        <div className="coords-mono">
                          {parseFloat(form.latitude).toFixed(5)}°N &nbsp;
                          {parseFloat(form.longitude).toFixed(5)}°E
                        </div>
                      </div>
                      <button
                        className="lh-geocoded-close"
                        onClick={() => setForm(f => ({ ...f, latitude: '', longitude: '', geocodedFrom: '' }))}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="lh-modal-footer">
                <button className="lh-btn-cancel" onClick={closeModal}>Cancel</button>
                <button
                  className="lh-btn-save"
                  style={{ background: mcfg.color }}
                  disabled={!form.name.trim() || saving}
                  onClick={handleSave}
                >
                  {saving ? (
                    <>
                      <span style={{
                        display: 'inline-block', width: 13, height: 13,
                        border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff',
                        borderRadius: '50%', animation: 'lh-spin 0.6s linear infinite',
                        marginRight: 7, verticalAlign: 'middle',
                      }} />
                      Saving…
                    </>
                  ) : `${modal.item ? 'Update' : 'Create'} ${mcfg.label}`}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── DELETE CONFIRM ────────────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="lh-overlay">
          <div className="lh-delete-modal">
            <div className="lh-delete-icon">🗑️</div>
            <div className="lh-delete-title">Delete {deleteTarget.type}?</div>
            <div className="lh-delete-sub">
              <strong>"{deleteTarget.name}"</strong> will be permanently removed.<br />
              This cannot be undone if it has no child items.
            </div>
            <div className="lh-delete-actions">
              <button className="lh-btn-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="lh-btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TOAST ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 30, right: 30, zIndex: 9999,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', padding: '12px 24px', borderRadius: 10,
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 14, fontWeight: 600,
          animation: 'lh-slidein 0.3s ease',
        }}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          {toast.message}
        </div>
      )}
    </div>
  );
}
