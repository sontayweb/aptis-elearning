const fs = require('fs');
const data = JSON.parse(fs.readFileSync('temp_exam_questions.json', 'utf8'));

for (const [id, item] of Object.entries(data)) {
  console.log('======================================================================');
  console.log(`SET ID: ${id}`);
  console.log(`Title: ${item.meta?.title}`);
  console.log(`Skill: ${item.meta?.skill} | Part: ${item.meta?.part}`);
  console.log(`Questions Count: ${item.questions.length}`);
  
  item.questions.forEach((q, idx) => {
    console.log(`\n  --- [Q${idx + 1}] ID: ${q.id} | Order: ${q.order_index} | Type: ${q.question_type} ---`);
    console.log('  question_text:');
    console.log(q.question_text ? q.question_text.slice(0, 300) : '(empty)');
    
    console.log('\n  options:');
    console.log(typeof q.options === 'object' ? JSON.stringify(q.options, null, 2) : q.options);
    
    console.log('\n  correct_answer:');
    console.log(typeof q.correct_answer === 'object' ? JSON.stringify(q.correct_answer, null, 2) : q.correct_answer);

    console.log('\n  extra_data:');
    console.log(typeof q.extra_data === 'object' ? JSON.stringify(q.extra_data, null, 2) : q.extra_data);
    
    console.log('\n  explanation:');
    console.log(typeof q.explanation === 'object' ? JSON.stringify(q.explanation, null, 2) : q.explanation);
  });
  console.log('\n');
}
