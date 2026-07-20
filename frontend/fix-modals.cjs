const fs = require('fs');
const files = ['Purchases.jsx', 'Sales.jsx', 'Expenses.jsx', 'CashBook.jsx', 'Users.jsx', 'Reports.jsx'];
files.forEach(file => {
  const path = 'd:/whole sale pharcmcy/frontend/src/components/' + file;
  let content = fs.readFileSync(path, 'utf8');
  
  // Replace the exact modal wrapper
  const regex = /<div className="fixed inset-0 z-50 flex items-center justify-center bg-black\/60 backdrop-blur-sm p-4( no-print)?"( onClick=\{.*?\})?>\s*<div (id=".*?" )?className="([\s\S]*?)">/g;
  
  content = content.replace(regex, (match, p1, p2, p3, p4) => {
    // p1 = " no-print" or undefined
    // p2 = " onClick=..." or undefined
    // p3 = 'id="..." ' or undefined
    // p4 = inner div classes
    
    // Remove max-h-[90vh] and overflow-y-auto from inner classes
    let newInnerClasses = p4.replace(/overflow-y-auto/g, '').replace(/max-h-\[90vh\]/g, '').replace(/\s+/g, ' ').trim();
    
    // Ensure relative is there
    if (!newInnerClasses.includes('relative')) {
      newInnerClasses = 'relative ' + newInnerClasses;
    }
    // Ensure shadow-2xl is there for consistent depth
    if (!newInnerClasses.includes('shadow-')) {
      newInnerClasses = newInnerClasses + ' shadow-2xl';
    }
    
    const clickHandler = p2 ? p2 : '';
    const noPrint = p1 ? p1 : '';
    const idAttr = p3 ? p3 : '';
    
    return `<div className="fixed inset-0 z-50 overflow-y-auto${noPrint}">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"${clickHandler}></div>
            <div ${idAttr}className="${newInnerClasses}">`;
  });
  
  fs.writeFileSync(path, content);
});
console.log("Done");
