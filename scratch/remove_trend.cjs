const fs = require('fs');

function removeLines(file, ranges) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  const outLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    let shouldRemove = false;
    for (const [start, end] of ranges) {
      if (lineNum >= start && lineNum <= end) {
        shouldRemove = true;
        break;
      }
    }
    if (!shouldRemove) {
      outLines.push(lines[i]);
    }
  }
  
  fs.writeFileSync(file, outLines.join('\n'), 'utf8');
  console.log(`Updated ${file}`);
}

// SupervisorOverview.jsx
removeLines('c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard/SupervisorOverview.jsx', [
  [50, 51], // trendPeriod, trendDropOpen
  [84, 116], // complianceTrend
  [276, 312] // Trend Row
]);

// InspectorOverview.jsx
removeLines('c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard/InspectorOverview.jsx', [
  [49, 50], // trendPeriod, trendDropOpen
  [70, 102], // complianceTrend
  [433, 469] // Trend Row
]);
