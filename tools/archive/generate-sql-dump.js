import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function main() {
  const jsonPath = path.resolve(__dirname, '../backups/aptis_exams_backup_latest.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('Không tìm thấy file backup JSON');
    return;
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const sqlLines = [];

  sqlLines.push('-- ============================================================');
  sqlLines.push('-- APTIS EXAMS BACKUP SQL DUMP FOR CLOUD DATABASE');
  sqlLines.push(`-- Exported At: ${data.exportedAt}`);
  sqlLines.push(`-- Total Exams: ${data.stats.totalExams}`);
  sqlLines.push(`-- Total Questions: ${data.stats.totalQuestions}`);
  sqlLines.push('-- ============================================================\n');
  sqlLines.push('BEGIN;\n');

  for (const ex of data.exams) {
    const examId = crypto.randomUUID();
    sqlLines.push(`-- Exam: ${ex.title}`);
    sqlLines.push(
      `INSERT INTO "Exam" ("id", "title", "description", "skill", "duration_minutes", "is_pro", "is_published", "source", "created_at", "updated_at") ` +
      `VALUES (${escapeSql(examId)}, ${escapeSql(ex.title)}, ${escapeSql(ex.description)}, '${ex.skill}', ${ex.duration_minutes}, ${ex.is_pro ? 'TRUE' : 'FALSE'}, TRUE, ${escapeSql(ex.source || 'BACKUP')}, NOW(), NOW()) ` +
      `ON CONFLICT DO NOTHING;`
    );

    for (const p of ex.parts) {
      const partId = crypto.randomUUID();
      sqlLines.push(
        `INSERT INTO "ExamPart" ("id", "exam_id", "part_number", "title", "instructions", "passage_text", "audio_url", "image_url", "created_at") ` +
        `VALUES (${escapeSql(partId)}, ${escapeSql(examId)}, ${p.part_number}, ${escapeSql(p.title)}, ${escapeSql(p.instructions)}, ${escapeSql(p.passage_text)}, ${escapeSql(p.audio_url)}, ${escapeSql(p.image_url)}, NOW());`
      );

      for (const q of p.questions) {
        const questionId = crypto.randomUUID();
        const optionsJson = q.options ? escapeSql(JSON.stringify(q.options)) : 'NULL';
        sqlLines.push(
          `INSERT INTO "Question" ("id", "part_id", "question_number", "question_type", "prompt", "options", "correct_answer", "explanation", "max_score", "created_at") ` +
          `VALUES (${escapeSql(questionId)}, ${escapeSql(partId)}, ${q.question_number}, '${q.question_type}', ${escapeSql(q.prompt)}, ${optionsJson}::jsonb, ${escapeSql(q.correct_answer)}, ${escapeSql(q.explanation)}, ${q.max_score || 1.0}, NOW());`
        );
      }
    }
    sqlLines.push('');
  }

  sqlLines.push('COMMIT;\n');

  const outSqlPath = path.resolve(__dirname, '../backups/aptis_exams_seed_cloud.sql');
  fs.writeFileSync(outSqlPath, sqlLines.join('\n'), 'utf-8');
  console.log(`✅ Đã tạo file SQL Dump nạp trực tiếp: ${outSqlPath}`);
}

main();
