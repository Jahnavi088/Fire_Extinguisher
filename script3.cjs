const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\Jahnavi Data\\\\Fire_Extinguisher\\\\src\\\\components\\\\Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx'));

let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('<span className="fe-search-icon">🔍</span>')) {
    content = content.replace(/<span className="fe-search-icon">🔍<\/span>\s*/g, '');
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  }
}
console.log('Removed search icon from', modifiedCount, 'files.');
