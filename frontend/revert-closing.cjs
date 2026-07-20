const fs = require('fs');
const files = ['Purchases.jsx', 'Sales.jsx', 'Expenses.jsx', 'CashBook.jsx', 'Users.jsx', 'Reports.jsx', 'Inventory.jsx'];
files.forEach(file => {
  const path = 'd:/whole sale pharcmcy/frontend/src/components/' + file;
  let content = fs.readFileSync(path, 'utf8');
  
  // Revert the extra closing div added by fix-closing.cjs
  const regex = /<\/div>\s*<\/div>\s*<\/div>\s*(\)\})/g;
  content = content.replace(regex, '</div>\n        </div>\n      $1');
  
  fs.writeFileSync(path, content);
});
console.log("Done");
