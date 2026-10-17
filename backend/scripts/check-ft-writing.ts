import fs from 'fs';
import path from 'path';

const toolsDataDir = path.resolve(__dirname, '../../tools/data/aptiskytich');
const fullTests = JSON.parse(fs.readFileSync(path.join(toolsDataDir, 'full_tests.json'), 'utf-8'));
const catalog = JSON.parse(fs.readFileSync(path.join(toolsDataDir, 'exam_sets_catalog.json'), 'utf-8'));
const allQuestions = JSON.parse(fs.readFileSync(path.join(toolsDataDir, 'all_exam_questions.json'), 'utf-8'));

const catMap = new Map();
for (const c of catalog) catMap.set(c.id, c);

const qMap = new Map();
for (const q of allQuestions) {
  if (!qMap.has(q.exam_set_id)) qMap.set(q.exam_set_id, []);
  qMap.get(q.exam_set_id).push(q);
}

// Check Full Test 03 and others with writing part 2
for (const ft of fullTests) {
  const writeSetIds = (ft.examSetIds || []).filter((id: string) => {
    const c = catMap.get(id);
    return c && c.skill === 'writing' && c.part && c.part.includes('Part 2');
  });

  for (const wId of writeSetIds) {
    const c = catMap.get(wId);
    const qs = qMap.get(wId) || [];
    console.log(`FT: ${ft.title} | Set: ${c.title}`);
    for (const q of qs) {
      console.log(`  question_text: ${q.question_text}`);
      console.log(`  extra_data:`, JSON.stringify(q.extra_data));
    }
  }
}
