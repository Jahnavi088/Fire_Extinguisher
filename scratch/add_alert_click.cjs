const fs = require('fs');
const path = require('path');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx'));

let count = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  const regex = /className="fe-alert-row"\s+style=\{\{\s*/g;
  
  if (regex.test(content) && !content.includes('onClick={() => openDetail(a)}')) {
     content = content.replace(regex, 'className="fe-alert-row" onClick={() => openDetail(a)} style={{ cursor: \'pointer\', ');
     fs.writeFileSync(filePath, content, 'utf8');
     count++;
     console.log(`Updated ${file}`);
  }
});
console.log('Total files updated: ' + count);
