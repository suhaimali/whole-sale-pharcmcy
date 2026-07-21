const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Revert all ₹{ back to ${ to fix the syntax errors
  content = content.replace(/₹\{/g, '${');

  // Now selectively apply ₹{ only where it's clearly a currency in JSX
  content = content.replace(/>\$\{/g, '>₹{');
  content = content.replace(/-\$\{/g, '-₹{');
  content = content.replace(/\+\$\{/g, '+₹{');
  content = content.replace(/\| \$\{/g, '| ₹{');
  content = content.replace(/\(\$\{/g, '(₹{');

  // Handle specific text nodes in JSX that might have spaces
  content = content.replace(/Total:\s*\$\{/g, 'Total: ₹{');
  content = content.replace(/Subtotal:\s*\$\{/g, 'Subtotal: ₹{');
  content = content.replace(/Discount:\s*\$\{/g, 'Discount: ₹{');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed syntax in', file);
});
