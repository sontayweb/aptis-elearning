import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const skills = ['SPEAKING'];
  for (const skill of skills) {
    const exams = await prisma.exam.findMany({
      where: { skill: skill as any },
      include: {
        parts: {
          include: {
            questions: true,
          },
          orderBy: { part_number: 'asc' }
        }
      }
    });

    console.log(`\n==================================================`);
    console.log(`SKILL: ${skill} (Tổng số đề: ${exams.length})`);
    console.log(`==================================================`);

    const partCountMap: Record<number, number> = {};
    const partNumsDist: Record<string, number> = {};
    const questionCountDist: Record<number, number> = {};

    for (const e of exams) {
      const pc = e.parts.length;
      partCountMap[pc] = (partCountMap[pc] || 0) + 1;
      const partNums = e.parts.map(p => p.part_number).join(',');
      partNumsDist[partNums] = (partNumsDist[partNums] || 0) + 1;

      const totalQ = e.parts.reduce((sum, p) => sum + p.questions.length, 0);
      questionCountDist[totalQ] = (questionCountDist[totalQ] || 0) + 1;
    }

    console.log('1. Phân bố số lượng Part trong 1 đề:');
    Object.keys(partCountMap).sort((a,b) => Number(a)-Number(b)).forEach(k => {
      console.log(`   - Có ${k} Part: ${partCountMap[Number(k)]} đề`);
    });

    console.log('2. Phân bố cấu hình part_number:');
    Object.entries(partNumsDist).forEach(([pattern, count]) => {
      console.log(`   - Cấu trúc parts [${pattern}]: ${count} đề`);
    });

    console.log('3. Mẫu 3 đề tiêu biểu:');
    exams.slice(0, 3).forEach((e, idx) => {
      console.log(`   Mẫu ${idx + 1}: ID: ${e.id} | Title: "${e.title}" | Parts: ${e.parts.length}`);
      e.parts.forEach(p => {
        console.log(`      -> Part ${p.part_number} (${p.title}): ${p.questions.length} questions | passage_text: ${p.passage_text ? 'CÓ (' + p.passage_text.length + ' chars)' : 'KHÔNG'}`);
      });
    });
  }

  await prisma.$disconnect();
}

check().catch(console.error);
