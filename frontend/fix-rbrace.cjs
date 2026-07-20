const fs = require('fs');
const files = ['Inventory.jsx', 'Purchases.jsx', 'Sales.jsx', 'CashBook.jsx', 'Reports.jsx', 'Expenses.jsx', 'Users.jsx'];
files.forEach(file => {
  const path = 'd:/whole sale pharcmcy/frontend/src/components/' + file;
  let content = fs.readFileSync(path, 'utf8');
  content = content.replace(/&rbrace;/g, '}');
  fs.writeFileSync(path, content);
});
console.log("Done");
