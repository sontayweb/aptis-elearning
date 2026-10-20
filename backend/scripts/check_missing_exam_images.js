const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  const parts = await prisma.examPart.findMany({
    where: {
      image_url: { not: null }
    },
    include: {
      exam: {
        select: { id: true, title: true, skill: true }
      }
    }
  });

  console.log(`Found ${parts.length} exam parts with image_url:`);
  let missingCount = 0;
  parts.forEach(p => {
    const rawUrl = p.image_url;
    // Check both frontend/public and backend/uploads
    const frontendPublicPath = path.resolve(__dirname, '../../frontend/public', rawUrl.replace(/^\/+/, ''));
    const backendUploadPath = path.resolve(__dirname, '../uploads', rawUrl.replace(/^\/?(uploads\/)?/, ''));
    const feExists = fs.existsSync(frontendPublicPath);
    const beExists = fs.existsSync(backendUploadPath);

    if (!feExists && !beExists) {
      missingCount++;
      console.log(`❌ MISSING [Exam: ${p.exam.title} (${p.exam.skill})] Part ${p.part_number} (${p.title}): ${rawUrl}`);
    } else {
      // console.log(`✅ OK: ${rawUrl}`);
    }
  });
  console.log(`\nTotal Missing Images: ${missingCount} / ${parts.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
