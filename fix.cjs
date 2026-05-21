const fs = require('fs');

const dir = 'c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard/';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx'));

for (const file of files) {
  const p = dir + file;
  let content = fs.readFileSync(p, 'utf8');
  
  // 1. Remove Upcoming from KPI_CARDS
  content = content.replace(/\n\s*\{\s*type:\s*'upcoming'[^}]+\},/g, '');
  
  // 2. Modify Active to include upcoming and remove Upcoming from data arrays
  content = content.replace(/val:\s*summary\.active\b/g, 'val: summary.active + (summary.upcoming || 0)');
  content = content.replace(/\n\s*\{\s*(?:name|label):\s*'[^']*Upcoming[^']*',\s*val:\s*summary\.upcoming[^}]+\},/g, '');
  content = content.replace(/\n\s*\{\s*color:\s*'#FF9800'\s*\},\s*\/\/\s*Upcoming/g, '');
  
  // 3. Fix Readiness Score Math
  content = content.replace(/\(summary\.active \* 100\)/g, '((summary.active + (summary.upcoming || 0)) * 100)');
  content = content.replace(/\+ \(\(summary\.upcoming \|\| 0\) \* 90\)/g, '');
  content = content.replace(/\+ \(summary\.upcoming \* 90\)/g, '');
  
  // 4. Fix title string
  content = content.replace(/\+ \(Upcoming \* 90\) /g, '');
  
  // 5. Remove Propose Update button
  content = content.replace(/<button[^>]*>\s*(?:<[^>]+>\s*)?(?:📝\s*)?Propose Update\s*<\/button>/g, '');
  
  // 6. Remove Start Inspection button
  content = content.replace(/<button[^>]*className="fe-inspect-btn"[^>]*>[\s\S]*?<\/button>/g, '');
  content = content.replace(/<button[^>]*>\s*(?:<[^>]+>\s*)?(?:📋\s*)?Start Inspection\s*<\/button>/g, '');
  
  // 7. Remove Icons from Stat Cards (The user's latest request)
  content = content.replace(/\n\s*<span className="fe-kpi-emoji">\{card\.icon\}<\/span>/g, '');
  
  fs.writeFileSync(p, content, 'utf8');
}
console.log('Done!');
