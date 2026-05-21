const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\Jahnavi Data\\\\Fire_Extinguisher\\\\src\\\\components\\\\Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx') && f !== 'FireExtinguisherStats.jsx');

let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the fe-header-search block and the fe-tab-switcher block.
  // We want to capture:
  // 1. Everything up to the end of the fe-header-search's closing div.
  // 2. The closing div of fe-header (which we will replace).
  // 3. The fe-tab-switcher (which we will remove).
  
  // The structure is roughly:
  // <div className="fe-header-search">
  //   <div className="fe-search-box">
  //     ...
  //   </div>
  // </div>
  // </div>  <-- closing of fe-header
  // 
  // {/* Tab Switcher */}
  // <div className="fe-tab-switcher" ...> ... </div>
  
  const searchPattern = /(<div className="fe-header-search">[\s\S]*?<\/div>\s*<\/div>)\s*<\/div>\s*(?:{\/\*\s*Tab Switcher\s*\*\/\}\s*)?<div className="fe-tab-switcher"[\s\S]*?<\/button>\s*<\/div>/;
  
  const match = content.match(searchPattern);
  
  if (match) {
    const beforeClosingHeader = match[1];
    
    const buttonHtml = `
          <button
            className={\`fe-tab-btn \${activeTab === 'history' ? 'active' : ''}\`}
            onClick={() => setActiveTab(activeTab === 'history' ? 'analytics' : 'history')}
            style={{ 
              background: activeTab === 'history' ? 'var(--blue)' : 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              boxShadow: activeTab === 'history' ? '0 4px 15px rgba(0,0,0,0.2)' : 'none',
              marginLeft: '8px'
            }}
          >
            <span className="fe-tab-icon">📜</span>
            Audit Trail
            {inspectionHistory.length > 0 && <span className="fe-tab-badge">{inspectionHistory.length}</span>}
          </button>
        </div>`;
    
    const newChunk = beforeClosingHeader + buttonHtml;
    content = content.replace(searchPattern, newChunk);
    
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  } else {
    console.log('No match in', file);
  }
}
console.log('Modified', modifiedCount, 'files.');
