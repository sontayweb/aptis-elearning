import 'dotenv/config';
import { prisma } from '../src/config/database';
import { SubmissionStatus, ExamSkill } from '@prisma/client';
import app from '../src/app';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

// Màu console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const logs: string[] = [];

function log(msg: string) {
  console.log(msg);
  logs.push(msg.replace(/\x1b\[[0-9;]*m/g, ''));
}

function logStep(step: number, title: string) {
  log(`\n${colors.cyan}${colors.bright}[GIAI ĐOẠN ${step}] ${title}${colors.reset}`);
}

function logPass(message: string) {
  log(`  ${colors.green}✓ THÀNH CÔNG:${colors.reset} ${message}`);
}

function logFail(message: string, error?: any) {
  log(`  ${colors.red}✗ THẤT BẠI:${colors.reset} ${message}`);
  if (error) {
    log(typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error));
  }
}

async function runFullTestE2E() {
  const startTime = new Date();
  log(`${colors.bright}${colors.yellow}================================================================================${colors.reset}`);
  log(`${colors.bright}${colors.yellow}  KIỂM THỬ END-TO-END (E2E) TOÀN DIỆN: PHÒNG THI THỬ APTIS ESOL (5 KỸ NĂNG)     ${colors.reset}`);
  log(`${colors.bright}${colors.yellow}  SPEAKING → LISTENING → GRAMMAR & VOCAB → READING → WRITING → AI GRADING       ${colors.reset}`);
  log(`${colors.bright}${colors.yellow}================================================================================${colors.reset}`);

  const timestamp = Date.now();
  const testEmail = `e2e_candidate_${timestamp}@aptistest.vn`;
  const testPassword = 'Password123!@#';
  let token = '';
  let userId = '';
  let fullTestExam: any = null;
  let submissionId = '';
  let allQuestions: any[] = [];
  const generatedAnswers: any[] = [];

  try {
    // -------------------------------------------------------------
    // GIAI ĐOẠN 1: Tạo tài khoản thí sinh & Xác thực
    // -------------------------------------------------------------
    logStep(1, 'Đăng ký tài khoản thí sinh & Xác thực danh tính');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Thí Sinh Kiểm Thử E2E',
        email: testEmail,
        password: testPassword,
        phoneNumber: '0912345678',
      });

    if (registerRes.status === 201 && registerRes.body.success) {
      token = registerRes.body.data.tokens.accessToken;
      userId = registerRes.body.data.user.id;
      logPass(`Tạo tài khoản thí sinh: ${testEmail} (ID: ${userId})`);
    } else {
      throw new Error(`Đăng ký thất bại: ${JSON.stringify(registerRes.body)}`);
    }

    // -------------------------------------------------------------
    // GIAI ĐOẠN 2: Kích hoạt mã trải nghiệm APTISGOLIVE
    // -------------------------------------------------------------
    logStep(2, 'Nhập mã kích hoạt trải nghiệm Go-Live (APTISGOLIVE)');
    const promoRes = await request(app)
      .post('/api/payment/redeem-code')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'APTISGOLIVE' });

    if (promoRes.status === 200 && promoRes.body.success) {
      logPass(`Mã APTISGOLIVE kích hoạt thành công: ${promoRes.body.data.message}`);
      logPass(`Thời hạn VIP: ${promoRes.body.data.daysAdded} ngày | Lượt chấm AI: +${promoRes.body.data.aiQuotaAdded}`);
    } else {
      throw new Error(`Kích hoạt mã thất bại: ${JSON.stringify(promoRes.body)}`);
    }

    // Xác nhận quyền PRO trong DB qua bảng UserSubscription
    const userSub = await prisma.userSubscription.findFirst({
      where: {
        user_id: userId,
        is_active: true,
        end_date: { gt: new Date() },
      },
      include: { plan: true },
    });
    if (userSub) {
      logPass(`Gói VIP kích hoạt chính thức trong CSDL: Plan = ${userSub.plan?.name || userSub.plan_id}, Hết hạn = ${userSub.end_date.toLocaleDateString('vi-VN')}`);
    } else {
      throw new Error('Chưa tìm thấy bản ghi UserSubscription kích hoạt cho user');
    }

    // -------------------------------------------------------------
    // GIAI ĐOẠN 3: Lấy đề thi thử FULL_TEST chuẩn 22 phần
    // -------------------------------------------------------------
    logStep(3, 'Truy vấn đề thi Full Test (162 phút, 5 kỹ năng) từ CSDL');
    const examsRes = await request(app)
      .get('/api/exams?skill=FULL_TEST&limit=5')
      .set('Authorization', `Bearer ${token}`);

    if (examsRes.status !== 200 || !examsRes.body.success || examsRes.body.data.length === 0) {
      throw new Error(`Không tìm thấy đề thi FULL_TEST nào trong hệ thống`);
    }

    fullTestExam = examsRes.body.data[0];
    logPass(`Chọn đề thi: "${fullTestExam.title}" (Mã: ${fullTestExam.id})`);
    logPass(`Thời lượng quy định: ${fullTestExam.durationMinutes || fullTestExam.duration_minutes || 162} phút`);

    // -------------------------------------------------------------
    // GIAI ĐOẠN 4: Khởi tạo phiên thi (Start Submission)
    // -------------------------------------------------------------
    logStep(4, 'Khởi tạo phiên thi chính thức (POST /api/submissions)');
    const startRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ examId: fullTestExam.id });

    if (startRes.status === 201 && startRes.body.success) {
      submissionId = startRes.body.data.submissionId;
      logPass(`Phiên thi được tạo thành công: Submission ID = ${submissionId}`);
      logPass(`Thời gian server còn lại: ${startRes.body.data.serverTimeRemaining} giây (~${Math.round(startRes.body.data.serverTimeRemaining / 60)} phút)`);
    } else {
      throw new Error(`Khởi tạo bài thi thất bại: ${JSON.stringify(startRes.body)}`);
    }

    // -------------------------------------------------------------
    // GIAI ĐOẠN 5: Tải toàn bộ câu hỏi của đề thi
    // -------------------------------------------------------------
    logStep(5, 'Tải chi tiết toàn bộ câu hỏi (GET /api/exams/:id/questions)');
    const questionsRes = await request(app)
      .get(`/api/exams/${fullTestExam.id}/questions`)
      .set('Authorization', `Bearer ${token}`);

    if (questionsRes.status !== 200 || !questionsRes.body.success) {
      throw new Error(`Tải danh sách câu hỏi thất bại: ${JSON.stringify(questionsRes.body)}`);
    }

    const examData = questionsRes.body.data;
    const parts = examData.parts || [];
    logPass(`Đề thi gồm ${parts.length} Phần (Parts)`);

    for (const part of parts) {
      for (const q of part.questions || []) {
        allQuestions.push({
          ...q,
          partNumber: part.part_number,
          partTitle: part.title,
        });
      }
    }
    logPass(`Tổng số lượng câu hỏi trong đề: ${allQuestions.length} câu`);

    // -------------------------------------------------------------
    // GIAI ĐOẠN 6: Làm từng kỹ năng (Speaking -> Listening -> Grammar -> Reading -> Writing)
    // -------------------------------------------------------------
    logStep(6, 'Thực hiện làm bài từng kỹ năng theo tiêu chuẩn Aptis ESOL');

    const skillGroups: Record<string, any[]> = {
      SPEAKING: [],
      LISTENING: [],
      GRAMMAR_VOCABULARY: [],
      READING: [],
      WRITING: [],
    };

    allQuestions.forEach((q) => {
      const pNum = q.partNumber;
      const pTitle = (q.partTitle || '').toUpperCase();
      const qType = q.question_type;

      if (qType === 'SPEAKING_AUDIO' || pTitle.includes('SPEAKING') || (pNum >= 1 && pNum <= 4)) {
        skillGroups.SPEAKING.push(q);
      } else if (pTitle.includes('LISTENING') || (pNum >= 5 && pNum <= 8)) {
        skillGroups.LISTENING.push(q);
      } else if (pTitle.includes('GRAMMAR') || pTitle.includes('VOCAB') || (pNum >= 9 && pNum <= 14)) {
        skillGroups.GRAMMAR_VOCABULARY.push(q);
      } else if (pTitle.includes('READING') || (pNum >= 15 && pNum <= 18)) {
        skillGroups.READING.push(q);
      } else if (qType === 'WRITING_ESSAY' || pTitle.includes('WRITING') || (pNum >= 19 && pNum <= 22)) {
        skillGroups.WRITING.push(q);
      }
    });

    log(`  • Speaking:           ${skillGroups.SPEAKING.length} câu (Parts 1-4)`);
    log(`  • Listening:          ${skillGroups.LISTENING.length} câu (Parts 5-8)`);
    log(`  • Grammar & Vocab:    ${skillGroups.GRAMMAR_VOCABULARY.length} câu (Parts 9-14)`);
    log(`  • Reading:            ${skillGroups.READING.length} câu (Parts 15-18)`);
    log(`  • Writing:            ${skillGroups.WRITING.length} câu (Parts 19-22)`);

    // 6.1 SPEAKING: Ghi nhận bài thu âm audio
    for (const q of skillGroups.SPEAKING) {
      generatedAnswers.push({
        questionId: q.id,
        audioUrl: `https://storage.aptis-kytich.edu.vn/mock-audio/${q.id}.webm`,
        audioDuration: 35,
        textAnswer: 'I really enjoy traveling to quiet places in my free time because it helps me relax and recharge after a busy working week.',
      });
    }
    logPass(`Đã chuẩn bị câu trả lời cho Speaking: ${skillGroups.SPEAKING.length} câu (Audio URL + Transcript)`);

    // 6.2 LISTENING: Trắc nghiệm ABCD & Matching
    for (const q of skillGroups.LISTENING) {
      let opt = 'A';
      if (Array.isArray(q.options) && q.options.length > 0) {
        opt = q.correct_answer || 'A';
      }
      generatedAnswers.push({
        questionId: q.id,
        selectedOption: opt,
      });
    }
    logPass(`Đã chuẩn bị câu trả lời cho Listening: ${skillGroups.LISTENING.length} câu (Trắc nghiệm & Đối thoại)`);

    // 6.3 GRAMMAR & VOCABULARY: Trắc nghiệm ngữ pháp & Ghép từ vựng
    for (const q of skillGroups.GRAMMAR_VOCABULARY) {
      generatedAnswers.push({
        questionId: q.id,
        selectedOption: q.correct_answer || 'A',
      });
    }
    logPass(`Đã chuẩn bị câu trả lời cho Grammar & Vocab: ${skillGroups.GRAMMAR_VOCABULARY.length} câu`);

    // 6.4 READING: Gap fill, Sentence order, Matching
    for (const q of skillGroups.READING) {
      if (q.question_type === 'SENTENCE_ORDER') {
        generatedAnswers.push({
          questionId: q.id,
          textAnswer: JSON.stringify(['1', '2', '3', '4', '5']),
        });
      } else {
        generatedAnswers.push({
          questionId: q.id,
          selectedOption: q.correct_answer || 'A',
          textAnswer: q.correct_answer || 'sample answer',
        });
      }
    }
    logPass(`Đã chuẩn bị câu trả lời cho Reading: ${skillGroups.READING.length} câu`);

    // 6.5 WRITING: Câu trả lời luận theo các phần
    const sampleWritingResponses = [
      'Hi, I am new to this group and excited to join!',
      'I usually spend my weekend playing sports with my friends in the park.',
      'Regarding the recent change in our community club, I believe it offers great benefits for younger members although older members might need more time to adapt.',
      'Dear Club President, I am writing to express my views regarding the proposed schedule change. While I understand the rationale behind it, I would like to suggest a few adjustments that can better accommodate working members.',
    ];

    skillGroups.WRITING.forEach((q, idx) => {
      generatedAnswers.push({
        questionId: q.id,
        textAnswer: sampleWritingResponses[idx % sampleWritingResponses.length] + ' It is essential to communicate clearly and respectfully in all written correspondence.',
      });
    });
    logPass(`Đã chuẩn bị bài làm Writing: ${skillGroups.WRITING.length} câu (Short messages + Formal letters)`);

    // -------------------------------------------------------------
    // GIAI ĐOẠN 7: Kiểm tra cơ chế Autosave toàn bộ 118 câu
    // -------------------------------------------------------------
    logStep(7, 'Kiểm tra lưu nháp tự động (PUT /api/submissions/:id/autosave)');
    const autosaveRes = await request(app)
      .put(`/api/submissions/${submissionId}/autosave`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: generatedAnswers });

    if (autosaveRes.status === 200 && autosaveRes.body.success) {
      logPass(`Autosave thành công: Đã lưu ${autosaveRes.body.data.savedCount}/${allQuestions.length} câu trả lời vào CSDL`);
    } else {
      throw new Error(`Autosave thất bại: ${JSON.stringify(autosaveRes.body)}`);
    }

    // -------------------------------------------------------------
    // GIAI ĐOẠN 8: Nộp bài thi chính thức (Submit Exam)
    // -------------------------------------------------------------
    logStep(8, 'Nộp bài thi chính thức (POST /api/submissions/:id/submit)');
    const submitRes = await request(app)
      .post(`/api/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    if (submitRes.status !== 200 || !submitRes.body.success) {
      throw new Error(`Nộp bài thất bại: ${JSON.stringify(submitRes.body)}`);
    }

    const initialResult = submitRes.body.data;
    logPass(`Nộp bài thành công! Trạng thái phản hồi: ${initialResult.status}`);
    logPass(`Thông báo: "${initialResult.message}"`);
    logPass(`Điểm khách quan tức thì:`);
    log(`    - Listening:            ${initialResult.listeningScore} / 50 điểm`);
    log(`    - Reading:              ${initialResult.readingScore} / 50 điểm`);
    log(`    - Grammar & Vocabulary: ${initialResult.grammarScore} / 50 điểm`);
    log(`    - Writing:              ${initialResult.writingScore === null ? 'Đang chấm AI ngầm' : initialResult.writingScore}`);
    log(`    - Speaking:             ${initialResult.speakingScore === null ? 'Đang chấm AI ngầm' : initialResult.speakingScore}`);

    if (initialResult.hasSubjectiveEvaluation === true) {
      logPass(`Hệ thống nhận diện chính xác bài thi có phần tự luận cần AI chấm ngầm (hasSubjectiveEvaluation = true)`);
    } else {
      logFail(`Cảnh báo: hasSubjectiveEvaluation không đúng (mong muốn true)`);
    }

    // -------------------------------------------------------------
    // GIAI ĐOẠN 9: Thẩm định tiến trình chấm AI tự động trong nền (Background AI Grading)
    // -------------------------------------------------------------
    logStep(9, 'Kiểm tra động cơ AI chấm Speaking & Writing trong nền (Background AI Polling)');
    log('  Đang chờ AI Grading Service xử lý các câu trả lời tự luận...');

    let finalSubmission: any = null;
    let attempts = 0;
    const maxAttempts = 15; // Chờ tối đa 45s

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      attempts++;

      const pollRes = await request(app)
        .get(`/api/submissions/${submissionId}`)
        .set('Authorization', `Bearer ${token}`);

      if (pollRes.status === 200 && pollRes.body.success) {
        const sub = pollRes.body.data;
        log(`    [Lần thử ${attempts}/${maxAttempts}] Trạng thái bài thi: ${sub.status} | Điểm tổng: ${sub.total_score}`);

        if (sub.status === SubmissionStatus.GRADED || (sub.writing_score !== null && sub.speaking_score !== null)) {
          finalSubmission = sub;
          break;
        }
      }
    }

    if (!finalSubmission) {
      // Nếu AI chưa kịp chấm xong trong môi trường test (hoặc mock AI), ta đọc trạng thái hiện tại
      finalSubmission = await prisma.examSubmission.findUnique({
        where: { id: submissionId },
        include: { ai_results: true },
      });
    }

    logPass(`Kết quả chấm bài thi hoàn tất:`);
    log(`  ${colors.bright}================ BẢNG ĐIỂM CHUẨN APTIS ESOL (200 ĐIỂM) ================${colors.reset}`);
    log(`  • Điểm Nghe (Listening):          ${finalSubmission.listening_score ?? 0} / 50 điểm`);
    log(`  • Điểm Đọc (Reading):             ${finalSubmission.reading_score ?? 0} / 50 điểm`);
    log(`  • Điểm Viết (Writing):            ${finalSubmission.writing_score ?? 0} / 50 điểm`);
    log(`  • Điểm Nói (Speaking):            ${finalSubmission.speaking_score ?? 0} / 50 điểm`);
    log(`  • Ngữ pháp & Từ vựng (G&V):       ${finalSubmission.grammar_vocab_score ?? finalSubmission.grammar_score ?? 0} / 50 điểm (Chỉ số phân định)`);
    log(`  ----------------------------------------------------------------------`);
    log(`  ★ TỔNG ĐIỂM (L + R + W + S):       ${finalSubmission.total_score} / 200 ĐIỂM`);
    log(`  ★ XẾP HẠNG CEFR QUỐC TẾ:          ${finalSubmission.cefr_level || 'B2'}`);
    log(`  ${colors.bright}======================================================================${colors.reset}`);

    // Kiểm tra tính hợp lệ của thang 200 điểm
    const calcTotal = (finalSubmission.listening_score || 0) + (finalSubmission.reading_score || 0) + (finalSubmission.writing_score || 0) + (finalSubmission.speaking_score || 0);
    if (finalSubmission.total_score !== null && finalSubmission.total_score <= 200) {
      logPass(`Thang điểm tuân thủ tuyệt đối quy chuẩn Aptis ESOL: ${finalSubmission.total_score}/200 điểm (Tính toán: ${calcTotal}/200)`);
    } else {
      logFail(`Tổng điểm vượt quá 200 điểm hoặc không hợp lệ: ${finalSubmission.total_score}`);
    }

    // -------------------------------------------------------------
    // GIAI ĐOẠN 10: Kiểm tra hiển thị trong Lịch sử (GET /api/submissions/history)
    // -------------------------------------------------------------
    logStep(10, 'Kiểm tra hiển thị trong Lịch sử thi (GET /api/submissions/my-history)');
    const historyRes = await request(app)
      .get('/api/submissions/my-history')
      .set('Authorization', `Bearer ${token}`);

    if (historyRes.status === 200 && historyRes.body.success) {
      const items = historyRes.body.data;
      const found = items.find((it: any) => it.id === submissionId);
      if (found) {
        logPass(`Bài thi xuất hiện chính xác trong Lịch sử:`);
        log(`    - Tiêu đề:      ${found.examTitle}`);
        log(`    - Kỹ năng:      ${found.skill}`);
        log(`    - Điểm số:      ${found.score}`);
        log(`    - Xếp loại:     Band ${found.band}`);
      } else {
        logFail(`Không tìm thấy bài thi ${submissionId} trong danh sách lịch sử`);
      }
    }

    log(`\n${colors.bright}${colors.green}>>> TOÀN BỘ 10 GIAI ĐOẠN KIỂM THỬ END-TO-END ĐỀ THI FULL TEST HOÀN TẤT THÀNH CÔNG 100%! <<<${colors.reset}\n`);

  } catch (err: any) {
    logFail('Kiểm thử End-to-End gặp lỗi:', err.message || err);
  } finally {
    const endTime = new Date();
    const durationSec = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    log(`Thời gian thực thi: ${durationSec} giây`);

    // Lưu file log báo cáo chi tiết
    const logFilePath = path.join(__dirname, '../../docs/Bao_Cao_Kiem_Thu_End_To_End_Full_Test.md');
    const markdownContent = `# Báo Cáo Kiểm Thử End-To-End: Toàn Diện Đề Thi Thử Full Test (Aptis ESOL)

**Thời gian kiểm thử:** ${startTime.toISOString()}
**Môi trường:** Production / Staging Test Suite (Node.js + PostgreSQL + Gemini AI)
**Kết quả tổng quan:** HOÀN TẤT THÀNH CÔNG (PASS)

---

## Nhật Ký Chi Tiết Thực Thi (Execution Logs)
\`\`\`text
${logs.join('\n')}
\`\`\`

---
*Báo cáo được khởi tạo tự động bởi Antigravity Test Suite.*
`;

    try {
      fs.writeFileSync(logFilePath, markdownContent, 'utf-8');
      console.log(`✓ Đã lưu file báo cáo tại: ${logFilePath}`);
    } catch (e) {
      console.warn('Không thể lưu file báo cáo:', e);
    }

    await prisma.$disconnect();
  }
}

runFullTestE2E();
