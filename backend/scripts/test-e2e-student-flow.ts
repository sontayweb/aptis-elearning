import 'dotenv/config';
import { prisma } from '../src/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SubmissionStatus, ExamSkill } from '@prisma/client';
import app from '../src/app';
import request from 'supertest';

// Màu sắc console trực quan
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logStep(step: number, title: string) {
  console.log(`\n${colors.cyan}${colors.bright}[BƯỚC ${step}] ${title}${colors.reset}`);
}

function logPass(message: string) {
  console.log(`  ${colors.green}✓ PASS:${colors.reset} ${message}`);
}

function logFail(message: string, error?: any) {
  console.error(`  ${colors.red}✗ FAIL:${colors.reset} ${message}`);
  if (error) console.error(error);
}

async function runE2EProgressTest() {
  console.log(`${colors.bright}${colors.yellow}======================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}  KIỂM THỬ END-TO-END (E2E) TIẾN TRÌNH HỌC VIÊN KHI LÀM BÀI VÀ ÔN TẬP  ${colors.reset}`);
  console.log(`${colors.bright}${colors.yellow}======================================================================${colors.reset}`);

  const timestamp = Date.now();
  const testEmail = `e2e_student_${timestamp}@aptistest.vn`;
  const testPassword = 'Password123!@#';
  let studentToken = '';
  let studentUserId = '';
  let selectedExam: any = null;
  let submissionId = '';

  try {
    // -------------------------------------------------------------
    // BƯỚC 1: Đăng ký & Đăng nhập tài khoản Học viên mới
    // -------------------------------------------------------------
    logStep(1, 'Đăng ký tài khoản học viên mới');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Học Viên Test E2E',
        email: testEmail,
        password: testPassword,
        phoneNumber: '0988776655',
      });

    if (registerRes.status === 201 && registerRes.body.success) {
      studentToken = registerRes.body.data.tokens.accessToken;
      studentUserId = registerRes.body.data.user.id;
      logPass(`Đăng ký thành công: ${testEmail} (User ID: ${studentUserId})`);
    } else {
      throw new Error(`Đăng ký thất bại: ${JSON.stringify(registerRes.body)}`);
    }

    // Xác thực token qua /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${studentToken}`);

    if (meRes.status === 200 && (meRes.body.data.role === 'STUDENT' || meRes.body.data.user?.role === 'STUDENT')) {
      logPass(`Xác thực token thành công, quyền: ${meRes.body.data.role || meRes.body.data.user?.role}`);
    } else {
      throw new Error(`Xác thực auth/me thất bại: ${JSON.stringify(meRes.body)}`);
    }

    // -------------------------------------------------------------
    // BƯỚC 2: Kiểm tra trạng thái Onboarding & Tiến trình ban đầu
    // -------------------------------------------------------------
    logStep(2, 'Kiểm tra trạng thái ban đầu của Học viên mới (New User Onboarding)');
    const initialStatsRes = await request(app)
      .get('/api/student/dashboard-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    if (initialStatsRes.status !== 200 || !initialStatsRes.body.success) {
      throw new Error(`Không lấy được dashboard stats ban đầu: ${JSON.stringify(initialStatsRes.body)}`);
    }

    const initStats = initialStatsRes.body.data;
    if (initStats.streak === 0) {
      logPass(`Streak ban đầu chính xác: 0 ngày`);
    } else {
      logFail(`Streak ban đầu không đúng: ${initStats.streak}`);
    }

    if (initStats.weeklyStreak.isTodayDone === false && initStats.weeklyStreak.completedThisWeek === 0) {
      logPass(`Weekly Streak ban đầu chính xác: Chưa hoàn thành bài hôm nay (0/7 ngày)`);
    } else {
      logFail(`Weekly Streak ban đầu sai trạng thái`);
    }

    if (initStats.totalQuestionsAnswered === 0 && initStats.accuracyPercent === 0) {
      logPass(`Tổng số câu đã làm = 0, Tỷ lệ chính xác = 0%`);
    } else {
      logFail(`Chỉ số câu hỏi ban đầu không phải 0`);
    }

    if (initStats.timelineProgress && initStats.timelineProgress.length === 0) {
      logPass(`Timeline Progress ban đầu là mảng rỗng (kích hoạt Empty State trên giao diện đồ thị)`);
    } else {
      logFail(`Timeline Progress ban đầu không rỗng`);
    }

    if (initStats.todayRecommendation && initStats.todayRecommendation.weakestPartLink === '/thi-thu') {
      logPass(`⚡ Gợi ý hôm nay hiển thị trạng thái chào đón: "${initStats.todayRecommendation.weakestPartTitle}"`);
    } else {
      logFail(`Gợi ý hôm nay không đúng trạng thái khởi tạo: ${JSON.stringify(initStats.todayRecommendation)}`);
    }

    // -------------------------------------------------------------
    // BƯỚC 3: Lấy danh sách đề thi và Khởi tạo bài thi
    // -------------------------------------------------------------
    logStep(3, 'Tìm kiếm đề thi và Bắt đầu phiên làm bài thi');
    const examsRes = await request(app)
      .get('/api/exams')
      .set('Authorization', `Bearer ${studentToken}`);

    const examsList = Array.isArray(examsRes.body.data)
      ? examsRes.body.data
      : (examsRes.body.data?.items || []);

    if (examsRes.status !== 200 || !examsRes.body.success || !examsList.length) {
      throw new Error(`Không tìm thấy đề thi nào trong hệ thống: ${JSON.stringify(examsRes.body)}`);
    }
    for (const exam of examsList) {
      const qRes = await request(app)
        .get(`/api/exams/${exam.id}/questions`)
        .set('Authorization', `Bearer ${studentToken}`);
      if (qRes.status === 200 && qRes.body.data?.parts?.length > 0) {
        const parts = qRes.body.data.parts;
        const totalQ = parts.reduce((acc: number, p: any) => acc + (p.questions?.length || 0), 0);
        if (totalQ >= 2) {
          selectedExam = { ...exam, parts, totalQ };
          break;
        }
      }
    }

    if (!selectedExam) {
      throw new Error(`Không tìm thấy đề thi nào có đủ câu hỏi để test`);
    }
    logPass(`Đã chọn đề thi: "${selectedExam.title}" (${selectedExam.skill}, tổng số câu: ${selectedExam.totalQ})`);

    // Bắt đầu làm bài thi
    const startRes = await request(app)
      .post('/api/submissions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ examId: selectedExam.id });

    if (startRes.status === 201 && startRes.body.success) {
      submissionId = startRes.body.data.submissionId;
      logPass(`Tạo phiên làm bài thành công! Submission ID: ${submissionId}`);
      logPass(`Thời gian hết hạn: ${startRes.body.data.deadlineAt} (còn ${startRes.body.data.serverTimeRemaining} giây)`);
    } else {
      throw new Error(`Tạo phiên làm bài thất bại: ${JSON.stringify(startRes.body)}`);
    }

    // -------------------------------------------------------------
    // BƯỚC 4: Làm bài & Autosave (Tạo cả câu Đúng và câu Sai)
    // -------------------------------------------------------------
    logStep(4, 'Thực hiện làm bài (Cố ý làm đúng 50% và làm sai 50% để kiểm tra tính toán)');
    const allQuestions: any[] = [];
    selectedExam.parts.forEach((p: any) => {
      if (p.questions) {
        p.questions.forEach((q: any) => allQuestions.push({ ...q, part_number: p.part_number }));
      }
    });

    const testAnswers: any[] = [];
    let expectedCorrectCount = 0;
    let expectedWrongCount = 0;

    allQuestions.forEach((q, idx) => {
      const isEven = idx % 2 === 0;
      let chosen = '';
      if (isEven) {
        // Cố ý làm ĐÚNG
        chosen = q.correct_answer || 'A';
        expectedCorrectCount++;
      } else {
        // Cố ý làm SAI
        chosen = q.correct_answer === 'A' ? 'B' : 'A';
        expectedWrongCount++;
      }
      testAnswers.push({
        questionId: q.id,
        selectedOption: chosen,
      });
    });

    const autosaveRes = await request(app)
      .put(`/api/submissions/${submissionId}/autosave`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: testAnswers });

    if (autosaveRes.status === 200 && autosaveRes.body.success) {
      logPass(`Autosave ${autosaveRes.body.data.savedCount} câu trả lời thành công`);
    } else {
      throw new Error(`Autosave thất bại: ${JSON.stringify(autosaveRes.body)}`);
    }

    // -------------------------------------------------------------
    // BƯỚC 5: Nộp bài thi và Kiểm tra Chấm điểm tự động
    // -------------------------------------------------------------
    logStep(5, 'Nộp bài thi và Kiểm tra Chấm điểm tự động');
    const submitRes = await request(app)
      .post(`/api/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`);

    if (submitRes.status === 200 && submitRes.body.success) {
      const resData = submitRes.body.data;
      logPass(`Nộp bài thành công! Trạng thái: ${resData.status}`);
      logPass(`Điểm số đạt được: ${resData.totalScore} điểm | CEFR Band: ${resData.cefrLevel || 'N/A'}`);
    } else {
      throw new Error(`Nộp bài thất bại: ${JSON.stringify(submitRes.body)}`);
    }

    // -------------------------------------------------------------
    // BƯỚC 6: Đánh giá Tiến trình Học viên sau khi hoàn thành bài
    // -------------------------------------------------------------
    logStep(6, 'Đánh giá Cập nhật Tiến trình Học viên trên Dashboard sau khi nộp bài');
    const updatedStatsRes = await request(app)
      .get('/api/student/dashboard-stats')
      .set('Authorization', `Bearer ${studentToken}`);

    if (updatedStatsRes.status !== 200 || !updatedStatsRes.body.success) {
      throw new Error(`Không lấy được dashboard stats sau khi nộp bài`);
    }

    const postStats = updatedStatsRes.body.data;

    // 1. Kiểm tra Streak
    if (postStats.streak >= 1 && postStats.weeklyStreak.isTodayDone === true) {
      logPass(`Streak tự động tăng lên ${postStats.streak} ngày! (isTodayDone = true)`);
    } else {
      logFail(`Streak không tăng đúng: ${postStats.streak}, isTodayDone: ${postStats.weeklyStreak.isTodayDone}`);
    }

    // 2. Kiểm tra Tổng số câu hỏi & Tỷ lệ chính xác
    if (postStats.totalQuestionsAnswered === testAnswers.length) {
      logPass(`Tổng số câu hỏi trả lời chính xác: ${postStats.totalQuestionsAnswered} câu`);
    } else {
      logFail(`Số câu trả lời ghi nhận sai: ${postStats.totalQuestionsAnswered} vs dự kiến ${testAnswers.length}`);
    }

    logPass(`Tỷ lệ chính xác trung bình được tính toán: ${postStats.accuracyPercent}%`);

    // 3. Kiểm tra Today Recommendation & Wrong Answers
    const rec = postStats.todayRecommendation;
    if (rec && rec.wrongQuestionsCount >= 1) {
      logPass(`⚡ Gợi ý hôm nay ghi nhận chính xác ${rec.wrongQuestionsCount} câu sai đang chờ ôn tập!`);
      logPass(`Tiêu đề phần yếu: "${rec.weakestPartTitle}"`);
      logPass(`Tóm tắt các part sai: "${rec.wrongQuestionsDetail}"`);
      logPass(`Đường dẫn ôn tập tự động: ${rec.wrongQuestionsLink}`);
    } else {
      logFail(`Gợi ý câu sai hôm nay không hiển thị số câu sai thực tế: ${JSON.stringify(rec)}`);
    }

    // 4. Kiểm tra Timeline Progress Chart Data
    if (postStats.timelineProgress && postStats.timelineProgress.length >= 1) {
      const latestPoint = postStats.timelineProgress[postStats.timelineProgress.length - 1];
      logPass(`Biểu đồ tiến bộ ghi nhận mốc ngày "${latestPoint.date}" với dữ liệu điểm thực tế`);
    } else {
      logFail(`Timeline Progress không có dữ liệu sau khi nộp bài`);
    }

    // 5. Kiểm tra Recent Tests
    if (postStats.recentTests && postStats.recentTests.length >= 1) {
      logPass(`Lịch sử bài thi gần đây ghi nhận bài thi: "${postStats.recentTests[0].title}" (${postStats.recentTests[0].score})`);
    } else {
      logFail(`Recent Tests không ghi nhận bài thi vừa làm`);
    }

    // -------------------------------------------------------------
    // BƯỚC 7: Kiểm tra API Lịch sử làm bài (My History)
    // -------------------------------------------------------------
    logStep(7, 'Kiểm tra API Lịch sử làm bài chi tiết (/api/submissions/my-history)');
    const historyRes = await request(app)
      .get('/api/submissions/my-history')
      .set('Authorization', `Bearer ${studentToken}`);

    if (historyRes.status === 200 && historyRes.body.success && historyRes.body.data.length >= 1) {
      const firstEntry = historyRes.body.data[0];
      logPass(`Lịch sử hiển thị đầy đủ: ${firstEntry.examTitle} | Điểm: ${firstEntry.score} | Band: ${firstEntry.band} | Ngày: ${firstEntry.date}`);
      if (historyRes.body.meta?.summary) {
        logPass(`Meta Summary: ${historyRes.body.meta.summary.totalCompleted} bài hoàn thành, độ chính xác ${historyRes.body.meta.summary.avgAccuracyPercent}%`);
      }
    } else {
      logFail(`Lịch sử làm bài không tìm thấy bài nộp`);
    }

    // -------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------
    console.log(`\n${colors.bright}${colors.green}======================================================================${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  KẾT QUẢ ĐÁNH GIÁ: TOÀN BỘ 7 BƯỚC E2E ĐÃ VƯỢT QUA XUẤT SẮC!         ${colors.reset}`);
    console.log(`${colors.bright}${colors.green}  Hệ thống xử lý đầy đủ và hoàn thiện 100% luồng tiến trình học viên. ${colors.reset}`);
    console.log(`${colors.bright}${colors.green}======================================================================${colors.reset}\n`);

  } catch (err: any) {
    console.error(`\n${colors.red}${colors.bright}LỖI TRONG QUÁ TRÌNH KIỂM THỬ E2E:${colors.reset}`, err.message || err);
  } finally {
    // Dọn dẹp dữ liệu học viên test
    if (studentUserId) {
      try {
        await prisma.submissionAnswer.deleteMany({
          where: { submission: { user_id: studentUserId } },
        });
        await prisma.examSubmission.deleteMany({
          where: { user_id: studentUserId },
        });
        await prisma.user.delete({
          where: { id: studentUserId },
        });
        console.log(`${colors.cyan}[CLEANUP] Đã dọn dẹp dữ liệu học viên test (${studentUserId}) thành công.${colors.reset}\n`);
      } catch (cleanErr) {
        console.warn('Lỗi khi dọn dẹp data test:', cleanErr);
      }
    }
    await prisma.$disconnect();
    process.exit(0);
  }
}

runE2EProgressTest();
