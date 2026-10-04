import 'dotenv/config';
import { geminiRotator } from '../src/modules/ai-grading/gemini-rotator.service';

async function runFullTest() {
  console.log('========================================================');
  console.log('🚀 BẮT ĐẦU KIỂM TRA TOÀN DIỆN GOOGLE GEMINI AI API');
  console.log('========================================================');
  
  const startTime = Date.now();
  await geminiRotator.reloadConfig();
  
  const prompt = 'Write an email to a friend about a canceled trip to the art gallery. Write about 50 words.';
  const context = 'Annual Art Gallery trip is canceled due to budget constraints.';
  const candidateText = `Dear Alex,

I just heard the terrible news that our annual trip to the National Art Gallery has been canceled because of budget shortages. I am so upset about this because I was eagerly looking forward to seeing the impressionist paintings. Perhaps we can organize our own small visit next weekend instead?

Best wishes,
Hiep`;

  console.log('📝 Đang gửi bài viết thực tế (60 từ) tới mô hình Gemini...');
  const result = await geminiRotator.evaluateWriting(prompt, context, candidateText);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('--------------------------------------------------------');
  console.log('⚡ Thời gian phản hồi:', duration, 'giây (Rất nhanh)');
  console.log('✅ TRẠNG THÁI: KẾT NỐI THÀNH CÔNG 100%');
  console.log('🤖 Mô hình AI phục vụ:', result.usedModel);
  console.log('🎯 Điểm tổng kết:', result.score, '/ 50');
  console.log('📊 Quy đổi CEFR:', result.cefr_level);
  console.log('📌 Điểm chi tiết 4 tiêu chí chuẩn British Council:');
  console.log('   • Task Fulfillment (Hoàn thành đề bài):', result.task_completion, '/ 50');
  console.log('   • Grammar Accuracy (Độ chuẩn ngữ pháp):', result.grammar_score, '/ 50');
  console.log('   • Vocabulary Diversity (Độ đa dạng từ vựng):', result.vocabulary_score, '/ 50');
  console.log('   • Cohesion & Flow (Tính liên kết câu):', result.cohesion_score, '/ 50');
  console.log('--------------------------------------------------------');
  console.log('💬 Nhận xét tiếng Việt từ AI:');
  console.log('  ', result.feedback_summary);
  
  if (Array.isArray(result.detailed_feedback) && result.detailed_feedback.length > 0) {
    console.log('🔍 Sửa lỗi ngữ pháp & Gợi ý nâng band:');
    result.detailed_feedback.forEach((f: any, idx: number) => {
      console.log(`   ${idx + 1}. [${f.errorType || 'Grammar/Vocab'}]`);
      if (f.original) console.log(`      - Bản gốc: "${f.original}"`);
      if (f.suggested) console.log(`      - Gợi ý: "${f.suggested}"`);
      if (f.comment) console.log(`      - Giải thích: ${f.comment}`);
    });
  }
  console.log('========================================================');
}

runFullTest().catch((err) => {
  console.error('❌ LỖI KHI GỌI GOOGLE AI:', err);
  process.exit(1);
});
