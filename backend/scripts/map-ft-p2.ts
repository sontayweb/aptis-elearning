import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  const toolsDataDir = path.resolve(__dirname, '../../tools/data/aptiskytich');
  const catalog = JSON.parse(fs.readFileSync(path.join(toolsDataDir, 'exam_sets_catalog.json'), 'utf-8'));
  const allQuestions = JSON.parse(fs.readFileSync(path.join(toolsDataDir, 'all_exam_questions.json'), 'utf-8'));

  const catMap = new Map();
  for (const c of catalog) catMap.set(c.id, c);

  // Map each writing question by exam_set_id
  const p2Questions = allQuestions.filter(
    (q: any) => q.question_type === 'writing' && q.extra_data && q.extra_data.question
  );

  const clubToP2 = new Map();
  for (const q of p2Questions) {
    const cat = catMap.get(q.exam_set_id);
    if (cat) {
      const m = cat.title.match(/^(.*?)\s*-\s*Writing Part\s*2/i);
      const club = m ? m[1].trim().toLowerCase() : cat.title.trim().toLowerCase();
      clubToP2.set(club, q);
    }
  }

  // Find all questions in DB where exam.skill == 'FULL_TEST' and part title has 'WRITING - Part 2'
  const ftQuestions = await prisma.question.findMany({
    where: {
      part: {
        exam: { skill: 'FULL_TEST' },
        title: { contains: 'Part 2' }
      }
    },
    include: {
      part: {
        include: { exam: true }
      }
    }
  });

  console.log('Total Full Test Writing Part 2 questions found:', ftQuestions.length);
  for (const q of ftQuestions) {
    console.log(`\nExam: "${q.part.exam.title}"`);
    console.log(`  Current prompt: "${q.prompt}"`);

    // Detect club name from prompt or instructions
    const fullText = `${q.prompt} ${q.part.instructions || ''}`.toLowerCase();
    let matchedQ = null;
    let matchedClub = '';

    for (const [club, p2Q] of clubToP2.entries()) {
      if (fullText.includes(club)) {
        matchedQ = p2Q;
        matchedClub = club;
        break;
      }
    }

    if (matchedQ) {
      console.log(`  -> Matched Club: "${matchedClub}"`);
      console.log(`  -> Real Question: "${matchedQ.extra_data.question}"`);
      console.log(`  -> Instruction: "${matchedQ.extra_data.instruction}"`);
    } else {
      console.log(`  -> UNMATCHED!`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
