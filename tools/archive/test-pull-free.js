import fs from 'node:fs';

async function testFreeExams() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  console.log('🔍 Đang tìm các bộ đề FREE của từng kỹ năng trên aptiskytich.vn...');

  const skills = ['reading', 'listening', 'writing', 'speaking'];
  const testResults = {};

  for (const sk of skills) {
    const setsRes = await fetch(`${supabaseUrl}/rest/v1/exam_sets?skill=eq.${sk}&access_tier=eq.free&select=*&limit=2`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    if (!setsRes.ok) {
      console.log(`Lỗi lấy đề free skill ${sk}: HTTP ${setsRes.status}`);
      continue;
    }

    const freeSets = await setsRes.json();
    console.log(`\n======================================================`);
    console.log(`📚 KỸ NĂNG: ${sk.toUpperCase()} (Tìm thấy ${freeSets.length} đề free mẫu)`);

    for (const exam of freeSets) {
      console.log(`👉 Đề: "${exam.title}" | Part: "${exam.part}" | ID: ${exam.id}`);

      // Lấy câu hỏi
      const qRes = await fetch(`${supabaseUrl}/rest/v1/exam_questions?exam_set_id=eq.${exam.id}&order=order_index.asc`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`
        }
      });

      if (qRes.ok) {
        const questions = await qRes.json();
        console.log(`   ✅ KÉO THÀNH CÔNG ${questions.length} CÂU HỎI!`);
        if (questions.length > 0) {
          const sampleQ = questions[0];
          console.log(`   - Cấu trúc 1 câu hỏi mẫu:`);
          console.log(`     + Question text:`, sampleQ.question_text?.substring(0, 100) || sampleQ.prompt || '(Trống)');
          console.log(`     + Options:`, sampleQ.options);
          console.log(`     + Correct answer:`, sampleQ.correct_answer);
          console.log(`     + Audio URL:`, sampleQ.audio_url || sampleQ.extra_data?.audio_url || 'Không có');
          console.log(`     + Image URL:`, sampleQ.image_url || sampleQ.extra_data?.image_url || 'Không có');
          console.log(`     + Passage text:`, sampleQ.passage_text?.substring(0, 100) || 'Không có');
          console.log(`     + Explanation:`, sampleQ.explanation?.substring(0, 100) || 'Không có');

          testResults[sk] = {
            exam,
            totalQuestions: questions.length,
            sampleQuestion: sampleQ
          };
          fs.writeFileSync(`tools/data-pulled-${sk}-free.json`, JSON.stringify({ exam, questions }, null, 2));
        }
      } else {
        console.log(`   ❌ Lỗi lấy câu hỏi: HTTP ${qRes.status}`);
      }
    }
  }

  fs.writeFileSync('tools/test-pull-summary.json', JSON.stringify(testResults, null, 2));
  console.log('\n🎉 Hoàn thành test kéo thử dữ liệu!');
}

testFreeExams().catch(console.error);
