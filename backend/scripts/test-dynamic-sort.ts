const models = [
  'gemini-2.5-flash',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-flash-lite-latest',
  'gemini-4.0-flash',
  'gemini-3.1-pro-preview',
  'gemini-flash-latest',
  'gemini-3.6-flash',
  'gemini-pro-latest'
];

function getDynamicScore(name: string): number {
  // 1. Tự động bóc tách số phiên bản bằng Regex toán học (vd: 3.8, 3.7, 4.0...)
  const vMatch = name.match(/gemini-(\d+(?:\.\d+)?)/i);
  const version = vMatch ? parseFloat(vMatch[1]) : 0;

  // 2. Điểm thưởng cho 'latest'
  const isLatest = name.includes('latest') ? 50 : 0;

  // 3. Ưu tiên Flash (nhẹ, nhanh, real-time) hơn Pro
  const isFlash = name.includes('flash') ? 20 : 0;
  const isPro = name.includes('pro') ? 10 : 0;

  return version * 100 + isLatest + isFlash + isPro;
}

models.sort((a, b) => getDynamicScore(b) - getDynamicScore(a));
console.log('Sorted dynamically:');
console.log(models);
