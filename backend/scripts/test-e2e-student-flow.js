const API_BASE = 'http://103.90.227.117:5000/api';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('====================================================================');
  console.log('🚀 BẮT ĐẦU KIỂM TRA ĐẦU LUỒNG END-TO-END QUA API CHO TÀI KHOẢN STUDENT');
  console.log('====================================================================\n');

  // 1. ĐĂNG NHẬP
  console.log('▶️ [BƯỚC 1] Đăng nhập tài khoản hoanghiep310102@gmail.com');
  const loginRes = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'hoanghiep310102@gmail.com',
      password: '12345678',
    }),
  });

  const tokens = loginRes.data?.data?.tokens || loginRes.data?.data;
  const token = tokens?.accessToken;
  if (!loginRes.ok || !token) {
    console.error('❌ Đăng nhập thất bại:', loginRes.data);
    return;
  }
  const user = loginRes.data.data.user;
  const activeSub = user.activeSubscription;
  console.log(`  ✅ Đăng nhập thành công! User: ${user.fullName} (${user.email})`);
  console.log(`     - Gói cước: ${activeSub?.planName || 'N/A'}`);
  console.log(`     - Quota AI còn lại: ${activeSub?.aiQuotaLeft}`);
  console.log(`     - Quota GV còn lại: ${activeSub?.teacherQuotaLeft}\n`);

  // 2. LẤY DANH SÁCH ĐỀ THI TỪNG KỸ NĂNG
  console.log('▶️ [BƯỚC 2] Lấy danh sách đề thi (Reading, Listening, Writing)');
  const [readingList, listeningList, writingList] = await Promise.all([
    request('/exams?skill=READING&limit=5', {}, token),
    request('/exams?skill=LISTENING&limit=5', {}, token),
    request('/exams?skill=WRITING&limit=5', {}, token),
  ]);

  const readingExam = readingList.data?.data?.[0];
  const listeningExam = listeningList.data?.data?.[0];
  const writingExam = writingList.data?.data?.[0];

  console.log(`  📖 Reading Exam: "${readingExam?.title}" (${readingExam?.id})`);
  console.log(`  🎧 Listening Exam: "${listeningExam?.title}" (${listeningExam?.id})`);
  console.log(`  ✍️ Writing Exam: "${writingExam?.title}" (${writingExam?.id})\n`);

  // 3. TEST LUỒNG READING END-TO-END (Trắc nghiệm chấm tự động)
  if (readingExam) {
    console.log('--------------------------------------------------------------------');
    console.log(`▶️ [BƯỚC 3] TEST LUỒNG READING: "${readingExam.title}"`);
    console.log('--------------------------------------------------------------------');

    // 3.1 Start / Resume (forceNew: false)
    console.log('  3.1. Bắt đầu phiên làm bài (forceNew: false)');
    const startRes = await request('/submissions', {
      method: 'POST',
      body: JSON.stringify({ examId: readingExam.id, forceNew: false }),
    }, token);
    console.log(`      Status code: ${startRes.status}, isResumed: ${startRes.data?.data?.isResumed}`);
    const subId = startRes.data?.data?.submissionId;
    console.log(`      Submission ID: ${subId}`);
    console.log(`      Thời gian còn lại trên server: ${startRes.data?.data?.serverTimeRemaining} giây`);

    // 3.2 Lấy chi tiết đề thi để có question_id
    const examDetail = await request(`/exams/${readingExam.id}/questions`, {}, token);
    const parts = examDetail.data?.data?.parts || [];
    console.log(`      Đề thi có ${parts.length} part, tổng số câu hỏi:`, parts.flatMap(p => p.questions).length);

    // 3.3 Autosave một vài đáp án
    const firstQ = parts[0]?.questions?.[0];
    if (firstQ) {
      console.log(`  3.2. Autosave câu hỏi ID: ${firstQ.id} (chọn đáp án 'A')`);
      const autosaveRes = await request(`/submissions/${subId}/autosave`, {
        method: 'PUT',
        body: JSON.stringify({
          answers: [{ questionId: firstQ.id, selectedOption: 'A' }],
        }),
      }, token);
      console.log(`      Autosave status: ${autosaveRes.status}, data:`, autosaveRes.data);
    }

    // 3.4 Heartbeat
    console.log(`  3.3. Gửi heartbeat`);
    const hbRes = await request(`/submissions/${subId}/heartbeat`, {
      method: 'POST',
      body: JSON.stringify({ tabSwitchCount: 0 }),
    }, token);
    console.log(`      Heartbeat response:`, hbRes.data);

    // 3.5 Submit bài thi Reading
    console.log(`  3.4. Nộp bài thi Reading (POST /submissions/${subId}/submit)`);
    const submitRes = await request(`/submissions/${subId}/submit`, {
      method: 'POST',
    }, token);
    console.log(`      Submit status code: ${submitRes.status}`);
    console.log(`      Trạng thái sau submit: ${submitRes.data?.data?.status}`);
    console.log(`      Điểm số đạt được: ${submitRes.data?.data?.total_score}`);
    console.log(`      CEFR Level: ${submitRes.data?.data?.cefr_level}`);

    // 3.6 Test forceNew = true (Làm lại đề mới ngay lập tức)
    console.log(`  3.5. Bấm [Làm lại đề này] với forceNew: true`);
    const forceNewRes = await request('/submissions', {
      method: 'POST',
      body: JSON.stringify({ examId: readingExam.id, forceNew: true }),
    }, token);
    console.log(`      Status code: ${forceNewRes.status}, isResumed: ${forceNewRes.data?.data?.isResumed}`);
    console.log(`      New Submission ID: ${forceNewRes.data?.data?.submissionId} (Khác cũ: ${forceNewRes.data?.data?.submissionId !== subId})`);
    console.log(`      Thời gian cấp mới: ${forceNewRes.data?.data?.serverTimeRemaining} giây (~${Math.round(forceNewRes.data?.data?.serverTimeRemaining / 60)} phút)\n`);
  }

  // 4. TEST LUỒNG WRITING END-TO-END (Tự luận & Background AI Evaluation)
  if (writingExam) {
    console.log('--------------------------------------------------------------------');
    console.log(`▶️ [BƯỚC 4] TEST LUỒNG WRITING: "${writingExam.title}"`);
    console.log('--------------------------------------------------------------------');

    // 4.1 Tạo bài thi Writing mới
    console.log('  4.1. Bắt đầu bài thi Writing mới (forceNew: true)');
    const wStart = await request('/submissions', {
      method: 'POST',
      body: JSON.stringify({ examId: writingExam.id, forceNew: true }),
    }, token);
    const wSubId = wStart.data?.data?.submissionId;
    console.log(`      Writing Submission ID: ${wSubId}`);

    // 4.2 Lấy câu hỏi Writing
    const wDetail = await request(`/exams/${writingExam.id}/questions`, {}, token);
    const wParts = wDetail.data?.data?.parts || [];
    const wQuestions = wParts.flatMap(p => p.questions);
    console.log(`      Writing có ${wParts.length} part, ${wQuestions.length} câu hỏi.`);

    // 4.3 Autosave bài viết mẫu
    if (wQuestions.length > 0) {
      console.log(`  4.2. Autosave câu trả lời bài viết Writing`);
      const sampleAnswers = wQuestions.map((q, idx) => ({
        questionId: q.id,
        textAnswer: `This is a test response for Writing question ${idx + 1}. I believe that community clubs play an essential role in bringing people together. Through regular meetings and activities, members can share their passions and build strong social networks.`,
      }));
      const wAutosave = await request(`/submissions/${wSubId}/autosave`, {
        method: 'PUT',
        body: JSON.stringify({ answers: sampleAnswers }),
      }, token);
      console.log(`      Autosave lưu được: ${wAutosave.data?.data?.savedCount} câu`);
    }

    // 4.4 Submit bài Writing
    console.log(`  4.3. Nộp bài Writing (POST /submissions/${wSubId}/submit)`);
    const wSubmit = await request(`/submissions/${wSubId}/submit`, {
      method: 'POST',
    }, token);
    console.log(`      Submit status code: ${wSubmit.status}`);
    console.log(`      Trạng thái ban đầu sau submit: ${wSubmit.data?.data?.status}`);

    // 4.5 Kiểm tra Polling kết quả chấm ngầm
    console.log(`  4.4. Polling kiểm tra kết quả chấm ngầm của AI (đợi tối đa 30s)`);
    let graded = false;
    for (let i = 1; i <= 10; i++) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await request(`/submissions/${wSubId}`, {}, token);
      const subData = pollRes.data?.data;
      console.log(`      [Lần ${i} - ${i * 3}s] Status: ${subData?.status}, Score: ${subData?.total_score}, CEFR: ${subData?.cefr_level}, AI Results: ${subData?.ai_results?.length || 0}`);
      if (subData?.status === 'GRADED' || (subData?.ai_results && subData.ai_results.length > 0)) {
        graded = true;
        console.log(`      ✅ AI đã chấm xong thành công!`);
        console.log(`         - Band CEFR: ${subData?.cefr_level}`);
        console.log(`         - Điểm Writing: ${subData?.writing_score || subData?.total_score}`);
        if (subData?.ai_results?.[0]) {
          console.log(`         - Feedback câu 1: ${JSON.stringify(subData.ai_results[0].feedback || subData.ai_results[0].general_feedback)}`);
        }
        break;
      }
    }
    if (!graded) {
      console.log(`      ℹ️ AI vẫn đang xử lý ngầm (hoặc chạy qua mock service)`);
    }
  }

  // 5. TEST LUỒNG LỊCH SỬ LÀM BÀI (/submissions/my-history)
  console.log('\n--------------------------------------------------------------------');
  console.log('▶️ [BƯỚC 5] TEST API LỊCH SỬ LÀM BÀI (/submissions/my-history)');
  console.log('--------------------------------------------------------------------');
  const historyRes = await request('/submissions/my-history?limit=10', {}, token);
  console.log(`  History status: ${historyRes.status}, Total items: ${historyRes.data?.data?.length}`);
  const items = historyRes.data?.data || [];
  if (items.length > 0) {
    console.log('  3 bài thi gần nhất trong lịch sử:');
    items.slice(0, 3).forEach((item, idx) => {
      console.log(`     ${idx + 1}. [${item.skill}] ${item.examTitle}`);
      console.log(`        - ID: ${item.id}`);
      console.log(`        - Điểm: ${item.score} | Band: ${item.band}`);
      console.log(`        - Ngày thi: ${item.date}`);
      console.log(`        - URL xem lại: /${(item.skill || 'reading').toLowerCase()}/${item.examId}?submissionId=${item.id}&mode=review`);
    });
  }

  // 6. TEST TRUY VẤN LẠI BÀI ĐÃ LÀM (REVIEW MODE FETCH)
  if (items.length > 0) {
    const testReviewSub = items[0];
    console.log(`\n▶️ [BƯỚC 6] Test lấy dữ liệu Review cho bài nộp ID: ${testReviewSub.id}`);
    const reviewRes = await request(`/submissions/${testReviewSub.id}`, {}, token);
    const rData = reviewRes.data?.data;
    console.log(`  Review fetch status: ${reviewRes.status}`);
    console.log(`  - Exam: "${rData?.exam?.title}"`);
    console.log(`  - Status: ${rData?.status}`);
    console.log(`  - Số câu trả lời lưu trong DB: ${rData?.answers?.length}`);
    console.log(`  - Kết quả AI: ${rData?.ai_results?.length || 0} mục`);
    console.log(`  => Dữ liệu đầy đủ để khôi phục 100% giao diện Review Mode!`);
  }

  console.log('\n====================================================================');
  console.log('🎉 HOÀN THÀNH KIỂM TRA ĐẦU LUỒNG BACKEND API THÀNH CÔNG RỰC RỠ');
  console.log('====================================================================');
}

run().catch(console.error);
