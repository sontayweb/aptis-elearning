const fs = require('fs');
const path = require('path');

const p2Content = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/data/speaking-part2-bank.ts'), 'utf8');
const p3Content = fs.readFileSync(path.resolve(__dirname, '../../frontend/src/data/speaking-part3-bank.ts'), 'utf8');

const p2Start = p2Content.indexOf('= [') + 2;
const p3Start = p3Content.indexOf('= [') + 2;

const p2JsonStr = p2Content.substring(p2Start, p2Content.lastIndexOf(']') + 1);
const p3JsonStr = p3Content.substring(p3Start, p3Content.lastIndexOf(']') + 1);

const p2 = JSON.parse(p2JsonStr);
const p3 = JSON.parse(p3JsonStr);

console.log('=== CHECKING PART 2 IMAGES ===');
p2.forEach(item => {
  const fullPath = path.resolve(__dirname, '../../frontend/public' + item.imageUrl);
  if (!fs.existsSync(fullPath)) {
    console.log(`[P2 #${item.topicNumber}] MISSING: ${item.imageUrl}`);
  }
});

console.log('=== CHECKING PART 3 IMAGES ===');
p3.forEach(item => {
  const fullPath = path.resolve(__dirname, '../../frontend/public' + item.imageUrl);
  if (!fs.existsSync(fullPath)) {
    console.log(`[P3 #${item.topicNumber}] MISSING: ${item.imageUrl}`);
  } else {
    const size = fs.statSync(fullPath).size;
    console.log(`[P3 #${item.topicNumber}] OK (${size} bytes) - ${item.imageUrl} - ${item.title}`);
  }
});
