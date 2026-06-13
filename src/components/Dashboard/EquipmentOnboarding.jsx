import { useState, useEffect, useRef } from 'react';
import { ApiService } from '../../services/apiService';
import './EquipmentOnboarding.css';

// ── Static master lists ──────────────────────────────────────────────────────


const SHIFT_OPTIONS = ['Morning', 'Evening', 'Night', 'Anytime'];

const EMPTY_FORM = {
  equipment_code: '',
  equipment_type: '',
  company_id: '',
  branch_id: '',
  building_id: '',
  floor_id: '',
  zone_id: '',
  department_id: '',
  inspection_frequency: '',
  custom_frequency_days: '',
  shift_allowed: '',
  checklist_template_id: '',
  installation_date: '',
  expiry_date: '',
  status: '',
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

const ShiftDropdown = ({ value, onChange, placeholder, error, shifts = [] }) => {
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

  const options = shifts.length > 0
    ? shifts.map(s => s.name || s.shift_name).filter(Boolean)
    : SHIFT_OPTIONS;

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
        {options.map(opt => {
          const isSelected = value.includes(opt);
          return (
            <div
              key={opt}
              className={`eob-select-option ${isSelected ? 'selected' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault(); e.stopPropagation();
                toggleShift(opt);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px' }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                readOnly
                style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)' }}>{opt}</span>
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
  const [branches, setBranches] = useState([]);
  const [allBuildings, setAllBuildings] = useState([]);
  const [allZones, setAllZones] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [dynamicFloors, setDynamicFloors] = useState([]);
  const [successData, setSuccessData] = useState(null);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [frequencies, setFrequencies] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [actionError, setActionError] = useState(null);

  // Load companies, equipment types, checklists, frequencies, and statuses on mount
  useEffect(() => {
    Promise.allSettled([
      ApiService.getAdminCompanies(),
      ApiService.getAdminModules(),
      ApiService.getChecklists(),
      ApiService.getFrequencies(),
      ApiService.getStatuses()
    ]).then(([companiesRes, modulesRes, checklistsRes, frequenciesRes, statusesRes]) => {
      const compList = companiesRes.status === 'fulfilled'
        ? (Array.isArray(companiesRes.value) ? companiesRes.value : (companiesRes.value?.companies || companiesRes.value?.data || []))
        : [];
      const moduleList = modulesRes.status === 'fulfilled'
        ? (Array.isArray(modulesRes.value) ? modulesRes.value : (modulesRes.value?.data || modulesRes.value?.modules || []))
        : [];
      const checklistList = checklistsRes.status === 'fulfilled'
        ? (checklistsRes.value?.types || [])
        : [];
      const freqList = frequenciesRes.status === 'fulfilled'
        ? (Array.isArray(frequenciesRes.value) ? frequenciesRes.value : (frequenciesRes.value?.frequencies || frequenciesRes.value?.data || []))
        : [];
      const statusList = statusesRes.status === 'fulfilled'
        ? (Array.isArray(statusesRes.value) ? statusesRes.value : (statusesRes.value?.statuses || statusesRes.value?.data || []))
        : [];

      setCompanies(compList);
      setChecklists(checklistList);
      setFrequencies(freqList);
      setStatuses(statusList);

      if (moduleList.length > 0) {
        const activeModules = moduleList.filter(m => m.is_active || m.status === 'active' || m.is_active === 1 || m.is_active === '1');
        const types = activeModules.map(m => m.name).filter(Boolean);
        if (types.length > 0) {
          setEquipmentTypes(types);
        }
      }
    }).catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  // When company changes → fetch branches
  useEffect(() => {
    if (!form.company_id) {
      setBranches([]); setAllBuildings([]); setAllZones([]); setAllDepartments([]); setDynamicFloors([]);
      return;
    }
    setDropdownsLoading(true);
    ApiService.getBranches({ company_id: form.company_id })
      .then(res => {
        const branchList = (Array.isArray(res) ? res : (res?.branches || res?.data || []))
          .filter(b => !form.company_id || String(b.company_id) === String(form.company_id));
        setBranches(branchList);
      })
      .catch(err => {
        console.error('Failed to fetch branches:', err);
        setBranches([]);
      })
      .finally(() => setDropdownsLoading(false));

    ApiService.getOnboardingDropdowns(form.company_id)
      .then(d => {
        setAllZones(d.zones || []);
      })
      .catch(() => {});
  }, [form.company_id]);

  // When branch changes → fetch buildings for this branch
  useEffect(() => {
    if (!form.branch_id) {
      setAllBuildings([]);
      return;
    }
    setDropdownsLoading(true);
    ApiService.getBranchBuildings(form.branch_id)
      .then(res => {
        const buildingList = Array.isArray(res) ? res : (res?.buildings || res?.data || []);
        setAllBuildings(buildingList);
      })
      .catch(err => {
        console.error('Failed to fetch buildings for branch:', err);
        setAllBuildings([]);
      })
      .finally(() => setDropdownsLoading(false));

    // Fetch branch details
    ApiService.getBranchById(form.branch_id)
      .catch(() => {});
  }, [form.branch_id]);

  // When building changes → fetch branch floors dynamically
  useEffect(() => {
    if (!form.building_id) return;
    
    // Fetch floors
    ApiService.getBuildingFloors(form.building_id)
      .then(floors => {
        const floorList = Array.isArray(floors) ? floors : (floors?.data || floors?.floors || []);
        setDynamicFloors(floorList);
      })
      .catch(err => {
        console.warn('Failed to fetch building floors:', err);
        setDynamicFloors([]);
      });
  }, [form.building_id]);

  // When floor changes → fetch zones dynamically
  useEffect(() => {
    if (!form.floor_id) {
      setAllZones([]);
      return;
    }
    setDropdownsLoading(true);
    ApiService.getFloorZones(form.floor_id)
      .then(zones => {
        const zoneList = Array.isArray(zones) ? zones : (zones?.data || zones?.zones || []);
        const mappedZones = zoneList.map(z => ({
          ...z,
          floor_id: form.floor_id,
          name: z.zone_name || z.name
        }));
        setAllZones(mappedZones);
      })
      .catch(err => {
        console.warn('Failed to fetch floor zones:', err);
        setAllZones([]);
      })
      .finally(() => setDropdownsLoading(false));
  }, [form.floor_id]);

  // When zone changes → fetch departments dynamically
  useEffect(() => {
    if (!form.zone_id) {
      setAllDepartments([]);
      return;
    }
    setDropdownsLoading(true);
    ApiService.getZoneDepartments(form.zone_id)
      .then(depts => {
        const deptList = Array.isArray(depts) ? depts : (depts?.data || depts?.departments || []);
        const mappedDepts = deptList.map(d => ({
          ...d,
          zone_id: form.zone_id,
          name: d.department_name || d.name
        }));
        setAllDepartments(mappedDepts);
      })
      .catch(err => {
        console.warn('Failed to fetch zone departments:', err);
        setAllDepartments([]);
      })
      .finally(() => setDropdownsLoading(false));
  }, [form.zone_id]);

  // Cascaded options
  const filteredZones = allZones.filter(z => !form.floor_id || z.floor_id === form.floor_id);

  const set = (key, val) => {
    setFormState(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  };

  const setBranch = (val) => {
    setFormState(f => ({ ...f, branch_id: val, building_id: '', floor_id: '', zone_id: '' }));
    setErrors(e => ({ ...e, branch_id: undefined, building_id: undefined, floor_id: undefined, zone_id: undefined }));
  };

  const setBuilding = (val) => {
    setFormState(f => ({ ...f, building_id: val, floor_id: '', zone_id: '' }));
    setErrors(e => ({ ...e, building_id: undefined, floor_id: undefined, zone_id: undefined }));
  };

  const setFloor = (val) => {
    setFormState(f => ({ ...f, floor_id: val, zone_id: '' }));
    setErrors(e => ({ ...e, floor_id: undefined, zone_id: undefined }));
  };

  const setZone = (val) => {
    setFormState(f => ({ ...f, zone_id: val, department_id: '' }));
    setErrors(e => ({ ...e, zone_id: undefined, department_id: undefined }));
  };

  const validate = () => {
    const e = {};
    if (!form.equipment_code.trim())     e.equipment_code = 'Required';
    if (!form.equipment_type)            e.equipment_type = 'Required';
    if (!form.company_id)                e.company_id = 'Required';
    if (!form.branch_id)                 e.branch_id = 'Required';
    if (!form.building_id)               e.building_id = 'Required';
    if (!form.floor_id)                  e.floor_id = 'Required';
    if (!form.zone_id)                   e.zone_id = 'Required';
    if (!form.department_id)             e.department_id = 'Required';
    if (!form.inspection_frequency)      e.inspection_frequency = 'Required';
    if (String(form.inspection_frequency).toLowerCase() === 'custom' && (!form.custom_frequency_days || isNaN(form.custom_frequency_days) || Number(form.custom_frequency_days) <= 0)) {
      e.custom_frequency_days = 'Valid positive number required';
    }
    if (!form.shift_allowed) e.shift_allowed = 'Select a shift';
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
    setActionError(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = {
        equipment_code: form.equipment_code.trim().toUpperCase(),
        equipment_type: form.equipment_type,
        company_id: form.company_id,
        branch_id: form.branch_id,
        building_id: form.building_id,
        floor_id: form.floor_id,
        zone_id: form.zone_id,
        department_id: form.department_id,
        inspection_frequency: form.inspection_frequency,
        shift_allowed: form.shift_allowed ? [form.shift_allowed] : [],
        checklist_template_id: form.checklist_template_id,
        auto_generate_qr: true,
        installation_date: formatDateToDDMMYYYY(form.installation_date),
        expiry_date: formatDateToDDMMYYYY(form.expiry_date),
        status: form.status,
        fda_21_cfr_part_11_certified: certified,
      };

      if (String(form.inspection_frequency).toLowerCase() === 'custom') {
        payload.custom_frequency_days = Number(form.custom_frequency_days);
      }

      const result = await ApiService.onboardEquipment(payload);
      setSuccessData(result);
    } catch (err) {
      setActionError(err.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setFormState(EMPTY_FORM);
    setCertified(false);
    setErrors({});
    setActionError(null);
    setSuccessData(null);
    setAllBuildings([]); setAllZones([]);
  };

  // Company options — use database ID as value for APIs
  const companyOptions = companies.map(c => ({
    value: c.id || c.company_id,
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
        {actionError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#fca5a5',
            padding: '12px 16px',
            fontSize: '13px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px' }}>⚠️</span>
              <span><strong>Failed to deploy:</strong> {actionError}</span>
            </div>
            <button
              onClick={() => setActionError(null)}
              style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' }}
            >
              &times;
            </button>
          </div>
        )}

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
              options={equipmentTypes.map(t => ({ value: t, label: t }))}
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
          <Field label="Branch" required error={errors.branch_id}>
            <CustomSelect
              value={form.branch_id}
              onChange={setBranch}
              placeholder={!form.company_id ? 'Select company first' : dropdownsLoading ? 'Loading…' : 'Select Branch'}
              options={branches.map(b => ({ value: b.id, label: b.branch_name || b.name || `Branch #${b.id}` }))}
              disabled={!form.company_id || dropdownsLoading}
            />
          </Field>

          <Field label="Building" required error={errors.building_id}>
            <CustomSelect
              value={form.building_id}
              onChange={setBuilding}
              placeholder={!form.branch_id ? 'Select branch first' : dropdownsLoading ? 'Loading…' : 'Select Building'}
              options={allBuildings.map(b => ({ value: b.id, label: b.building_name || b.name || `Building #${b.id}` }))}
              disabled={!form.branch_id || dropdownsLoading}
            />
          </Field>

          <Field label="Floor" required error={errors.floor_id}>
            <CustomSelect
              value={form.floor_id}
              onChange={setFloor}
              placeholder="Select Floor"
              options={dynamicFloors.map(f => ({ value: f.id, label: f.floor_name || f.name }))}
            />
          </Field>

          <Field label="Zone" required error={errors.zone_id}>
            <CustomSelect
              value={form.zone_id}
              onChange={setZone}
              placeholder={!form.floor_id ? 'Select floor first' : 'Select Zone'}
              options={filteredZones.map(z => ({ value: z.id, label: z.zone_name || z.name }))}
              disabled={!form.floor_id}
            />
          </Field>

          <Field label="Department" required error={errors.department_id}>
            <CustomSelect
              value={form.department_id}
              onChange={v => set('department_id', v)}
              placeholder={!form.zone_id ? 'Select zone first' : 'Select Department'}
              options={allDepartments.map(d => ({ value: d.id, label: d.department_name || d.name }))}
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
              options={frequencies.map(f => ({ 
                value: f.key || f.name || f, 
                label: f.name || f.key || f 
              }))}
            />
          </Field>

          {String(form.inspection_frequency).toLowerCase() === 'custom' && (
            <Field label="Custom Frequency (Days)" required error={errors.custom_frequency_days}>
              <input
                className="eob-input"
                type="number"
                min="1"
                placeholder="e.g. 13"
                value={form.custom_frequency_days}
                onChange={e => set('custom_frequency_days', e.target.value)}
              />
            </Field>
          )}

          <Field label="Checklist Template" required error={errors.checklist_template_id}>
            <CustomSelect
              value={form.checklist_template_id}
              onChange={v => set('checklist_template_id', v)}
              placeholder="Select Template"
              options={checklists.map(t => ({ 
                value: t.equipment_type, 
                label: `${(t.equipment_type || '').replace(/_/g, ' ').toUpperCase()} (${t.total_items || 0} items)` 
              }))}
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

          {/* Shift dropdown single-select */}
          <Field label="Shift Allowed" required error={errors.shift_allowed} span={1}>
            <CustomSelect
              value={form.shift_allowed}
              onChange={v => set('shift_allowed', v)}
              placeholder="Select Shift"
              options={SHIFT_OPTIONS.map(s => ({ value: s, label: s }))}
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
              options={statuses.map(s => ({ value: s.key || s.name || s, label: s.name || s.key || s }))}
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
