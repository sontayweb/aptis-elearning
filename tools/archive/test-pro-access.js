import fs from 'node:fs';

async function testProAccess() {
  const probeData = JSON.parse(fs.readFileSync('tools/probe-results.json', 'utf-8'));
  const supabaseUrl = probeData.supabaseUrl;
  const anonKey = probeData.anonKey;

  // Lấy 1 đề thi PRO
  const sampleSets = JSON.parse(fs.readFileSync('tools/sample-exam_sets.json', 'utf-8'));
  const proExam = sampleSets.find(s => s.access_tier === 'pro');
  console.log(`Đề PRO mẫu: "${proExam.title}" (ID: ${proExam.id})`);

  // 1. Thử các RPC có liên quan đến exam_questions
  console.log('\n--- 1. Kiểm tra các RPC tiềm năng ---');
  const possibleRpcs = [
    'get_exam_questions',
    'get_exam_details',
    'fetch_exam_questions',
    'get_exam_set',
    'get_questions_by_exam_set',
    'get_full_test_questions'
  ];

  for (const rpc of possibleRpcs) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_exam_set_id: proExam.id, exam_set_id: proExam.id, p_id: proExam.id })
    });
    console.log(`RPC '${rpc}': HTTP ${res.status}`);
  }

  // 2. Kiểm tra xem các đề trong Full Test (Thi thử 26 đề) có chứa các Part PRO không
  console.log('\n--- 2. Kiểm tra các đề thi con trong 26 Full Test ---');
  const fullTests = JSON.parse(fs.readFileSync('tools/sample-full-tests-rpc.json', 'utf-8'));
  const allExamSetIdsInFullTests = new Set();
  fullTests.forEach(ft => {
    (ft.examSetIds || []).forEach(id => allExamSetIdsInFullTests.add(id));
  });
  console.log(`Tổng số exam_sets nằm trong 26 đề Thi Thử (Full Tests): ${allExamSetIdsInFullTests.size} đề`);

  // Kiểm tra xem trong các exam_sets này, có bao nhiêu đề là PRO, bao nhiêu đề là FREE
  let proInFt = 0;
  let freeInFt = 0;

  // Lấy thông tin access_tier của các exam_sets trong Full Tests
  const idsArr = Array.from(allExamSetIdsInFullTests).slice(0, 50);
  const checkSetsRes = await fetch(`${supabaseUrl}/rest/v1/exam_sets?id=in.(${idsArr.join(',')})&select=id,title,access_tier`, {
    headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
  });
  if (checkSetsRes.ok) {
    const data = await checkSetsRes.json();
    const proList = data.filter(d => d.access_tier === 'pro');
    const freeList = data.filter(d => d.access_tier === 'free');
    console.log(`Kiểm tra mẫu 50 đề trong Full Tests: ${freeList.length} đề Free, ${proList.length} đề PRO!`);
  }
}

testProAccess().catch(console.error);
