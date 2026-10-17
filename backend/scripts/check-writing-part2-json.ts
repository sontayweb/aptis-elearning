import fs from 'fs';

const raw = fs.readFileSync('d:/sontayweb/aptis-elearning/tools/data/aptiskytich/all_exam_questions.json', 'utf8');
const data = JSON.parse(raw);

const writingPart2 = data.filter((q: any) =>
  q.question_type === 'writing' &&
  (JSON.stringify(q).toLowerCase().includes('part 2') ||
   JSON.stringify(q).toLowerCase().includes('fill in the form') ||
   JSON.stringify(q).toLowerCase().includes('20-30 words'))
);

console.log('Writing Part 2 items count:', writingPart2.length);
if (writingPart2.length > 0) {
  for (let i = 0; i < Math.min(5, writingPart2.length); i++) {
    console.log(`\nItem ${i + 1}:`);
    console.log('question_text:', writingPart2[i].question_text);
    console.log('explanation:', writingPart2[i].explanation);
    console.log('extra_data:', JSON.stringify(writingPart2[i].extra_data, null, 2));
  }
}
