const fs = require('fs');
const path = require('path');

const dir = 'c:\\\\Jahnavi Data\\\\Fire_Extinguisher\\\\src\\\\components\\\\Dashboard';
const files = fs.readdirSync(dir).filter(f => f.endsWith('Stats.jsx') && f !== 'FireExtinguisherStats.jsx');

let modifiedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Search for the fe-header closing and the tab switcher block
  const searchPattern = /<div className="fe-header-search">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*(?:{\/\*\s*Tab Switcher\s*\*\/\}\s*)?<div className="fe-tab-switcher"[\s\S]*?<\/div>\s*<div className="fe-tab-content">\s*{activeTab === 'analytics' \? \(\s*<>/;
  
  const match = content.match(searchPattern);
  if (match) {
    const originalChunk = match[0];
    
    // Extract everything up to the final </div></div> of the fe-header
    const searchBlockMatch = originalChunk.match(/<div className="fe-header-search">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/);
    if (!searchBlockMatch) continue;
    
    // Remove the last </div> from searchBlockMatch to insert the button inside fe-header
    let headerContent = searchBlockMatch[0].replace(/\s*<\/div>$/, '');
    
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
        </div>

        {activeTab === 'analytics' ? (
          <>`;
    
    const newChunk = headerContent + buttonHtml;
    content = content.replace(searchPattern, newChunk);
    
    // Remove the closing </div> of fe-tab-content at the very bottom
    // We are looking for:
    //             )}
    //           </div>
    //         )}
    //       </div>
    //     );
    //   }
    // We just want to remove the `<div className="fe-tab-content">` closing tag which is the second to last `</div>` before `);`.
    content = content.replace(/(\s*)\}\s*<\/div>\s*<\/div>\s*\);\s*\}/, '$1}\n      </div>\n    );\n  }');
    
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
  } else {
    console.log('No match in', file);
  }
}
console.log('Modified', modifiedCount, 'files.');
