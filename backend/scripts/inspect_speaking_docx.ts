import AdmZip from 'adm-zip';
import path from 'path';

function inspectDocx(filePath: string) {
  console.log(`\n======================================================`);
  console.log(`INSPECTING: ${path.basename(filePath)}`);
  console.log(`======================================================`);
  try {
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
    let count = 0;
    while ((pm = pRegex.exec(docXml)) !== null) {
      const xml = pm[0];
      const text = Array.from(xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)).map(m => m[1]).join('').trim();
      const images = Array.from(xml.matchAll(/r:embed="([^"]+)"/g)).map(m => relMap[m[1]]);
      if (text || images.length > 0) {
        if (text.startsWith('Đề') || text.startsWith('Part') || text.includes('Tranh') || text.includes('+') || images.length > 0) {
          count++;
          if (count <= 35) {
            console.log(`[P] Text: "${text.slice(0, 80)}" | Images: ${images.join(', ')}`);
          }
        }
      }
    }
    console.log(`Total relevant paragraphs: ${count}`);
  } catch (err: any) {
    console.error('Error inspecting:', err.message);
  }
}

inspectDocx(path.resolve(__dirname, '../../SPEAKING/Tranh trọng điểm part 3.docx'));
inspectDocx(path.resolve(__dirname, '../../SPEAKING/Part 3 update.docx'));
inspectDocx(path.resolve(__dirname, '../../SPEAKING/Part 3.docx'));
