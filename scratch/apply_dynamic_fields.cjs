const fs = require('fs');
const path = require('path');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx'));

const appendBlock = `
          {/* Dynamic Specifications */}
          {Array.isArray(u.field_definitions) && u.field_definitions.length > 0 && (
          <div className="fe-detail-card fe-full">
            <div className="fe-section-title">📋 Specifications (Dynamic)</div>
            <div className="fe-identity-grid">
              {u.field_definitions.sort((a, b) => a.sort_order - b.sort_order).map(f => (
                <div key={f.field_key} className="fe-field">
                  <div className="fe-field-label">{f.field_label}</div>
                  <div className="fe-field-value">{u.details?.[f.field_key] ?? u[f.field_key] ?? '—'}</div>
                </div>
              ))}
            </div>
          </div>
          )}
`;

let count = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let changed = false;

  // Fix getEquipmentById to getEquipmentBySosCode if exists
  if (content.includes('ApiService.getEquipmentById(')) {
    content = content.replace(/ApiService\.getEquipmentById\(/g, 'ApiService.getEquipmentBySosCode(');
    changed = true;
  }

  // Ensure dynamic block is injected
  if (!content.includes('u.field_definitions.sort')) {
     const target = '<div className="fe-detail-grid">';
     if (content.includes(target)) {
        content = content.replace(target, target + appendBlock);
        changed = true;
     }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log('Updated ' + file);
  }
});

console.log('Total files updated: ' + count);
