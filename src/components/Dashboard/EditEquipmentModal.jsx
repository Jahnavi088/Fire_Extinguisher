import React, { useState, useEffect, useRef } from 'react';
import './EditEquipmentModal.css';
import { ApiService } from '../../services/apiService';

// ── Shared sub-components (mirrored from Onboarding) ─────────────
const Field = ({ label, required, error, children, span2 }) => (
  <div className={`eob-field${error ? ' has-error' : ''}${span2 ? ' eob-span-2' : ''}`}>
    <label className="eob-label">{label}{required && <span className="eob-req">*</span>}</label>
    {children}
    {error && <span className="eob-error-msg">{error}</span>}
  </div>
);

const CustomSelect = ({ value, onChange, options, placeholder, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const sel = options.find(o => String(o.value) === String(value));
  return (
    <div className={`eob-custom-select${open ? ' is-open' : ''}`} ref={ref}>
      <div
        className={`eob-select-trigger${open ? ' open' : ''}${disabled ? ' disabled' : ''}`}
        onMouseDown={e => { if (disabled) return; e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
      >
        <span className={sel ? '' : 'placeholder-text'}>{sel ? sel.label : placeholder}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="eob-select-icon" style={{ pointerEvents: 'none' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div className={`eob-select-dropdown${open ? ' open' : ''}`}>
        {options.length === 0
          ? <div className="eob-select-option" style={{ opacity: 0.4, cursor: 'default' }}>No options</div>
          : options.map(o => (
            <div key={o.value}
              className={`eob-select-option${String(o.value) === String(value) ? ' selected' : ''}`}
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onChange(o.value); setOpen(false); }}>
              {o.label}
            </div>
          ))}
      </div>
    </div>
  );
};

const Section = ({ icon, title }) => (
  <div className="eob-section-divider" style={{ marginTop: '20px' }}>
    <span className="eob-section-icon">{icon}</span>
    <span className="eob-section-title">{title}</span>
    <div className="eob-section-line" />
  </div>
);

const DynamicField = ({ attr, value, onChange, error }) => {
  const type = attr.type || attr.field_type;
  if (type === 'select' || type === 'dropdown' || type === 'multiselect') {
    const rawOptions = attr.options || attr.values || attr.choices || [];
    const normalizedOptions = rawOptions.map(o => {
      if (typeof o === 'object' && o !== null) return { value: o.value || o.id || o.name, label: o.label || o.name || o.value };
      return { value: o, label: o };
    });
    return (
      <Field key={attr.key || attr.field_key} label={attr.label} required={attr.required || attr.is_required} error={error}>
        <CustomSelect
          value={value || ''}
          onChange={v => onChange(attr.key || attr.field_key, v)}
          placeholder={`Select ${attr.label}`}
          options={normalizedOptions}
        />
      </Field>
    );
  }
  return (
    <Field key={attr.key || attr.field_key} label={attr.label} required={attr.required || attr.is_required} error={error}>
      <input
        className="eob-input"
        type={attr.type || attr.field_type || 'text'}
        placeholder={attr.placeholder || ''}
        value={value || ''}
        onChange={e => onChange(attr.key || attr.field_key, e.target.value)}
        {...(attr.type === 'number' || attr.field_type === 'number' ? { min: 0 } : {})}
      />
    </Field>
  );
};

// ── Main Component ─────────────
const EditEquipmentModal = ({ equipment, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  
  const [dynamicConfig, setDynamicConfig] = useState(null);
  
  // Master data
  const [branches, setBranches] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [floors, setFloors] = useState([]);
  const [zones, setZones] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [statuses, setStatuses] = useState([]);

  // Form State
  const [identity, setIdentity] = useState({ serial_number: '', barcode: '', manufacturer_name: '' });
  const [details, setDetails] = useState({});
  const [location, setLocationState] = useState({
    branch_id: '', building_id: '', floor_id: '', zone_id: '', department_id: '',
    exact_location_description: '', latitude: null, longitude: null, geo_accuracy_m: null
  });
  const [lifecycle, setLifecycle] = useState({
    installed_on: '', last_service_on: '', expiry_date: '', operational_status: '', remarks: ''
  });
  
  const [companyId, setCompanyId] = useState(null);
  const [moduleId, setModuleId] = useState(null);
  const [equipmentType, setEquipmentType] = useState('');

  const sosCode = equipment.sos_code || equipment.equipment_code || equipment.id;

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      ApiService.getAdminEquipmentBySosCode(sosCode),
      ApiService.getStatuses()
    ]).then(([eqRes, statRes]) => {
      if (statRes.status === 'fulfilled') {
        const list = Array.isArray(statRes.value) ? statRes.value : (statRes.value?.statuses || statRes.value?.data || []);
        setStatuses(list);
      }
      
      if (eqRes.status === 'fulfilled' && eqRes.value) {
        const res = eqRes.value;
        const cid = res.company_id || 21;
        setCompanyId(cid);
        setModuleId(res.module_id);
        setEquipmentType(res.equipment_type || equipment.equipment_type || '');

        setIdentity({ 
          serial_number: res.serial_number || '', 
          barcode: res.barcode || '', 
          manufacturer_name: res.manufacturer_name || '' 
        });
        setDetails(res.specs || res.details || {});
        setLocationState({
          branch_id: res.branch_id || '',
          building_id: res.building_id || '',
          floor_id: res.floor_id || '',
          zone_id: res.zone_id || '',
          department_id: res.department_id || '',
          exact_location_description: res.exact_location_desc || res.exact_location_description || '',
          latitude: res.latitude, longitude: res.longitude, geo_accuracy_m: res.geo_accuracy_m
        });
        setLifecycle({
          installed_on: res.installed_on || '',
          last_service_on: res.last_service_on || '',
          expiry_date: res.expiry_date || '',
          operational_status: res.operational_status || '',
          remarks: res.remarks || ''
        });

        // Load branches
        ApiService.getBranches({ company_id: cid }).then(b => setBranches(Array.isArray(b) ? b : (b.branches || [])));

        if (res.module_id) {
          ApiService.getModuleFieldConfig(res.module_id).then(cfg => {
            const rawCfg = cfg?.data || cfg;
            let data = { ...rawCfg };
            if (data?.layout?.steps) {
              data.layout = {
                ...data.layout,
                steps: data.layout.steps.filter(st => !(st.label || '').toLowerCase().includes('compliance'))
              };
            }
            setDynamicConfig(data);
          }).catch(() => {});
        }
      }
    }).finally(() => setLoading(false));
  }, [sosCode]);

  // Cascades
  useEffect(() => {
    if (!location.branch_id) { setBuildings([]); return; }
    ApiService.getBranchBuildings(location.branch_id)
      .then(res => setBuildings(Array.isArray(res) ? res : (res?.buildings || res?.data || [])));
  }, [location.branch_id]);

  useEffect(() => {
    if (!location.building_id) { setFloors([]); return; }
    ApiService.getBuildingFloors(location.building_id)
      .then(res => setFloors(Array.isArray(res) ? res : (res?.floors || res?.data || [])));
  }, [location.building_id]);

  useEffect(() => {
    if (!location.floor_id) { setZones([]); return; }
    ApiService.getFloorZones(location.floor_id)
      .then(res => setZones(Array.isArray(res) ? res : (res?.zones || res?.data || []).map(z => ({ ...z, name: z.zone_name || z.name }))));
  }, [location.floor_id]);

  useEffect(() => {
    if (!location.zone_id) { setDepartments([]); return; }
    ApiService.getZoneDepartments(location.zone_id)
      .then(res => setDepartments(Array.isArray(res) ? res : (res?.departments || res?.data || []).map(d => ({ ...d, name: d.department_name || d.name }))));
  }, [location.zone_id]);

  const setId = (k, v) => setIdentity(s => ({ ...s, [k]: v }));
  const setLc = (k, v) => setLifecycle(s => ({ ...s, [k]: v }));
  const setDet = (k, v) => setDetails(s => ({ ...s, [k]: v }));
  const setLoc = (k, v) => {
    const cascades = {
      branch_id:   { building_id: '', floor_id: '', zone_id: '', department_id: '' },
      building_id: { floor_id: '', zone_id: '', department_id: '' },
      floor_id:    { zone_id: '', department_id: '' },
      zone_id:     { department_id: '' },
    };
    setLocationState(s => ({ ...s, [k]: v, ...(cascades[k] || {}) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const bldg = buildings.find(b => b.id === location.building_id);
      const flr = floors.find(f => f.id === location.floor_id);
      const zn = zones.find(z => z.id === location.zone_id);
      const locParts = [];
      if (bldg) locParts.push(bldg.name || bldg.building_name);
      if (flr) locParts.push(flr.name || flr.floor_name);
      if (zn) locParts.push(zn.name || zn.zone_name);

      const payload = {
        serial_number:      identity.serial_number.trim().toUpperCase(),
        equipment_code:     identity.serial_number.trim().toUpperCase(),
        module_id:          moduleId,
        equipment_type:     equipmentType,
        manufacturer_name:  identity.manufacturer_name.trim(),
        company_id:         companyId,

        branch_id:          location.branch_id,
        location_id:        location.branch_id,
        location_name:      locParts.join(' / ') || 'Unknown Location',
        exact_location_desc: location.exact_location_description.trim(),
        
        building_id:        location.building_id,
        floor_id:           location.floor_id,
        zone_id:            location.zone_id,
        department_id:      location.department_id || undefined,
        
        latitude:           location.latitude,
        longitude:          location.longitude,
        geo_accuracy_m:     location.geo_accuracy_m,

        specs: {
          barcode:        identity.barcode.trim() || identity.serial_number.trim().toUpperCase(),
          equipment_code: identity.serial_number.trim().toUpperCase(),
          ...details,
        },
        details: {
          barcode:        identity.barcode.trim() || identity.serial_number.trim().toUpperCase(),
          equipment_code: identity.serial_number.trim().toUpperCase(),
          ...details,
        },

        installed_on:        lifecycle.installed_on,
        inspection_frequency_days: 365,
        last_service_on:     lifecycle.last_service_on || undefined,
        expiry_date:         lifecycle.expiry_date,
        operational_status:  lifecycle.operational_status,
        remarks:             lifecycle.remarks || "",
      };
      
      await ApiService.updateAdminEquipment(sosCode, payload);
      onSuccess(payload);
    } catch (err) {
      setError(err.message || 'Failed to update equipment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="eob-overlay" onClick={onClose}>
      <div className="eob-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="eob-modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#1e293b' }}>
          <div className="eob-modal-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#3b82f6' }}>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Edit Equipment
          </div>
          <button className="eob-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="eob-modal-body" style={{ padding: '20px' }}>
          {error && <div className="eob-error-banner" style={{ background: '#dc354522', color: '#dc3545', padding: '10px', borderRadius: '4px', marginBottom: '15px' }}>{error}</div>}
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Loading equipment data...</div>
          ) : (
            <>
              <Section icon="🏷️" title="Equipment Identity" />
              <div className="eob-grid">
                <Field label="SOS Code">
                  <input type="text" className="eob-input" value={sosCode} disabled />
                </Field>
                <Field label="Equipment Type">
                  <input type="text" className="eob-input" value={equipmentType || 'Unknown'} disabled />
                </Field>
                <Field label="Serial Number" required>
                  <input type="text" className="eob-input" value={identity.serial_number} onChange={e => setId('serial_number', e.target.value)} />
                </Field>
                <Field label="Manufacturer Name" required>
                  <input type="text" className="eob-input" value={identity.manufacturer_name} onChange={e => setId('manufacturer_name', e.target.value)} />
                </Field>
              </div>

              {dynamicConfig?.layout?.steps && dynamicConfig.layout.steps.map((st, idx) => (
                <div key={idx}>
                  <Section icon="⚙️" title={`${equipmentType} — ${st.label}`} />
                  <div className="eob-grid">
                    {(st.fields || []).map(attr => {
                      const key = attr.key || attr.field_key;
                      return (
                        <DynamicField
                          key={key}
                          attr={attr}
                          value={details[key]}
                          onChange={setDet}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}

              <Section icon="🏢" title="Organisation & Location" />
              <div className="eob-grid">
                <Field label="Branch / Location" required>
                  <CustomSelect
                    value={location.branch_id}
                    onChange={v => setLoc('branch_id', v)}
                    placeholder="Select Branch"
                    options={branches.map(b => ({ value: b.id, label: b.branch_name || b.name }))}
                  />
                </Field>
                <Field label="Building" required>
                  <CustomSelect
                    value={location.building_id}
                    onChange={v => setLoc('building_id', v)}
                    placeholder={!location.branch_id ? 'Select branch first' : 'Select Building'}
                    options={buildings.map(b => ({ value: b.id, label: b.building_name || b.name }))}
                    disabled={!location.branch_id}
                  />
                </Field>
                <Field label="Floor" required>
                  <CustomSelect
                    value={location.floor_id}
                    onChange={v => setLoc('floor_id', v)}
                    placeholder={!location.building_id ? 'Select building first' : 'Select Floor'}
                    options={floors.map(f => ({ value: f.id, label: f.floor_name || f.name }))}
                    disabled={!location.building_id}
                  />
                </Field>
                <Field label="Zone" required>
                  <CustomSelect
                    value={location.zone_id}
                    onChange={v => setLoc('zone_id', v)}
                    placeholder={!location.floor_id ? 'Select floor first' : 'Select Zone'}
                    options={zones.map(z => ({ value: z.id, label: z.zone_name || z.name }))}
                    disabled={!location.floor_id}
                  />
                </Field>
                <Field label="Department">
                  <CustomSelect
                    value={location.department_id}
                    onChange={v => setLoc('department_id', v)}
                    placeholder={!location.zone_id ? 'Select zone first' : 'Select Department'}
                    options={departments.map(d => ({ value: d.id, label: d.department_name || d.name }))}
                    disabled={!location.zone_id}
                  />
                </Field>
                <Field label="Exact Location Description" required span2>
                  <input className="eob-input" type="text"
                    value={location.exact_location_description}
                    onChange={e => setLoc('exact_location_description', e.target.value)}
                  />
                </Field>
              </div>

              <Section icon="📅" title="Lifecycle & Status" />
              <div className="eob-grid">
                <Field label="Installation Date" required>
                  <input className="eob-input eob-date-input" type="date"
                    value={lifecycle.installed_on}
                    onChange={e => setLc('installed_on', e.target.value)}
                  />
                </Field>
                <Field label="Expiry Date" required>
                  <input className="eob-input eob-date-input" type="date"
                    value={lifecycle.expiry_date}
                    onChange={e => setLc('expiry_date', e.target.value)}
                  />
                </Field>
                <Field label="Operational Status" required>
                  <CustomSelect
                    value={lifecycle.operational_status}
                    onChange={v => setLc('operational_status', v)}
                    placeholder="Select Status"
                    options={
                      statuses.length > 0
                        ? statuses.map(s => ({ value: s.key || s.name || s, label: s.name || s.key || s }))
                        : [
                            { value: 'active',            label: 'Active' },
                            { value: 'inactive',          label: 'Inactive' },
                            { value: 'under_maintenance', label: 'Under Maintenance' },
                            { value: 'decommissioned',    label: 'Decommissioned' },
                          ]
                    }
                  />
                </Field>
                <Field label="Remarks" span2>
                  <textarea className="eob-input" rows={2}
                    value={lifecycle.remarks}
                    onChange={e => setLc('remarks', e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        <div className="eob-modal-footer" style={{ position: 'sticky', bottom: 0, background: '#1e293b', borderTop: '1px solid #334155' }}>
          <button className="eob-btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="eob-btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEquipmentModal;
