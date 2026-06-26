/**
 * onboardingConfig.js
 *
 * Single source of truth for the Equipment Onboarding Wizard.
 *
 * SECTION 1 — COMMON_FIELDS
 *   Fields that appear on EVERY equipment type regardless of module.
 *   Grouped into sub-sections that map to the wizard steps.
 *
 * SECTION 2 — EQUIPMENT_ATTRIBUTE_SCHEMAS
 *   Equipment-specific attributes that change per module type.
 *   Stored inside the `details` JSONB column in the DB.
 */

// ── Field type constants ──────────────────────────────────────────────────────
export const FIELD_TYPES = {
  TEXT:     'text',
  NUMBER:   'number',
  SELECT:   'select',
  DATE:     'date',
  TEXTAREA: 'textarea',
  GPS:      'gps',      // rendered as Leaflet map + GPS button
  DISPLAY:  'display',  // read-only info, not editable
};

// ── Source constants for SELECT fields ───────────────────────────────────────
export const FIELD_SOURCE = {
  STATIC:   'static',   // options defined inline in config
  API:      'api',      // loaded from an API endpoint
  COMPUTED: 'computed', // derived from another field / state
};

// =============================================================================
// SECTION 1 — COMMON FIELDS
// Same for all 35 equipment types.
// Organized by sub-section (maps to wizard Steps 2, 3 and 4).
// =============================================================================

export const COMMON_SECTIONS = [

  // ── Sub-section A: Equipment Identity (Wizard Step 2) ──────────────────────
  {
    id:    'identity',
    title: 'Equipment Identity',
    icon:  '🏷️',
    step:  2,
    fields: [
      {
        key:         'serial_number',
        label:       'Equipment Code',
        type:        FIELD_TYPES.TEXT,
        required:    true,
        placeholder: 'e.g. FE-2025-501',
        maxLength:   30,
        transform:   'uppercase',
        dbField:     'serial_number',
        note:        'Primary identifier — used to generate QR/SOS code',
      },
      {
        key:         'equipment_name',
        label:       'Equipment Name',
        type:        FIELD_TYPES.TEXT,
        required:    false,
        placeholder: 'e.g. Fire Extinguisher - Block B Exit',
        maxLength:   120,
        dbField:     'details.equipment_name',
        note:        'Human-readable label for this specific unit',
      },
      {
        key:      'equipment_type',
        label:    'Equipment Type',
        type:     FIELD_TYPES.DISPLAY,
        required: true,
        dbField:  'equipment_type',
        note:     'Auto-filled from the module selected in Step 2',
      },
      {
        key:         'manufacturer_name',
        label:       'Manufacturer',
        type:        FIELD_TYPES.TEXT,
        required:    true,
        placeholder: 'e.g. Tyco, Ceasefire, Kanex',
        maxLength:   100,
        dbField:     'manufacturer_name',
      },
      {
        key:         'barcode',
        label:       'Barcode',
        type:        FIELD_TYPES.TEXT,
        required:    false,
        placeholder: 'Physical barcode — defaults to Equipment Code if blank',
        maxLength:   30,
        transform:   'uppercase',
        dbField:     'details.barcode',
      },
    ],
  },

  // ── Sub-section B: Location (Wizard Step 3) ────────────────────────────────
  {
    id:    'location',
    title: 'Location',
    icon:  '📍',
    step:  3,
    fields: [
      {
        key:      'company',
        label:    'Company',
        type:     FIELD_TYPES.DISPLAY,
        required: true,
        dbField:  null,
        note:     'Selected in Step 1 — drives Branch dropdown below',
      },
      {
        key:         'branch_id',
        label:       'Branch',
        type:        FIELD_TYPES.SELECT,
        required:    true,
        placeholder: 'Select Branch',
        source:      FIELD_SOURCE.API,
        apiMethod:   'getBranches',
        apiParams:   { company_id: '<from_state>' },
        dependsOn:   'company_id',
        labelField:  'branch_name',
        valueField:  'id',
        dbField:     'location_id',  // NOTE: branch is stored as location_id in DB
        note:        'Maps to location_id in the equipment DB record',
      },
      {
        key:         'building_id',
        label:       'Building',
        type:        FIELD_TYPES.SELECT,
        required:    true,
        placeholder: 'Select Building',
        source:      FIELD_SOURCE.API,
        apiMethod:   'getBranchBuildings',
        dependsOn:   'branch_id',
        labelField:  'building_name',
        valueField:  'id',
        dbField:     'building_id',
      },
      {
        key:         'floor_id',
        label:       'Floor',
        type:        FIELD_TYPES.SELECT,
        required:    true,
        placeholder: 'Select Floor',
        source:      FIELD_SOURCE.API,
        apiMethod:   'getBuildingFloors',
        dependsOn:   'building_id',
        labelField:  'floor_name',
        valueField:  'id',
        dbField:     'floor_id',
      },
      {
        key:         'zone_id',
        label:       'Zone',
        type:        FIELD_TYPES.SELECT,
        required:    true,
        placeholder: 'Select Zone',
        source:      FIELD_SOURCE.API,
        apiMethod:   'getFloorZones',
        dependsOn:   'floor_id',
        labelField:  'zone_name',
        valueField:  'id',
        dbField:     'zone_id',
      },
      {
        key:         'department_id',
        label:       'Department',
        type:        FIELD_TYPES.SELECT,
        required:    false,
        placeholder: 'Select Department (Optional)',
        source:      FIELD_SOURCE.API,
        apiMethod:   'getZoneDepartments',
        dependsOn:   'zone_id',
        labelField:  'department_name',
        valueField:  'id',
        dbField:     'department_id',
      },
      {
        key:         'exact_location_description',
        label:       'Exact Location Description',
        type:        FIELD_TYPES.TEXT,
        required:    true,
        placeholder: 'e.g. Adjacent to Reactor-3 exit, left wall',
        maxLength:   200,
        dbField:     'exact_location_description',
        note:        'Plain-text description — used when GPS is unavailable',
      },
      {
        key:      'gps',
        label:    'GPS Coordinates',
        type:     FIELD_TYPES.GPS,
        required: false,
        dbField:  null,
        note:     'Captured via GPS button or by clicking on the Leaflet map',
        subFields: {
          latitude:     { key: 'latitude',       label: 'GPS Latitude',    dbField: 'latitude',       type: FIELD_TYPES.NUMBER },
          longitude:    { key: 'longitude',      label: 'GPS Longitude',   dbField: 'longitude',      type: FIELD_TYPES.NUMBER },
          geo_accuracy: { key: 'geo_accuracy_m', label: 'Accuracy (± m)', dbField: 'geo_accuracy_m', type: FIELD_TYPES.NUMBER },
        },
      },
    ],
  },

  // ── Sub-section C: Lifecycle & Status (Wizard Step 3) ─────────────────────
  {
    id:    'lifecycle',
    title: 'Lifecycle & Status',
    icon:  '📅',
    step:  3,
    fields: [
      {
        key:      'installed_on',
        label:    'Installation Date',
        type:     FIELD_TYPES.DATE,
        required: true,
        dbField:  'installed_on',
      },
      {
        key:      'last_service_on',
        label:    'Last Service Date',
        type:     FIELD_TYPES.DATE,
        required: false,
        dbField:  'last_service_on',
      },
      {
        key:      'expiry_date',
        label:    'Expiry Date',
        type:     FIELD_TYPES.DATE,
        required: true,
        dbField:  'expiry_date',
      },
      {
        key:         'inspection_frequency',
        label:       'Inspection Frequency',
        type:        FIELD_TYPES.SELECT,
        required:    true,
        placeholder: 'Select Frequency',
        source:      FIELD_SOURCE.API,
        apiMethod:   'getFrequencies',
        labelField:  'name',
        valueField:  'key',
        dbField:     'inspection_frequency',
        fallbackOptions: [
          { key: 'daily',     name: 'Daily' },
          { key: 'weekly',    name: 'Weekly' },
          { key: 'monthly',   name: 'Monthly' },
          { key: 'quarterly', name: 'Quarterly' },
          { key: 'half_yearly', name: 'Half-Yearly' },
          { key: 'annually',  name: 'Annually' },
        ],
      },
      {
        key:         'operational_status',
        label:       'Status',
        type:        FIELD_TYPES.SELECT,
        required:    true,
        placeholder: 'Select Status',
        source:      FIELD_SOURCE.API,
        apiMethod:   'getStatuses',
        labelField:  'name',
        valueField:  'key',
        dbField:     'operational_status',
        fallbackOptions: [
          { key: 'active',            name: 'Active' },
          { key: 'inactive',          name: 'Inactive' },
          { key: 'under_maintenance', name: 'Under Maintenance' },
          { key: 'decommissioned',    name: 'Decommissioned' },
        ],
      },
      {
        key:         'remarks',
        label:       'Remarks',
        type:        FIELD_TYPES.TEXTAREA,
        required:    false,
        placeholder: 'Any additional notes…',
        dbField:     'remarks',
      },
    ],
  },

  // ── Sub-section D: QR Code (Wizard Step 4 — post-submit display) ──────────
  {
    id:    'qr',
    title: 'QR Code',
    icon:  '📱',
    step:  4,
    fields: [
      {
        key:      'sos_code',
        label:    'SOS / QR Code',
        type:     FIELD_TYPES.DISPLAY,
        required: false,
        dbField:  'sos_code',
        note:     'Auto-generated by the backend after successful submission. Used to generate the printable QR label.',
      },
    ],
  },
];

// ── Flat list of all common field keys for quick lookup ───────────────────────
export const ALL_COMMON_KEYS = COMMON_SECTIONS.flatMap(s => s.fields.flatMap(f =>
  f.type === FIELD_TYPES.GPS
    ? Object.values(f.subFields).map(sf => sf.key)
    : [f.key]
));

// ── DB field map: formKey → dbColumn ─────────────────────────────────────────
export const COMMON_DB_MAP = Object.fromEntries(
  COMMON_SECTIONS.flatMap(s => s.fields.flatMap(f => {
    if (f.type === FIELD_TYPES.GPS) {
      return Object.values(f.subFields).map(sf => [sf.key, sf.dbField]);
    }
    return f.dbField ? [[f.key, f.dbField]] : [];
  }))
);

// =============================================================================
// SECTION 2 — EQUIPMENT-SPECIFIC ATTRIBUTE SCHEMAS
// Fields that are unique to each module type.
// All values are stored in the `details` JSONB column.
// Key: lowercase module name (matched case-insensitively at runtime).
// =============================================================================

const COND = ['OK', 'Damaged', 'Missing', 'Needs Service'];

export const EQUIPMENT_ATTRIBUTE_SCHEMAS = {

  'fire extinguisher': {
    icon: '🧯',
    attributes: [
      { key: 'extinguisher_type', label: 'Extinguisher Type',    type: 'select', required: true,
        options: ['ABC DCP', 'CO2', 'Foam', 'Water', 'Halon', 'Wet Chemical', 'Clean Agent'] },
      { key: 'capacity_kg',       label: 'Capacity (kg)',        type: 'number', required: true,  placeholder: 'e.g. 9' },
      { key: 'capacity_text',     label: 'Capacity Label',       type: 'text',                    placeholder: 'e.g. 9 kg or 2.5 lbs' },
      { key: 'pressure_status',   label: 'Pressure Status',      type: 'select', required: true,  options: COND },
      { key: 'body_status',       label: 'Body Condition',       type: 'select', required: true,  options: COND },
      { key: 'hose_status',       label: 'Hose / Nozzle Status', type: 'select', required: true,  options: COND },
      { key: 'pin_seal_status',   label: 'Pin & Seal Status',    type: 'select', required: true,  options: COND },
      { key: 'serviced_by',       label: 'Serviced By',          type: 'text',                    placeholder: 'Technician name' },
      { key: 'service_agency',    label: 'Service Agency',       type: 'text',                    placeholder: 'Agency / company name' },
    ],
  },

  'co detector': {
    icon: '☁️',
    attributes: [
      { key: 'sensor_type',           label: 'Sensor Technology',     type: 'select', required: true,
        options: ['Electrochemical', 'Semiconductor', 'Catalytic'] },
      { key: 'alarm_threshold_ppm',   label: 'Alarm Threshold (PPM)', type: 'number', required: true },
      { key: 'battery_backup_hrs',    label: 'Battery Backup (hrs)',  type: 'number' },
      { key: 'coverage_sqft',         label: 'Coverage Area (sq ft)', type: 'number' },
      { key: 'last_calibration_date', label: 'Last Calibration Date', type: 'date',   required: true },
    ],
  },

  'heat detector': {
    icon: '🌡️',
    attributes: [
      { key: 'detector_type',  label: 'Detector Type',            type: 'select', required: true,
        options: ['Fixed Temperature', 'Rate-of-Rise', 'Combination'] },
      { key: 'trigger_temp_c', label: 'Trigger Temperature (°C)', type: 'number', required: true },
      { key: 'coverage_sqft',  label: 'Coverage Area (sq ft)',    type: 'number' },
      { key: 'last_test_date', label: 'Last Test Date',           type: 'date' },
    ],
  },

  'smoke detector': {
    icon: '💨',
    attributes: [
      { key: 'detector_type',      label: 'Detector Type',         type: 'select', required: true,
        options: ['Ionization', 'Photoelectric', 'Dual Sensor'] },
      { key: 'coverage_sqft',      label: 'Coverage Area (sq ft)', type: 'number' },
      { key: 'battery_backup_hrs', label: 'Battery Backup (hrs)',  type: 'number' },
      { key: 'last_test_date',     label: 'Last Test Date',        type: 'date' },
    ],
  },

  'emergency shower': {
    icon: '🚿',
    attributes: [
      { key: 'flow_rate_lpm',   label: 'Flow Rate (L/min)',        type: 'number', required: true },
      { key: 'ansi_compliant',  label: 'ANSI Z358.1 Compliant',   type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'drain_connected', label: 'Drain Connected',          type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'tepid_water',     label: 'Tepid Water (16–38°C)',   type: 'select', options: ['Yes', 'No'] },
      { key: 'last_flush_date', label: 'Last Weekly Flush Date',   type: 'date',   required: true },
    ],
  },

  'chemical shower': {
    icon: '🧪',
    attributes: [
      { key: 'flow_rate_lpm',   label: 'Flow Rate (L/min)',       type: 'number', required: true },
      { key: 'ansi_compliant',  label: 'ANSI Z358.1 Compliant',  type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'drain_connected', label: 'Drain Connected',         type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'last_flush_date', label: 'Last Weekly Flush Date',  type: 'date',   required: true },
    ],
  },

  'eyewash station': {
    icon: '👁️',
    attributes: [
      { key: 'station_type',    label: 'Station Type',            type: 'select', required: true,
        options: ['Plumbed', 'Self-Contained', 'Combination'] },
      { key: 'flow_rate_lpm',   label: 'Flow Rate (L/min)',       type: 'number', required: true },
      { key: 'ansi_compliant',  label: 'ANSI Z358.1 Compliant',  type: 'select', options: ['Yes', 'No'] },
      { key: 'last_flush_date', label: 'Last Weekly Flush Date',  type: 'date',   required: true },
    ],
  },

  'fire alarm panel': {
    icon: '🔔',
    attributes: [
      { key: 'zone_count',         label: 'Number of Zones',      type: 'number', required: true },
      { key: 'loop_type',          label: 'Loop Type',            type: 'select', required: true,
        options: ['2-Wire Conventional', '4-Wire Conventional', 'Addressable', 'Analogue Addressable'] },
      { key: 'battery_backup_hrs', label: 'Battery Backup (hrs)', type: 'number', required: true },
      { key: 'brand_model',        label: 'Brand / Model',        type: 'text' },
      { key: 'last_test_date',     label: 'Last Functional Test', type: 'date' },
    ],
  },

  'hose reel': {
    icon: '🚒',
    attributes: [
      { key: 'hose_length_m',      label: 'Hose Length (m)',       type: 'number', required: true },
      { key: 'hose_diameter_mm',   label: 'Hose Diameter (mm)',    type: 'number' },
      { key: 'nozzle_type',        label: 'Nozzle Type',           type: 'select', options: ['Jet', 'Spray', 'Combination'] },
      { key: 'water_pressure_bar', label: 'Water Pressure (bar)',  type: 'number' },
      { key: 'reel_condition',     label: 'Reel Condition',        type: 'select', required: true, options: COND },
    ],
  },

  'hydrant': {
    icon: '🔴',
    attributes: [
      { key: 'hydrant_type',   label: 'Hydrant Type',         type: 'select', required: true,
        options: ['Pillar', 'Underground', 'Wall'] },
      { key: 'outlet_size_mm', label: 'Outlet Size (mm)',     type: 'number' },
      { key: 'flow_rate_lpm',  label: 'Flow Rate (LPM)',      type: 'number' },
      { key: 'water_source',   label: 'Water Supply Source',  type: 'text' },
      { key: 'condition',      label: 'Overall Condition',    type: 'select', required: true, options: COND },
    ],
  },

  'first aid box': {
    icon: '🩹',
    attributes: [
      { key: 'box_type',        label: 'Box Type',            type: 'select', required: true,
        options: ['Basic', 'Advanced', 'Industrial', 'Burns Kit'] },
      { key: 'persons_covered', label: 'Persons Covered',     type: 'number', required: true },
      { key: 'standard',        label: 'Contents Standard',   type: 'text',   placeholder: 'e.g. IS 13945, OSHA' },
      { key: 'last_restocked',  label: 'Last Restocked Date', type: 'date',   required: true },
    ],
  },

  'ppe station': {
    icon: '🦺',
    attributes: [
      { key: 'ppe_types',        label: 'PPE Types Available', type: 'text',   placeholder: 'e.g. Gloves, Goggles, Helmet' },
      { key: 'persons_capacity', label: 'Capacity (persons)',  type: 'number' },
      { key: 'condition',        label: 'Station Condition',   type: 'select', required: true, options: COND },
    ],
  },

  'fire door': {
    icon: '🚪',
    attributes: [
      { key: 'fire_rating_min',  label: 'Fire Rating (min)',       type: 'select', required: true,
        options: ['30', '60', '90', '120'] },
      { key: 'door_material',    label: 'Door Material',           type: 'select',
        options: ['Timber', 'Steel', 'Glass', 'Composite'] },
      { key: 'door_width_mm',    label: 'Door Width (mm)',         type: 'number' },
      { key: 'self_closing',     label: 'Self-Closing Mechanism',  type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'intumescent_seal', label: 'Intumescent Seal',        type: 'select', options: ['Yes', 'No'] },
      { key: 'condition',        label: 'Door Condition',          type: 'select', required: true, options: COND },
    ],
  },

  'emergency door': {
    icon: '🚪',
    attributes: [
      { key: 'door_width_mm', label: 'Door Width (mm)',     type: 'number', required: true },
      { key: 'panic_bar',     label: 'Panic Bar',           type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'self_closing',  label: 'Self-Closing',        type: 'select', options: ['Yes', 'No'] },
      { key: 'condition',     label: 'Door Condition',      type: 'select', required: true, options: COND },
    ],
  },

  'emergency exit': {
    icon: '🚨',
    attributes: [
      { key: 'exit_width_mm', label: 'Exit Width (mm)',     type: 'number', required: true },
      { key: 'panic_bar',     label: 'Panic Bar Installed', type: 'select', options: ['Yes', 'No'] },
      { key: 'sign_type',     label: 'Sign Type',           type: 'select',
        options: ['Photoluminescent', 'LED Backlit', 'Painted'] },
      { key: 'lux_level',     label: 'Illumination (lux)', type: 'number' },
      { key: 'condition',     label: 'Exit Condition',      type: 'select', required: true, options: COND },
    ],
  },

  'emergency lighting': {
    icon: '💡',
    attributes: [
      { key: 'lux_output',         label: 'Lux Output',            type: 'number', required: true },
      { key: 'battery_backup_hrs', label: 'Battery Backup (hrs)',  type: 'number', required: true },
      { key: 'coverage_sqft',      label: 'Coverage Area (sq ft)', type: 'number' },
      { key: 'self_test',          label: 'Auto Self-Test',        type: 'select', options: ['Yes', 'No'] },
      { key: 'condition',          label: 'Fixture Condition',     type: 'select', required: true, options: COND },
    ],
  },

  'muster point': {
    icon: '📍',
    attributes: [
      { key: 'capacity_persons',  label: 'Capacity (persons)',  type: 'number', required: true },
      { key: 'area_sqft',         label: 'Area (sq ft)',        type: 'number' },
      { key: 'signage_installed', label: 'Signage Installed',   type: 'select', required: true, options: ['Yes', 'No'] },
      { key: 'surface_type',      label: 'Surface Type',        type: 'select',
        options: ['Open Ground', 'Parking', 'Terrace', 'Indoor'] },
    ],
  },

  'pa siren': {
    icon: '📢',
    attributes: [
      { key: 'decibel_rating',     label: 'Decibel Rating (dB)',   type: 'number', required: true },
      { key: 'coverage_radius_m',  label: 'Coverage Radius (m)',   type: 'number', required: true },
      { key: 'battery_backup_hrs', label: 'Battery Backup (hrs)',  type: 'number' },
      { key: 'tone_count',         label: 'Number of Tones',       type: 'number' },
      { key: 'condition',          label: 'Unit Condition',        type: 'select', required: true, options: COND },
    ],
  },

  'spill kit': {
    icon: '🧰',
    attributes: [
      { key: 'absorbent_type',    label: 'Absorbent Type',       type: 'select', required: true,
        options: ['Universal', 'Oil-Only', 'Chemical', 'Hazchem'] },
      { key: 'volume_capacity_l', label: 'Volume Capacity (L)',  type: 'number', required: true },
      { key: 'hazmat_class',      label: 'Hazmat Class Covered', type: 'text',   placeholder: 'e.g. Class 3, Class 8' },
      { key: 'last_restocked',    label: 'Last Restocked',       type: 'date' },
    ],
  },

  'scba': {
    icon: '😷',
    attributes: [
      { key: 'cylinder_capacity_l',  label: 'Cylinder Capacity (L)',   type: 'number', required: true },
      { key: 'working_pressure_bar', label: 'Working Pressure (bar)',  type: 'number', required: true },
      { key: 'air_duration_min',     label: 'Air Duration (min)',      type: 'number', required: true },
      { key: 'face_mask_type',       label: 'Face Mask Type',          type: 'select', options: ['Full Face', 'Half Face'] },
      { key: 'condition',            label: 'Unit Condition',          type: 'select', required: true, options: COND },
    ],
  },

  'sand bucket': {
    icon: '🪣',
    attributes: [
      { key: 'capacity_l',    label: 'Capacity (litres)',   type: 'number', required: true },
      { key: 'fill_level',    label: 'Current Fill Level',  type: 'select', required: true,
        options: ['Full', '3/4 Full', 'Half', 'Low', 'Empty'] },
      { key: 'last_refilled', label: 'Last Refilled',       type: 'date' },
    ],
  },

  'fire blanket': {
    icon: '🛡️',
    attributes: [
      { key: 'size',      label: 'Blanket Size', type: 'select', required: true,
        options: ['1.0m x 1.0m', '1.2m x 1.2m', '1.8m x 1.2m', '1.8m x 1.8m'] },
      { key: 'material',  label: 'Material',     type: 'select',
        options: ['Fibreglass', 'Wool', 'Carbon Fibre'] },
      { key: 'condition', label: 'Condition',    type: 'select', required: true, options: COND },
    ],
  },

  'suppression system': {
    icon: '💧',
    attributes: [
      { key: 'system_type',         label: 'System Type',           type: 'select', required: true,
        options: ['Wet Pipe', 'Dry Pipe', 'Deluge', 'Pre-action', 'FM-200', 'CO2', 'NOVEC 1230'] },
      { key: 'coverage_sqft',       label: 'Coverage Area (sq ft)', type: 'number', required: true },
      { key: 'design_pressure_bar', label: 'Design Pressure (bar)', type: 'number' },
      { key: 'agent_quantity',      label: 'Agent Quantity',        type: 'text',   placeholder: 'e.g. 120 kg' },
      { key: 'last_test_date',      label: 'Last Test Date',        type: 'date' },
    ],
  },

  'sprinkler': {
    icon: '🌊',
    attributes: [
      { key: 'head_type',         label: 'Head Type',              type: 'select', required: true,
        options: ['Pendant', 'Upright', 'Sidewall', 'Concealed'] },
      { key: 'activation_temp_c', label: 'Activation Temp (°C)',  type: 'number', required: true },
      { key: 'k_factor',          label: 'K-Factor',              type: 'text',   placeholder: 'e.g. K80, K115' },
      { key: 'coverage_sqft',     label: 'Coverage Area (sq ft)', type: 'number' },
      { key: 'condition',         label: 'Head Condition',        type: 'select', required: true, options: COND },
    ],
  },

  'drum hose': {
    icon: '🥁',
    attributes: [
      { key: 'hose_length_m',   label: 'Hose Length (m)',  type: 'number', required: true },
      { key: 'drum_capacity_l', label: 'Drum Capacity (L)', type: 'number' },
      { key: 'nozzle_type',     label: 'Nozzle Type',       type: 'select', options: ['Jet', 'Spray', 'Combination'] },
      { key: 'condition',       label: 'Hose Condition',    type: 'select', required: true, options: COND },
    ],
  },

  'fire trolley': {
    icon: '🛒',
    attributes: [
      { key: 'trolley_type',    label: 'Trolley Type',       type: 'select', required: true,
        options: ['CO2', 'DCP', 'Foam', 'Water Mist'] },
      { key: 'capacity_kg',     label: 'Capacity (kg)',      type: 'number', required: true },
      { key: 'wheel_condition', label: 'Wheel Condition',    type: 'select', required: true, options: COND },
      { key: 'condition',       label: 'Overall Condition',  type: 'select', required: true, options: COND },
    ],
  },

  'fire brigade': {
    icon: '🚒',
    attributes: [
      { key: 'vehicle_reg',      label: 'Vehicle Registration', type: 'text',   required: true },
      { key: 'vehicle_type',     label: 'Vehicle Type',         type: 'select', required: true,
        options: ['Water Tender', 'Foam Tender', 'Aerial Platform', 'Rescue'] },
      { key: 'crew_count',       label: 'Crew Count',           type: 'number', required: true },
      { key: 'water_capacity_l', label: 'Water Capacity (L)',   type: 'number' },
    ],
  },

  'emergency communication': {
    icon: '📞',
    attributes: [
      { key: 'comm_type',          label: 'Communication Type',  type: 'select', required: true,
        options: ['Intercom', 'Telephone', 'Radio', 'PA System'] },
      { key: 'coverage_area',      label: 'Coverage Area',       type: 'text' },
      { key: 'battery_backup_hrs', label: 'Battery Backup (hrs)', type: 'number' },
      { key: 'condition',          label: 'Unit Condition',      type: 'select', required: true, options: COND },
    ],
  },

  'safety signage': {
    icon: '⚠️',
    attributes: [
      { key: 'sign_type',   label: 'Sign Type',      type: 'select', required: true,
        options: ['Fire Exit', 'No Smoking', 'Hazard', 'First Aid', 'PPE Required', 'Emergency'] },
      { key: 'material',    label: 'Material',       type: 'select',
        options: ['Vinyl', 'Aluminium', 'Acrylic', 'Photoluminescent'] },
      { key: 'illuminated', label: 'Illuminated',    type: 'select', options: ['Yes', 'No'] },
      { key: 'condition',   label: 'Sign Condition', type: 'select', required: true, options: COND },
    ],
  },

  'ambulance': {
    icon: '🚑',
    attributes: [
      { key: 'vehicle_reg',    label: 'Vehicle Registration', type: 'text',   required: true },
      { key: 'ambulance_type', label: 'Ambulance Type',       type: 'select', required: true,
        options: ['Basic Life Support', 'Advanced Life Support', 'Patient Transport'] },
      { key: 'crew_count',     label: 'Crew Count',           type: 'number' },
      { key: 'aed_installed',  label: 'AED Installed',        type: 'select', options: ['Yes', 'No'] },
    ],
  },

  'fire noc': {
    icon: '📄',
    attributes: [
      { key: 'certificate_no',    label: 'Certificate Number', type: 'text',  required: true },
      { key: 'issuing_authority', label: 'Issuing Authority',  type: 'text',  required: true, placeholder: 'e.g. GHMC, Fire Dept' },
      { key: 'valid_from',        label: 'Valid From',         type: 'date',  required: true },
      { key: 'valid_till',        label: 'Valid Till',         type: 'date',  required: true },
    ],
  },

  'wind sock': {
    icon: '🎏',
    attributes: [
      { key: 'pole_height_m', label: 'Pole Height (m)',   type: 'number', required: true },
      { key: 'sock_length_m', label: 'Sock Length (m)',   type: 'number' },
      { key: 'material',      label: 'Sock Material',     type: 'select', options: ['Nylon', 'Polyester', 'Canvas'] },
      { key: 'condition',     label: 'Overall Condition', type: 'select', required: true, options: COND },
    ],
  },
};

// ── Generic fallback for unmapped module names ─────────────────────────────────
export const GENERIC_EQUIPMENT_SCHEMA = {
  icon: '⚙️',
  attributes: [
    { key: 'condition', label: 'Overall Condition', type: 'select', required: true, options: COND },
    { key: 'notes',     label: 'Notes',             type: 'text' },
  ],
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Returns the attribute schema for a given module name.
 * Falls back to GENERIC_EQUIPMENT_SCHEMA for unmapped types.
 */
export const getEquipmentSchema = (moduleName = '') =>
  EQUIPMENT_ATTRIBUTE_SCHEMAS[moduleName.toLowerCase().trim()] || GENERIC_EQUIPMENT_SCHEMA;

/**
 * Returns the common fields for a specific wizard step.
 */
export const getFieldsForStep = (stepNumber) =>
  COMMON_SECTIONS.filter(s => s.step === stepNumber).flatMap(s => s.fields);

/**
 * Returns the section config object for a section id.
 */
export const getSection = (sectionId) =>
  COMMON_SECTIONS.find(s => s.id === sectionId);
