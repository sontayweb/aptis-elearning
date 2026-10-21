const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const p3_single1 = await prisma.examPart.updateMany({
    where: {
      image_url: '/uploads/speaking/part3/image1.jpg'
    },
    data: {
      image_url: '/uploads/speaking/part3/image1.jpg, /uploads/speaking/part3/image4.jpg'
    }
  });
  console.log('Updated image1.jpg to include image4.jpg:', p3_single1.count);

  const p3_single2 = await prisma.examPart.updateMany({
    where: {
      image_url: '/uploads/speaking/part3/image2.png'
    },
    data: {
      image_url: '/uploads/speaking/part3/image2.png, /uploads/speaking/part3/image8.png'
    }
  });
  console.log('Updated image2.png to include image8.png:', p3_single2.count);

  const p3_single3 = await prisma.examPart.updateMany({
    where: {
      image_url: '/uploads/speaking/part3/image3.png'
    },
    data: {
      image_url: '/uploads/speaking/part3/image3.png, /uploads/speaking/part3/image7.png'
    }
  });
  console.log('Updated image3.png to include image7.png:', p3_single3.count);

  const p3_single5 = await prisma.examPart.updateMany({
    where: {
      image_url: '/uploads/speaking/part3/image5.png'
    },
    data: {
      image_url: '/uploads/speaking/part3/image5.png, /uploads/speaking/part3/beach.jpg'
    }
  });
  console.log('Updated image5.png to include beach.jpg:', p3_single5.count);

  // Update thithuaptis.com to local speaking uploads if any
  const thithu = await prisma.examPart.updateMany({
    where: {
      image_url: { contains: 'thithuaptis.com' }
    },
    data: {
      image_url: '/uploads/speaking/part3/image1.jpg, /uploads/speaking/part3/image4.jpg'
    }
  });
  console.log('Updated thithuaptis.com dead URLs to local:', thithu.count);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
