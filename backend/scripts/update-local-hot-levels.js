const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLocal() {
  const exams = await prisma.exam.findMany({
    select: { id: true, title: true, hot_level: true }
  });

  const t3 = [
    'film', 'singer', 'the famous singer', 'new coffee shop', 'my visit to a new coffee shop',
    'busy coffee', 'end of term project', 'the first american woman in space', 'weekend activities',
    'movies then and now', 'the history of transportation', 'childhood', 'music festival',
    'games from childhood', 'technology in childhood', 'extreme sports', 'mountain',
    'four-day week', 'women mathematicians', 'woman mathematics', 'mountain summits'
  ];

  const t2 = [
    'family sport day', 'family sports day', 'mae - the math girl', 'cultural festival',
    'college welcoming day', 'childhood memories', 'free time activity', 'job and trainning',
    'job and training', 'volunteering', 'career'
  ];

  const t1 = [
    'public transportations', 'writing about a place', 'music show at the park'
  ];

  let updated = 0;
  for (const e of exams) {
    const t = e.title.toLowerCase();
    let lvl = null;
    for (const k of t3) {
      if (t.includes(k)) { lvl = 3; break; }
    }
    if (lvl === null) {
      for (const k of t2) {
        if (t.includes(k)) { lvl = 2; break; }
      }
    }
    if (lvl === null) {
      for (const k of t1) {
        if (t.includes(k)) { lvl = 1; break; }
      }
    }

    if (lvl !== null && lvl !== e.hot_level) {
      await prisma.exam.update({
        where: { id: e.id },
        data: { hot_level: lvl }
      });
      updated++;
    }
  }

  console.log(`Local DB updated: ${updated} exams.`);
  const stats = await prisma.exam.groupBy({
    by: ['hot_level'],
    _count: { id: true }
  });
  console.log('Local hot level stats:', stats);
}

updateLocal()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
