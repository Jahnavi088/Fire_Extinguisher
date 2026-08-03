import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import MapLocationPicker from './MapLocationPicker';
import {
  EQUIPMENT_ATTRIBUTE_SCHEMAS,
  GENERIC_EQUIPMENT_SCHEMA,
  getEquipmentSchema,
  COMMON_SECTIONS,
} from '../../config/onboardingConfig';
import './EquipmentOnboarding.css';

const API_BASE = 'https://ehs.garrev.com';

// COND array kept here for any inline use; canonical copy lives in onboardingConfig.js
const COND = ['OK', 'Damaged', 'Missing', 'Needs Service'];


// ── Logo resolver ─────────────────────────────────────────────────────────────
const resolveLogoUrl = (company) => {
  const raw = company?.logo_url || company?.logo || company?.company_logo || '';
  if (!raw) return null;
  if (raw.startsWith('http')) return raw;
  return `${API_BASE}/${raw.replace(/^\//, '')}`;
};

// ── Shared sub-components ────────────────────────────────────────────────────
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

const StepIndicator = ({ current, steps }) => (
  <div className="eob-step-bar">
    {steps.map((s, i) => {
      const stepIndex = i + 1;
      const done = stepIndex < current, active = stepIndex === current;
      return (
        <div key={s.id} className="eob-step-item">
          <div className={`eob-step-circle${done ? ' done' : active ? ' active' : ''}`}>
            {done ? '✓' : s.icon}
          </div>
          <span className={`eob-step-label${active ? ' active' : done ? ' done' : ''}`}>{s.label}</span>
          {i < steps.length - 1 && <div className={`eob-step-connector${done ? ' done' : ''}`} />}
        </div>
      );
    })}
  </div>
);

const Section = ({ icon, title }) => (
  <div className="eob-section-divider">
    <span className="eob-section-icon">{icon}</span>
    <span className="eob-section-title">{title}</span>
    <div className="eob-section-line" />
  </div>
);

const ReviewBlock = ({ title, icon, rows }) => (
  <div className="eob-review-card">
    <div className="eob-review-card-title">{icon} {title}</div>
    {rows.map(([label, value]) => (
      <div key={label} className="eob-review-row">
        <span className="eob-review-label">{label}</span>
        <span className="eob-review-value">{value || <span style={{ opacity: 0.35 }}>—</span>}</span>
      </div>
    ))}
  </div>
);

// Renders one dynamic attribute field from the schema
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

// ── CASCADE RESET MAP ─────────────────────────────────────────────────────────
const CASCADE = {
  branch_id:   { building_id: '', floor_id: '', zone_id: '', department_id: '' },
  building_id: { floor_id: '', zone_id: '', department_id: '' },
  floor_id:    { zone_id: '', department_id: '' },
  zone_id:     { department_id: '' },
};

// ── Main Component ────────────────────────────────────────────────────────────
const EquipmentOnboarding = ({ onBack, onSuccess, user }) => {
  const loggedInUserStr = localStorage.getItem('auth_user') || localStorage.getItem('user');
  const loggedInUser = user || (loggedInUserStr ? JSON.parse(loggedInUserStr) : null);
  const isSuperAdmin = loggedInUser?.role === 'superadmin';

  const [step, setStep]               = useState(1);
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [actionError, setActionError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [gpsCapturing, setGpsCapturing] = useState(false);

  // ── Master data ─────────────────────────────────────────────────────────────
  const [companies,  setCompanies]  = useState([]);
  const [modules,    setModules]    = useState([]);
  const [statuses,   setStatuses]   = useState([]);
  const [masterLoading, setMasterLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(false);

  const [dynamicConfig, setDynamicConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);

  // ── Step 1 ──────────────────────────────────────────────────────────────────
  const [selectedCompany, setSelectedCompany] = useState(null);

  // ── Step 2 ──────────────────────────────────────────────────────────────────
  const [selectedModule, setSelectedModule] = useState(null);
  const [identity, setIdentity] = useState({ serial_number: '', barcode: '', manufacturer_name: '' });
  const [details,  setDetails]  = useState({});

  // ── Step 3 — Location ───────────────────────────────────────────────────────
  const [branches,    setBranches]    = useState([]);
  const [buildings,   setBuildings]   = useState([]);
  const [floors,      setFloors]      = useState([]);
  const [zones,       setZones]       = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locLoading,  setLocLoading]  = useState(false);
  const [location, setLocationState] = useState({
    branch_id: '', building_id: '', floor_id: '', zone_id: '', department_id: '',
    exact_location_description: '',
    latitude: null, longitude: null, geo_accuracy_m: null,
  });

  // ── Step 3 — Lifecycle ──────────────────────────────────────────────────────
  const [lifecycle, setLifecycle] = useState({
    installed_on: '', last_service_on: '', expiry_date: '', operational_status: '', remarks: '',
  });

  // ── Step 4 ──────────────────────────────────────────────────────────────────
  const [certified, setCertified] = useState(false);

  // ── Load companies + statuses on mount ─────────────────────────────────────
  useEffect(() => {
    Promise.allSettled([
      ApiService.getAdminCompanies(),
      ApiService.getStatuses(),
    ]).then(([compRes, statRes]) => {
      if (compRes.status === 'fulfilled') {
        const list = Array.isArray(compRes.value) ? compRes.value : (compRes.value?.companies || compRes.value?.data || []);
        setCompanies(list);
      }
      if (statRes.status === 'fulfilled') {
        const list = Array.isArray(statRes.value) ? statRes.value : (statRes.value?.statuses || statRes.value?.data || []);
        setStatuses(list);
      }
    }).finally(() => setMasterLoading(false));
  }, []);

  // ── Auto-select company for non-superadmin ──────────────────────────────────
  useEffect(() => {
    if (!isSuperAdmin && companies.length > 0) {
      const userCompanyId = loggedInUser?.company_id || loggedInUser?.company?.id || loggedInUser?.company?.company_id;
      const userCompany = companies.find(c => String(c.id || c.company_id) === String(userCompanyId)) || companies[0];
      if (userCompany) {
        setSelectedCompany(userCompany);
      }
    }
  }, [companies, isSuperAdmin, loggedInUser]);

  // ── When company selected → load its modules ────────────────────────────────
  useEffect(() => {
    if (!selectedCompany) { setModules([]); return; }
    setModulesLoading(true);
    setSelectedModule(null);
    setDetails({});
    setDynamicConfig(null);
    ApiService.getAdminModules({ company_id: selectedCompany.id || selectedCompany.company_id })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || res?.modules || []);
        console.log('ADMIN MODULES LIST:', list);
        
        // Let's also check if the company object has modules
        ApiService.getAdminCompanyById(selectedCompany.id || selectedCompany.company_id).then(c => {
          console.log('COMPANY DETAILS from getAdminCompanyById:', c);
        }).catch(e => console.error(e));

        setModules(list);
      })
      .catch(() => setModules([]))
      .finally(() => setModulesLoading(false));
  }, [selectedCompany]);

  // ── When company selected → load its branches ───────────────────────────────
  useEffect(() => {
    if (!selectedCompany) { setBranches([]); return; }
    const cid = selectedCompany.id || selectedCompany.company_id;
    ApiService.getBranches({ company_id: cid })
      .then(res => setBranches(Array.isArray(res) ? res : (res?.branches || res?.data || [])))
      .catch(() => setBranches([]));
  }, [selectedCompany]);

  // Location cascade
  useEffect(() => {
    if (!location.branch_id) { setBuildings([]); setFloors([]); setZones([]); setDepartments([]); return; }
    setLocLoading(true);
    ApiService.getBranchBuildings(location.branch_id)
      .then(res => setBuildings(Array.isArray(res) ? res : (res?.buildings || res?.data || [])))
      .catch(() => setBuildings([]))
      .finally(() => setLocLoading(false));
  }, [location.branch_id]);

  useEffect(() => {
    if (!location.building_id) { setFloors([]); setZones([]); setDepartments([]); return; }
    setLocLoading(true);
    ApiService.getBuildingFloors(location.building_id)
      .then(res => setFloors(Array.isArray(res) ? res : (res?.floors || res?.data || [])))
      .catch(() => setFloors([]))
      .finally(() => setLocLoading(false));
  }, [location.building_id]);

  useEffect(() => {
    if (!location.floor_id) { setZones([]); setDepartments([]); return; }
    setLocLoading(true);
    ApiService.getFloorZones(location.floor_id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.zones || res?.data || []);
        setZones(list.map(z => ({ ...z, name: z.zone_name || z.name })));
      })
      .catch(() => setZones([]))
      .finally(() => setLocLoading(false));
  }, [location.floor_id]);

  useEffect(() => {
    if (!location.zone_id) { setDepartments([]); return; }
    setLocLoading(true);
    ApiService.getZoneDepartments(location.zone_id)
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.departments || res?.data || []);
        setDepartments(list.map(d => ({ ...d, name: d.department_name || d.name })));
      })
      .catch(() => setDepartments([]))
      .finally(() => setLocLoading(false));
  }, [location.zone_id]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const setId  = (k, v) => { setIdentity(s => ({ ...s, [k]: v }));   setErrors(e => ({ ...e, [k]: undefined })); };
  const setLc  = (k, v) => { setLifecycle(s => ({ ...s, [k]: v }));  setErrors(e => ({ ...e, [k]: undefined })); };
  const setDet = (k, v) => { setDetails(s => ({ ...s, [k]: v }));    setErrors(e => ({ ...e, [`det_${k}`]: undefined })); };

  const setLoc = (k, v) => {
    setLocationState(s => ({ ...s, [k]: v, ...(CASCADE[k] || {}) }));
    setErrors(e => ({ ...e, [k]: undefined }));
  };

  const captureGPS = () => {
    if (!navigator.geolocation) { alert('GPS not supported by this browser.'); return; }
    setGpsCapturing(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocationState(s => ({
          ...s,
          latitude:      parseFloat(pos.coords.latitude.toFixed(6)),
          longitude:     parseFloat(pos.coords.longitude.toFixed(6)),
          geo_accuracy_m: Math.round(pos.coords.accuracy),
        }));
        setGpsCapturing(false);
      },
      () => { setGpsCapturing(false); alert('Could not get GPS. Allow location access.'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearGPS = () => setLocationState(s => ({ ...s, latitude: null, longitude: null, geo_accuracy_m: null }));

  const fmt = d => {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}-${m}-${y}`;
  };

  // ── Validation ───────────────────────────────────────────────────────────────
  const STEPS = isSuperAdmin ? [
    { id: 'company', label: 'Company', icon: '🏢' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'location', label: 'Location & Dates', icon: '📍' },
    { id: 'review', label: 'Review', icon: '✅' }
  ] : [
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'location', label: 'Location & Dates', icon: '📍' },
    { id: 'review', label: 'Review', icon: '✅' }
  ];

  const validate = s => {
    const e = {};
    const stepDef = STEPS[s - 1];

    if (stepDef.id === 'company') {
      if (!selectedCompany) e.company = 'Please select a company';
    }
    if (stepDef.id === 'equipment') {
      if (!selectedModule) e.module = 'Please select an equipment module';
      if (!identity.serial_number.trim()) e.serial_number = 'Required';
      if (!identity.manufacturer_name.trim()) e.manufacturer_name = 'Required';
      
      if (dynamicConfig?.layout?.steps) {
        dynamicConfig.layout.steps.forEach(st => {
          (st.fields || []).filter(f => f.required || f.is_required).forEach(f => {
            const key = f.key || f.field_key;
            if (!details[key]) e[`det_${key}`] = 'Required';
          });
        });
      } else {
        const schema = getEquipmentSchema(selectedModule?.name || '');
        schema?.attributes?.filter(a => a.required).forEach(a => {
          if (!details[a.key]) e[`det_${a.key}`] = 'Required';
        });
      }
      if (!lifecycle.installed_on)       e.installed_on       = 'Required';
      if (!lifecycle.expiry_date)        e.expiry_date        = 'Required';
      if (!lifecycle.operational_status) e.operational_status = 'Required';
    }
    if (stepDef.id === 'location') {
      if (!location.branch_id)   e.branch_id   = 'Required';
      if (!location.building_id) e.building_id = 'Required';
      if (!location.floor_id)    e.floor_id    = 'Required';
      if (!location.zone_id)     e.zone_id     = 'Required';
      if (!location.exact_location_description.trim()) e.exact_location_description = 'Required';
    }
    if (stepDef.id === 'review') {
      if (!certified) e.certified = 'Certification required before deploying';
    }
    return e;
  };

  const goNext = () => {
    const e = validate(step);
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(s => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => { setErrors({}); setActionError(null); setStep(s => s - 1); };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate(STEPS.length);
    if (Object.keys(e).length) { setErrors(e); return; }
    setSubmitting(true);
    setActionError(null);
    try {
      const cid = selectedCompany?.id || selectedCompany?.company_id;
      
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
        module_id:          selectedModule?.id || selectedModule?.module_id,
        equipment_type:     selectedModule?.name,
        manufacturer_name:  identity.manufacturer_name.trim(),
        company_id:         cid,

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
        // We'll also keep details just in case the legacy backend expects it as well, but specs is the new format
        details: {
          barcode:        identity.barcode.trim() || identity.serial_number.trim().toUpperCase(),
          equipment_code: identity.serial_number.trim().toUpperCase(),
          ...details,
        },

        installed_on:        lifecycle.installed_on, // YYYY-MM-DD format from input
        inspection_frequency_days: 365,
        last_service_on:     lifecycle.last_service_on || undefined,
        expiry_date:         lifecycle.expiry_date,
        operational_status:  lifecycle.operational_status,
        remarks:             lifecycle.remarks || "",

        auto_generate_qr:             true,
        fda_21_cfr_part_11_certified: certified,
      };

      const result = await ApiService.onboardEquipment(payload);
      let verified = result;
      if (result?.sos_code) {
        try { verified = await ApiService.getEquipmentBySosCode(result.sos_code); } catch (_) {}
      }
      setSuccessData({ ...result, ...verified });
    } catch (err) {
      setActionError(err.message || 'Failed to onboard equipment');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Nav bar ──────────────────────────────────────────────────────────────────
  const NavBar = () => (
    <div className="eob-nav-bar">
      <button className="eob-cancel-btn" onClick={step === 1 ? onBack : goBack} disabled={submitting}>
        {step === 1 ? 'Cancel' : '← Back'}
      </button>
      <span className="eob-step-counter">Step {step} of {STEPS.length}</span>
      {step < STEPS.length
        ? <button className="eob-submit-btn" onClick={goNext}>Next →</button>
        : <button className="eob-submit-btn" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><div className="eob-btn-spinner" />Deploying…</> : '⚡ Onboard & Deploy'}
          </button>}
    </div>
  );

  // ── Success screen ───────────────────────────────────────────────────────────
  if (successData) {
    return (
      <div className="eob-page">
        <div className="eob-header">
          <button className="eob-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="eob-header-info"><div className="eob-title">Equipment Onboarding</div></div>
        </div>
        <div className="eob-body">
          <div className="eob-success-card">
            <div className="eob-success-icon">✅</div>
            <div className="eob-success-title">Equipment Deployed Successfully</div>
            <div className="eob-success-subtitle">{successData.message || 'Equipment is ready for inspection.'}</div>
            <div className="eob-success-detail-grid">
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">SOS Code</span>
                <span className="eob-success-sos">{successData.sos_code || '—'}</span>
              </div>
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">System ID</span>
                <span className="eob-success-id">#{successData.id || '—'}</span>
              </div>
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">Serial Number</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{identity.serial_number.toUpperCase()}</span>
              </div>
              <div className="eob-success-detail">
                <span className="eob-success-detail-label">Equipment Type</span>
                <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{selectedModule?.name}</span>
              </div>
              {successData.sos_code && (
                <div className="eob-success-detail" style={{ gridColumn: '1/-1' }}>
                  <span className="eob-success-detail-label">QR Scan URL</span>
                  <span className="eob-success-qr">https://ehs.garrev.com/scan/{successData.sos_code}</span>
                </div>
              )}
            </div>
            <div className="eob-success-actions">
              <button className="eob-cancel-btn" onClick={onSuccess || onBack}>Back to Dashboard</button>
              <button className="eob-submit-btn" onClick={() => {
                setSuccessData(null); setStep(1);
                if (isSuperAdmin) {
                  setSelectedCompany(null);
                }
                setSelectedModule(null);
                setIdentity({ serial_number: '', barcode: '', manufacturer_name: '' });
                setDetails({});
                setLocationState({ branch_id: '', building_id: '', floor_id: '', zone_id: '', department_id: '', exact_location_description: '', latitude: null, longitude: null, geo_accuracy_m: null });
                setLifecycle({ installed_on: '', last_service_on: '', expiry_date: '', operational_status: '', remarks: '' });
                setCertified(false); setErrors({});
              }}>+ Onboard Another</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const schema = selectedModule ? getEquipmentSchema(selectedModule.name) : null;

  return (
    <div className="eob-page">
      {/* Header */}
      <div className="eob-header">
        <button className="eob-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div className="eob-header-info">
          <div className="eob-title">Equipment Onboarding</div>
          {selectedCompany && (
            <span className="eob-breadcrumb">
              {selectedCompany.name}
              {selectedModule && <> › {selectedModule.name}</>}
            </span>
          )}
        </div>
        {(masterLoading || locLoading || modulesLoading) && (
          <div className="eob-header-loading">
            <div className="eob-spinner" />
            <span>{locLoading ? 'Loading locations…' : modulesLoading ? 'Loading modules…' : 'Loading…'}</span>
          </div>
        )}
      </div>

      <StepIndicator current={step} steps={STEPS} />

      <div className="eob-body">
        {actionError && (
          <div className="eob-action-error">
            <span>⚠️ <strong>Error:</strong> {actionError}</span>
            <button onClick={() => setActionError(null)}>×</button>
          </div>
        )}

        {/* ══════════════ STEP 1 — COMPANY ══════════════ */}
        {STEPS[step - 1]?.id === 'company' && (
          <>
            <Section icon="🏢" title="Select Company" />
            {errors.company && (
              <div style={{ color: '#fc8181', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                ⚠ {errors.company}
              </div>
            )}

            {masterLoading ? (
              <div className="eob-loading-placeholder">
                <div className="eob-spinner" style={{ width: 28, height: 28 }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading companies…</span>
              </div>
            ) : companies.length === 0 ? (
              <div className="eob-empty-state">No companies found. Add a company first.</div>
            ) : (
              <div className="eob-company-grid">
                {companies.map(c => {
                  const isSelected = selectedCompany?.id === c.id || selectedCompany?.company_id === c.company_id;
                  const logo = resolveLogoUrl(c);
                  return (
                    <div
                      key={c.id || c.company_id}
                      className={`eob-company-card${isSelected ? ' selected' : ''}`}
                      onClick={() => { setSelectedCompany(c); setErrors(e => ({ ...e, company: undefined })); }}
                    >
                      <div className="eob-company-logo">
                        {logo
                          ? <img src={logo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 6 }} />
                          : <span style={{ fontSize: 24 }}>🏢</span>}
                      </div>
                      <div className="eob-company-info">
                        <div className="eob-company-name">{c.name || c.company_name}</div>
                        <div className="eob-company-id">{c.comapany_ref || c.company_ref || c.company_id || ''}</div>
                        {c.address && <div className="eob-company-addr">{c.address}</div>}
                      </div>
                      {isSelected && (
                        <input 
                          type="checkbox" 
                          className="eob-native-checkbox" 
                          checked={true} 
                          readOnly 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            <NavBar />
          </>
        )}

        {/* ══════════════ STEP 2 — MODULE + ATTRIBUTES ══════════════ */}
        {STEPS[step - 1]?.id === 'equipment' && (
          <>
            <Section icon="🔧" title="Select Equipment Module" />
            {errors.module && (
              <div style={{ color: '#fc8181', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                ⚠ {errors.module}
              </div>
            )}

            {modulesLoading ? (
              <div className="eob-loading-placeholder">
                <div className="eob-spinner" style={{ width: 24, height: 24 }} />
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Loading modules for {selectedCompany?.name}…</span>
              </div>
            ) : modules.length === 0 ? (
              <div className="eob-empty-state">No modules found for this company.</div>
            ) : (
              <div style={{ maxWidth: '500px' }}>
                <CustomSelect
                  value={selectedModule?.id || ''}
                  placeholder="Select Equipment Module..."
                  options={modules.map(m => ({
                    label: m.name || m.module_name || `Module ${m.id}`,
                    value: m.id
                  }))}
                  onChange={(val) => {
                    const mod = modules.find(m => String(m.id) === String(val));
                    setSelectedModule(mod || null);
                    setDetails({});
                    setDynamicConfig(null);
                    setErrors(e => ({ ...e, module: undefined }));
                    if (mod) {
                      setConfigLoading(true);
                      ApiService.getModuleFieldConfig(mod.id || mod.module_id)
                        .then(res => {
                          const rawCfg = res?.data || res;
                          let cfg = { ...rawCfg };
                          if (cfg?.layout?.steps) {
                            cfg.layout = {
                              ...cfg.layout,
                              steps: cfg.layout.steps.filter(st => !(st.label || '').toLowerCase().includes('compliance'))
                            };
                          }
                          setDynamicConfig(cfg);
                        })
                        .catch(err => console.error(err))
                        .finally(() => setConfigLoading(false));
                    }
                  }}
                />
              </div>
            )}

            {/* Equipment Identity + Module Attributes */}
            {selectedModule && (
              <>
                <Section icon="🏷️" title="Equipment Identity" />
                <div className="eob-grid">
                  <Field label="Serial Number" required error={errors.serial_number}>
                    <input className="eob-input" type="text"
                      placeholder="e.g. FE-2024-501"
                      value={identity.serial_number}
                      onChange={e => setId('serial_number', e.target.value.toUpperCase())}
                      maxLength={30}
                    />
                  </Field>
                  <Field label="Barcode" error={errors.barcode}>
                    <input className="eob-input" type="text"
                      placeholder="Physical barcode (defaults to serial if blank)"
                      value={identity.barcode}
                      onChange={e => setId('barcode', e.target.value.toUpperCase())}
                      maxLength={30}
                    />
                  </Field>
                  <Field label="Manufacturer Name" required error={errors.manufacturer_name}>
                    <input className="eob-input" type="text"
                      placeholder="e.g. Tyco, Ceasefire, Kanex"
                      value={identity.manufacturer_name}
                      onChange={e => setId('manufacturer_name', e.target.value)}
                      maxLength={100}
                    />
                  </Field>
                </div>

                {/* DYNAMIC STEPS (SPECS) RENDERED INLINE */}
                {dynamicConfig?.layout?.steps && dynamicConfig.layout.steps.map((st, idx) => (
                  <div key={idx}>
                    <Section icon="⚙️" title={`${selectedModule?.name} — ${st.label}`} />
                    <div className="eob-grid">
                      {(st.fields || []).map(attr => {
                        const key = attr.key || attr.field_key;
                        return (
                          <DynamicField
                            key={key}
                            attr={attr}
                            value={details[key]}
                            onChange={setDet}
                            error={errors[`det_${key}`]}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!dynamicConfig?.layout?.steps && schema && (
                  <>
                    <Section icon={schema.icon} title={`${selectedModule.name} Specifications`} />
                    <div className="eob-grid">
                      {schema.attributes.map(attr => (
                        <DynamicField
                          key={attr.key}
                          attr={attr}
                          value={details[attr.key]}
                          onChange={setDet}
                          error={errors[`det_${attr.key}`]}
                        />
                      ))}
                    </div>
                  </>
                )}

                <Section icon="📅" title="Lifecycle & Status" />
                <div className="eob-grid">
                  <Field label="Installation Date" required error={errors.installed_on}>
                    <input className="eob-input eob-date-input" type="date"
                      value={lifecycle.installed_on}
                      onChange={e => setLc('installed_on', e.target.value)}
                    />
                  </Field>
                  <Field label="Last Service Date" error={errors.last_service_on}>
                    <input className="eob-input eob-date-input" type="date"
                      value={lifecycle.last_service_on}
                      onChange={e => setLc('last_service_on', e.target.value)}
                    />
                  </Field>
                  <Field label="Expiry Date" required error={errors.expiry_date}>
                    <input className="eob-input eob-date-input" type="date"
                      value={lifecycle.expiry_date}
                      onChange={e => setLc('expiry_date', e.target.value)}
                    />
                  </Field>
                  <Field label="Operational Status" required error={errors.operational_status}>
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
                  <Field label="Remarks" error={errors.remarks} span2>
                    <textarea className="eob-input" rows={2}
                      placeholder="Any additional notes…"
                      value={lifecycle.remarks}
                      onChange={e => setLc('remarks', e.target.value)}
                      style={{ resize: 'vertical', minHeight: 48 }}
                    />
                  </Field>
                </div>
              </>
            )}
            <NavBar />
          </>
        )}

        {/* ══════════════ STEP 3 — LOCATION ══════════════ */}
        {STEPS[step - 1]?.id === 'location' && (
          <>
            <Section icon="🏢" title="Organisation & Location" />
            <div className="eob-grid">
              <Field label="Branch / Location" required error={errors.branch_id}>
                <CustomSelect
                  value={location.branch_id}
                  onChange={v => setLoc('branch_id', v)}
                  placeholder={locLoading ? 'Loading…' : 'Select Branch'}
                  options={branches.map(b => ({ value: b.id, label: b.branch_name || b.name }))}
                  disabled={locLoading}
                />
              </Field>
              <Field label="Building" required error={errors.building_id}>
                <CustomSelect
                  value={location.building_id}
                  onChange={v => setLoc('building_id', v)}
                  placeholder={!location.branch_id ? 'Select branch first' : locLoading ? 'Loading…' : 'Select Building'}
                  options={buildings.map(b => ({ value: b.id, label: b.building_name || b.name }))}
                  disabled={!location.branch_id || locLoading}
                />
              </Field>
              <Field label="Floor" required error={errors.floor_id}>
                <CustomSelect
                  value={location.floor_id}
                  onChange={v => setLoc('floor_id', v)}
                  placeholder={!location.building_id ? 'Select building first' : locLoading ? 'Loading…' : 'Select Floor'}
                  options={floors.map(f => ({ value: f.id, label: f.floor_name || f.name }))}
                  disabled={!location.building_id || locLoading}
                />
              </Field>
              <Field label="Zone" required error={errors.zone_id}>
                <CustomSelect
                  value={location.zone_id}
                  onChange={v => setLoc('zone_id', v)}
                  placeholder={!location.floor_id ? 'Select floor first' : locLoading ? 'Loading…' : 'Select Zone'}
                  options={zones.map(z => ({ value: z.id, label: z.zone_name || z.name }))}
                  disabled={!location.floor_id || locLoading}
                />
              </Field>
              <Field label="Department" error={errors.department_id}>
                <CustomSelect
                  value={location.department_id}
                  onChange={v => setLoc('department_id', v)}
                  placeholder={!location.zone_id ? 'Select zone first' : locLoading ? 'Loading…' : 'Select Department'}
                  options={departments.map(d => ({ value: d.id, label: d.department_name || d.name }))}
                  disabled={!location.zone_id || locLoading}
                />
              </Field>
              <Field label="Exact Location Description" required error={errors.exact_location_description} span2>
                <input className="eob-input" type="text"
                  placeholder="e.g. Adjacent to Reactor-3 exit, left wall"
                  value={location.exact_location_description}
                  onChange={e => setLoc('exact_location_description', e.target.value)}
                  maxLength={200}
                />
              </Field>
            </div>

            <Section icon="🗺️" title="Pin on Map" />
            <MapLocationPicker
              position={location.latitude != null ? { latitude: location.latitude, longitude: location.longitude, geo_accuracy_m: location.geo_accuracy_m } : null}
              onChange={({ latitude, longitude, geo_accuracy_m }) =>
                setLocationState(s => ({ ...s, latitude, longitude, geo_accuracy_m }))}
              gpsCapturing={gpsCapturing}
              onCaptureGPS={captureGPS}
              onClear={clearGPS}
            />

            <NavBar />
          </>
        )}

        {/* ══════════════ STEP 4 — REVIEW ══════════════ */}
        {STEPS[step - 1]?.id === 'review' && (
          <>
            <Section icon="📋" title="Review Your Submission" />
            <div className="eob-review-grid">
              <ReviewBlock title="Company & Module" icon="🏢" rows={[
                ['Company',   selectedCompany?.name],
                ['Module',    selectedModule?.name],
                ['Serial No.',identity.serial_number],
                ['Barcode',   identity.barcode || identity.serial_number],
                ['Manufacturer', identity.manufacturer_name],
              ]} />

              <ReviewBlock title="Specifications" icon="🔧" rows={
                schema
                  ? schema.attributes.slice(0, 8).map(a => [a.label, details[a.key] ? String(details[a.key]) : null])
                  : []
              } />

              <ReviewBlock title="Location" icon="📍" rows={[
                ['Branch',    branches.find(b => String(b.id) === String(location.branch_id))?.branch_name],
                ['Building',  buildings.find(b => String(b.id) === String(location.building_id))?.building_name],
                ['Floor',     floors.find(f => String(f.id) === String(location.floor_id))?.floor_name],
                ['Zone',      zones.find(z => String(z.id) === String(location.zone_id))?.zone_name || zones.find(z => String(z.id) === String(location.zone_id))?.name],
                ['Exact Loc', location.exact_location_description],
                ['GPS',       location.latitude != null ? `${location.latitude}°N, ${location.longitude}°E (±${location.geo_accuracy_m}m)` : 'Not captured'],
              ]} />

              <ReviewBlock title="Lifecycle" icon="📅" rows={[
                ['Installed On',  lifecycle.installed_on],
                ['Last Serviced', lifecycle.last_service_on],
                ['Expiry Date',   lifecycle.expiry_date],
                ['Status',        lifecycle.operational_status],
                ['Remarks',       lifecycle.remarks],
              ]} />
            </div>

            <div className={`eob-cert-card${errors.certified ? ' has-error' : ''}`}>
              <label className="eob-cert-label">
                <input type="checkbox" className="eob-cert-checkbox"
                  checked={certified}
                  onChange={e => { setCertified(e.target.checked); setErrors(v => ({ ...v, certified: undefined })); }}
                />
                <span className="eob-cert-title">FDA 21 CFR Part 11 — Electronic Signature Certification</span>
              </label>
              <p className="eob-cert-text">
                I certify that this equipment has undergone required physical verification and complies with
                applicable safety standards. This electronic signature authorizes its secure provisioning into the system.
              </p>
              {errors.certified && <span className="eob-error-msg">{errors.certified}</span>}
            </div>

            <NavBar />
          </>
        )}
      </div>
    </div>
  );
};

export default EquipmentOnboarding;
