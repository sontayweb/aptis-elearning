import { ExamService } from '../src/modules/exams/exam.service';

async function main() {
  const service = new ExamService();
  console.log('=== ĐỐI SOÁT TRỰC TIẾP CẢ 4 KỸ NĂNG SAU KHI ĐỒNG BỘ ===\n');

  for (const skill of ['READING', 'LISTENING', 'SPEAKING', 'WRITING'] as const) {
    const res = await service.listExams({ skill, limit: 350, page: 1 } as any);
    const fullExams = res.exams.filter(e => e.title.includes('Full') || e.totalParts === 4);
    console.log(`📌 Kỹ năng [${skill}]:`);
    console.log(`   - Tổng số đề trong kho: ${res.exams.length}`);
    console.log(`   - Số bài thi FULL liên hoàn (Tab 1): ${fullExams.length} đề`);
    console.log(`   - Mẫu đề đầu: "${fullExams[0]?.title}" (${fullExams[0]?.durationMinutes} phút, Pro: ${fullExams[0]?.isPro})`);
    console.log(`   - Mẫu đề cuối: "${fullExams[fullExams.length - 1]?.title}"`);
    console.log('');
  }
}

main().finally(() => process.exit(0));
