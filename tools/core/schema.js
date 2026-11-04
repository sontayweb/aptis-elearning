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

          const rawOptions = q.options !== undefined ? q.options : [];
          const cleanOptions = (Array.isArray(rawOptions) ? rawOptions : []).map(opt => {
            if (typeof opt === 'object' && opt !== null) {
              return String(opt.content || opt.text || opt.title || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            }
            return String(opt || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          });

          const canonicalCorrectAnswer = normalizeCorrectAnswer(
            q.correct_answer,
            cleanOptions,
            q.answerList || q.rawAnswerList || rawOptions
          );

          return {
            question_number: qNum,
            question_type: inferredType,
            prompt: String(q.prompt || `Câu hỏi ${qNum}`).trim(),
            options: cleanOptions,
            correct_answer: canonicalCorrectAnswer,
            explanation: q.explanation ? String(q.explanation).trim() : null,
            max_score: Number(q.max_score) > 0 ? Number(q.max_score) : defaultScore
          };
        })
      };
    })
  };
}

/**
 * Chuẩn hóa đáp án đúng về dạng Canonical Text
 * Giải quyết triệt để vấn đề UUID hoặc số index lọt vào trường correct_answer
 */
export function normalizeCorrectAnswer(correctAnswer, options = [], rawAnswerList = []) {
  if (correctAnswer === undefined || correctAnswer === null) return null;
  const ca = String(correctAnswer).trim();
  if (!ca) return null;

  const opts = Array.isArray(options) ? options : [];
  const list = Array.isArray(rawAnswerList) ? rawAnswerList : [];

  // 1. Nếu là số index ("0", "1", "2"...):
  if (/^\d+$/.test(ca) && opts.length > 0) {
    const idx = parseInt(ca, 10);
    if (opts[idx] !== undefined && opts[idx] !== null) {
      const val = typeof opts[idx] === 'object' ? (opts[idx].content || opts[idx].text || opts[idx]) : opts[idx];
      return String(val).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  // 2. Nếu là UUID và có danh sách đối tượng chứa id và content:
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ca)) {
    const searchLists = [list, opts];
    for (const sList of searchLists) {
      if (Array.isArray(sList) && sList.length > 0) {
        const found = sList.find(a => a && typeof a === 'object' && String(a.id || '').trim().toLowerCase() === ca.toLowerCase());
        if (found && (found.content !== undefined && found.content !== null)) {
          return String(found.content).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }
  }

  // 3. Nếu là chữ cái 'A', 'B', 'C', 'D' đơn lẻ và options có độ dài tương ứng:
  if (/^[A-D]$/i.test(ca) && opts.length >= 2) {
    const letterIdx = ca.toUpperCase().charCodeAt(0) - 65;
    if (opts[letterIdx] !== undefined) {
      const val = typeof opts[letterIdx] === 'object' ? (opts[letterIdx].content || opts[letterIdx]) : opts[letterIdx];
      const sVal = String(val).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (sVal.length > 1 && sVal.toUpperCase() !== ca.toUpperCase()) {
        return sVal;
      }
    }
  }

  return ca.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
  // 1. Kỹ năng Speaking luôn là SPEAKING_AUDIO
  if (skill === 'SPEAKING') {
    return 'SPEAKING_AUDIO';
  }

  // 2. Kỹ năng Writing luôn là SHORT_TEXT (Part 1, 3) hoặc ESSAY (Part 2, 4)
  if (skill === 'WRITING') {
    if (partNum === 1 || partNum === 3) return 'SHORT_TEXT';
    return 'ESSAY';
  }

  const t = String(type || '').toUpperCase();
  if (t === 'GAP_FILL' || t.includes('GAP')) return 'GAP_FILL';
  if (t === 'SENTENCE_ORDER' || t.includes('ORDER')) return 'SENTENCE_ORDER';
  if (t === 'MATCHING' || t.includes('MATCH')) return 'MATCHING';
  if (t === 'ESSAY' || t.includes('ESSAY')) return 'ESSAY';
  if (t === 'SHORT_TEXT' || t.includes('SHORT')) return 'SHORT_TEXT';
  if (t === 'SPEAKING_AUDIO' || t.includes('SPEAK') || t.includes('AUDIO')) return 'SPEAKING_AUDIO';
  if (t === 'MULTIPLE_CHOICE' || t.includes('CHOICE') || t.includes('MCQ')) return 'MULTIPLE_CHOICE';

  // 3. Tự động suy luận thông minh theo chuẩn Aptis CEFR cho Reading / Listening nếu scraper không cung cấp
  if (skill === 'READING') {
    if (partNum === 1) return 'GAP_FILL';
    if (partNum === 2 || partNum === 3) return 'SENTENCE_ORDER';
    if (partNum === 4) return 'MATCHING';
  } else if (skill === 'LISTENING') {
    if (partNum === 2 || partNum === 3) return 'MATCHING';
    return 'MULTIPLE_CHOICE';
  }

  return 'MULTIPLE_CHOICE';
}

export { validateExam, normalizeExamTitle };
