const fs = require('fs');
const content = fs.readFileSync('d:/whole sale pharcmcy/frontend/src/components/Sales.jsx', 'utf8');
const lines = content.split('\n');
console.log(`Line 1313 characters:`, JSON.stringify(lines[1312]));
console.log(`Line 1314 characters:`, JSON.stringify(lines[1313]));
