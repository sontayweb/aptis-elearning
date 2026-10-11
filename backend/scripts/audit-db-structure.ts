import { PrismaClient, ExamSkill } from '@prisma/client';

const prisma = new PrismaClient();

async function auditDatabaseStructure() {
  console.log('================ AUDIT HỆ THỐNG DỮ LIỆU ĐỀ THI ================');
  
  const skills: ExamSkill[] = [
    ExamSkill.SPEAKING,
    ExamSkill.WRITING,
    ExamSkill.READING,
    ExamSkill.LISTENING,
    ExamSkill.GRAMMAR_VOCABULARY,
    ExamSkill.FULL_TEST,
  ];

  for (const skill of skills) {
    const totalExams = await prisma.exam.count({ where: { skill } });
    const exams = await prisma.exam.findMany({
      where: { skill },
      select: {
        id: true,
        title: true,
        parts: {
          select: {
            id: true,
            part_number: true,
            title: true,
            instructions: true,
            passage_text: true,
            _count: { select: { questions: true } },
          },
        },
      },
      take: 20,
    });

    const partCountDistribution: Record<number, number> = {};
    for (const e of exams) {
      const pCount = e.parts.length;
      partCountDistribution[pCount] = (partCountDistribution[pCount] || 0) + 1;
    }

    console.log(`\n--- Skill: ${skill} (Tổng số đề: ${totalExams}) ---`);
    console.log('Phân bố số Part trong mẫu 20 đề:', JSON.stringify(partCountDistribution));
    
    // Mẫu 3 đề điển hình
    for (const e of exams.slice(0, 3)) {
      console.log(`  * Đề: "${e.title}" [${e.id}] (Số Part: ${e.parts.length})`);
      for (const p of e.parts) {
        console.log(`     - Part ${p.part_number}: "${p.title}" (${p._count.questions} questions) | Has passage: ${Boolean(p.passage_text)} | Has inst: ${Boolean(p.instructions)}`);
      }
    }
  }
}

auditDatabaseStructure().finally(() => prisma.$disconnect());
