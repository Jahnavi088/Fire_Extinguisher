import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './EquipmentOnboarding.css';

// ── Static master lists ──────────────────────────────────────────────────────
const EQUIPMENT_TYPES = [
  'Fire Extinguisher', 'Sprinkler System', 'Hose Reel', 'Fire Hydrant',
  'Smoke Detector', 'Heat Detector', 'Emergency Exit', 'Emergency Lighting',
  'PA System', 'SCBA Unit', 'First Aid Kit', 'Eyewash Station',
  'Chemical Shower', 'Spill Kit', 'PPE Station', 'Fire Trolley',
  'Fire Blanket', 'Suppression System', 'Wind Sock', 'Ambulance',
];

const FLOORS = [
  { id: 'FLR-02', name: 'Ground Floor' },
  { id: 'FLR-03', name: '1st Floor' },
  { id: 'FLR-04', name: '2nd Floor' },
  { id: 'FLR-05', name: '3rd Floor' },
  { id: 'FLR-06', name: '4th Floor' },
  { id: 'FLR-07', name: '5th Floor' },
  { id: 'FLR-08', name: 'Terrace' },
  { id: 'FLR-01', name: 'Basement' },
];

const DEPARTMENTS = [
  { id: 'DEP-01', name: 'Administration' },
  { id: 'DEP-02', name: 'Operations' },
  { id: 'DEP-03', name: 'Production' },
  { id: 'DEP-04', name: 'Quality Control' },
  { id: 'DEP-05', name: 'Maintenance' },
  { id: 'DEP-06', name: 'Security' },
  { id: 'DEP-07', name: 'Warehouse' },
  { id: 'DEP-08', name: 'Laboratory' },
  { id: 'DEP-09', name: 'IT' },
  { id: 'DEP-10', name: 'HR' },
  { id: 'DEP-11', name: 'Finance' },
  { id: 'DEP-12', name: 'Granulation' },
  { id: 'DEP-13', name: 'Common Area' },
];

const CHECKLIST_TEMPLATES = [
  { id: 'CHK-101', name: 'Standard Fire Extinguisher' },
  { id: 'CHK-102', name: 'Hydrant System' },
  { id: 'CHK-103', name: 'Sprinkler System' },
  { id: 'CHK-104', name: 'Smoke Detector' },
  { id: 'CHK-105', name: 'Emergency Exit' },
  { id: 'CHK-106', name: 'First Aid Kit' },
  { id: 'CHK-107', name: 'SCBA Unit' },
  { id: 'CHK-108', name: 'Hose Reel' },
  { id: 'CHK-109', name: 'Suppression System' },
  { id: 'CHK-110', name: 'General Safety Equipment' },
];

const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
const SHIFT_OPTIONS = ['Morning', 'Evening', 'Night', 'General'];
const STATUSES = ['Active', 'Inactive', 'Under Maintenance'];

const EMPTY_FORM = {
  equipment_code: '',
  equipment_type: '',
  company_id: '',
  building_id: '',
  floor_id: '',
  zone_id: '',
  department_id: '',
  area_id: '',
  inspection_frequency: '',
  shift_allowed: [],
  checklist_template_id: '',
  installation_date: '',
  expiry_date: '',
  status: 'Active',
};

// ── Sub-components ────────────────────────────────────────────────────────────
const Field = ({ label, required, error, children, span }) => (
  <div className={`eob-field ${error ? 'has-error' : ''} ${span ? `eob-span-${span}` : ''}`}>
    <label className="eob-label">
      {label}{required && <span className="eob-req">*</span>}
    </label>
    {children}
    {error && <span className="eob-error-msg">{error}</span>}
  </div>
);

const CustomSelect = ({ value, onChange, options, placeholder, disabled }) => {
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
        className={`eob-select-trigger ${isOpen ? 'open' : ''} ${disabled ? 'disabled' : ''}`}
        onMouseDown={(e) => {
          if (disabled) return;
          e.preventDefault(); e.stopPropagation();
          setIsOpen(v => !v);
        }}
      >
        <span className={selected ? '' : 'placeholder-text'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="eob-select-icon" style={{ pointerEvents: 'none' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div className={`eob-select-dropdown ${isOpen ? 'open' : ''}`}>
        {options.length === 0
          ? <div className="eob-select-option" style={{ opacity: 0.4, cursor: 'default' }}>No options available</div>
          : options.map(opt => (
            <div
              key={opt.value}
              className={`eob-select-option ${String(opt.value) === String(value) ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); e.stopPropagation();
                onChange(opt.value); setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
      </div>
    </div>
  );
};

const ShiftDropdown = ({ value, onChange, placeholder, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const toggleShift = (shift) => {
    if (value.includes(shift)) {
      onChange(value.filter(s => s !== shift));
    } else {
      onChange([...value, shift]);
    }
  };

  return (
    <div className={`eob-custom-select ${isOpen ? 'is-open' : ''} ${error ? 'has-error' : ''}`} ref={ref}>
      <div
        className={`eob-select-trigger ${isOpen ? 'open' : ''}`}
        onMouseDown={(e) => {
          e.preventDefault(); e.stopPropagation();
          setIsOpen(v => !v);
        }}
      >
        <span className={value.length > 0 ? '' : 'placeholder-text'}>
          {value.length > 0 ? value.join(', ') : placeholder}
        </span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className="eob-select-icon" style={{ pointerEvents: 'none' }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <div className={`eob-select-dropdown ${isOpen ? 'open' : ''}`} style={{ maxHeight: '200px', overflowY: 'auto' }}>
        {SHIFT_OPTIONS.map(shift => {
          const isSelected = value.includes(shift);
          return (
            <div
              key={shift}
              className={`eob-select-option ${isSelected ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); e.stopPropagation();
                toggleShift(shift);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px' }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)' }}>{shift}</span>
            </div>
          );
        })}
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

// ── Main component ────────────────────────────────────────────────────────────
const EquipmentOnboarding = ({ onBack, onSuccess }) => {
  const [form, setFormState] = useState(EMPTY_FORM);
  const [certified, setCertified] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [allZones, setAllZones] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [dynamicFloors, setDynamicFloors] = useState([]);
  const [successData, setSuccessData] = useState(null);

  // Load companies on mount
  useEffect(() => {
    ApiService.getAdminCompanies()
      .then(raw => {
        const list = Array.isArray(raw) ? raw : (raw?.companies || raw?.data || []);
        setCompanies(list);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  // When company changes → fetch cascaded dropdowns
  useEffect(() => {
    if (!form.company_id) {
      setAllBuildings([]); setAllZones([]); setAllAreas([]); setAllDepartments([]); setDynamicFloors([]);
      return;
    }
    setDropdownsLoading(true);
    ApiService.getOnboardingDropdowns(form.company_id)
      .then(d => {
        setAllBuildings(d.buildings || []);
        setAllZones(d.zones || []);
        setAllAreas(d.areas || []);
        setAllDepartments(d.departments || []);
        setDynamicFloors(d.floors || []);
      })
      .catch(() => { setAllBuildings([]); setAllZones([]); setAllAreas([]); setAllDepartments([]); setDynamicFloors([]); })
      .finally(() => setDropdownsLoading(false));
  }, [form.company_id]);

  // Cascaded options
  const filteredZones = allZones.filter(z => !form.building_id || z.building_id === form.building_id);
  const filteredAreas = allAreas.filter(a => !form.zone_id || a.zone_id === form.zone_id);

  const set = (key, val) => {
    setFormState(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const setBuilding = (val) => {
    setFormState(f => ({ ...f, building_id: val, zone_id: '', area_id: '' }));
    setErrors(e => ({ ...e, building_id: undefined, zone_id: undefined, area_id: undefined }));
  };

  const setZone = (val) => {
    setFormState(f => ({ ...f, zone_id: val, area_id: '' }));
    setErrors(e => ({ ...e, zone_id: undefined, area_id: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.equipment_code.trim())     e.equipment_code = 'Required';
    if (!form.equipment_type)            e.equipment_type = 'Required';
    if (!form.company_id)                e.company_id = 'Required';
    if (!form.building_id)               e.building_id = 'Required';
    if (!form.floor_id)                  e.floor_id = 'Required';
    if (!form.zone_id)                   e.zone_id = 'Required';
    if (!form.department_id)             e.department_id = 'Required';
    if (!form.area_id)                   e.area_id = 'Required';
    if (!form.inspection_frequency)      e.inspection_frequency = 'Required';
    if (form.shift_allowed.length === 0) e.shift_allowed = 'Select at least one shift';
    if (!form.checklist_template_id)     e.checklist_template_id = 'Required';
    if (!form.installation_date)         e.installation_date = 'Required';
    if (!form.expiry_date)               e.expiry_date = 'Required';
    if (!form.status)                    e.status = 'Required';
    if (!certified)                      e.certified = 'Certification required before deploying';
    return e;
  };

  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // Convert YYYY-MM-DD from HTML input to DD-MM-YYYY for API
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const result = await ApiService.onboardEquipment({
        equipment_code: form.equipment_code.trim().toUpperCase(),
        equipment_type: form.equipment_type,
        company_id: form.company_id,
        building_id: form.building_id,
        floor_id: form.floor_id,
        zone_id: form.zone_id,
        department_id: form.department_id,
        area_id: form.area_id,
        inspection_frequency: form.inspection_frequency,
        shift_allowed: form.shift_allowed,
        checklist_template_id: form.checklist_template_id,
        auto_generate_qr: true,
        installation_date: formatDateToDDMMYYYY(form.installation_date),
        expiry_date: formatDateToDDMMYYYY(form.expiry_date),
        status: form.status,
        fda_21_cfr_part_11_certified: certified,
      });
      setSuccessData(result);
    } catch (err) {
      alert('Failed to onboard equipment: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setFormState(EMPTY_FORM);
    setCertified(false);
    setErrors({});
    setSuccessData(null);
    setAllBuildings([]); setAllZones([]); setAllAreas([]);
  };

  // Company options — use company_ref as value for new API
  const companyOptions = companies.map(c => ({
    value: c.comapany_ref || c.company_ref || c.id,
    label: c.name || c.company_name,
  }));

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="eob-page">
        <div className="eob-header">
          <button className="eob-back-btn" onClick={onBack} title="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="eob-header-info">
            <div className="eob-header-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div><div className="eob-title">Equipment Onboarding</div></div>
          </div>
        </div>

        <div className="eob-body">
          <div className="eob-success-card">
            <div className="eob-success-icon">✅</div>
            <div className="eob-success-title">Equipment Deployed Successfully</div>
            <div className="eob-success-subtitle">{successData.message || 'Equipment has been onboarded and is ready for inspection scheduling.'}</div>

            <div className="eob-success-detail-grid">
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">Generated SOS Code</span>
                <span className="eob-success-sos">{successData.sos_code || '—'}</span>
              </div>
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">System ID</span>
                <span className="eob-success-id">#{successData.id || '—'}</span>
              </div>
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">Equipment Code</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{form.equipment_code.toUpperCase()}</span>
              </div>
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">Equipment Type</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{form.equipment_type}</span>
              </div>
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">QR Code URL</span>
                <span className="eob-success-qr">https://ehs.garrev.com/scan/{successData.sos_code}</span>
              </div>
            </div>

            <div className="eob-success-actions">
              <button className="eob-cancel-btn" onClick={onSuccess || onBack}>Back to Dashboard</button>
              <button className="eob-submit-btn" onClick={handleAddAnother}>
                + Onboard Another Equipment
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Form screen ─────────────────────────────────────────────────────────────
  return (
    <div className="eob-page">
      {/* Header */}
      <div className="eob-header">
        <button className="eob-back-btn" onClick={onBack} title="Back">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="eob-header-info">
          <div className="eob-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div><div className="eob-title">Equipment Onboarding</div></div>
        </div>
        {(loadingData || dropdownsLoading) && (
          <div className="eob-header-loading">
            <div className="eob-spinner" />
            <span>{dropdownsLoading ? 'Loading locations…' : 'Loading…'}</span>
          </div>
        )}
      </div>

      {/* Form body */}
      <div className="eob-body">

        {/* ── SECTION 1: IDENTITY ── */}
        <SectionDivider icon="🏷️" title="Equipment Identity" />
        <div className="eob-grid">
          <Field label="Equipment Code" required error={errors.equipment_code}>
            <input
              className="eob-input"
              type="text"
              placeholder="e.g. FE-501"
              value={form.equipment_code}
              onChange={e => set('equipment_code', e.target.value.toUpperCase())}
              maxLength={20}
            />
          </Field>

          <Field label="Equipment Type" required error={errors.equipment_type}>
            <CustomSelect
              value={form.equipment_type}
              onChange={v => set('equipment_type', v)}
              placeholder="Select Type"
              options={EQUIPMENT_TYPES.map(t => ({ value: t, label: t }))}
            />
          </Field>

          <Field label="Company" required error={errors.company_id}>
            <CustomSelect
              value={form.company_id}
              onChange={v => set('company_id', v)}
              placeholder="Select Company"
              options={companyOptions}
              disabled={loadingData}
            />
          </Field>
        </div>

        {/* ── SECTION 2: LOCATION (cascades from company) ── */}
        <SectionDivider icon="📍" title="Location Details" />
        <div className="eob-grid">
          <Field label="Building" required error={errors.building_id}>
            <CustomSelect
              value={form.building_id}
              onChange={setBuilding}
              placeholder={!form.company_id ? 'Select company first' : dropdownsLoading ? 'Loading…' : 'Select Building'}
              options={allBuildings.map(b => ({ value: b.id, label: b.name }))}
              disabled={!form.company_id || dropdownsLoading}
            />
          </Field>

          <Field label="Floor" required error={errors.floor_id}>
            <CustomSelect
              value={form.floor_id}
              onChange={v => set('floor_id', v)}
              placeholder="Select Floor"
              options={
                dynamicFloors.length > 0
                  ? dynamicFloors.map(f => ({ value: f.id, label: f.name }))
                  : FLOORS.map(f => ({ value: f.id, label: f.name }))
              }
            />
          </Field>

          <Field label="Zone" required error={errors.zone_id}>
            <CustomSelect
              value={form.zone_id}
              onChange={setZone}
              placeholder={!form.building_id ? 'Select building first' : 'Select Zone'}
              options={filteredZones.map(z => ({ value: z.id, label: z.name }))}
              disabled={!form.building_id}
            />
          </Field>

          <Field label="Department" required error={errors.department_id}>
            <CustomSelect
              value={form.department_id}
              onChange={v => set('department_id', v)}
              placeholder="Select Department"
              options={
                allDepartments.length > 0
                  ? allDepartments.map(d => ({ value: d.id, label: d.name }))
                  : DEPARTMENTS.map(d => ({ value: d.id, label: d.name }))
              }
            />
          </Field>

          <Field label="Area" required error={errors.area_id}>
            <CustomSelect
              value={form.area_id}
              onChange={v => set('area_id', v)}
              placeholder={!form.zone_id ? 'Select zone first' : 'Select Area'}
              options={filteredAreas.map(a => ({ value: a.id, label: a.name }))}
              disabled={!form.zone_id}
            />
          </Field>
        </div>

        {/* ── SECTION 3: OPERATIONAL CONFIG ── */}
        <SectionDivider icon="⚙️" title="Operational Configuration" />
        <div className="eob-grid">
          <Field label="Inspection Frequency" required error={errors.inspection_frequency}>
            <CustomSelect
              value={form.inspection_frequency}
              onChange={v => set('inspection_frequency', v)}
              placeholder="Select Frequency"
              options={FREQUENCIES.map(f => ({ value: f, label: f }))}
            />
          </Field>

          <Field label="Checklist Template" required error={errors.checklist_template_id}>
            <CustomSelect
              value={form.checklist_template_id}
              onChange={v => set('checklist_template_id', v)}
              placeholder="Select Template"
              options={CHECKLIST_TEMPLATES.map(t => ({ value: t.id, label: t.name }))}
            />
          </Field>

          <Field label="QR Code" span={1}>
            <div className="eob-qr-field">
              <svg className="eob-qr-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="5" height="5" rx="1" />
                <rect x="16" y="3" width="5" height="5" rx="1" />
                <rect x="3" y="16" width="5" height="5" rx="1" />
                <path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" />
                <path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" />
                <path d="M12 3h.01" /><path d="M12 16v.01" />
                <path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
              </svg>
              <input
                className="eob-input eob-qr-input"
                type="text"
                readOnly
                placeholder="Auto-generated by server on deploy"
                value={form.equipment_code.trim() ? `https://ehs.garrev.com/scan/[auto]` : ''}
              />
              {form.equipment_code.trim() && (
                <span className="eob-qr-badge">Auto-generated</span>
              )}
            </div>
          </Field>

          {/* Shift dropdown multi-select — reduced field size */}
          <Field label="Shift Allowed" required error={errors.shift_allowed} span={1}>
            <ShiftDropdown
              value={form.shift_allowed}
              onChange={v => { set('shift_allowed', v); }}
              placeholder="Select Allowed Shifts"
              error={errors.shift_allowed}
            />
          </Field>
        </div>

        {/* ── SECTION 4: LIFECYCLE ── */}
        <SectionDivider icon="📅" title="Lifecycle & Status" />
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

        {/* ── FDA 21 CFR CERTIFICATION ── */}
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
            I certify that this equipment has undergone required physical verification and complies
            with applicable safety standards. This electronic signature authorizes its secure
            provisioning into the system.
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
              : '⚡ Onboard & Deploy Asset'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default EquipmentOnboarding;
