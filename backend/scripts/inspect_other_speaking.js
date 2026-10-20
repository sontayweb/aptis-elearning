const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');

['Part 3 update.docx', 'Part 3.docx', 'Part 4.docx'].forEach(file => {
  const p = path.resolve(__dirname, '../../SPEAKING', file);
  if (fs.existsSync(p)) {
    const zip = new AdmZip(p);
    const media = zip.getEntries().filter(e => e.entryName.startsWith('word/media/'));
    console.log(file, 'has media count:', media.length);
    media.slice(0, 5).forEach(m => console.log('  media:', m.entryName));
  } else {
    console.log(file, 'NOT EXISTS');
  }
});
