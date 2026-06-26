const fs = require('fs');
const path = require('path');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx'));

let count = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const regex = /ApiService\.getAlertsSummary\(\),[\s\n]*ApiService\.getAlerts\(\{\s*module_id:\s*([a-zA-Z0-9_]+)/;
  
  const match = content.match(regex);
  if (match) {
     const varName = match[1];
     content = content.replace(
       'ApiService.getAlertsSummary(),', 
       `ApiService.getAlertsSummary({ module_id: ${varName} }),`
     );
     fs.writeFileSync(filePath, content, 'utf8');
     count++;
     console.log(`Updated ${file} with ${varName}`);
  }
});
console.log('Total files updated: ' + count);
