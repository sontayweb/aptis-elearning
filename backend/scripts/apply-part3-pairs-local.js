const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updatePart3Local() {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'part3_single_images_audit.json'), 'utf-8'));
  console.log(`Updating ${data.length} Part 3s on local DB...`);

  let count = 0;
  for (const item of data) {
    try {
      await prisma.examPart.update({
        where: { id: item.part_id },
        data: { image_url: item.suggested }
      });
      count++;
    } catch (e) {
      // Part may not exist locally if local DB has fewer records
    }
  }

  console.log(`Local DB updated: ${count} Part 3s with dual images.`);
}

updatePart3Local()
  .then(() => prisma.$disconnect())
  .catch((err) => {
    console.error(err);
    prisma.$disconnect();
  });
