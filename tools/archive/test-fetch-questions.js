import fs from 'node:fs';

async function testExamQuestions() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  // Lấy 1 exam_set_id từ sample-exam_sets.json
  const sampleSets = JSON.parse(fs.readFileSync('tools/sample-exam_sets.json', 'utf-8'));
  console.log(`Có ${sampleSets.length} exam_sets mẫu.`);

  for (const set of sampleSets) {
    console.log(`\n🔍 Đang query câu hỏi cho đề: "${set.title}" (${set.skill} - ${set.part}) - ID: ${set.id}...`);
    const qRes = await fetch(`${supabaseUrl}/rest/v1/exam_questions?exam_set_id=eq.${set.id}&order=order_index.asc`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });

    console.log(`HTTP Status: ${qRes.status}`);
    if (qRes.ok) {
      const questions = await qRes.json();
      console.log(`✅ Lấy thành công ${questions.length} câu hỏi!`);
      if (questions.length > 0) {
        console.log(`Chi tiết câu hỏi 1:`, JSON.stringify(questions[0], null, 2));
        fs.writeFileSync(`tools/sample-questions-${set.skill}.json`, JSON.stringify(questions, null, 2));
        break; // Lấy được 1 mẫu thành công
      }
    } else {
      console.log(`Lỗi query:`, await qRes.text());
    }
  }

  // Thử kiểm tra số lượng exam_sets tổng cộng theo từng skill
  const skills = ['reading', 'listening', 'writing', 'speaking', 'grammar'];
  console.log('\n📊 THỐNG KÊ TOÀN BỘ ĐỀ THI TRÊN APTISKYTICH:');
  for (const sk of skills) {
    const countRes = await fetch(`${supabaseUrl}/rest/v1/exam_sets?skill=eq.${sk}&select=id,title,part,access_tier`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`
      }
    });
    if (countRes.ok) {
      const items = await countRes.json();
      console.log(`- Kỹ năng ${sk.toUpperCase()}: ${items.length} bộ đề (Free: ${items.filter(x => x.access_tier === 'free').length}, Pro: ${items.filter(x => x.access_tier === 'pro').length})`);
    } else {
      console.log(`- Kỹ năng ${sk.toUpperCase()}: Lỗi HTTP ${countRes.status}`);
    }
  }
}

testExamQuestions().catch(console.error);
