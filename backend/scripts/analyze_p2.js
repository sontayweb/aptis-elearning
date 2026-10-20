const fs = require('fs');
const path = require('path');

const p2 = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../scratch_p2.json'), 'utf8'));

let currentTopic = null;
const topics = [];

for (let i = 0; i < p2.length; i++) {
  const item = p2[i];
  if (item.img) {
    if (currentTopic) topics.push(currentTopic);
    currentTopic = {
      img: item.img,
      textsBefore: [],
      textsAfter: []
    };
  } else if (item.text) {
    if (currentTopic) {
      currentTopic.textsAfter.push(item.text);
    } else {
      // before first image
    }
  }
}
if (currentTopic) topics.push(currentTopic);

console.log('Total topics found in docx:', topics.length);
topics.forEach((t, idx) => {
  console.log(`\n--- TOPIC #${idx + 1} (Image: ${t.img}) ---`);
  t.textsAfter.forEach((txt, tIdx) => {
    console.log(`   [${tIdx}] ${txt}`);
  });
});
