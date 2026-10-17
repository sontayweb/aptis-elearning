import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function testMatch() {
  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const questionsPath = path.resolve(__dirname, '../../tools/data/aptiskytich/all_exam_questions.json');

  const catalog: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const allQuestions: any[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  // Map catalog ID -> catalog item
  const catMap = new Map<string, any>();
  for (const c of catalog) {
    catMap.set(c.id, c);
  }

  // Filter writing Part 2 questions
  const p2Questions = allQuestions.filter(
    (q) => q.question_type === 'writing' && q.extra_data && q.extra_data.question
  );
  console.log('Total P2 questions in JSON with extra_data.question:', p2Questions.length);

  // Group by catalog title
  const titleToP2 = new Map<string, any>();
  for (const q of p2Questions) {
    const cat = catMap.get(q.exam_set_id);
    if (cat) {
      titleToP2.set(cat.title.trim().toLowerCase(), q);
      // Also extract club name: "Art club - Writing Part 2" -> "Art club"
      const m = cat.title.match(/^(.*?)\s*-\s*Writing Part\s*2/i);
      if (m) {
        titleToP2.set(m[1].trim().toLowerCase(), q);
      }
    }
  }

  console.log('Mapped distinct titles/clubs:', titleToP2.size);

  // Test match with DB sub-exams
  const dbSubExams = await prisma.exam.findMany({
    where: { skill: 'WRITING', title: { contains: 'Writing Part 2' } },
    include: { parts: { include: { questions: true } } }
  });

  let matchedSub = 0;
  for (const ex of dbSubExams) {
    const qData = titleToP2.get(ex.title.trim().toLowerCase());
    if (qData) {
      matchedSub++;
    } else {
      console.log('Unmatched DB sub-exam:', ex.title);
    }
  }
  console.log(`Matched DB sub-exams: ${matchedSub} / ${dbSubExams.length}`);

  // Test match with DB Full exams
  const dbFullExams = await prisma.exam.findMany({
    where: { skill: 'WRITING', title: { contains: 'Full Writing' } },
    include: { parts: { include: { questions: true } } }
  });

  let matchedFull = 0;
  for (const ex of dbFullExams) {
    const m = ex.title.match(/^(.*?)\s*—\s*Full Writing/i);
    const club = m ? m[1].trim().toLowerCase() : ex.title.trim().toLowerCase();
    const qData = titleToP2.get(club);
    if (qData) {
      matchedFull++;
    } else {
      console.log('Unmatched DB Full exam:', ex.title, '| club:', club);
    }
  }
  console.log(`Matched DB Full exams: ${matchedFull} / ${dbFullExams.length}`);

  await prisma.$disconnect();
}

testMatch().catch(console.error);
