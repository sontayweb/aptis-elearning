const fs = require('fs');
const data = JSON.parse(fs.readFileSync('temp_exam_questions.json', 'utf8'));

const summary = [];

for (const [id, item] of Object.entries(data)) {
  const q = item.questions[0];
  summary.push({
    setId: id,
    examTitle: item.meta?.title,
    skill: item.meta?.skill,
    part: item.meta?.part,
    qId: q?.id,
    questionType: q?.question_type,
    questionTextSample: q?.question_text ? q.question_text.slice(0, 150) + '...' : null,
    optionsType: Array.isArray(q?.options) ? `Array (${q.options.length} items)` : typeof q?.options,
    optionsSample: Array.isArray(q?.options) ? q.options.slice(0, 4) : q?.options,
    correctAnswer: q?.correct_answer,
    extraDataKeys: q?.extra_data ? Object.keys(q.extra_data) : null,
    extraData: q?.extra_data
  });
}

fs.writeFileSync('scripts/summary_analysis.json', JSON.stringify(summary, null, 2));
console.log('Summary saved to scripts/summary_analysis.json');
