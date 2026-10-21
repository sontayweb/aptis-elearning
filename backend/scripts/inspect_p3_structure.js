const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

const docxPath = path.resolve(__dirname, '../../SPEAKING/Tranh trọng điểm part 3.docx');
const zip = new AdmZip(docxPath);
const relsXml = zip.readAsText('word/_rels/document.xml.rels');
const relMap = {};
const relRegex = /Id="([^"]+)"\s+Type="[^"]*image"\s+Target="([^"]+)"/g;
let rm;
while ((rm = relRegex.exec(relsXml)) !== null) {
  relMap[rm[1]] = rm[2].replace(/^media\//, '');
}

const docXml = zip.readAsText('word/document.xml');
const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
let currentTopic = null;
const allTopics = [];

while ((pm = pRegex.exec(docXml)) !== null) {
  const xml = pm[0];
  const drawMatches = Array.from(xml.matchAll(/r:embed="([^"]+)"/g)).map(m => relMap[m[1]]);
  const text = Array.from(xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)).map(m => m[1]).join('').trim();
  
  if (text && (text.includes('+') || text.includes('Tranh') || text.includes('Sống cùng') || text.includes('Người') || text.includes('Đọc sách') || text.includes('Mua sắm') || text.includes('Cô gái') || text.includes('Ăn đồ') || text.includes('1 cặp') || text.includes('1 người') || text.includes('Thể thao') || text.includes('Cặp tranh'))) {
    if (!text.includes('English') && !text.includes('Tiếng Việt') && !text.includes('Tell me') && !text.includes('What') && !text.includes('Why') && !text.includes('How') && !text.includes('Which') && !text.includes('Do you') && !text.includes('Is it') && !text.includes('Please')) {
      if (currentTopic) allTopics.push(currentTopic);
      currentTopic = {
        title: text,
        images: []
      };
    }
  }

  if (drawMatches.length > 0) {
    if (currentTopic) {
      currentTopic.images.push(...drawMatches);
    } else {
      currentTopic = { title: 'Topic 1', images: [...drawMatches] };
    }
  }
}
if (currentTopic) allTopics.push(currentTopic);

console.log('ALL TOPICS EXTRACTED:');
allTopics.forEach((t, i) => {
  console.log(`Topic #${i + 1}: "${t.title}" | Images (${t.images.length}):`, t.images);
});

