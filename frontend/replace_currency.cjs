const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync('src/components');
let totalReplaced = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  let original = content;
  
  // Replace direct $ usage
  content = content.replace(/>\$/g, '>₹');
  content = content.replace(/\+\$/g, '+₹');
  content = content.replace(/-\$/g, '-₹');
  
  // Replace string patterns
  content = content.replace(/Cost Price \(\$\)/g, 'Cost Price (₹)');
  content = content.replace(/Selling Price \(\$\)/g, 'Selling Price (₹)');
  content = content.replace(/Retail Price \(\$\)/g, 'Retail Price (₹)');
  content = content.replace(/Amount \(\$\)/g, 'Amount (₹)');
  
  // For ' $123'
  content = content.replace(/ \$/g, ' ₹');
  // For '($'
  content = content.replace(/\(\$/g, '(₹');
  
  // For \`$${
  content = content.replace(/`\$\${/g, '`₹${');
  
  if (content !== original) {
    fs.writeFileSync(f, content, 'utf8');
    totalReplaced++;
    console.log('Updated', f);
  }
});
console.log('Total files updated:', totalReplaced);
