import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ngân hàng 25 chủ đề tranh Part 2 chuẩn khảo thí Aptis
const PART2_BANK = [
  { id: 1, title: 'Nhóm người trong phòng họp', img: '/uploads/speaking/part2/image15.png', keywords: ['meeting', 'office', 'colleagues', 'conference', 'phòng họp', 'đồng nghiệp'] },
  { id: 2, title: 'Hai vợ chồng ở phòng khách', img: '/uploads/speaking/part2/image22.png', keywords: ['living room', 'couple', 'sofa', 'husband', 'wife', 'phòng khách', 'vợ chồng'] },
  { id: 3, title: 'Cô gái đi siêu thị', img: '/uploads/speaking/part2/image18.png', keywords: ['supermarket', 'grocery', 'shopping cart', 'vegetables', 'siêu thị', 'mua sắm'] },
  { id: 4, title: 'Gia đình trong phòng bếp', img: '/uploads/speaking/part2/image9.png', keywords: ['kitchen', 'cooking', 'family meal', 'chef', 'phòng bếp', 'nấu ăn'] },
  { id: 5, title: 'Nhóm người trên xe khách', img: '/uploads/speaking/part2/image10.png', keywords: ['bus', 'coach', 'passenger', 'travel by bus', 'xe khách', 'xe buýt'] },
  { id: 6, title: 'Hai mẹ con đang cưỡi ngựa', img: '/uploads/speaking/part2/image16.png', keywords: ['horse', 'riding horse', 'equestrian', 'cưỡi ngựa'] },
  { id: 7, title: 'Gia đình trên ô tô', img: '/uploads/speaking/part2/image23.png', keywords: ['car', 'driving', 'family car', 'road trip', 'ô tô', 'lái xe'] },
  { id: 8, title: 'Bữa tiệc sinh nhật', img: '/uploads/speaking/part2/image11.png', keywords: ['birthday', 'cake', 'party', 'candles', 'sinh nhật', 'tiệc'] },
  { id: 9, title: 'Nhóm bạn ở nhà hàng', img: '/uploads/speaking/part2/image12.png', keywords: ['restaurant', 'eating out', 'friends eat', 'chinese restaurant', 'nhà hàng', 'ăn uống'] },
  { id: 10, title: 'Gia đình chơi ở công viên', img: '/uploads/speaking/part2/image7.png', keywords: ['park', 'picnic', 'grass', 'outdoor playing', 'công viên'] },
  { id: 11, title: 'Thể thao ngoài trời', img: '/uploads/speaking/part2/image2.png', keywords: ['sports', 'football', 'soccer', 'running', 'bóng đá', 'thể thao'] },
  { id: 12, title: 'Lễ hội đường phố', img: '/uploads/speaking/part2/image24.png', keywords: ['festival', 'street', 'carnival', 'crowd', 'lễ hội'] },
  { id: 13, title: 'Hai bố con ăn sáng', img: '/uploads/speaking/part2/image6.png', keywords: ['breakfast', 'father and son', 'morning meal', 'ăn sáng', 'bố con'] },
  { id: 14, title: 'Đọc sách thư viện', img: '/uploads/speaking/part2/image19.png', keywords: ['library', 'reading books', 'bookshelf', 'thư viện', 'đọc sách'] },
  { id: 15, title: 'Khám bác sĩ', img: '/uploads/speaking/part2/image13.png', keywords: ['doctor', 'hospital', 'patient', 'clinic', 'bác sĩ', 'bệnh viện'] },
  { id: 16, title: 'Làm vườn cây cảnh', img: '/uploads/speaking/part2/image4.png', keywords: ['gardening', 'plants', 'flowers', 'watering', 'làm vườn', 'trồng cây'] },
  { id: 17, title: 'Bãi biển mùa hè', img: '/uploads/speaking/part2/image3.png', keywords: ['beach', 'sea', 'summer holiday', 'sand', 'bãi biển'] },
  { id: 18, title: 'Hai bố con chơi đùa', img: '/uploads/speaking/part2/image14.png', keywords: ['playing with dad', 'father daughter', 'toys', 'chơi với bố'] },
  { id: 19, title: 'Nhóm người ở rạp chiếu phim', img: '/uploads/speaking/part2/image1.png', keywords: ['cinema', 'movie', 'popcorn', 'theater', 'rạp phim', 'xem phim'] },
  { id: 20, title: 'Cô giáo đang dạy học', img: '/uploads/speaking/part2/image17.png', keywords: ['teacher', 'classroom', 'students', 'blackboard', 'lớp học', 'cô giáo', 'giảng dạy'] },
  { id: 21, title: 'Ăn uống cùng gia đình', img: '/uploads/speaking/part2/image8.png', keywords: ['dining', 'family dinner', 'table', 'meal', 'bữa tối gia đình'] },
  { id: 22, title: 'Làm việc máy tính', img: '/uploads/speaking/part2/image21.png', keywords: ['computer', 'laptop', 'typing', 'technology', 'máy tính'] },
  { id: 23, title: 'Đi dạo phố', img: '/uploads/speaking/part2/image5.png', keywords: ['walking street', 'city walk', 'pedestrian', 'dạo phố'] },
  { id: 24, title: 'Cô gái ngồi trên thuyền ngắm cảnh', img: '/uploads/speaking/part2/image20.png', keywords: ['boat', 'lake', 'river', 'scenery', 'thuyền', 'chèo thuyền'] },
  { id: 25, title: 'Người đàn ông đang đứng đợi tàu', img: '/uploads/speaking/part2/image25.png', keywords: ['train station', 'waiting for train', 'platform', 'đợi tàu', 'ga tàu'] },
];

// Ngân hàng 12 cặp tranh Part 3 chuẩn khảo thí Aptis
const PART3_BANK = [
  { id: 1, title: 'Leo núi vs Đi biển', img: '/uploads/speaking/part3/image5.png', keywords: ['mountain', 'beach', 'hiking', 'ocean', 'leo núi', 'bãi biển', 'đảo nhiệt đới'] },
  { id: 2, title: 'Sống cùng gia đình vs Sống một mình', img: '/uploads/speaking/part3/image6.png', keywords: ['live with family', 'live alone', 'apartment', 'house', 'sống một mình', 'sống với gia đình'] },
  { id: 3, title: 'Đi lại bằng ô tô vs Đi bằng tàu hoả', img: '/uploads/speaking/part3/image1.jpg', keywords: ['car', 'train', 'traveling by car', 'travel by train', 'tàu hoả', 'xe ô tô', 'public transport', 'plane'] },
  { id: 4, title: 'Thu hoạch táo vs Tưới cây', img: '/uploads/speaking/part3/image2.png', keywords: ['apple', 'harvest', 'watering plants', 'gardening', 'thu hoạch', 'tưới cây'] },
  { id: 5, title: 'Học nhóm vs Tự học một mình', img: '/uploads/speaking/part3/image3.png', keywords: ['group study', 'study alone', 'classroom', 'self study', 'học nhóm', 'tự học'] },
  { id: 6, title: 'Mua sắm siêu thị vs Mua sắm chợ truyền thống', img: '/uploads/speaking/part3/image14.png', keywords: ['supermarket', 'market', 'grocery shopping', 'traditional market', 'chợ', 'siêu thị'] },
  { id: 7, title: 'Nghe nhạc tai nghe vs Xem ban nhạc biểu diễn', img: '/uploads/speaking/part3/image9.png', keywords: ['listen to music', 'headphones', 'concert', 'band', 'live music', 'nghe nhạc', 'ban nhạc'] },
  { id: 8, title: 'Đọc sách giấy vs Đọc sách điện tử', img: '/uploads/speaking/part3/image11.png', keywords: ['paper book', 'ebook', 'kindle', 'reading', 'sách giấy', 'sách điện tử'] },
  { id: 9, title: 'Trò chuyện dưới tuyết mùa đông vs Tắm nắng mùa hè', img: '/uploads/speaking/part3/image13.png', keywords: ['snow', 'winter', 'sunbathing', 'summer', 'tuyết', 'mùa đông', 'tắm nắng'] },
  { id: 10, title: 'Tập gym thể hình vs Leo núi vận động', img: '/uploads/speaking/part3/image12.png', keywords: ['gym', 'fitness', 'climbing', 'exercise', 'tập gym', 'thể hình'] },
  { id: 11, title: 'Ăn tại nhà vs Ăn ngoài tiệm', img: '/uploads/speaking/part3/image15.png', keywords: ['home cooking', 'eating out', 'fast food', 'healthy food', 'nấu ăn ở nhà', 'ăn ngoài'] },
  { id: 12, title: 'Làm việc tại văn phòng vs Làm việc từ xa (WFH)', img: '/uploads/speaking/part3/image10.png', keywords: ['office work', 'work from home', 'remote work', 'laptop at home', 'văn phòng', 'làm việc tại nhà'] },
];

function scoreMatch(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) {
      score += 10;
    }
  }
  return score;
}

async function main() {
  console.log('--- BẮT ĐẦU CHUẨN HÓA DỮ LIỆU SPEAKING ---');

  // 1. Dọn dẹp Part 4: Xóa toàn bộ image_url của Part 4 (chuẩn Aptis Part 4 KHÔNG có tranh)
  const p4Updated = await prisma.examPart.updateMany({
    where: {
      exam: { skill: 'SPEAKING' },
      OR: [
        { part_number: 4 },
        { title: { contains: 'Part 4', mode: 'insensitive' } },
        { title: { contains: 'Part4', mode: 'insensitive' } }
      ]
    },
    data: {
      image_url: null
    }
  });
  console.log(`[Task 1.1] Đã dọn dẹp ${p4Updated.count} Part 4: image_url -> null hoàn toàn.`);

  // 2. Dọn dẹp Part 1: Xóa image_url của Part 1
  const p1Updated = await prisma.examPart.updateMany({
    where: {
      exam: { skill: 'SPEAKING' },
      OR: [
        { title: { contains: 'Part 1', mode: 'insensitive' } },
        { title: { contains: 'Part1', mode: 'insensitive' } }
      ]
    },
    data: {
      image_url: null
    }
  });
  console.log(`[Task 1.2] Đã dọn dẹp ${p1Updated.count} Part 1: image_url -> null hoàn toàn.`);

  // 3. Chuẩn hóa Part 2
  const p2Parts = await prisma.examPart.findMany({
    where: {
      exam: { skill: 'SPEAKING' },
      OR: [
        { part_number: 2 },
        { title: { contains: 'Part 2', mode: 'insensitive' } },
        { title: { contains: 'Part2', mode: 'insensitive' } }
      ]
    },
    include: {
      questions: true,
      exam: true
    }
  });

  let p2Fixed = 0;
  for (const part of p2Parts) {
    const combinedContent = [
      part.exam.title,
      part.title,
      part.instructions || '',
      part.passage_text || '',
      ...part.questions.map(q => `${q.prompt} ${q.explanation || ''}`)
    ].join(' ');

    let bestTopic = PART2_BANK[0];
    let maxScore = -1;

    for (const topic of PART2_BANK) {
      const s = scoreMatch(combinedContent, topic.keywords);
      if (s > maxScore) {
        maxScore = s;
        bestTopic = topic;
      }
    }

    // Nếu không khớp từ khóa đặc biệt nhưng image_url cũ có dạng số (vd '1.png' -> image1.png)
    let finalImg = bestTopic.img;
    if (maxScore < 10 && part.image_url) {
      const numMatch = part.image_url.match(/(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        if (num >= 1 && num <= 25) {
          finalImg = `/uploads/speaking/part2/image${num}.png`;
        }
      }
    }

    await prisma.examPart.update({
      where: { id: part.id },
      data: { image_url: finalImg }
    });
    p2Fixed++;
  }
  console.log(`[Task 1.3] Đã chuẩn hóa chính xác tranh cho ${p2Fixed} Part 2 Speaking.`);

  // 4. Chuẩn hóa Part 3
  const p3Parts = await prisma.examPart.findMany({
    where: {
      exam: { skill: 'SPEAKING' },
      OR: [
        { part_number: 3 },
        { title: { contains: 'Part 3', mode: 'insensitive' } },
        { title: { contains: 'Part3', mode: 'insensitive' } }
      ]
    },
    include: {
      questions: true,
      exam: true
    }
  });

  let p3Fixed = 0;
  for (const part of p3Parts) {
    const combinedContent = [
      part.exam.title,
      part.title,
      part.instructions || '',
      part.passage_text || '',
      ...part.questions.map(q => `${q.prompt} ${q.explanation || ''}`)
    ].join(' ');

    let bestTopic = PART3_BANK[0];
    let maxScore = -1;

    for (const topic of PART3_BANK) {
      const s = scoreMatch(combinedContent, topic.keywords);
      if (s > maxScore) {
        maxScore = s;
        bestTopic = topic;
      }
    }

    // Nếu không khớp rõ nhưng image_url cũ có số đề (vd 'de01_1.png' -> topic 3 xe vs tàu)
    let finalImg = bestTopic.img;
    if (maxScore < 10 && part.image_url) {
      const numMatch = part.image_url.match(/(\d+)/);
      if (numMatch) {
        const num = parseInt(numMatch[1], 10);
        const mappedTopic = PART3_BANK[(num - 1) % PART3_BANK.length];
        if (mappedTopic) finalImg = mappedTopic.img;
      }
    }

    await prisma.examPart.update({
      where: { id: part.id },
      data: { image_url: finalImg }
    });
    p3Fixed++;
  }
  console.log(`[Task 1.4] Đã chuẩn hóa chính xác cặp tranh cho ${p3Fixed} Part 3 Speaking.`);

  console.log('--- HOÀN TẤT CHUẨN HÓA DỮ LIỆU SPEAKING TRONG DATABASE ---');
}

main()
  .catch((e) => {
    console.error('Lỗi khi chuẩn hóa Speaking:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
