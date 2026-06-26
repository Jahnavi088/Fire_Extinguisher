const fs = require('fs');
const path = require('path');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx'));

let count = 0;
files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Add detailSource state
  if (!content.includes('setDetailSource')) {
    content = content.replace(
      /const \[selectedUnit, setSelectedUnit\] = useState\(null\);/,
      "const [selectedUnit, setSelectedUnit] = useState(null);\n  const [detailSource, setDetailSource] = useState('list');"
    );
    changed = true;
  }

  // 2. Update openDetail signature and logic
  if (content.includes('const openDetail = async (item) => {') && !content.includes('setDetailSource(source)')) {
    content = content.replace(
      'const openDetail = async (item) => {',
      "const openDetail = async (item, source = 'list') => {\n    setDetailSource(source);"
    );
    changed = true;
  }
  
  if (content.includes('const openDetail = (item) => {') && !content.includes('setDetailSource(source)')) {
    content = content.replace(
      'const openDetail = (item) => {',
      "const openDetail = (item, source = 'list') => {\n    setDetailSource(source);"
    );
    changed = true;
  }

  // 3. Update goBack
  if (content.includes("if (view === 'detail') setView('list');")) {
    content = content.replace(
      "if (view === 'detail') setView('list');",
      "if (view === 'detail') setView(detailSource);"
    );
    changed = true;
  }

  // 4. Update alert click
  if (content.includes("onClick={() => openDetail(a)}")) {
    content = content.replace(
      /onClick=\{\(\) => openDetail\(a\)\}/g,
      "onClick={() => openDetail(a, 'overview')}"
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    count++;
    console.log(`Updated ${file}`);
  }
});
console.log('Total files updated: ' + count);
