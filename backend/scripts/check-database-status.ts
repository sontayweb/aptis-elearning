import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('KIỂM TRA TÌNH TRẠNG DATABASE VÀ BẢN BACKUP');
  console.log('================================================================\n');

  // 1. KIỂM TRA FILE BACKUP
  console.log('--- 1. KIỂM TRA TẬP TIN BACKUP VẬT LÝ ---');
  const backupDir = path.resolve(__dirname, '../backups');
  const sqlBackupFile = path.join(backupDir, 'backup_aptis_kytich_db_before_insert.sql');
  const jsonDir = path.join(backupDir, 'json_snapshot');

  if (fs.existsSync(sqlBackupFile)) {
    const stat = fs.statSync(sqlBackupFile);
    console.log(`[SQL DUMP] File: ${path.basename(sqlBackupFile)}`);
    console.log(`  -> Dung lượng: ${(stat.size / 1024).toFixed(2)} KB (${stat.size} bytes)`);
    console.log(`  -> Thời gian tạo: ${stat.mtime.toLocaleString('vi-VN')}`);
  } else {
    console.log(`[SQL DUMP] ⚠️ Không tìm thấy file ${sqlBackupFile}`);
  }

  if (fs.existsSync(jsonDir)) {
    console.log(`\n[JSON SNAPSHOTS] Thư mục: ${jsonDir}`);
    const files = fs.readdirSync(jsonDir);
    for (const f of files) {
      const fPath = path.join(jsonDir, f);
      const stat = fs.statSync(fPath);
      let countStr = '';
      try {
        const content = JSON.parse(fs.readFileSync(fPath, 'utf-8'));
        if (Array.isArray(content)) {
          countStr = ` (${content.length} records)`;
        }
      } catch (e) {
        countStr = ' (raw JSON)';
      }
      console.log(`  -> ${f}: ${(stat.size / 1024).toFixed(2)} KB${countStr}`);
    }
  } else {
    console.log(`[JSON SNAPSHOTS] ⚠️ Không tìm thấy thư mục ${jsonDir}`);
  }

  // 2. KIỂM TRA DATABASE HIỆN TẠI (POSTGRESQL)
  console.log('\n--- 2. KIỂM TRA DATABASE POSTGRESQL HIỆN TẠI ---');
  
  const userCount = await prisma.user.count();
  const subPlanCount = await prisma.subscriptionPlan.count();
  const userSubCount = await prisma.userSubscription.count();
  const examCount = await prisma.exam.count();
  const examPartCount = await prisma.examPart.count();
  const questionCount = await prisma.question.count();
  const dictationLessonCount = await prisma.dictationLesson.count();
  const dictationSentenceCount = await prisma.dictationSentence.count();
  const examSubmissionCount = await prisma.examSubmission.count();

  console.log(`• Users (Người dùng):           ${userCount}`);
  console.log(`• Subscription Plans:           ${subPlanCount}`);
  console.log(`• User Subscriptions:           ${userSubCount}`);
  console.log(`• Exams (Đề thi):               ${examCount}`);
  console.log(`• Exam Parts (Phần thi):        ${examPartCount}`);
  console.log(`• Questions (Câu hỏi):          ${questionCount}`);
  console.log(`• Dictation Lessons (Bài chép): ${dictationLessonCount}`);
  console.log(`• Dictation Sentences (Câu):    ${dictationSentenceCount}`);
  console.log(`• Exam Submissions:             ${examSubmissionCount}`);

  // Phân tích Exam theo Skill
  console.log('\n--- 3. PHÂN BỐ ĐỀ THI THEO KỸ NĂNG (EXAM SKILLS) ---');
  const examsBySkill = await prisma.exam.groupBy({
    by: ['skill'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  for (const item of examsBySkill) {
    console.log(`  - Skill [${item.skill}]: ${item._count.id} đề`);
  }

  // Phân tích Exam theo Source
  console.log('\n--- 4. NGUỒN GỐC DỮ LIỆU ĐỀ THI (SOURCE) ---');
  const examsBySource = await prisma.exam.groupBy({
    by: ['source'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  for (const item of examsBySource) {
    console.log(`  - Nguồn [${item.source || 'NULL'}]: ${item._count.id} đề`);
  }

  // Phân tích Dictation Lessons theo Level
  console.log('\n--- 5. BÀI HỌC CHÉP CHÍNH TẢ THEO LEVEL ---');
  const dictationsByLevel = await prisma.dictationLesson.groupBy({
    by: ['level'],
    _count: { id: true },
  });
  for (const item of dictationsByLevel) {
    console.log(`  - Level [${item.level}]: ${item._count.id} bài`);
  }

  // Phân tích Question theo Type
  console.log('\n--- 6. LOẠI CÂU HỎI (QUESTION TYPES) ---');
  const questionsByType = await prisma.question.groupBy({
    by: ['question_type'],
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } }
  });
  for (const item of questionsByType) {
    console.log(`  - Type [${item.question_type}]: ${item._count.id} câu hỏi`);
  }

  // 7. KIỂM TRA MẪU ĐỀ FULL TEST VÀ KỸ NĂNG
  console.log('\n--- 7. KIỂM TRA MẪU ĐỀ THI FULL TEST & AUDIO/OPTIONS ---');
  const sampleFullTest = await prisma.exam.findFirst({
    where: { title: { contains: 'Full Test 01' } },
    include: {
      parts: {
        orderBy: { part_number: 'asc' },
        include: {
          questions: {
            take: 2
          }
        }
      }
    }
  });

  if (sampleFullTest) {
    const totalQ = sampleFullTest.parts.reduce((sum, p) => sum + p.questions.length, 0);
    console.log(`\nSample: "${sampleFullTest.title}"`);
    console.log(`  - ID: ${sampleFullTest.id}`);
    console.log(`  - Số parts: ${sampleFullTest.parts.length} parts`);
    console.log(`  - Thời lượng: ${sampleFullTest.duration_minutes} phút`);
    console.log(`  - Skill: ${sampleFullTest.skill}, Type: ${sampleFullTest.type}`);
    console.log('  - Danh sách 5 parts đầu:');
    for (const p of sampleFullTest.parts.slice(0, 5)) {
      console.log(`     Part ${p.part_number}: ${p.title} (Có ${p.questions.length} câu đã load demo)`);
    }
  }

  // Sample Dictation
  const sampleDictation = await prisma.dictationLesson.findFirst({
    where: { level: 'FOUNDATION' },
    include: {
      sentences: {
        take: 3
      }
    }
  });
  if (sampleDictation) {
    console.log(`\nSample Dictation: "${sampleDictation.title}" (Level: ${sampleDictation.level})`);
    console.log(`  - Audio URL: ${sampleDictation.audio_url || 'Per-sentence'}`);
    console.log(`  - Số câu sample: ${sampleDictation.sentences.length}`);
    for (const s of sampleDictation.sentences) {
      console.log(`     #${s.order_index} [${s.duration_seconds}s]: "${s.transcript}"`);
      console.log(`       Audio: ${s.audio_url ? s.audio_url.substring(0, 70) + '...' : 'None'}`);
    }
  }

  // Sample Question across skills
  console.log('\n--- 8. KIỂM TRA MẪU CÂU HỎI & ĐÁP ÁN/AUDIO THEO KỸ NĂNG ---');
  const sampleListeningPart = await prisma.examPart.findFirst({
    where: { audio_url: { not: null } },
    include: {
      exam: true,
      questions: { take: 1 }
    }
  });
  if (sampleListeningPart) {
    console.log(`\nListening Sample Part & Question:`);
    console.log(`  - Đề: ${sampleListeningPart.exam.title}`);
    console.log(`  - Part: ${sampleListeningPart.title}`);
    console.log(`  - Audio URL: ${sampleListeningPart.audio_url?.substring(0, 80)}...`);
    if (sampleListeningPart.questions.length > 0) {
      const q = sampleListeningPart.questions[0];
      console.log(`  - Prompt: ${q.prompt?.substring(0, 80)}...`);
      console.log(`  - Options: ${JSON.stringify(q.options)}`);
      console.log(`  - Correct Answer: ${q.correct_answer}`);
    }
  }

  const sampleReading = await prisma.question.findFirst({
    where: { question_type: 'GAP_FILL' },
    include: { part: { include: { exam: true } } }
  });
  if (sampleReading) {
    console.log(`\nReading GAP_FILL Sample Question:`);
    console.log(`  - Đề: ${sampleReading.part.exam.title}`);
    console.log(`  - Part: ${sampleReading.part.title}`);
    console.log(`  - Prompt: ${sampleReading.prompt?.substring(0, 80)}...`);
    console.log(`  - Options: ${JSON.stringify(sampleReading.options)}`);
    console.log(`  - Correct Answer: ${sampleReading.correct_answer}`);
  }

  console.log('\n================================================================');
  console.log('KẾT LUẬN KIỂM TRA: HOÀN TẤT THÀNH CÔNG');
  console.log('================================================================');
}

main()
  .catch((e) => {
    console.error('Error during check:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
