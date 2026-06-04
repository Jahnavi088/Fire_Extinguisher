const fs = require('fs');

const logPath = 'C:/Users/ELT00049/.gemini/antigravity-ide/brain/c71d88a4-a794-4917-a7a3-385b374cf434/.system_generated/logs/transcript.jsonl';
const fileContent = fs.readFileSync(logPath, 'utf8');
const lines = fileContent.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  try {
    const data = JSON.parse(line);
    const str = JSON.stringify(data);
    if (str.includes('UserManagement') || str.includes('boundary') || str.includes('console.error')) {
      console.log(`--- Match at Line ${i + 1} ---`);
      console.log(str.substring(0, 3000));
    }
  } catch (e) {}
}
