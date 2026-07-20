const fs = require('fs');
const content = fs.readFileSync('d:/whole sale pharcmcy/frontend/fix-rbrace.cjs', 'utf8');
console.log(JSON.stringify(content));
