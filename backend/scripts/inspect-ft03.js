const fs = require('fs');
const path = require('path');

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

const ft03 = fullTests.find(ft => ft.title.includes('03'));
console.log('Full Test 03:', ft03.title);
for (const sId of ft03.examSetIds) {
  const cat = catMap.get(sId);
  if (cat && cat.skill === 'writing') {
    console.log('Writing set:', cat.title, '| Part:', cat.part);
    const qs = qMap.get(sId) || [];
    for (const q of qs) {
      console.log('  Q text:', q.question_text);
      console.log('  Extra:', JSON.stringify(q.extra_data));
    }
  }
}
