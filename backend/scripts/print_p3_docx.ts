import AdmZip from 'adm-zip';
import path from 'path';

const filePath = path.resolve(__dirname, '../../SPEAKING/Tranh trọng điểm part 3.docx');
const zip = new AdmZip(filePath);
const relsXml = zip.readAsText('word/_rels/document.xml.rels');
const relMap: Record<string, string> = {};
const relRegex = /Id="([^"]+)"\s+Type="[^"]*image"\s+Target="([^"]+)"/g;
let rm;
while ((rm = relRegex.exec(relsXml)) !== null) {
  relMap[rm[1]] = rm[2].replace(/^media\//, '');
}

const docXml = zip.readAsText('word/document.xml');
const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
let pm;
let idx = 0;
while ((pm = pRegex.exec(docXml)) !== null) {
  const xml = pm[0];
  const text = Array.from(xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)).map(m => m[1]).join('').trim();
  const images = Array.from(xml.matchAll(/r:embed="([^"]+)"/g)).map(m => relMap[m[1]]);
  if (text || images.length > 0) {
    console.log(`P#${++idx}: [IMG: ${images.join(', ')}] ${text}`);
  }
}
