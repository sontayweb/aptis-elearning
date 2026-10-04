import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeExam } from '../../core/schema.js';
import { upsertExam } from '../../core/db.js';
import { downloadMediaFile } from '../../core/media.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function crawl({ prisma = null, saveDb = false, downloadMedia = false } = {}) {
  console.log('=====================================================');
  console.log('🌐 BẮT ĐẦU ĐỒNG BỘ: APTIS ACADEMY (aptisacademy.com.vn)');
  console.log('=====================================================\n');

  const outputDir = path.resolve(__dirname, '../../data/aptisacademy');
  const exportSubDir = path.join(outputDir, 'exported_exams');
  const bodeKeyDir = path.join(outputDir, 'bo_de_key');
  const mediaDir = path.join(outputDir, 'media');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(exportSubDir, { recursive: true });
  fs.mkdirSync(bodeKeyDir, { recursive: true });
  if (downloadMedia) fs.mkdirSync(mediaDir, { recursive: true });

  const stats = {
    source: 'aptisacademy',
    fullTestsCount: 0,
    skillTestsCount: 0,
    bodeKeyExamsCount: 0,
    speaking: 0,
    writing: 0,
    listening: 0,
    reading: 0,
    totalAudios: 0,
    downloadedAudios: 0,
    crawledAt: new Date().toISOString()
  };

  // -------------------------------------------------------------
  // BỘ ĐỆM ĐỒNG BỘ TĂNG DẦN & KHỬ TRÙNG LẶP (Incremental & Deduplication)
  // Đọc danh sách đề thi đã lưu từ trước để đối chiếu đề cũ / mới
  // -------------------------------------------------------------
  const normalizedExamsFile = path.join(outputDir, 'normalized_exams.json');
  const previousExamsMap = new Map();
  if (fs.existsSync(normalizedExamsFile)) {
    try {
      const prev = JSON.parse(fs.readFileSync(normalizedExamsFile, 'utf-8'));
      if (Array.isArray(prev)) {
        prev.forEach(ex => {
          const k = ex.externalId || `${ex.title.trim().toLowerCase()}___${ex.skill}`;
          previousExamsMap.set(k, ex);
        });
      }
    } catch {}
  }

  const examsMap = new Map();
  let newlyAddedExamsCount = 0;
  let updatedExamsCount = 0;

  function upsertNormalizedExam(exam) {
    const key = exam.externalId || `${exam.title.trim().toLowerCase()}___${exam.skill}`;
    const isBrandNew = !previousExamsMap.has(key);

    if (!examsMap.has(key)) {
      examsMap.set(key, exam);
      if (isBrandNew) newlyAddedExamsCount++;
    } else {
      // Đề đã có trong batch hiện tại -> Hợp nhất dữ liệu hoàn thiện nhất
      const current = examsMap.get(key);
      updatedExamsCount++;

      if (exam.title && !exam.title.startsWith('Bộ Key ') && current.title.startsWith('Bộ Key ')) {
        current.title = exam.title;
      }

      current.parts.forEach((p, idx) => {
        const newPart = exam.parts[idx];
        if (newPart) {
          if (!p.audio_url && newPart.audio_url) p.audio_url = newPart.audio_url;
          if (!p.passage_text && newPart.passage_text) p.passage_text = newPart.passage_text;
          if (!p.image_url && newPart.image_url) p.image_url = newPart.image_url;
          p.questions.forEach((q, qIdx) => {
            const newQ = newPart.questions?.[qIdx];
            if (newQ) {
              if ((!q.options || q.options.length === 0) && newQ.options?.length > 0) {
                q.options = newQ.options;
              }
              if (!q.correct_answer && newQ.correct_answer) {
                q.correct_answer = newQ.correct_answer;
              }
              if (!q.explanation && newQ.explanation) {
                q.explanation = newQ.explanation;
              }
            }
          });
        }
      });
    }
  }

  // Map lưu trữ audio và options chuẩn từ Bộ Đề Key để đắp vào các câu bị khuyết
  const enrichedListeningMap = new Map();

  // -------------------------------------------------------------
  // 1. TẢI VÀ BÓC TÁCH BỘ ĐỀ KEY CHUYÊN SÂU (exams & exams_center_b)
  // Đầy đủ 100% audio MP3, đáp án, gợi ý và options!
  // -------------------------------------------------------------
  console.log('⏳ [1/3] Đang tải BỘ ĐỀ KEY CHUYÊN SÂU (Đầy đủ Audio, Options & Transcripts)...');
  const centers = ['exams', 'exams_center_b'];
  const skills = ['listening', 'reading', 'speaking', 'writing'];
  const parts = ['part1', 'part2', 'part3', 'part4'];

  for (const center of centers) {
    const centerDir = path.join(bodeKeyDir, center);
    fs.mkdirSync(centerDir, { recursive: true });

    for (const skill of skills) {
      for (const part of parts) {
        const fileKey = `${skill}-${part}`;
        const url = `https://aptisacademy.com.vn/data/${center}/${fileKey}.json`;
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          if (res.ok) {
            const items = await res.json();
            fs.writeFileSync(path.join(centerDir, `${fileKey}.json`), JSON.stringify(items, null, 2));

            if (Array.isArray(items)) {
              stats.bodeKeyExamsCount += items.length;

              // Chuẩn hóa và trích xuất dữ liệu
              items.forEach((item, idx) => {
                const questionsList = item.questions || [];
                questionsList.forEach(q => {
                  const qFile = q.file || null;
                  const qSuggestion = q.suggestion || null;

                  // Lưu map theo title để dự phòng
                  const titleKey = String(item.title || q.questionTitle || '').trim().toLowerCase();
                  if (titleKey) {
                    const existingTitle = enrichedListeningMap.get(titleKey);
                    enrichedListeningMap.set(titleKey, {
                      audioUrl: qFile || existingTitle?.audioUrl || null,
                      transcript: qSuggestion || existingTitle?.transcript || null
                    });
                  }

                  (q.subQuestion || []).forEach(sq => {
                    const promptKey = String(sq.content || '').trim().toLowerCase();
                    const audio = sq.file || qFile || null;
                    if (promptKey) {
                      const existing = enrichedListeningMap.get(promptKey);
                      enrichedListeningMap.set(promptKey, {
                        audioUrl: audio || existing?.audioUrl || null,
                        options: ((sq.answerList || q.answerList || []).length > 0)
                          ? (sq.answerList || q.answerList || []).map(a => a.content || a)
                          : (existing?.options || []),
                        correctAnswer: sq.correctAnswer || existing?.correctAnswer || null,
                        transcript: sq.suggestion || qSuggestion || existing?.transcript || null
                      });
                    }
                    if (audio) {
                      stats.totalAudios++;
                      if (downloadMedia) {
                        downloadMediaFile(audio, mediaDir).then(p => {
                          if (p) stats.downloadedAudios++;
                        }).catch(() => {});
                      }
                    }
                  });
                });

                upsertNormalizedExam(normalizeExam({
                  source: 'APTIS_ACADEMY',
                  externalId: item._id || item.id || `${center}_${fileKey}_${idx + 1}`,
                  title: item.title || `Bộ Key ${skill.toUpperCase()} ${part.toUpperCase()} - Đề ${idx + 1}`,
                  skill: skill.toUpperCase(),
                  durationMinutes: 30,
                  parts: [{
                    part_number: Number(part.replace('part', '')),
                    title: `Key ${part.toUpperCase()}`,
                    questions: (item.questions?.[0]?.subQuestion || []).map((sq, qIdx) => ({
                      question_number: qIdx + 1,
                      question_type: skill === 'LISTENING' ? 'MULTIPLE_CHOICE' : (skill === 'SPEAKING' ? 'SPEAKING_AUDIO' : 'ESSAY'),
                      prompt: sq.content || `Câu hỏi ${qIdx + 1}`,
                      options: (sq.answerList || []).map(a => a.content || a),
                      correct_answer: sq.correctAnswer || null,
                      explanation: sq.suggestion || null
                    }))
                  }]
                }));
              });
            }
          }
        } catch (e) {
          // console.warn(`Không tải được ${url}: ${e.message}`);
        }
      }
    }
  }
  console.log(`✅ Tải thành công Bộ đề Key: ${stats.bodeKeyExamsCount} bộ đề với đầy đủ Audio MP3 & Options!`);

  // -------------------------------------------------------------
  // 2. TẢI VÀ BÓC TÁCH BỘ ĐỀ FULL TESTS (bo-de.json - 167 ĐỀ FULL)
  // -------------------------------------------------------------
  console.log('\n⏳ [2/3] Đang tải bộ đề FULL TESTS (bo-de.json)...');
  let fullTestsData = null;
  const fullTestsUrl = 'https://aptisacademy.com.vn/data/bo-de.json';

  try {
    const res = await fetch(fullTestsUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      fullTestsData = await res.json();
      console.log('✅ Tải thành công bo-de.json từ máy chủ!');
      fs.writeFileSync(path.join(outputDir, 'raw_bo_de.json'), JSON.stringify(fullTestsData, null, 2));
    }
  } catch (e) {
    console.warn(`⚠️ Lỗi tải bo-de.json: ${e.message}`);
  }

  // Fallback đọc cache cục bộ
  if (!fullTestsData) {
    const cached = path.join(outputDir, 'raw_bo_de.json');
    if (fs.existsSync(cached)) {
      try {
        fullTestsData = JSON.parse(fs.readFileSync(cached, 'utf-8'));
        console.log('📁 Sử dụng cache raw_bo_de.json');
      } catch {}
    }
  }

  const items = fullTestsData?.data?.data?.items || [];
  if (items.length > 0) {
    stats.fullTestsCount = items.length;
    console.log(`📦 Bóc tách ${items.length} bộ đề thi Full Tests tổng hợp...`);

    for (const item of items) {
      const parts = [];
      const questionsList = item.questions || [];

      questionsList.forEach((q, qIdx) => {
        if (q.file) {
          stats.totalAudios++;
          if (downloadMedia) {
            downloadMediaFile(q.file, mediaDir).then(p => {
              if (p) stats.downloadedAudios++;
            }).catch(() => {});
          }
        }

        parts.push({
          part_number: qIdx + 1,
          title: q.questionTitle || `Part ${qIdx + 1}`,
          instructions: q.content || null,
          passage_text: q.suggestion || null,
          audio_url: q.file || null,
          image_url: q.image || null,
          questions: (q.subQuestion || []).map((sq, sqIdx) => ({
            question_number: sqIdx + 1,
            question_type: q.questionType || 'MULTIPLE_CHOICE',
            prompt: sq.content || `Câu ${sqIdx + 1}`,
            options: (q.answerList || []).map(a => a.content || a),
            correct_answer: sq.correctAnswer || null,
            explanation: sq.suggestion || null
          }))
        });
      });

      const exam = normalizeExam({
        source: 'APTIS_ACADEMY',
        externalId: String(item.id),
        title: item.title || `Aptis Academy Test ${item.id}`,
        skill: 'FULL_TEST',
        durationMinutes: item.timeToDo ? Number(item.timeToDo) : 60,
        description: item.description || '',
        parts
      });
      upsertNormalizedExam(exam);
    }
    fs.writeFileSync(path.join(outputDir, 'full_tests_167.json'), JSON.stringify(items, null, 2));
    console.log(`✅ Đã chuẩn hóa ${items.length} đề thi Full Tests!`);
  }

  // -------------------------------------------------------------
  // 3. TẢI VÀ BÓC TÁCH BỘ ĐỀ KỸ NĂNG (bo-de-free.json - 485 ĐỀ)
  // Kết hợp đối chiếu enrichedListeningMap để làm giàu dữ liệu!
  // -------------------------------------------------------------
  console.log('\n⏳ [3/3] Đang tải và làm giàu bộ đề KỸ NĂNG...');
  let skillData = null;
  const skillUrl = 'https://aptisacademy.com.vn/data/bo-de-free.json';

  try {
    const res = await fetch(skillUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      skillData = await res.json();
      console.log('✅ Tải thành công bo-de-free.json từ máy chủ!');
      fs.writeFileSync(path.join(outputDir, 'raw_bo_de_free.json'), JSON.stringify(skillData, null, 2));
    }
  } catch (e) {
    console.warn(`⚠️ Lỗi tải bo-de-free.json: ${e.message}`);
  }

  // Fallback đọc cache
  if (!skillData) {
    const cachedFiles = [
      path.join(outputDir, 'raw_bo_de_free.json'),
      path.resolve(__dirname, '../../archive/aptis-academy/bo-de-free.json')
    ];
    for (const cf of cachedFiles) {
      if (fs.existsSync(cf)) {
        try {
          skillData = JSON.parse(fs.readFileSync(cf, 'utf-8'));
          console.log(`📁 Sử dụng cache bo-de-free tại: ${cf}`);
          break;
        } catch {}
      }
    }
  }

  if (skillData && skillData[0]?.metadata?.[0]) {
    const meta = skillData[0].metadata[0];
    const speakingExams = [];
    const writingExams = [];
    const listeningExams = [];
    const readingExams = [];

    // Speaking
    for (const p of ['part1', 'part2', 'part3', 'part4']) {
      (meta.speaking?.[p] || []).forEach((item, idx) => {
        stats.speaking++;
        const pNum = Number(p.replace('part', ''));
        const title = item.title || `Speaking Part ${pNum} - Đề ${idx + 1}`;

        speakingExams.push({
          id: item._id,
          part: p.toUpperCase(),
          title,
          timeLimitSeconds: item.timeToDo ? Number(item.timeToDo) : null,
          image: item.image || item.questions?.[0]?.image || null,
          questions: (item.questions || []).map(q => ({
            prompt: q.content || q.questionTitle,
            subQuestions: (q.subQuestion || []).map(sq => ({
              id: sq._id,
              prompt: sq.content,
              suggestion: sq.suggestion || null
            }))
          }))
        });

        upsertNormalizedExam(normalizeExam({
          source: 'APTIS_ACADEMY',
          externalId: item._id,
          title,
          skill: 'SPEAKING',
          durationMinutes: 15,
          parts: [{
            part_number: pNum,
            title: `Speaking Part ${pNum}`,
            image_url: item.image || item.questions?.[0]?.image || null,
            questions: (item.questions || []).map((q, qIdx) => ({
              question_number: qIdx + 1,
              question_type: 'SPEAKING_AUDIO',
              prompt: q.content || q.questionTitle || 'Trả lời câu hỏi',
              max_score: 5.0
            }))
          }]
        }));
      });
    }

    // Writing
    for (const p of ['part1', 'part2', 'part3', 'part4']) {
      (meta.writing?.[p] || []).forEach((item, idx) => {
        stats.writing++;
        const pNum = Number(p.replace('part', ''));
        const title = item.title || `Writing Part ${pNum} - Đề ${idx + 1}`;

        writingExams.push({
          id: item._id,
          part: p.toUpperCase(),
          title,
          questions: (item.questions || []).map(q => ({
            prompt: q.content || q.questionTitle,
            subQuestions: (q.subQuestion || []).map(sq => ({
              prompt: sq.content,
              correctAnswer: sq.correctAnswer || null
            }))
          }))
        });

        upsertNormalizedExam(normalizeExam({
          source: 'APTIS_ACADEMY',
          externalId: item._id,
          title,
          skill: 'WRITING',
          durationMinutes: 50,
          parts: [{
            part_number: pNum,
            title: `Writing Part ${pNum}`,
            questions: (item.questions || []).map((q, qIdx) => ({
              question_number: qIdx + 1,
              question_type: 'ESSAY',
              prompt: q.content || q.questionTitle || 'Viết câu trả lời',
              max_score: 10.0
            }))
          }]
        }));
      });
    }

    // Listening (Được làm giàu với Audio & Options từ bộ Key)
    for (const p of ['part1', 'part2', 'part3', 'part4']) {
      (meta.listening?.[p] || []).forEach((item, idx) => {
        stats.listening++;
        const pNum = Number(p.replace('part', ''));
        const qObj = item.questions?.[0] || {};
        const title = item.title || `Listening Part ${pNum} - Đề ${idx + 1}`;
        let audioUrl = qObj.file || null;
        let transcript = qObj.suggestion || null;

        const subQuestions = (qObj.subQuestion || []).map(sq => {
          const prompt = sq.content;
          const promptKey = String(prompt || '').trim().toLowerCase();
          const enriched = enrichedListeningMap.get(promptKey);

          const finalOptions = (qObj.answerList?.length > 0)
            ? qObj.answerList.map(a => a.content || a)
            : (enriched?.options?.length > 0 ? enriched.options : []);

          if (!audioUrl && enriched?.audioUrl) {
            audioUrl = enriched.audioUrl;
          }
          if (!transcript && enriched?.transcript) {
            transcript = enriched.transcript;
          }

          return {
            prompt,
            options: finalOptions,
            correctAnswer: sq.correctAnswer || enriched?.correctAnswer || null
          };
        });

        // Nếu vẫn thiếu audio hoặc transcript, tra cứu dự phòng theo tên đề
        if (!audioUrl || !transcript) {
          const titleKey = String(title || item.title || '').trim().toLowerCase();
          const enrichedTitle = enrichedListeningMap.get(titleKey);
          if (!audioUrl && enrichedTitle?.audioUrl) {
            audioUrl = enrichedTitle.audioUrl;
          }
          if (!transcript && enrichedTitle?.transcript) {
            transcript = enrichedTitle.transcript;
          }
        }

        if (audioUrl) {
          stats.totalAudios++;
          if (downloadMedia) {
            downloadMediaFile(audioUrl, mediaDir).then(p => {
              if (p) stats.downloadedAudios++;
            }).catch(() => {});
          }
        }

        listeningExams.push({
          id: item._id,
          part: p.toUpperCase(),
          title,
          audioUrl,
          transcript,
          questions: subQuestions
        });

        upsertNormalizedExam(normalizeExam({
          source: 'APTIS_ACADEMY',
          externalId: item._id,
          title,
          skill: 'LISTENING',
          durationMinutes: 40,
          parts: [{
            part_number: pNum,
            title: `Listening Part ${pNum}`,
            audio_url: audioUrl,
            instructions: qObj.content || null,
            passage_text: transcript,
            questions: subQuestions.map((sq, sqIdx) => ({
              question_number: sqIdx + 1,
              question_type: 'MULTIPLE_CHOICE',
              prompt: sq.prompt || `Câu hỏi ${sqIdx + 1}`,
              options: sq.options,
              correct_answer: sq.correctAnswer
            }))
          }]
        }));
      });
    }

    // Reading
    for (const p of ['part1', 'part2', 'part4', 'part5']) {
      (meta.reading?.[p] || []).forEach((item, idx) => {
        stats.reading++;
        const pNum = Number(p.replace('part', ''));
        const d = item.data || item;
        const q = d.questions || item.questions?.[0] || {};
        const title = d.title || `Reading Part ${pNum} - Đề ${idx + 1}`;

        const questions = (q.subQuestion && q.subQuestion.length > 0)
          ? q.subQuestion.map((sq, sqIdx) => ({
              question_number: sqIdx + 1,
              prompt: sq.content || `Câu ${sqIdx + 1}`,
              options: (sq.answerList || q.answerList || []).map(a => a.content || a),
              correctAnswer: sq.correctAnswer || null
            }))
          : [{
              question_number: 1,
              prompt: q.content || 'Đọc và hoàn thành bài tập',
              options: (q.answerList || []).map(a => a.content || a),
              correctAnswer: q.correctAnswer || null
            }];

        readingExams.push({
          id: item._id,
          part: p.toUpperCase(),
          title,
          timeLimitMinutes: d.timeToDo || 35,
          content: q.content || null,
          options: q.answerList?.map(a => a.content || a) || [],
          correctAnswer: q.correctAnswer || null,
          questions
        });

        upsertNormalizedExam(normalizeExam({
          source: 'APTIS_ACADEMY',
          externalId: item._id,
          title,
          skill: 'READING',
          durationMinutes: d.timeToDo || 35,
          parts: [{
            part_number: pNum,
            title: `Reading Part ${pNum}`,
            instructions: q.content || null,
            questions: questions.map(qItem => ({
              question_number: qItem.question_number,
              question_type: 'MULTIPLE_CHOICE',
              prompt: qItem.prompt,
              options: qItem.options,
              correct_answer: Array.isArray(qItem.correctAnswer) ? qItem.correctAnswer.join(', ') : qItem.correctAnswer
            }))
          }]
        }));
      });
    }

    stats.skillTestsCount = speakingExams.length + writingExams.length + listeningExams.length + readingExams.length;

    // Xuất file chuyên biệt vào cả hai thư mục (data/ và tools/aptis-academy/ để giữ tính tương thích)
    const exportTargets = [
      exportSubDir,
      path.resolve(__dirname, '../../aptis-academy/exported_exams')
    ];

    for (const target of exportTargets) {
      try {
        fs.mkdirSync(target, { recursive: true });
        fs.writeFileSync(path.join(target, 'speaking_all.json'), JSON.stringify(speakingExams, null, 2));
        fs.writeFileSync(path.join(target, 'writing_all.json'), JSON.stringify(writingExams, null, 2));
        fs.writeFileSync(path.join(target, 'listening_all.json'), JSON.stringify(listeningExams, null, 2));
        fs.writeFileSync(path.join(target, 'reading_all.json'), JSON.stringify(readingExams, null, 2));
      } catch {}
    }

    console.log(`✅ Đã bóc tách thành công ${stats.skillTestsCount} đề kỹ năng chuyên sâu!`);
  }

  const normalizedExams = Array.from(examsMap.values());
  stats.totalUniqueExams = normalizedExams.length;
  stats.newlyAddedExams = newlyAddedExamsCount;
  stats.updatedExams = updatedExamsCount;

  fs.writeFileSync(path.join(outputDir, 'normalized_exams.json'), JSON.stringify(normalizedExams, null, 2));
  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(stats, null, 2));

  console.log(`\n🎉 HOÀN THÀNH ĐỒNG BỘ APTIS ACADEMY!`);
  console.log(`- Đề Full Tests (167 CLB):   ${stats.fullTestsCount} đề`);
  console.log(`- Đề Bộ Key Chuyên Sâu:     ${stats.bodeKeyExamsCount} đề`);
  console.log(`- Đề Kỹ Năng:               ${stats.skillTestsCount} đề`);
  console.log(`  + Speaking:               ${stats.speaking}`);
  console.log(`  + Writing:                ${stats.writing}`);
  console.log(`  + Listening:              ${stats.listening} (kèm ${stats.totalAudios} audio)`);
  console.log(`  + Reading:                ${stats.reading}`);
  console.log(`👉 TỔNG SỐ ĐỀ DUY NHẤT (ĐÃ KHỬ TRÙNG LẶP): ${stats.totalUniqueExams} BỘ ĐỀ THI`);
  console.log(`   └─ Đề thi mới phát hiện:     ${stats.newlyAddedExams} đề`);
  console.log(`   └─ Đề thi đã gộp & cập nhật: ${stats.updatedExams} lượt`);
  console.log(`📁 Dữ liệu lưu tại: ${outputDir}/`);

  // Nạp vào PostgreSQL nếu yêu cầu
  if (saveDb && prisma && normalizedExams.length > 0) {
    console.log('\n🚀 Đang nạp đề vào PostgreSQL qua Prisma...');
    let inserted = 0;
    let updated = 0;
    for (const ex of normalizedExams) {
      const res = await upsertExam(prisma, ex);
      if (res?.status === 'CREATED') inserted++;
      if (res?.status === 'UPDATED') updated++;
    }
    console.log(`✅ Hoàn tất nạp DB: Thêm mới ${inserted} đề, Cập nhật ${updated} đề.`);
  }

  return stats;
}

// Chạy trực tiếp nếu gọi từ dòng lệnh
if (process.argv[1] && process.argv[1].endsWith('crawler.js')) {
  crawl().catch(console.error);
}
