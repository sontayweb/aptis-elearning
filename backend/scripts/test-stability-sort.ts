const models = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-pro-latest',
  'gemini-3.1-pro-preview',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
  'gemini-3.8-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash'
];

function getStabilityScore(name: string): number {
  let score = 0;

  // 1. Nhóm bí danh ổn định dài hạn (Permanent Stable Aliases)
  // Google tự động trỏ các alias này vào model tốt nhất, KHÔNG BAO GIỜ bị khai tử!
  if (name === 'gemini-flash-lite-latest') score += 2000;
  else if (name === 'gemini-flash-latest') score += 1900;
  else if (name === 'gemini-pro-latest') score += 1800;
  else if (name.includes('latest')) score += 1700;

  // 2. Trừ điểm nặng cho Preview / Exp / Experimental vì hay bị 503 quá tải và đổi tên
  const isPreview = name.includes('preview') || name.includes('exp') || name.includes('customtools');
  if (isPreview) {
    score -= 500;
  } else {
    score += 500; // Bản Stable chính thức
  }

  // 3. Ưu tiên Flash (nhẹ, nhanh, ít nghẽn mạng) hơn Pro
  if (name.includes('flash-lite')) score += 150;
  else if (name.includes('flash')) score += 100;
  else if (name.includes('pro')) score += 50;

  // 4. Version số học (đời cao hơn ưu tiên hơn: 3.8 > 3.7 > 3.6...)
  const vMatch = name.match(/gemini-(\d+(?:\.\d+)?)/i);
  if (vMatch) {
    score += parseFloat(vMatch[1]) * 10;
  }

  return score;
}

models.sort((a, b) => getStabilityScore(b) - getStabilityScore(a));

console.log('--- THỨ TỰ ƯU TIÊN SỰ ỔN ĐỊNH CAO NHẤT ---');
models.forEach((m, idx) => {
  console.log(`${idx + 1}. ${m} (Điểm ổn định: ${getStabilityScore(m)})`);
});
