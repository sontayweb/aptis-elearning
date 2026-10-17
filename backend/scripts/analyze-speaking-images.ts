import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const parts = await prisma.examPart.findMany({
    where: {
      OR: [
        { exam: { skill: 'SPEAKING' } },
        { title: { contains: 'SPEAKING' } },
        { title: { contains: 'Part 2' } },
        { title: { contains: 'Part 3' } },
      ]
    },
    select: {
      id: true,
      title: true,
      part_number: true,
      image_url: true,
      exam: {
        select: { id: true, title: true, skill: true }
      },
      questions: {
        select: { id: true, prompt: true, options: true }
      }
    }
  });

  console.log(`Found ${parts.length} parts.`);
  const commaSeparated: any[] = [];
  const relativeUrls: any[] = [];
  const nullImagesP2P3: any[] = [];
  const simpleFilenames: any[] = [];
  const fullUrls: any[] = [];

  for (const p of parts) {
    const isP2orP3 = p.part_number === 2 || p.part_number === 3 ||
      p.title.toLowerCase().includes('part 2') || p.title.toLowerCase().includes('part 3');
    if (!isP2orP3) continue;

    const img = p.image_url || '';
    if (!img) {
      nullImagesP2P3.push({ exam: p.exam.title, part: p.title });
    } else if (img.includes(',')) {
      commaSeparated.push({ exam: p.exam.title, part: p.title, img });
    } else if (img.startsWith('http')) {
      fullUrls.push({ exam: p.exam.title, part: p.title, img });
    } else if (img.includes('/') || img.includes('\\')) {
      relativeUrls.push({ exam: p.exam.title, part: p.title, img });
    } else {
      simpleFilenames.push({ exam: p.exam.title, part: p.title, img });
    }
  }

  console.log('--- Image analysis for Speaking Part 2 & 3 ---');
  console.log('Comma-separated images (2 images in 1 string):', commaSeparated.length);
  if (commaSeparated.length > 0) {
    console.log('  Sample:', commaSeparated[0]);
  }
  console.log('Full URLs (http/https):', fullUrls.length);
  if (fullUrls.length > 0) {
    console.log('  Sample:', fullUrls[0]);
  }
  console.log('Relative paths (speaking/...):', relativeUrls.length);
  if (relativeUrls.length > 0) {
    console.log('  Sample:', relativeUrls[0]);
  }
  console.log('Simple filenames (7.png, de07_1.png):', simpleFilenames.length);
  if (simpleFilenames.length > 0) {
    console.log('  Sample:', simpleFilenames[0]);
  }
  console.log('Null or empty image_url:', nullImagesP2P3.length);
  if (nullImagesP2P3.length > 0) {
    console.log('  Sample:', nullImagesP2P3.slice(0, 5));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
