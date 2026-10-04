import dotenv from 'dotenv';
dotenv.config();

import { geminiRotator } from '../src/modules/ai-grading/gemini-rotator.service';

async function testLiveGrading() {
  console.log('🚀 Bắt đầu kiểm tra Thực tế (End-to-End) Gemini Model Rotator:');
  
  // 1. Kiểm tra trạng thái
  await geminiRotator.reloadConfig();
  const status = geminiRotator.getStatus();
  console.log(`📌 Active Model khởi đầu: "${status.activeModel}"`);
  console.log(`📋 Số lượng models Google hỗ trợ khám phá được: ${status.totalDiscovered}`);
  console.log(`Top 5 models ưu tiên:`, status.availableModels.slice(0, 5));

  // 2. Chấm thử một bài viết Aptis ESOL Part 4
  console.log('\n📝 2. Đang gửi đề bài và bài làm của thí sinh để Gemini chấm điểm...');
  const prompt = 'You are a member of an environmental club. Write an email to the club president explaining why you missed the annual tree planting event and propose 2 ideas for next month.';
  const context = 'Aptis General Writing Part 4 - Formal Email (120-150 words)';
  const candidateText = `Dear Mr. Robinson,

I am writing this email to formally express my sincerest apologies for my unanticipated absence from our annual tree planting initiative last Saturday. Unfortunately, an unforeseen family emergency required my immediate presence out of town, making it impossible for me to attend the scheduled community project.

To compensate for my absence, I would like to put forward two viable suggestions for our forthcoming environmental campaign next month. Firstly, we could organize an urban plastic recycling workshop tailored for local university students to enhance sustainability awareness. Secondly, launching a digital fundraising drive could provide financial backing to purchase indigenous saplings for the suburban nature reserve.

I look forward to discussing these proposals further at our upcoming committee meeting.

Yours sincerely,
Nguyen Hoang Hiep`;

  const start = Date.now();
  try {
    const result = await geminiRotator.evaluateWriting(prompt, context, candidateText);
    const duration = Date.now() - start;

    console.log(`\n🎉 ✅ CHẤM THI THÀNH CÔNG TRONG ${duration}ms!`);
    console.log(`⭐ Model đã phản hồi & được lưu Sticky: "${result.usedModel}"`);
    console.log('--------------------------------------------------');
    console.log(`📊 Điểm tổng kết (Score): ${result.score}/50`);
    console.log(`🏆 Bậc quy đổi CEFR: ${result.cefr_level}`);
    console.log(`- Task Completion: ${result.task_completion}/50`);
    console.log(`- Grammar Score: ${result.grammar_score}/50`);
    console.log(`- Vocabulary Score: ${result.vocabulary_score}/50`);
    console.log(`- Cohesion Score: ${result.cohesion_score}/50`);
    console.log(`💬 Nhận xét tổng quan: ${result.feedback_summary}`);
    console.log(`🔍 Số lượng góp ý chi tiết: ${result.detailed_feedback?.length || 0} điểm`);
    if (result.detailed_feedback && result.detailed_feedback.length > 0) {
      console.log('Ví dụ góp ý đầu tiên:', result.detailed_feedback[0]);
    }
    console.log('--------------------------------------------------');

    // Kiểm tra lại trạng thái sau khi chấm
    const afterStatus = geminiRotator.getStatus();
    console.log(`🎯 Active Model hiện tại đã được ghi nhớ: "${afterStatus.activeModel}" (Tổng lượt xoay vòng: ${afterStatus.totalRotations})`);
  } catch (err: any) {
    console.error('❌ Lỗi chấm thi:', err?.message || err);
  }
}

testLiveGrading();
