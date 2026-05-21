const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/User/Desktop/Fire_Extinguisher/src/components/Dashboard';
const files = fs.readdirSync(dir);

const newTooltip = "Health Calculation: [(Active * 100) + (Upcoming * 90) + (Due * 60) + (Service * 30)] / Total";

files.forEach(file => {
  if (file.endsWith('Stats.jsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Update Tooltip
    const oldTooltipRegex = /title="Health Calculation: \(\(Total.*?\)"/;
    if (oldTooltipRegex.test(content)) {
      console.log(`Updating tooltip in ${file}...`);
      content = content.replace(oldTooltipRegex, `title="${newTooltip}"`);
    }

    // Update Fallback Calculation if exists (some files might have local calcs)
    // Most files seem to rely on summary?.readiness_score, but let's be safe.
    
    fs.writeFileSync(filePath, content);
  }
});
