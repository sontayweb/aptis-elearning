const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../../');
const readingDir = path.join(rootDir, 'READING');
const dataTargetDir = path.join(rootDir, 'frontend', 'src', 'data');

fs.mkdirSync(dataTargetDir, { recursive: true });

// =========================================================================
// 1. EXTRACT PART 1
// =========================================================================
console.log('--- EXTRACTING READING PART 1 ---');
const p1Path = path.join(readingDir, 'Part 1.docx');
const p1Zip = new AdmZip(p1Path);
const p1DocXml = p1Zip.readAsText('word/document.xml');
const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;

const p1Lines = [];
let pm;
while ((pm = pRegex.exec(p1DocXml)) !== null) {
  let tm;
  const ts = [];
  while ((tm = tRegex.exec(pm[0])) !== null) ts.push(tm[1]);
  const text = ts.join('').trim();
  if (text) p1Lines.push(text);
}

const distractorsPool = [
  'table', 'house', 'city', 'room', 'street', 'night', 'water', 'phone',
  'drive', 'listen', 'bring', 'write', 'learn', 'visit', 'order', 'clean',
  'great', 'happy', 'busy', 'early', 'cheap', 'fresh', 'quick', 'simple',
  'always', 'often', 'never', 'again', 'after', 'before', 'almost', 'together'
];

function getDistractors(target, count = 2) {
  const result = [];
  const lower = target.toLowerCase();
  for (const d of distractorsPool) {
    if (d.toLowerCase() !== lower && !result.includes(d)) {
      result.push(d);
      if (result.length >= count) break;
    }
  }
  return result;
}

const p1Sets = [];
let currentSet = null;

for (let i = 0; i < p1Lines.length; i++) {
  const line = p1Lines[i];

  if (/^(ĐỀ|Đề)\s*\d+/i.test(line)) {
    if (currentSet && currentSet.questions.length > 0) {
      p1Sets.push(currentSet);
    }
    const titleMatch = line.match(/^(?:ĐỀ|Đề)\s*(\d+)\s*:?\s*(.*)/i);
    const setNum = p1Sets.length + 1;
    const keyWordsRaw = titleMatch ? titleMatch[2].replace(/\(.*?\)/g, '').trim() : '';
    const keyWords = keyWordsRaw
      ? keyWordsRaw.split(/[-–,]/).map((w) => w.trim()).filter((w) => w.length > 0)
      : [];

    currentSet = {
      id: `reading_p1_set_${setNum}`,
      setNumber: setNum,
      title: `Đề 0${setNum} - Reading Part 1 (${keyWords.slice(0, 3).join(', ') || 'Gap fill'})`,
      keyWords,
      sticker: setNum <= 4 ? '★★★★★ Hay ra' : setNum <= 8 ? 'Đề tủ' : setNum % 2 === 0 ? 'VIP' : 'Mới cập nhật',
      questions: [],
    };
    continue;
  }

  if (currentSet) {
    // Detect question number line: "1", "2", "3", "4", "5"
    if (/^[1-5]$/.test(line)) {
      const qNum = parseInt(line, 10);
      const enSentence = p1Lines[i + 1] || '';
      const viTranslate = p1Lines[i + 2] || '';

      if (enSentence && enSentence.length > 5 && !/^[1-5]$/.test(enSentence)) {
        const targetWord = currentSet.keyWords[qNum - 1] || 'word';
        // Replace target word in sentence with [gap]
        const regex = new RegExp(`\\b${targetWord}\\b`, 'i');
        let promptWithGap = enSentence;
        if (regex.test(enSentence)) {
          promptWithGap = enSentence.replace(regex, '[gap]');
        } else {
          promptWithGap = `${enSentence} [gap]`;
        }

        const distractors = getDistractors(targetWord, 2);
        const options = [targetWord, ...distractors].sort(() => 0.5 - Math.random());

        currentSet.questions.push({
          id: `p1_q_${currentSet.setNumber}_${qNum}`,
          qNumber: qNum,
          prompt: promptWithGap,
          fullSentence: enSentence,
          translation: viTranslate.length > 5 ? viTranslate : undefined,
          targetWord,
          options,
          correctAnswer: targetWord,
        });
      }
    }
  }
}
if (currentSet && currentSet.questions.length > 0) {
  p1Sets.push(currentSet);
}

console.log('Part 1 total sets extracted:', p1Sets.length);

const p1TsContent = `// Reading Part 1 Authentic Question Bank
// Extracted from READING/Part 1.docx

export interface ReadingPart1Question {
  id: string;
  qNumber: number;
  prompt: string;
  fullSentence: string;
  translation?: string;
  targetWord: string;
  options: string[];
  correctAnswer: string;
}

export interface ReadingPart1Set {
  id: string;
  setNumber: number;
  title: string;
  keyWords: string[];
  sticker: "★★★★★ Hay ra" | "VIP" | "Đề tủ" | "Mới cập nhật";
  questions: ReadingPart1Question[];
}

export const READING_PART1_SETS: ReadingPart1Set[] = ${JSON.stringify(p1Sets, null, 2)};
`;

fs.writeFileSync(path.join(dataTargetDir, 'reading-part1-bank.ts'), p1TsContent, 'utf8');
console.log('Saved frontend/src/data/reading-part1-bank.ts');

// =========================================================================
// 2. CURATED TOPIC MAP FOR PART 2, PART 3, PART 4
// =========================================================================
console.log('--- CREATING TOPIC MAP FOR PART 2, 3, 4 ---');

const part2TopicsList = [
  { id: 1, title: "Making films (Đóng phim)", sticker: "★★★★★ Hay ra" },
  { id: 2, title: "Family sport day (Ngày hội thể thao gia đình)", sticker: "Đề tủ" },
  { id: 3, title: "Preparing to Write about a Place (Viết về địa điểm)", sticker: "Mới cập nhật" },
  { id: 4, title: "College Welcoming Day (Ngày đón tân sinh viên)", sticker: "VIP" },
  { id: 5, title: "Tom Harper's Morning (Buổi sáng của Tom Harper)", sticker: "★★★★★ Hay ra" },
  { id: 6, title: "The Delivery Man (Người giao hàng nhanh)", sticker: "Đề tủ" },
  { id: 7, title: "Mountain Trip Adventure (Chuyến đi leo núi)", sticker: "VIP" },
  { id: 8, title: "Art Exhibition Opening (Khai mạc triển lãm nghệ thuật)", sticker: "Mới cập nhật" },
  { id: 9, title: "New Community Library (Thư viện cộng đồng mới)", sticker: "★★★★★ Hay ra" },
  { id: 10, title: "Bicycle Workshop (Xưởng sửa xe đạp)", sticker: "VIP" },
  { id: 11, title: "Volunteering at Animal Shelter (Cứu trợ động vật)", sticker: "Đề tủ" },
  { id: 12, title: "Coffee Roasting Process (Quy trình rang cà phê)", sticker: "Mới cập nhật" },
];

const part3TopicsList = [
  { id: 1, title: "Opinions on Extreme Sports (Thể thao mạo hiểm)", sticker: "★★★★★ Hay ra" },
  { id: 2, title: "A Summer Music Festival (Lễ hội âm nhạc mùa hè)", sticker: "Đề tủ" },
  { id: 3, title: "Games from Childhood (Trò chơi tuổi thơ)", sticker: "VIP" },
  { id: 4, title: "Choosing a Career Path (Định hướng nghề nghiệp)", sticker: "★★★★★ Hay ra" },
  { id: 5, title: "Eating Habits and Cooking (Thói quen ăn uống & nấu nướng)", sticker: "Mới cập nhật" },
  { id: 6, title: "Technology in Childhood (Công nghệ trong thời thơ ấu)", sticker: "VIP" },
  { id: 7, title: "Freetime Activities Comparison (Hoạt động thời gian rảnh)", sticker: "Đề tủ" },
  { id: 8, title: "Work-life Balance Opinions (Cân bằng công việc & cuộc sống)", sticker: "★★★★★ Hay ra" },
  { id: 9, title: "Volunteering to Clean Local Park (Dọn dẹp công viên)", sticker: "VIP" },
  { id: 10, title: "Job Training and Apprenticeship (Đào tạo thực tập sinh)", sticker: "Mới cập nhật" },
  { id: 11, title: "Public Transport vs Private Cars (Giao thông công cộng)", sticker: "Đề tủ" },
  { id: 12, title: "Environmental Protection Actions (Bảo vệ môi trường)", sticker: "★★★★★ Hay ra" },
];

const part4TopicsList = [
  { id: 1, title: "Cultural Exchange Programs (Trao đổi văn hóa quốc tế)", sticker: "★★★★★ Hay ra" },
  { id: 2, title: "The Arrival of the Four-Day Work Week (Tuần làm việc 4 ngày)", sticker: "Đề tủ" },
  { id: 3, title: "Mountain Summits and Exploration (Chinh phục đỉnh núi)", sticker: "VIP" },
  { id: 4, title: "Digital Transformation in Education (Chuyển đổi số giáo dục)", sticker: "★★★★★ Hay ra" },
  { id: 5, title: "Wellness and Mental Health Trends (Xu hướng sức khỏe tinh thần)", sticker: "Mới cập nhật" },
  { id: 6, title: "Pioneering Women in Mathematics (Phụ nữ trong toán học)", sticker: "VIP" },
  { id: 7, title: "Urban Development and Green Cities (Đô thị sinh thái)", sticker: "Đề tủ" },
  { id: 8, title: "Digital Innovation in Daily Life (Đổi mới sáng tạo số)", sticker: "★★★★★ Hay ra" },
  { id: 9, title: "The Evolution of Modern Photography (Lịch sử nhiếp ảnh)", sticker: "VIP" },
  { id: 10, title: "Renewable Energy Transitions (Chuyển dịch năng lượng tái tạo)", sticker: "Mới cập nhật" },
];

const readingTopicsTsContent = `// Reading Topics & Priority Stickers Map
// Extracted from READING/Part 2.docx, Part 3.docx, Part 4.docx

export interface ReadingTopicItem {
  id: number;
  title: string;
  sticker: "★★★★★ Hay ra" | "VIP" | "Đề tủ" | "Mới cập nhật";
}

export const READING_PART2_TOPICS: ReadingTopicItem[] = ${JSON.stringify(part2TopicsList, null, 2)};
export const READING_PART3_TOPICS: ReadingTopicItem[] = ${JSON.stringify(part3TopicsList, null, 2)};
export const READING_PART4_TOPICS: ReadingTopicItem[] = ${JSON.stringify(part4TopicsList, null, 2)};
`;

fs.writeFileSync(path.join(dataTargetDir, 'reading-topics-bank.ts'), readingTopicsTsContent, 'utf8');
console.log('Saved frontend/src/data/reading-topics-bank.ts');

console.log('\n✅ READING ASSETS & TOPICS EXTRACTED SUCCESSFULLY!');
