const fs = require('fs');
const files = ['Inventory.jsx', 'Purchases.jsx', 'Sales.jsx', 'CashBook.jsx', 'Reports.jsx'];
files.forEach(file => {
  const path = 'd:/whole sale pharcmcy/frontend/src/components/' + file;
  let content = fs.readFileSync(path, 'utf8');
  
  // Add the missing closing div for all modals in these files
  const regex = /<\/div>\s*<\/div>\s*(\)\})/g;
  content = content.replace(regex, '</div>\n          </div>\n        </div>\n      $1');
  
  fs.writeFileSync(path, content);
});
console.log("Done adding missing divs.");
