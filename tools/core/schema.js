import { normalizeExamTitle, validateExam, SKILL_TYPES, QUESTION_TYPES } from './contracts.js';

/**
 * Chuẩn hóa cấu trúc đề thi thống nhất cho toàn bộ hệ thống
 * Mọi nguồn web (aptiskytich, aptisacademy, web mới) đều được chuẩn hóa về định dạng này trước khi nạp vào DB.
 */
export function normalizeExam({
  source = 'WEB',
  externalId,
  title,
  skill = 'FULL_TEST',
  durationMinutes,
  isPro = false,
  isPublished = true,
  hotLevel = 0,
  forecastTag = null,
  description = '',
  parts = []
}) {
  const mappedSkill = mapSkill(skill);
  const cleanTitle = normalizeExamTitle(title);

  // Tính toán thời gian thi mặc định chuẩn khảo thí nếu chưa có
  const defaultDuration = getDefaultDuration(mappedSkill);
  const finalDuration = Number(durationMinutes) > 0 ? Number(durationMinutes) : defaultDuration;

  return {
    source: String(source || 'WEB'),
    externalId: externalId ? String(externalId) : null,
    title: cleanTitle,
    skill: mappedSkill,
    duration_minutes: finalDuration,
    is_pro: Boolean(isPro),
    is_published: Boolean(isPublished),
    hot_level: Number(hotLevel) || 0,
    forecast_tag: forecastTag ? String(forecastTag) : null,
    description: description ? String(description).trim() : '',
    parts: parts.map((p, idx) => {
      const pNum = Number(p.part_number) || idx + 1;
      return {
        part_number: pNum,
        title: String(p.title || `Part ${pNum}`).trim(),
        instructions: p.instructions ? String(p.instructions).trim() : null,
        passage_text: p.passage_text ? String(p.passage_text).trim() : null,
        audio_url: p.audio_url ? String(p.audio_url).trim() : null,
        image_url: p.image_url ? String(p.image_url).trim() : null,
        questions: (p.questions || []).map((q, qIdx) => {
          const qNum = Number(q.question_number) || qIdx + 1;
          const inferredType = mapQuestionType(q.question_type, mappedSkill, pNum);
          const defaultScore = getDefaultScore(mappedSkill, pNum, inferredType);

          return {
            question_number: qNum,
            question_type: inferredType,
            prompt: String(q.prompt || `Câu hỏi ${qNum}`).trim(),
            options: q.options !== undefined ? q.options : [],
            correct_answer: q.correct_answer !== undefined && q.correct_answer !== null ? String(q.correct_answer).trim() : null,
            explanation: q.explanation ? String(q.explanation).trim() : null,
            max_score: Number(q.max_score) > 0 ? Number(q.max_score) : defaultScore
          };
        })
      };
    })
  };
}

function getDefaultDuration(skill) {
  switch (skill) {
    case 'FULL_TEST': return 162;
    case 'READING': return 35;
    case 'LISTENING': return 40;
    case 'WRITING': return 50;
    case 'SPEAKING': return 12;
    case 'GRAMMAR_VOCABULARY': return 25;
    default: return 60;
  }
}

function getDefaultScore(skill, partNum, qType) {
  if (skill === 'READING') {
    if (partNum === 1 || qType === 'GAP_FILL') return 2.0; // 5 câu = 10đ
    if (partNum === 2 || partNum === 3 || qType === 'SENTENCE_ORDER') return 5.0; // 1đ/câu xếp đúng
  }
  return 1.0;
}

export function mapSkill(skill) {
  const s = String(skill || '').toUpperCase();
  if (s.includes('READ')) return 'READING';
  if (s.includes('LISTEN')) return 'LISTENING';
  if (s.includes('WRITE') || s.includes('WRITING')) return 'WRITING';
  if (s.includes('SPEAK')) return 'SPEAKING';
  if (s.includes('GRAMMAR') || s.includes('VOCAB')) return 'GRAMMAR_VOCABULARY';
  return 'FULL_TEST';
}

export function mapQuestionType(type, skill = '', partNum = 1) {
  const t = String(type || '').toUpperCase();
  if (t === 'GAP_FILL' || t.includes('GAP')) return 'GAP_FILL';
  if (t === 'SENTENCE_ORDER' || t.includes('ORDER')) return 'SENTENCE_ORDER';
  if (t === 'MATCHING' || t.includes('MATCH')) return 'MATCHING';
  if (t === 'ESSAY' || t.includes('ESSAY')) return 'ESSAY';
  if (t === 'SHORT_TEXT' || t.includes('SHORT')) return 'SHORT_TEXT';
  if (t === 'SPEAKING_AUDIO' || t.includes('SPEAK') || t.includes('AUDIO')) return 'SPEAKING_AUDIO';
  if (t === 'MULTIPLE_CHOICE' || t.includes('CHOICE') || t.includes('MCQ')) return 'MULTIPLE_CHOICE';

  // Tự động suy luận thông minh theo chuẩn Aptis CEFR nếu scraper không cung cấp
  if (skill === 'READING') {
    if (partNum === 1) return 'GAP_FILL';
    if (partNum === 2 || partNum === 3) return 'SENTENCE_ORDER';
    if (partNum === 4) return 'MATCHING';
  } else if (skill === 'SPEAKING') {
    return 'SPEAKING_AUDIO';
  } else if (skill === 'WRITING') {
    if (partNum === 1 || partNum === 3) return 'SHORT_TEXT';
    return 'ESSAY';
  } else if (skill === 'LISTENING') {
    if (partNum === 2 || partNum === 3) return 'MATCHING';
    return 'MULTIPLE_CHOICE';
  }

  return 'MULTIPLE_CHOICE';
}

export { validateExam, normalizeExamTitle };
