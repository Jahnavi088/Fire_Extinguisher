const fs = require('fs');
const path = require('path');

const logPath = 'C:/Users/ELT00049/.gemini/antigravity-ide/brain/c71d88a4-a794-4917-a7a3-385b374cf434/.system_generated/logs/transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (const line of lines) {
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    // Look for browser console logs or error results
    if (data.type === 'BROWSER_SUBAGENT' && data.content && data.content.includes('error')) {
      console.log('--- Subagent Step Content ---');
      console.log(data.content);
    }
    if (data.tool_calls) {
      for (const tc of data.tool_calls) {
        if (tc.name === 'browser_subagent') {
          console.log('--- Subagent Args ---');
          console.log(tc.args);
        }
      }
    }
  } catch (e) {
    // ignore
  }
}
