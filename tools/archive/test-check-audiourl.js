import fs from 'node:fs';

async function checkAudioUrl() {
  const code = await (await fetch('https://aptiskytich.vn/assets/audioUrl-ydNk8aep.js')).text();
  console.log('AudioUrl chunk length:', code.length);
  console.log(code.substring(0, 1500));
}

checkAudioUrl().catch(console.error);
