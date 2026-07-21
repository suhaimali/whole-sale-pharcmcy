const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend/src/components');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  // Replace }$ (JSX closing brace followed by $)
  if (content.match(/\}\$/)) {
    content = content.replace(/\}\$/g, '}₹');
    modified = true;
  }
  
  // Replace {`...$`...} - wait, in string interpolation it would be ${
  // Wait, in Sales.jsx line 601: `>${p.price.toFixed(2)}` (might have been replaced)
  // Let's just do a blanket check for \$ followed by {
  // Wait, I already did >${ and -${ and +${

  if (content.match(/ \$/)) {
    // Only replace if it's " $" followed by `{` or digit
    content = content.replace(/ \$(?=\d|\{)/g, ' ₹');
    modified = true;
  }
  
  if (content.match(/\(\$/)) {
    content = content.replace(/\(\$/g, '(₹');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Modified', file);
  }
});
