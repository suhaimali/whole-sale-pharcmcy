const fs = require('fs');

const BASE = 'd:/whole sale pharcmcy/frontend/src/components/';

function updateModals(file) {
  const fullPath = BASE + file;
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;

  // We want to transform:
  // <div className="fixed inset-0 z-50 overflow-y-auto">
  //   <div className="flex min-h-full items-center justify-center p-4 sm:p-8">
  //     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={...}></div>
  //     <div className={`relative w-full max-w-2xl ...`}>
  // Into:
  // <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
  //   <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={...}></div>
  //   <div className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto ...`}>
  
  // This means we are REMOVING one outer div wrapper.
  // This ALSO means we must remove one closing </div> tag for each such modal.

  // Regex to find modal opening:
  const openRegex = /<div className="fixed inset-0 z-50 overflow-y-auto(?: no-print)?">\s*<div className="flex min-h-full items-center justify-center p-4 sm:p-8">\s*<div className="fixed inset-0 bg-black\/60 backdrop-blur-sm transition-opacity"([^>]*)><\/div>\s*<div className={`?([^`>]+)`?>/g;
  
  let match;
  let matches = [];
  while ((match = openRegex.exec(content)) !== null) {
    matches.push({
      full: match[0],
      backdropAttrs: match[1],
      innerClasses: match[2],
      index: match.index
    });
  }

  // Go backwards so indices don't shift
  for (let i = matches.length - 1; i >= 0; i--) {
    let m = matches[i];
    let newInnerClasses = m.innerClasses;
    if (!newInnerClasses.includes('max-h-[')) {
      newInnerClasses = newInnerClasses.replace('relative ', 'relative max-h-[90vh] overflow-y-auto ');
    }
    
    // Add z-50 if it's no-print
    let parentClass = m.full.includes('no-print') 
      ? 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 no-print'
      : 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8';

    let replacement = `<div className="${parentClass}">\n          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"${m.backdropAttrs}></div>\n          <div className={\`${newInnerClasses}\`}>`;

    // 1. Replace the opening
    content = content.substring(0, m.index) + replacement + content.substring(m.index + m.full.length);
    
    // 2. Find the corresponding closing sequence
    // We need to look forward from m.index for the sequence:
    //         </div>\n        </div>\n      )}
    // And replace it with:
    //       </div>\n      )}
    // Let's use a targeted search forward from the match index
    
    // Find the end of this modal by searching for </div>\n        </div>\n      )}
    // We can just use string indexOf since the code is pretty uniform
    
    let closeIndex = content.indexOf('          </div>\n        </div>\n      )}', m.index);
    if (closeIndex !== -1) {
      content = content.substring(0, closeIndex) + '        </div>\n      )}' + content.substring(closeIndex + 40);
    } else {
      console.log(`Could not find closing sequence for modal in ${file} at index ${m.index}`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed modals in ${file}`);
  }
}

const files = ['Inventory.jsx', 'Purchases.jsx', 'Sales.jsx', 'CashBook.jsx', 'Reports.jsx'];
files.forEach(f => updateModals(f));
