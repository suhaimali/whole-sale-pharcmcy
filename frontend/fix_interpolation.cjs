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
let files = walkSync('src/components');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('₹{')) {
    content = content.replace(/₹\{/g, '${');
    fs.writeFileSync(f, content, 'utf8');
    console.log('Fixed', f);
  }
});
