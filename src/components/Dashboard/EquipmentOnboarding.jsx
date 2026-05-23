import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './EquipmentOnboarding.css';

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
  'Server Room', 'Cafeteria', 'Parking', 'Conference Room',
];

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];

const SHIFTS = [
  'Shift A	6 AM – 2 PM',
  'Shift B	2 PM – 10 PM',
  'Shift C	10 PM – 6 AM',
  'General Shift (G)	9 AM – 6 PM'
];

const STATUSES = ['Active', 'Inactive', 'Under Maintenance'];

const CHECKLIST_TEMPLATES = [
  'Standard Fire Extinguisher',
  'Hydrant System',
  'Sprinkler System',
  'Smoke Detector',
  'Emergency Exit',
  'First Aid Kit',
  'SCBA Unit',
  'Hose Reel',
  'Suppression System',
  'General Safety Equipment',
];

const EMPTY_FORM = {
  sos_code: '',
  module_id: '',
  company_id: '',
  building_id: '',
  floor_name: '',
  zone_name: '',
  department_name: '',
  area_name: '',
  frequency: '',
  shift_allowed: '',
  checklist_template: '',
  installation_date: '',
  expiry_date: '',
  status: 'Active',
};

const Field = ({ label, required, error, children, span }) => (
  <div className={`eob-field ${error ? 'has-error' : ''} ${span ? `eob-span-${span}` : ''}`}>
    <label className="eob-label">
      {label}
      {required && <span className="eob-req">*</span>}
    </label>
    {children}
    {error && <span className="eob-error-msg">{error}</span>}
  </div>
);

const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selected = options.find(o => String(o.value) === String(value));

  return (
    <div className={`eob-custom-select ${isOpen ? 'is-open' : ''}`} ref={ref}>
      <div
        className={`eob-select-trigger ${isOpen ? 'open' : ''}`}
        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(v => !v); }}
      >
        <span className={selected ? '' : 'placeholder-text'}>
          {selected ? selected.label : placeholder}
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
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
          >
            {opt.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const SectionDivider = ({ icon, title }) => (
  <div className="eob-section-divider">
    <span className="eob-section-icon">{icon}</span>
    <span className="eob-section-title">{title}</span>
    <div className="eob-section-line" />
  </div>
);

const EquipmentOnboarding = ({ onBack, onSuccess }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [certified, setCertified] = useState(false);
  const [modules, setModules] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.allSettled([
      ApiService.getAdminModulesList(),
      ApiService.getAdminBuildings(),
      ApiService.getAdminCompanies(),
    ]).then(([modsRes, bldgsRes, compRes]) => {
      if (modsRes.status === 'fulfilled') {
        const raw = modsRes.value;
        setModules(Array.isArray(raw) ? raw : (raw?.modules || raw?.data || []));
      }
      if (bldgsRes.status === 'fulfilled') {
        const raw = bldgsRes.value;
        setBuildings(Array.isArray(raw) ? raw : (raw?.buildings || raw?.data || []));
      }
      if (compRes.status === 'fulfilled') {
        const raw = compRes.value;
        setCompanies(Array.isArray(raw) ? raw : (raw?.companies || raw?.data || []));
      }
      setLoadingData(false);
    }).catch(() => setLoadingData(false));
  }, []);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const qrPreview = form.sos_code.trim()
    ? `https://ehs.garrev.com/scan/${form.sos_code.trim().toUpperCase()}`
    : '';

  const validate = () => {
    const e = {};
    if (!form.sos_code.trim()) e.sos_code = 'Required';
    if (!form.module_id) e.module_id = 'Required';
    if (!form.company_id) e.company_id = 'Required';
    if (!form.building_id) e.building_id = 'Required';
    if (!form.floor_name) e.floor_name = 'Required';
    if (!form.zone_name) e.zone_name = 'Required';
    if (!form.department_name) e.department_name = 'Required';
    if (!form.area_name) e.area_name = 'Required';
    if (!form.frequency) e.frequency = 'Required';
    if (!form.shift_allowed) e.shift_allowed = 'Required';
    if (!form.checklist_template) e.checklist_template = 'Required';
    if (!form.installation_date) e.installation_date = 'Required';
    if (!form.expiry_date) e.expiry_date = 'Required';
    if (!form.status) e.status = 'Required';
    if (!certified) e.certified = 'Certification required before deploying';
    return e;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const selectedBuilding = buildings.find(b => String(b.id) === String(form.building_id));
      await ApiService.createAdminEquipment({
        sos_code: form.sos_code.trim().toUpperCase(),
        module_id: parseInt(form.module_id),
        company_id: parseInt(form.company_id),
        building_id: parseInt(form.building_id),
        building_name: selectedBuilding?.name || selectedBuilding?.building_name || '',
        floor_name: form.floor_name,
        zone_name: form.zone_name,
        department_name: form.department_name,
        area_name: form.area_name,
        frequency: form.frequency,
        shift_allowed: form.shift_allowed,
        checklist_template: form.checklist_template,
        installation_date: form.installation_date,
        expiry_date: form.expiry_date,
        status: form.status,
      });
      if (onSuccess) onSuccess();
      else onBack();
    } catch (err) {
      alert('Failed to onboard equipment: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const buildingOptions = buildings.length > 0
    ? buildings.map(b => ({ value: b.id || b, label: b.name || b.building_name || b }))
    : ['Main Block', 'Block A', 'Block B', 'Annex', 'Warehouse'].map(n => ({ value: n, label: n }));

  return (
    <div className="eob-page">
      {/* Header */}
      <div className="eob-header">
        <button className="eob-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="eob-header-info">
          <div className="eob-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <div className="eob-title">Equipment Onboarding</div>
            <div className="eob-subtitle">Register and deploy new safety equipment to the system</div>
          </div>
        </div>
        {loadingData && (
          <div className="eob-header-loading">
            <div className="eob-spinner" />
            <span>Loading…</span>
          </div>
        )}
      </div>

      {/* Form body */}
      <div className="eob-body">

        {/* ── SECTION 1: IDENTITY ── */}
        <SectionDivider title="Equipment Identity" />
        <div className="eob-grid">
          <Field label="Equipment Code" required error={errors.sos_code}>
            <input
              className="eob-input"
              type="text"
              placeholder="e.g. FE-501"
              value={form.sos_code}
              onChange={e => set('sos_code', e.target.value.toUpperCase())}
              maxLength={20}
            />
          </Field>

          <Field label="Equipment Type" required error={errors.module_id}>
            <CustomSelect
              value={form.module_id}
              onChange={v => set('module_id', v)}
              placeholder="Select Module"
              options={modules.map(m => ({ value: m.id || m.module_id, label: m.name || m.module_name }))}
            />
          </Field>

          <Field label="Company" required error={errors.company_id}>
            <CustomSelect
              value={form.company_id}
              onChange={v => set('company_id', v)}
              placeholder="Select Company"
              options={companies.map(c => ({ value: c.id, label: c.name || c.company_name }))}
            />
          </Field>
        </div>

        {/* ── SECTION 2: LOCATION ── */}
        <SectionDivider title="Location Details" />
        <div className="eob-grid">
          <Field label="Building" required error={errors.building_id}>
            <CustomSelect
              value={form.building_id}
              onChange={v => set('building_id', v)}
              placeholder="Select Building"
              options={buildingOptions}
            />
          </Field>

          <Field label="Floor" required error={errors.floor_name}>
            <CustomSelect
              value={form.floor_name}
              onChange={v => set('floor_name', v)}
              placeholder="Select Floor"
              options={FLOORS.map(f => ({ value: f, label: f }))}
            />
          </Field>

          <Field label="Zone" required error={errors.zone_name}>
            <CustomSelect
              value={form.zone_name}
              onChange={v => set('zone_name', v)}
              placeholder="Select Zone"
              options={ZONES.map(z => ({ value: z, label: z }))}
            />
          </Field>

          <Field label="Department" required error={errors.department_name}>
            <CustomSelect
              value={form.department_name}
              onChange={v => set('department_name', v)}
              placeholder="Select Department"
              options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
            />
          </Field>

          <Field label="Area" required error={errors.area_name}>
            <CustomSelect
              value={form.area_name}
              onChange={v => set('area_name', v)}
              placeholder="Select Area"
              options={AREAS.map(a => ({ value: a, label: a }))}
            />
          </Field>
        </div>

        {/* ── SECTION 3: OPERATIONAL ── */}
        <SectionDivider title="Operational Configuration" />
        <div className="eob-grid">
          <Field label="Inspection Frequency" required error={errors.frequency}>
            <CustomSelect
              value={form.frequency}
              onChange={v => set('frequency', v)}
              placeholder="Select Frequency"
              options={FREQUENCIES.map(f => ({ value: f, label: f }))}
            />
          </Field>

          <Field label="Shift Allowed" required error={errors.shift_allowed}>
            <CustomSelect
              value={form.shift_allowed}
              onChange={v => set('shift_allowed', v)}
              placeholder="Select Shift"
              options={SHIFTS.map(s => ({ value: s, label: s }))}
            />
          </Field>

          <Field label="Checklist Template" required error={errors.checklist_template}>
            <CustomSelect
              value={form.checklist_template}
              onChange={v => set('checklist_template', v)}
              placeholder="Select Template"
              options={CHECKLIST_TEMPLATES.map(t => ({ value: t, label: t }))}
            />
          </Field>

          {/* QR Code — auto-generated from equipment code */}
          <Field label="QR Code" error={null} span={3}>
            <div className="eob-qr-field">
              <svg className="eob-qr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5" rx="1" />
                <rect x="16" y="3" width="5" height="5" rx="1" />
                <rect x="3" y="16" width="5" height="5" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                <path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                <path d="M3 12h.01" />
                <path d="M12 3h.01" />
                <path d="M12 16v.01" />
                <path d="M16 12h1" />
                <path d="M21 12v.01" />
                <path d="M12 21v-1" />
              </svg>
              <input
                className="eob-input eob-qr-input"
                type="text"
                readOnly
                placeholder="Auto-generated after entering Equipment Code"
                value={qrPreview}
              />
              {qrPreview && (
                <span className="eob-qr-badge">Auto-generated</span>
              )}
            </div>
          </Field>
        </div>

        {/* ── SECTION 4: LIFECYCLE ── */}
        <SectionDivider title="Lifecycle & Status" />
        <div className="eob-grid">
          <Field label="Installation Date" required error={errors.installation_date}>
            <input
              className="eob-input eob-date-input"
              type="date"
              value={form.installation_date}
              onChange={e => set('installation_date', e.target.value)}
            />
          </Field>

          <Field label="Expiry Date" required error={errors.expiry_date}>
            <input
              className="eob-input eob-date-input"
              type="date"
              value={form.expiry_date}
              onChange={e => set('expiry_date', e.target.value)}
            />
          </Field>

          <Field label="Status" required error={errors.status}>
            <CustomSelect
              value={form.status}
              onChange={v => set('status', v)}
              placeholder="Select Status"
              options={STATUSES.map(s => ({ value: s, label: s }))}
            />
          </Field>
        </div>

        {/* ── CERTIFICATION ── */}
        <div className={`eob-cert-card ${errors.certified ? 'has-error' : ''}`}>
          <label className="eob-cert-label">
            <input
              type="checkbox"
              className="eob-cert-checkbox"
              checked={certified}
              onChange={e => { setCertified(e.target.checked); setErrors(v => ({ ...v, certified: undefined })); }}
            />
            <span className="eob-cert-title">FDA 21 CFR Part 11 — Electronic Signature Certification</span>
          </label>
          <p className="eob-cert-text">
            I certify that this equipment has undergone required physical verification and complies with applicable safety standards. This electronic signature authorizes its secure provisioning into the system.
          </p>
          {errors.certified && <span className="eob-error-msg">{errors.certified}</span>}
        </div>

        {/* ── ACTIONS ── */}
        <div className="eob-actions">
          <button className="eob-cancel-btn" onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          <button
            className="eob-submit-btn"
            onClick={handleSubmit}
            disabled={submitting || loadingData}
          >
            {submitting
              ? <><div className="eob-btn-spinner" /> Deploying…</>
              : '⚡ Onboard & Deploy Asset'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentOnboarding;
