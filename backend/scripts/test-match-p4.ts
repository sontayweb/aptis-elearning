import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function testMatchP4() {
  const catalogPath = path.resolve(__dirname, '../../tools/data/aptiskytich/exam_sets_catalog.json');
  const questionsPath = path.resolve(__dirname, '../../tools/data/aptiskytich/all_exam_questions.json');

  const catalog: any[] = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
  const allQuestions: any[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));

  const catMap = new Map<string, any>();
  for (const c of catalog) {
    catMap.set(c.id, c);
  }

  const p4Questions = allQuestions.filter(
    (q) => q.question_type === 'writing' && q.extra_data && (q.extra_data.formalEmail || q.extra_data.informalEmail || q.extra_data.scenarioEmail)
  );
  console.log('Total P4 questions in JSON with email extra_data:', p4Questions.length);

  const titleToP4 = new Map<string, any>();
  for (const q of p4Questions) {
    const cat = catMap.get(q.exam_set_id);
    if (cat) {
      titleToP4.set(cat.title.trim().toLowerCase(), q);
      const m = cat.title.match(/^(.*?)\s*-\s*Writing Part\s*4/i);
      if (m) {
        titleToP4.set(m[1].trim().toLowerCase(), q);
      }
    }
  }

  const dbSubExams = await prisma.exam.findMany({
    where: { skill: 'WRITING', title: { contains: 'Writing Part 4' } },
    include: { parts: { include: { questions: true } } }
  });

  let matchedSub = 0;
  for (const ex of dbSubExams) {
    const qData = titleToP4.get(ex.title.trim().toLowerCase());
    if (qData) matchedSub++;
  }
  console.log(`Matched DB P4 sub-exams: ${matchedSub} / ${dbSubExams.length}`);

  const dbFullExams = await prisma.exam.findMany({
    where: { skill: 'WRITING', title: { contains: 'Full Writing' } },
    include: { parts: { include: { questions: true } } }
  });

  let matchedFull = 0;
  for (const ex of dbFullExams) {
    const m = ex.title.match(/^(.*?)\s*—\s*Full Writing/i);
    const club = m ? m[1].trim().toLowerCase() : ex.title.trim().toLowerCase();
    const qData = titleToP4.get(club);
    if (qData) matchedFull++;
  }
  console.log(`Matched DB P4 Full exams: ${matchedFull} / ${dbFullExams.length}`);

  await prisma.$disconnect();
}

testMatchP4().catch(console.error);
