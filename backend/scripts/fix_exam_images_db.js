const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p1Updated = await prisma.examPart.updateMany({
    where: {
      image_url: '/uploads/speaking/part3/image1.png'
    },
    data: {
      image_url: '/uploads/speaking/part3/image1.jpg'
    }
  });
  console.log(`Updated image1.png -> image1.jpg: ${p1Updated.count} parts`);

  const p4Updated = await prisma.examPart.updateMany({
    where: {
      image_url: '/uploads/speaking/part3/image4.png'
    },
    data: {
      image_url: '/uploads/speaking/part3/image4.jpg'
    }
  });
  console.log(`Updated image4.png -> image4.jpg: ${p4Updated.count} parts`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
