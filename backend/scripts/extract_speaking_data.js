const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '../../');
const p1DocxPath = path.join(rootDir, 'SPEAKING', 'Tổng hợp đề part 1.docx');
const p2DocxPath = path.join(rootDir, 'SPEAKING', 'Tranh trọng điểm part 2.docx');
const p3DocxPath = path.join(rootDir, 'SPEAKING', 'Tranh trọng điểm part 3.docx');

const p2TargetDir = path.join(rootDir, 'frontend', 'public', 'uploads', 'speaking', 'part2');
const p3TargetDir = path.join(rootDir, 'frontend', 'public', 'uploads', 'speaking', 'part3');
const dataTargetDir = path.join(rootDir, 'frontend', 'src', 'data');

fs.mkdirSync(p2TargetDir, { recursive: true });
fs.mkdirSync(p3TargetDir, { recursive: true });
fs.mkdirSync(dataTargetDir, { recursive: true });

function parseDocxWithMedia(docxPath, targetDir) {
  const zip = new AdmZip(docxPath);
  const relsXml = zip.readAsText('word/_rels/document.xml.rels');
  const docXml = zip.readAsText('word/document.xml');

  const relMap = {};
  const relRegex = /Id="([^"]+)"\s+Type="[^"]*image"\s+Target="([^"]+)"/g;
  let rm;
  while ((rm = relRegex.exec(relsXml)) !== null) {
    relMap[rm[1]] = rm[2].replace(/^media\//, '');
  }

  const mediaEntries = zip.getEntries().filter((e) => e.entryName.startsWith('word/media/'));
  for (const entry of mediaEntries) {
    const filename = path.basename(entry.entryName);
    const dest = path.join(targetDir, filename);
    fs.writeFileSync(dest, entry.getData());
  }

  return { zip, docXml, relMap };
}

// =========================================================================
// 1. EXTRACT PART 2
// =========================================================================
console.log('Extracting Part 2...');
const p2Data = parseDocxWithMedia(p2DocxPath, p2TargetDir);
const p2Xml = p2Data.docXml;
const p2Body = p2Xml.substring(p2Xml.indexOf('<w:body>'), p2Xml.lastIndexOf('</w:body>'));
const p2ElemRegex = /<(w:p|w:tbl)[\s>][\s\S]*?<\/\1>/g;

const p2Topics = [];
let pendingP2Title = '';
let currentP2Topic = null;
let p2Em;

while ((p2Em = p2ElemRegex.exec(p2Body)) !== null) {
  const tag = p2Em[1];
  const xml = p2Em[0];

  const hasDraw = xml.includes('r:embed="');
  const tMatches = [];
  const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let tm;
  while ((tm = tRegex.exec(xml)) !== null) {
    tMatches.push(tm[1]);
  }
  const text = tMatches.join('').trim();

  if (hasDraw) {
    const drawMatch = xml.match(/r:embed="([^"]+)"/);
    if (drawMatch) {
      const rId = drawMatch[1];
      const imgFile = p2Data.relMap[rId];
      if (currentP2Topic) {
        p2Topics.push(currentP2Topic);
      }
      currentP2Topic = {
        id: `p2_${p2Topics.length + 1}`,
        topicNumber: p2Topics.length + 1,
        title: pendingP2Title || `Tranh Speaking Part 2 - Đề 0${p2Topics.length + 1}`,
        imageUrl: `/uploads/speaking/part2/${imgFile}`,
        vocab: [],
        questions: [],
      };
      pendingP2Title = '';
    }
    continue;
  }

  if (tag === 'w:tbl' && currentP2Topic) {
    const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
    let rm;
    while ((rm = rowRegex.exec(xml)) !== null) {
      const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
      const cells = [];
      let cm;
      while ((cm = cellRegex.exec(rm[0])) !== null) {
        const cTexts = [];
        let ctm;
        const ctRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        while ((ctm = ctRegex.exec(cm[0])) !== null) {
          cTexts.push(ctm[1]);
        }
        cells.push(cTexts.join('').trim());
      }
      if (cells.length >= 2) {
        const en = cells[0];
        const vi = cells[1];
        if (en && vi && en.toLowerCase() !== 'english' && vi.toLowerCase() !== 'tiếng việt') {
          currentP2Topic.vocab.push({ en, vi });
        }
      }
    }
    continue;
  }

  if (!text) continue;

  if (currentP2Topic) {
    if (
      text.startsWith('Describe the picture') ||
      text.startsWith('Tell me') ||
      text.startsWith('Why ') ||
      text.startsWith('The last time') ||
      text.startsWith('Do you think') ||
      text.startsWith('How ') ||
      text.startsWith('What ') ||
      text.endsWith('?')
    ) {
      currentP2Topic.questions.push(text);
    } else {
      if (!pendingP2Title) {
        pendingP2Title = text;
      }
    }
  } else {
    if (!pendingP2Title) {
      pendingP2Title = text;
    }
  }
}
if (currentP2Topic) {
  p2Topics.push(currentP2Topic);
}

console.log(`Part 2 topics extracted: ${p2Topics.length}`);

// =========================================================================
// 2. EXTRACT PART 3
// =========================================================================
console.log('Extracting Part 3...');
const p3Data = parseDocxWithMedia(p3DocxPath, p3TargetDir);
const p3Xml = p3Data.docXml;
const p3Body = p3Xml.substring(p3Xml.indexOf('<w:body>'), p3Xml.lastIndexOf('</w:body>'));
const p3ElemRegex = /<(w:p|w:tbl)[\s>][\s\S]*?<\/\1>/g;

const p3Topics = [];
let pendingP3Title = '';
let currentP3Topic = null;
let p3Em;

while ((p3Em = p3ElemRegex.exec(p3Body)) !== null) {
  const tag = p3Em[1];
  const xml = p3Em[0];

  const hasDraw = xml.includes('r:embed="');
  const tMatches = [];
  const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let tm;
  while ((tm = tRegex.exec(xml)) !== null) {
    tMatches.push(tm[1]);
  }
  const text = tMatches.join('').trim();

  if (hasDraw) {
    const drawMatch = xml.match(/r:embed="([^"]+)"/);
    if (drawMatch) {
      const rId = drawMatch[1];
      const imgFile = p3Data.relMap[rId];
      if (currentP3Topic) {
        p3Topics.push(currentP3Topic);
      }
      currentP3Topic = {
        id: `p3_${p3Topics.length + 1}`,
        topicNumber: p3Topics.length + 1,
        title: pendingP3Title || `Cặp tranh Speaking Part 3 - Đề 0${p3Topics.length + 1}`,
        imageUrl: `/uploads/speaking/part3/${imgFile}`,
        vocab: [],
        questions: [],
      };
      pendingP3Title = '';
    }
    continue;
  }

  if (tag === 'w:tbl' && currentP3Topic) {
    const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
    let rm;
    while ((rm = rowRegex.exec(xml)) !== null) {
      const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
      const cells = [];
      let cm;
      while ((cm = cellRegex.exec(rm[0])) !== null) {
        const cTexts = [];
        let ctm;
        const ctRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
        while ((ctm = ctRegex.exec(cm[0])) !== null) {
          cTexts.push(ctm[1]);
        }
        cells.push(cTexts.join('').trim());
      }
      if (cells.length >= 2) {
        const en = cells[0];
        const vi = cells[1];
        if (en && vi && en.toLowerCase() !== 'english' && vi.toLowerCase() !== 'tiếng việt') {
          currentP3Topic.vocab.push({ en, vi });
        }
      }
    }
    continue;
  }

  if (!text) continue;

  if (currentP3Topic) {
    if (
      text.startsWith('Tell me what you see') ||
      text.startsWith('Do you prefer') ||
      text.startsWith('Is it necessary') ||
      text.startsWith('Which ') ||
      text.startsWith('Why ') ||
      text.startsWith('What ') ||
      text.startsWith('How ') ||
      text.endsWith('?')
    ) {
      currentP3Topic.questions.push(text);
    } else {
      if (!pendingP3Title) {
        pendingP3Title = text;
      }
    }
  } else {
    if (!pendingP3Title) {
      pendingP3Title = text;
    }
  }
}
if (currentP3Topic) {
  p3Topics.push(currentP3Topic);
}

console.log(`Part 3 topics extracted: ${p3Topics.length}`);

// =========================================================================
// 3. EXTRACT PART 1 STRUCTURED UNITS & QUESTIONS
// =========================================================================
console.log('Extracting Part 1 Units & Questions...');
const p1Zip = new AdmZip(p1DocxPath);
const p1DocXml = p1Zip.readAsText('word/document.xml');
const p1Body = p1DocXml.substring(p1DocXml.indexOf('<w:body>'), p1DocXml.lastIndexOf('</w:body>'));
const p1ElemRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;

const p1Lines = [];
let p1m;
while ((p1m = p1ElemRegex.exec(p1Body)) !== null) {
  const tMatches = [];
  const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let tm;
  while ((tm = tRegex.exec(p1m[0])) !== null) {
    tMatches.push(tm[1]);
  }
  const text = tMatches.join('').trim();
  if (text) p1Lines.push(text);
}

// We will parse:
// 1. Core Guide / Intro tips
// 2. Units (Unit 1 to 8) and Questions with Sample Answers
const p1Units = [];
let currentUnit = {
  id: 'unit_intro',
  title: 'Chủ đề khởi động & Bản thân (Essential Starters)',
  goal: 'Làm quen phản xạ trả lời ngắn 30s các chủ đề quen thuộc',
  questions: [],
};

let currentQuestion = null;
let isCollectingSample = false;

for (let i = 0; i < p1Lines.length; i++) {
  const line = p1Lines[i];

  if (line.startsWith('UNIT ')) {
    if (currentQuestion) {
      currentUnit.questions.push(currentQuestion);
      currentQuestion = null;
    }
    if (currentUnit.questions.length > 0) {
      p1Units.push(currentUnit);
    }
    currentUnit = {
      id: `unit_${p1Units.length + 1}`,
      title: line,
      goal: '',
      questions: [],
    };
    isCollectingSample = false;
    continue;
  }

  if (line.startsWith('Mục tiêu của unit:')) {
    currentUnit.goal = line.replace('Mục tiêu của unit:', '').trim();
    continue;
  }

  if (line.startsWith('QUESTION ')) {
    if (currentQuestion) {
      currentUnit.questions.push(currentQuestion);
    }
    currentQuestion = {
      id: `q_${p1Units.length + 1}_${currentUnit.questions.length + 1}`,
      qLabel: line,
      prompt: '',
      sampleAnswer: '',
    };
    isCollectingSample = false;
    continue;
  }

  if (line === 'Sample Answer') {
    isCollectingSample = true;
    continue;
  }

  if (currentQuestion) {
    if (!currentQuestion.prompt && !isCollectingSample) {
      currentQuestion.prompt = line;
    } else if (isCollectingSample) {
      currentQuestion.sampleAnswer = currentQuestion.sampleAnswer
        ? currentQuestion.sampleAnswer + ' ' + line
        : line;
    }
  } else {
    // If before first QUESTION, check for Part A questions (like "What is your village...")
    if (
      (line.endsWith('?') || line.startsWith('Please tell me') || line.startsWith('Describe')) &&
      !line.includes('Sample') &&
      !line.includes('BÍ QUYẾT') &&
      !line.includes('Bước ')
    ) {
      currentUnit.questions.push({
        id: `q_intro_${currentUnit.questions.length + 1}`,
        qLabel: `Starter Question 0${currentUnit.questions.length + 1}`,
        prompt: line,
        sampleAnswer: '',
      });
    }
  }
}

if (currentQuestion) {
  currentUnit.questions.push(currentQuestion);
}
if (currentUnit.questions.length > 0) {
  p1Units.push(currentUnit);
}

console.log(`Part 1 total structured units: ${p1Units.length}`);
let totalQCount = 0;
p1Units.forEach((u) => {
  totalQCount += u.questions.length;
  console.log(` - [${u.id}] ${u.title}: ${u.questions.length} questions`);
});
console.log(`Total Part 1 questions: ${totalQCount}`);

// =========================================================================
// 4. WRITE EXPORT FILES
// =========================================================================

// File 1: Part 2 Bank
const part2TsContent = `// Speaking Part 2 Authentic Question & Picture Bank
// Extracted from SPEAKING/Tranh trọng điểm part 2.docx

export interface SpeakingVocabItem {
  en: string;
  vi: string;
}

export interface SpeakingPart2Topic {
  id: string;
  topicNumber: number;
  title: string;
  imageUrl: string;
  vocab: SpeakingVocabItem[];
  questions: string[];
}

export const SPEAKING_PART2_BANK: SpeakingPart2Topic[] = ${JSON.stringify(p2Topics, null, 2)};
`;
fs.writeFileSync(path.join(dataTargetDir, 'speaking-part2-bank.ts'), part2TsContent, 'utf8');
console.log('Saved frontend/src/data/speaking-part2-bank.ts');

// File 2: Part 3 Bank
const part3TsContent = `// Speaking Part 3 Authentic Picture Comparison Bank
// Extracted from SPEAKING/Tranh trọng điểm part 3.docx

export interface SpeakingPart3Topic {
  id: string;
  topicNumber: number;
  title: string;
  imageUrl: string;
  vocab: { en: string; vi: string }[];
  questions: string[];
}

export const SPEAKING_PART3_BANK: SpeakingPart3Topic[] = ${JSON.stringify(p3Topics, null, 2)};
`;
fs.writeFileSync(path.join(dataTargetDir, 'speaking-part3-bank.ts'), part3TsContent, 'utf8');
console.log('Saved frontend/src/data/speaking-part3-bank.ts');

// File 3: Part 1 Bank
const part1TsContent = `// Speaking Part 1 Authentic Question Bank
// Extracted from SPEAKING/Tổng hợp đề part 1.docx

export interface SpeakingPart1QuestionItem {
  id: string;
  qLabel?: string;
  prompt: string;
  sampleAnswer?: string;
}

export interface SpeakingPart1Unit {
  id: string;
  title: string;
  goal?: string;
  questions: SpeakingPart1QuestionItem[];
}

export const SPEAKING_PART1_UNITS: SpeakingPart1Unit[] = ${JSON.stringify(p1Units, null, 2)};

export const SPEAKING_PART1_ALL_QUESTIONS: SpeakingPart1QuestionItem[] = SPEAKING_PART1_UNITS.flatMap(
  (u) => u.questions
);
`;
fs.writeFileSync(path.join(dataTargetDir, 'speaking-part1-bank.ts'), part1TsContent, 'utf8');
console.log('Saved frontend/src/data/speaking-part1-bank.ts');

console.log('\n🚀 ALL DATA SAVED IN FRONTEND DATA DIR!');
