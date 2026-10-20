const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

function inspectDocx(docxPath) {
  const zip = new AdmZip(docxPath);
  const docXml = zip.readAsText('word/document.xml');
  const relsXml = zip.readAsText('word/_rels/document.xml.rels');
  const relMap = {};
  const relRegex = /Id="([^"]+)"\s+Type="[^"]*image"\s+Target="([^"]+)"/g;
  let rm;
  while ((rm = relRegex.exec(relsXml)) !== null) {
    relMap[rm[1]] = rm[2].replace(/^media\//, '');
  }

  const elemRegex = /<(w:p|w:tbl)[\s>][\s\S]*?<\/\1>/g;
  let em;
  const elements = [];
  while ((em = elemRegex.exec(docXml)) !== null) {
    const tag = em[1];
    const xml = em[0];
    if (tag === 'w:p') {
      const drawMatch = xml.match(/r:embed="([^"]+)"/);
      const img = drawMatch ? relMap[drawMatch[1]] : null;
      const tMatches = [];
      const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let tm;
      while ((tm = tRegex.exec(xml)) !== null) {
        tMatches.push(tm[1]);
      }
      const text = tMatches.join('').trim();
      if (text || img) {
        elements.push({ type: 'p', text, img });
      }
    } else if (tag === 'w:tbl') {
      elements.push({ type: 'tbl' });
    }
  }
  return elements;
}

const p2 = inspectDocx(path.resolve(__dirname, '../../SPEAKING/Tranh trọng điểm part 2.docx'));
fs.writeFileSync(path.resolve(__dirname, '../../scratch_p2.json'), JSON.stringify(p2, null, 2));

const p3 = inspectDocx(path.resolve(__dirname, '../../SPEAKING/Tranh trọng điểm part 3.docx'));
fs.writeFileSync(path.resolve(__dirname, '../../scratch_p3.json'), JSON.stringify(p3, null, 2));

console.log('DONE inspect P2 & P3! P2 elements:', p2.length, 'P3 elements:', p3.length);
