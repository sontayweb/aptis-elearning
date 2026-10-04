/**
 * Chuẩn hóa cấu trúc đề thi thống nhất cho toàn bộ hệ thống
 * Mọi nguồn web (aptiskytich, aptisacademy, web mới) đều được chuẩn hóa về định dạng này trước khi nạp vào DB.
 */
export function normalizeExam({
  source,
  externalId,
  title,
  skill = 'FULL_TEST',
  durationMinutes = 60,
  isPro = false,
  isPublished = true,
  description = '',
  parts = []
}) {
  return {
    source,
    externalId: String(externalId || ''),
    title: String(title).trim(),
    skill: mapSkill(skill),
    duration_minutes: Number(durationMinutes) || 60,
    is_pro: Boolean(isPro),
    is_published: Boolean(isPublished),
    description: String(description || ''),
    parts: parts.map((p, idx) => ({
      part_number: Number(p.part_number) || idx + 1,
      title: String(p.title || `Part ${idx + 1}`),
      instructions: p.instructions ? String(p.instructions) : null,
      passage_text: p.passage_text ? String(p.passage_text) : null,
      audio_url: p.audio_url ? String(p.audio_url) : null,
      image_url: p.image_url ? String(p.image_url) : null,
      questions: (p.questions || []).map((q, qIdx) => ({
        question_number: Number(q.question_number) || qIdx + 1,
        question_type: mapQuestionType(q.question_type),
        prompt: String(q.prompt || `Câu hỏi ${qIdx + 1}`),
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer ? String(q.correct_answer) : null,
        explanation: q.explanation ? String(q.explanation) : null,
        max_score: Number(q.max_score) || 1.0
      }))
    }))
  };
}

function mapSkill(skill) {
  const s = String(skill).toUpperCase();
  if (s.includes('READ')) return 'READING';
  if (s.includes('LISTEN')) return 'LISTENING';
  if (s.includes('WRITE') || s.includes('WRITING')) return 'WRITING';
  if (s.includes('SPEAK')) return 'SPEAKING';
  if (s.includes('GRAMMAR') || s.includes('VOCAB')) return 'GRAMMAR_VOCABULARY';
  return 'FULL_TEST';
}

function mapQuestionType(type) {
  const t = String(type || '').toUpperCase();
  if (t.includes('GAP')) return 'GAP_FILL';
  if (t.includes('ORDER')) return 'SENTENCE_ORDER';
  if (t.includes('MATCH')) return 'MATCHING';
  if (t.includes('ESSAY')) return 'ESSAY';
  if (t.includes('SPEAK') || t.includes('AUDIO')) return 'SPEAKING_AUDIO';
  return 'MULTIPLE_CHOICE';
}
