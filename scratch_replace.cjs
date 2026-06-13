const fs=require('fs');
const file='c:/Jahnavi Data/Fire_Extinguisher/src/components/Dashboard/AutoScheduler.jsx';
let text=fs.readFileSync(file,'utf8');
text=text.replace(/'Pending'/g, "'Not Started'");
text=text.replace(/"Pending"/g, '"Not Started"');
text=text.replace(/>Pending</g, '>Not Started<');
fs.writeFileSync(file, text);
console.log('done');
