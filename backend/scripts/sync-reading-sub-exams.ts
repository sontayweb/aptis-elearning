import { PrismaClient, QuestionType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('=== SYNCING 32 FULL READING EXAMS INTO SINGLE-PART EXAMS ===\n');

  for (let i = 1; i <= 32; i++) {
    const code = i < 10 ? `0${i}` : `${i}`;
    const fullExamTitle = `Đề ${code} — Full Reading · 4 Parts`;

    const fullExam = await prisma.exam.findFirst({
      where: { title: fullExamTitle },
      include: {
        parts: {
          include: {
            questions: true,
          },
          orderBy: { part_number: 'asc' },
        },
      },
    });

    if (!fullExam) {
      console.warn(`⚠️ Không tìm thấy Full Exam "${fullExamTitle}"`);
      continue;
    }

    const p1 = fullExam.parts.find((p) => p.part_number === 1);
    const p2 = fullExam.parts.find((p) => p.part_number === 2);
    const p3 = fullExam.parts.find((p) => p.part_number === 4); // Opinion Matching
    const p4 = fullExam.parts.find((p) => p.part_number === 5); // Long Reading

    const subExams = await prisma.exam.findMany({
      where: {
        skill: 'READING',
        title: { startsWith: `Đề ${code} -` },
      },
      include: {
        parts: {
          include: { questions: true },
        },
      },
    });

    console.log(`\n[Đề ${code}] Tìm thấy ${subExams.length} sub-exams:`);

    for (const sub of subExams) {
      const lower = sub.title.toLowerCase();
      let sourcePart: typeof p1 | null = null;
      let targetPartTitle = '';

      if (lower.includes('part 1') || lower.includes('gap')) {
        sourcePart = p1;
        targetPartTitle = 'Part 1 – Sentence comprehension';
      } else if (
        lower.includes('tom harper') ||
        lower.includes('delivery') ||
        lower.includes('cohesion') ||
        lower.includes('paperwork') ||
        lower.includes('hand in') ||
        lower.includes('report submission') ||
        lower.includes('participate in a race') ||
        lower.includes('making films') ||
        lower.includes('writing about a place') ||
        lower.includes('coffee shop') ||
        lower.includes('welcome day') ||
        lower.includes('cultural festival') ||
        lower.includes('fire instructions') ||
        lower.includes('family sports') ||
        lower.includes('transportation') ||
        lower.includes('instructions for new') ||
        lower.includes('internet of things') ||
        lower.includes('open day') ||
        lower.includes('animal hospital') ||
        lower.includes('artificial intelligence') ||
        lower.includes('betty barr') ||
        lower.includes('key card') ||
        lower.includes('potatoes') ||
        lower.includes('public cycle') ||
        lower.includes('football player') ||
        lower.includes('natural history') ||
        lower.includes('healthy eating') ||
        lower.includes('famous singer') ||
        lower.includes('tourism') ||
        lower.includes('restaurant + end') ||
        lower.includes('music show') ||
        lower.includes('wellness fair')
      ) {
        sourcePart = p2;
        targetPartTitle = 'Part 2 + 3 – Text cohesion';
      } else if (
        lower.includes('opinions') ||
        lower.includes('opinion') ||
        lower.includes('restaurant') ||
        lower.includes('books') ||
        lower.includes('city') ||
        lower.includes('art') ||
        lower.includes('station') ||
        lower.includes('games') ||
        lower.includes('extreme sports') ||
        lower.includes('work-life') ||
        lower.includes('technology in') ||
        lower.includes('plans for') ||
        lower.includes('music festival') ||
        lower.includes('volunteering') ||
        lower.includes('holiday') ||
        lower.includes('sports') ||
        lower.includes('island') ||
        lower.includes('watching television') ||
        lower.includes('eating and cooking') ||
        lower.includes('job and training') ||
        lower.includes('flying') ||
        lower.includes('zoo')
      ) {
        sourcePart = p3;
        targetPartTitle = 'Part 4 – Opinion matching';
      } else {
        sourcePart = p4;
        targetPartTitle = 'Part 5 – Long reading';
      }

      if (!sourcePart) {
        console.warn(`  ⚠️ Không tìm thấy sourcePart cho: ${sub.title}`);
        continue;
      }

      // 1. Xóa các bài nộp cũ của sub-exam (tự động cascade xóa SubmissionAnswer)
      await prisma.examSubmission.deleteMany({ where: { exam_id: sub.id } });

      // 2. Xóa các question và part cũ
      for (const sp of sub.parts) {
        await prisma.question.deleteMany({ where: { part_id: sp.id } });
      }
      await prisma.examPart.deleteMany({ where: { exam_id: sub.id } });

      // 3. Tạo lại part & questions với dữ liệu từ sourcePart
      const newPart = await prisma.examPart.create({
        data: {
          exam_id: sub.id,
          part_number: 1,
          title: targetPartTitle,
          instructions: sourcePart.instructions,
          passage_text: sourcePart.passage_text,
          audio_url: sourcePart.audio_url,
          image_url: sourcePart.image_url,
        },
      });

      // 4. Tạo lại các câu hỏi
      for (const q of sourcePart.questions) {
        await prisma.question.create({
          data: {
            part_id: newPart.id,
            question_number: q.question_number,
            question_type: q.question_type,
            prompt: q.prompt,
            options: q.options as any,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            max_score: q.max_score,
          },
        });
      }

      console.log(`  ✅ Đã đồng bộ [${targetPartTitle}] (${sourcePart.questions.length} câu) -> "${sub.title}"`);
    }
  }

  console.log('\n🎉 HOÀN TẤT ĐỒNG BỘ TẤT CẢ SUB-EXAMS READING!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
