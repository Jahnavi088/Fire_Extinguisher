const fs = require('fs');
const path = require('path');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard';

const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('Stats.jsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    // regex to remove the `if (!data.items || data.items.length === 0) { ... }` block
    const regex = /if\s*\(\!data\.items\s*\|\|\s*data\.items\.length\s*===\s*0\)\s*\{\s*const\s*(mock|mockItems)\s*=\s*Array\.from[^]*?setListTotal\((mock|mockItems)\.length\);\s*\}/g;
    
    let newContent = content.replace(regex, '');

    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}
