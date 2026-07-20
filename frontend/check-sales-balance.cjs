const fs = require('fs');
const content = fs.readFileSync('d:/whole sale pharcmcy/frontend/src/components/Sales.jsx', 'utf8');

const stack = [];
const lines = content.split('\n');

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  for (let charIdx = 0; charIdx < line.length; charIdx++) {
    const char = line[charIdx];
    if (char === '{' || char === '(' || char === '[') {
      stack.push({ char, line: lineIdx + 1, col: charIdx + 1 });
    } else if (char === '}' || char === ')' || char === ']') {
      if (stack.length === 0) {
        console.log(`Unmatched closing character '${char}' at line ${lineIdx + 1}, col ${charIdx + 1}`);
      } else {
        const top = stack[stack.length - 1];
        if (
          (char === '}' && top.char === '{') ||
          (char === ')' && top.char === '(') ||
          (char === ']' && top.char === '[')
        ) {
          stack.pop();
        } else {
          console.log(`Mismatched closing character '${char}' at line ${lineIdx + 1}, col ${charIdx + 1} (expected match for '${top.char}' opened at line ${top.line}, col ${top.col})`);
          // Pop anyway to continue checking
          stack.pop();
        }
      }
    }
  }
}

if (stack.length > 0) {
  console.log("Unclosed opening characters left on stack:");
  stack.forEach(item => {
    console.log(`'${item.char}' opened at line ${item.line}, col ${item.col}`);
  });
} else {
  console.log("All braces, parens, and brackets are perfectly balanced!");
}
