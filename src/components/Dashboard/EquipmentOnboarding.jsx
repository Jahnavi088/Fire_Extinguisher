import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './EquipmentOnboarding.css';

const SUPPLIERS = [
  'Supremex Safety', 'Minimax', 'Kanex Fire', 'Nu Swift', 'Ceasefire',
  'Firetrace', 'Amerex', 'Kidde', 'Hochiki', 'Napco', 'Other',
];

const ZONES = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F'];

const FLOORS = [
  'Basement', 'Ground Floor', '1st Floor', '2nd Floor', '3rd Floor',
  '4th Floor', '5th Floor', 'Terrace',
];

const DEPARTMENTS = [
  'Administration', 'Operations', 'Production', 'Quality Control',
  'Maintenance', 'Security', 'Warehouse', 'Laboratory', 'IT', 'HR',
  'Finance', 'Reception', 'Common Area',
];

const AREAS = [
  'Indoor', 'Outdoor', 'Lobby', 'Corridor', 'Stairwell',
  'Server Room', 'Cafeteria', 'Parking', 'Reception', 'Conference Room',
];

const LOCATIONS = [
  'Ground Floor - Lobby', 'Main Entrance', 'Emergency Exit',
  'Server Room', 'Control Room', 'Stairwell - Block A', 'Stairwell - Block B',
  'Parking Level 1', 'Rooftop', 'Basement - Storage',
];

const FDA_TEXT = `I certify that this equipment has undergone required physical verification and complies with safety standards. This electronic signature authorizes its secure provisioning.`;

const EMPTY_FORM = {
  sos_code: '',
  module_id: '',
  supplier_name: '',
  location_name: '',
  building_id: '',
  zone_name: '',
  floor_name: '',
  department_name: '',
  area_name: '',
};

const Field = ({ label, required, error, children }) => (
  <div className={`eob-field ${error ? 'has-error' : ''}`}>
    <label className="eob-label">{label}{required && <span className="eob-req">*</span>}</label>
    {children}
    {error && <span className="eob-error-msg">{error}</span>}
  </div>
);

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div className={`eob-custom-select ${isOpen ? 'is-open' : ''}`} ref={dropdownRef}>
      <div 
        className={`eob-select-trigger ${isOpen ? 'open' : ''}`} 
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
      >
        <span className={selectedOption ? '' : 'placeholder-text'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="eob-select-icon" style={{ pointerEvents: 'none' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div className={`eob-select-dropdown ${isOpen ? 'open' : ''}`}>
        {options.map(opt => (
          <div
            key={opt.value}
            className={`eob-select-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onChange(opt.value);
              setIsOpen(false);
            }}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const EquipmentOnboarding = ({ onBack, onSuccess }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [certified, setCertified] = useState(false);
  const [modules, setModules] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.allSettled([
      ApiService.getAdminModulesList(),
      ApiService.getAdminBuildings(),
    ]).then(([modsRes, bldgsRes]) => {
      if (modsRes.status === 'fulfilled') {
        const raw = modsRes.value;
        setModules(Array.isArray(raw) ? raw : (raw?.modules || raw?.data || []));
      }
      if (bldgsRes.status === 'fulfilled') {
        const raw = bldgsRes.value;
        setBuildings(Array.isArray(raw) ? raw : (raw?.buildings || raw?.data || []));
      }
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.sos_code.trim())     e.sos_code     = 'Required';
    if (!form.module_id)           e.module_id    = 'Required';
    if (!form.supplier_name)       e.supplier_name = 'Required';
    if (!form.location_name)       e.location_name = 'Required';
    if (!form.building_id)         e.building_id  = 'Required';
    if (!form.zone_name)           e.zone_name    = 'Required';
    if (!form.floor_name)          e.floor_name   = 'Required';
    if (!form.department_name)     e.department_name = 'Required';
    if (!form.area_name)           e.area_name    = 'Required';
    if (!certified)                e.certified    = 'You must certify before deploying';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const selectedBuilding = buildings.find(b => String(b.id) === String(form.building_id));
      await ApiService.createAdminEquipment({
        sos_code:        form.sos_code.trim().toUpperCase(),
        module_id:       parseInt(form.module_id),
        supplier_name:   form.supplier_name,
        location_name:   form.location_name,
        building_id:     parseInt(form.building_id),
        building_name:   selectedBuilding?.name || selectedBuilding?.building_name || '',
        zone_name:       form.zone_name,
        floor_name:      form.floor_name,
        department_name: form.department_name,
        area_name:       form.area_name,
      });
      if (onSuccess) onSuccess();
      else onBack();
    } catch (err) {
      alert('Failed to onboard equipment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="eob-page">
      {/* Header */}
      <div className="eob-header">
        <button className="eob-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="eob-header-info">
          <div className="eob-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="eob-title">Equipment Onboarding</div>
            <div className="eob-subtitle">Part 11 Compliant Onboarding — Certify new safety equipment and terminals</div>
          </div>
        </div>
      </div>

      {/* Form body */}
      <div className="eob-body">
        {loadingData && <div className="eob-data-loading"><div className="eob-spinner" /> Loading options…</div>}

        <div className="eob-grid">
          {/* Row 1 */}
          <Field label="SOS CODE" required error={errors.sos_code}>
            <input
              className="eob-input"
              type="text"
              placeholder="e.g. FE-501"
              value={form.sos_code}
              onChange={e => set('sos_code', e.target.value)}
            />
          </Field>

          <Field label="EQUIPMENT TYPE" required error={errors.module_id}>
            <CustomSelect
              value={form.module_id}
              onChange={v => set('module_id', v)}
              placeholder="All Modules"
              options={modules.map(m => ({ value: m.id || m.module_id, label: m.name || m.module_name }))}
            />
          </Field>

          <Field label="SUPPLIERS NAME" required error={errors.supplier_name}>
            <CustomSelect
              value={form.supplier_name}
              onChange={v => set('supplier_name', v)}
              placeholder="Select Options"
              options={SUPPLIERS.map(s => ({ value: s, label: s }))}
            />
          </Field>

          {/* Row 2 */}
          <Field label="LOCATION" required error={errors.location_name}>
            <CustomSelect
              value={form.location_name}
              onChange={v => set('location_name', v)}
              placeholder="Select Location"
              options={LOCATIONS.map(l => ({ value: l, label: l }))}
            />
          </Field>

          <Field label="BUILDING" required error={errors.building_id}>
            <CustomSelect
              value={form.building_id}
              onChange={v => set('building_id', v)}
              placeholder="Select Building"
              options={buildings.length > 0
                ? buildings.map(b => ({ value: b.id || b, label: b.name || b.building_name || b }))
                : ['Main Block', 'Block A', 'Block B', 'Annex', 'Warehouse'].map(n => ({ value: n, label: n }))
              }
            />
          </Field>

          <Field label="ZONE" required error={errors.zone_name}>
            <CustomSelect
              value={form.zone_name}
              onChange={v => set('zone_name', v)}
              placeholder="Select Zone"
              options={ZONES.map(z => ({ value: z, label: z }))}
            />
          </Field>

          {/* Row 3 */}
          <Field label="FLOOR" required error={errors.floor_name}>
            <CustomSelect
              value={form.floor_name}
              onChange={v => set('floor_name', v)}
              placeholder="Select Floor"
              options={FLOORS.map(f => ({ value: f, label: f }))}
            />
          </Field>

          <Field label="DEPARTMENT" required error={errors.department_name}>
            <CustomSelect
              value={form.department_name}
              onChange={v => set('department_name', v)}
              placeholder="Select Department"
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
            />
          </Field>

          <Field label="AREA" required error={errors.area_name}>
            <CustomSelect
              value={form.area_name}
              onChange={v => set('area_name', v)}
              placeholder="Select Area"
              options={AREAS.map(a => ({ value: a, label: a }))}
            />
          </Field>
        </div>

        {/* Signature cert */}
        <div className={`eob-cert-card ${errors.certified ? 'has-error' : ''}`}>
          <label className="eob-cert-label">
            <input
              type="checkbox"
              className="eob-cert-checkbox"
              checked={certified}
              onChange={e => { setCertified(e.target.checked); setErrors(v => ({ ...v, certified: undefined })); }}
            />
            <span className="eob-cert-title">FDA 21 CFR Part 11 Compliant Electronic Signature Certification</span>
          </label>
          <p className="eob-cert-text">{FDA_TEXT}</p>
          {errors.certified && <span className="eob-error-msg">{errors.certified}</span>}
        </div>

        {/* Actions */}
        <div className="eob-actions">
          <button className="eob-cancel-btn" onClick={onBack} disabled={submitting}>Cancel</button>
          <button
            className="eob-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || loadingData}
          >
            {submitting ? 'Deploying…' : 'Onboard & Deploy Asset'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentOnboarding;
