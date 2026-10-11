import fs from 'node:fs';
import path from 'node:path';

const kytichDir = path.resolve(__dirname, '../../tools/data/aptiskytich');
const catalog = JSON.parse(fs.readFileSync(path.join(kytichDir, 'exam_sets_catalog.json'), 'utf-8'));
const allQuestions = JSON.parse(fs.readFileSync(path.join(kytichDir, 'all_exam_questions.json'), 'utf-8'));

// Tìm Đề 03 Part 4
const de03Part4 = catalog.find((c: any) => c.title?.includes('Đề 03') && c.part?.includes('Part 4'));
console.log('Đề 03 Part 4 catalog:', de03Part4);

if (de03Part4) {
  const qs = allQuestions.filter((q: any) => q.exam_set_id === de03Part4.id);
  console.log(`Số câu hỏi trong Đề 03 Part 4: ${qs.length}`);
  for (const q of qs) {
    console.log('\n--- Question ---');
    console.log(JSON.stringify(q, null, 2));
  }
}
