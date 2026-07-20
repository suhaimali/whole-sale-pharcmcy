const fs = require('fs');
const path = require('path');

const filesToRefactor = [
  'Sales.jsx',
  'Inventory.jsx',
  'Purchases.jsx',
  'Reports.jsx',
  'Expenses.jsx',
  'CashBook.jsx',
  'Overview.jsx',
  'Users.jsx'
];

filesToRefactor.forEach(fileName => {
  const filePath = path.join(__dirname, 'src', 'components', fileName);
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // Strip out Vapor stuff (we already know we removed isVapor from Dashboard)
  // But wait, the components still have `isVapor` logic passing around.
  // The user said: "Remove duplicate styles and refactor into reusable components and a centralized design system. Use a white/light-gray theme... Remove legacy Vapor dark mode styles."
  
  // So we can aggressively regex out isVapor ternary operators if possible, but it's safer to just replace standard component patterns.

  // 1. Modals
  content = content.replace(
    /<div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8(?: no-print)?">\s*<div className="fixed inset-0 bg-black\/60 backdrop-blur-sm transition-opacity"><\/div>\s*<div (id="[^"]+"\s+)?className="relative w-full ([a-zA-Z0-9-\s]+) max-h-\[90vh\] overflow-y-auto ([^"]+)">/g,
    `<div className="modal-overlay">\n          <div className="modal-backdrop"></div>\n          <div $1className="modal-content $2">`
  );

  // Modal headers
  content = content.replace(
    /<div className="flex items-center justify-between border-b pb-3 mb-[0-9]+(?: no-print)?(?: w-full)?(?: dark:border-[^"]+)?">\s*<h3 className="text-[a-zA-Z0-9-\s]+ font-bold(?: flex items-center gap-[0-9.]+)?(?: text-[a-zA-Z0-9-]+)?">/g,
    `<div className="modal-header">\n              <h3 className="text-lg font-bold flex items-center gap-2">`
  );

  // Forms 2 column
  content = content.replace(/<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">/g, `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">`);

  // Cards
  content = content.replace(/className="bg-white rounded-2xl shadow-sm border border-gray-200([^"]*)"/g, `className="card$1"`);
  
  // Primary buttons (approximation)
  content = content.replace(/className="rounded-lg bg-pharmacy-600 hover:bg-pharmacy-500 px-[0-9]+ py-[0-9]+ font-semibold text-white shadow-sm([^"]*)"/g, `className="btn-primary$1"`);
  content = content.replace(/className="bg-pharmacy-600 hover:bg-pharmacy-700 text-white px-[0-9]+ py-[0-9]+ rounded-lg font-semibold flex items-center gap-2 transition-all([^"]*)"/g, `className="btn-primary$1"`);
  
  // Secondary buttons
  content = content.replace(/className="rounded-lg px-[0-9]+ py-[0-9]+ border font-semibold hover:bg-gray-50 text-gray-700([^"]*)"/g, `className="btn-secondary$1"`);

  // Inputs
  content = content.replace(/className="mt-1 block w-full rounded-xl border-gray-300 bg-gray-50 py-[0-9]+ px-[0-9]+ text-sm shadow-sm focus:border-pharmacy-500 focus:ring-pharmacy-500([^"]*)"/g, `className="input-field$1"`);
  
  // Tables
  content = content.replace(/className="min-w-full divide-y divide-gray-200"/g, `className="table-base"`);
  content = content.replace(/className="bg-gray-50"/g, `className="table-header"`);
  content = content.replace(/<th([^>]+)className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider([^"]*)"/g, `<th$1className="table-th$2"`);
  content = content.replace(/<td([^>]+)className="px-6 py-4 whitespace-nowrap text-sm text-gray-900([^"]*)"/g, `<td$1className="table-cell text-sm$2"`);
  content = content.replace(/<tr([^>]+)className="hover:bg-gray-50 transition-colors([^"]*)"/g, `<tr$1className="table-row$2"`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${fileName}`);
});
