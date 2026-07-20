const fs = require('fs');
const files = ['Purchases.jsx', 'Sales.jsx', 'Expenses.jsx', 'CashBook.jsx', 'Users.jsx', 'Reports.jsx', 'Inventory.jsx'];
files.forEach(file => {
  const path = 'd:/whole sale pharcmcy/frontend/src/components/' + file;
  let content = fs.readFileSync(path, 'utf8');
  
  // Replace missing closing div for modals
  // Match exactly: </div> \n </div> \n )}
  const regex = /<\/div>\s*<\/div>\s*(\)\})/g;
  content = content.replace(regex, '</div>\n          </div>\n        </div>\n      $1');
  
  fs.writeFileSync(path, content);
});
console.log("Done");
