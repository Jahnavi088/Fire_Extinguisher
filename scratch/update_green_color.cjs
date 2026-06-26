const fs = require('fs');
const path = require('path');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard';

const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx'));
let count = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('#28a745')) {
    content = content.replace(/#28a745/g, '#10b981');
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log(`Updated color in ${file}`);
  }
});
console.log(`Updated color in ${count} files.`);
