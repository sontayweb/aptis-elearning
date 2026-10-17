const fs = require('fs');

const raw = fs.readFileSync('d:/sontayweb/aptis-elearning/tools/data/aptiskytich/all_exam_questions.json', 'utf8');
const data = JSON.parse(raw);
const p2Items = data.filter(x => x.part_title && x.part_title.includes('Part 2'));
console.log('Total Part 2 items in all_exam_questions.json:', p2Items.length);
for (let i = 0; i < 5; i++) {
  const item = p2Items[i];
  console.log('--- Item', i, '---');
  console.log('exam_title:', item.exam_title);
  console.log('part_title:', item.part_title);
  console.log('question_text:', item.question_text);
  console.log('extra_data:', JSON.stringify(item.extra_data, null, 2));
}
