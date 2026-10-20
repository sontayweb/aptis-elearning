const fs = require('fs');
const path = require('path');

const p3 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_p3.json'), 'utf8'));

let currentTopic = null;
const topics = [];

for (let i = 0; i < p3.length; i++) {
  const item = p3[i];
  if (item.img) {
    if (currentTopic) topics.push(currentTopic);
    currentTopic = {
      img: item.img,
      texts: []
    };
  } else if (item.text) {
    if (currentTopic) {
      currentTopic.texts.push(item.text);
    }
  }
}
if (currentTopic) topics.push(currentTopic);

console.log('Total topics in P3 docx:', topics.length);
topics.forEach((t, idx) => {
  console.log(`\n--- P3 TOPIC #${idx + 1} (Image: ${t.img}) ---`);
  t.texts.forEach((txt, tIdx) => {
    console.log(`   [${tIdx}] ${txt}`);
  });
});
