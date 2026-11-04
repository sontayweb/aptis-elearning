import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { normalizeExam } from '../../core/schema.js';
import { upsertExam } from '../../core/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getExecutablePath() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('Không tìm thấy trình duyệt Chrome hoặc Edge trên máy tính.');
}

/**
 * Đảm bảo phiên đăng nhập ASP.NET Core Identity của aptistest.edu.vn còn hoạt động
 */
async function ensureSession(config, outputDir) {
  const sessionFile = path.join(outputDir, 'session.json');
  let authCookie = null;

  if (fs.existsSync(sessionFile)) {
    try {
      const sess = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      if (sess.authCookie) {
        const checkRes = await fetch(`${config.baseUrl}/api/auth/session-status`, {
          headers: { Cookie: `AptisWeb.Auth=${sess.authCookie}` },
        }).catch(() => null);

        if (checkRes && checkRes.ok) {
          const body = await checkRes.json().catch(() => null);
          if (body?.ok) {
            console.log(`🔑 Phiên đăng nhập có sẵn vẫn hiệu lực: ${sess.email || config.account.email}`);
            return sess.authCookie;
          }
        }
      }
    } catch {}
  }

  console.log(`🔐 Đang tự động đăng nhập tài khoản ${config.account.email} qua API login-cookie...`);
  const loginRes = await fetch(`${config.baseUrl}/api/auth/login-cookie`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: config.baseUrl,
      Referer: `${config.baseUrl}/login`,
    },
    body: JSON.stringify({
      emailOrUsername: config.account.email,
      password: config.account.password,
      rememberMe: true,
      loginContext: 'Student',
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Đăng nhập thất bại: HTTP ${loginRes.status} (${loginRes.statusText})`);
  }

  const setCookie = loginRes.headers.get('set-cookie') || '';
  const match = setCookie.match(/AptisWeb\.Auth=([^;]+)/);
  if (!match) {
    throw new Error('Không tìm thấy Set-Cookie AptisWeb.Auth trong phản hồi từ server.');
  }

  authCookie = match[1];
  fs.writeFileSync(
    sessionFile,
    JSON.stringify(
      {
        email: config.account.email,
        authCookie,
        savedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`✅ Đã lưu cookie phiên đăng nhập mới vào ${sessionFile}`);
  return authCookie;
}

/**
 * Làm sạch tiêu đề thông báo thành tên đề thi ngắn gọn, chuẩn khảo thí
 */
function cleanExamTitle(rawTitle, skill) {
  let title = String(rawTitle || '').replace(/\s+/g, ' ').trim();

  // Bóc tách tên đề thi cụ thể trong ngoặc kép hoặc sau tiền tố
  const quoteMatch = title.match(/[“"']([^"”']{3,60})[”"']/);
  if (quoteMatch) {
    const inner = quoteMatch[1].trim();
    if (inner.toLowerCase().includes('speaking') || inner.toLowerCase().includes('listening') || inner.toLowerCase().includes('writing') || inner.toLowerCase().includes('reading')) {
      return inner;
    }
    return `Đề ${skill} - ${inner}`;
  }

  // Khử các đoạn văn thừa dài
  const cutWords = ['Đã thêm đề', 'Aptis Speaking', 'Aptis Listening', 'Aptis Writing', 'Aptis Reading', 'User-supplied', 'Xem chi tiết'];
  for (const word of cutWords) {
    const idx = title.indexOf(word);
    if (idx > 5) {
      title = title.substring(0, idx).trim();
    }
  }

  return title.length > 5 ? title : `Đề thi Aptis ${skill}`;
}

/**
 * Crawler chuyên biệt cho nguồn aptistest.edu.vn
 * CHỈ THU THẬP ĐỀ THI APTIS ESOL (Listening, Reading, Writing, Speaking, Grammar)
 */
export async function crawl({ prisma = null, saveDb = false, downloadMedia = false } = {}) {
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));
  console.log('=====================================================');
  console.log(`🌐 BẮT ĐẦU ĐỒNG BỘ: ${config.displayName} (${config.baseUrl})`);
  console.log(`📌 Phạm vi: CHỈ THU THẬP ĐỀ THI APTIS ESOL (Không lẫn đề khác)`);
  console.log('=====================================================\n');

  const outputDir = path.resolve(__dirname, `../../data/${config.name}`);
  fs.mkdirSync(outputDir, { recursive: true });

  const authCookie = await ensureSession(config, outputDir);

  const browser = await puppeteer.launch({
    executablePath: getExecutablePath(),
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: 'AptisWeb.Auth',
    value: authCookie,
    domain: 'aptistest.edu.vn',
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
  });

  const catalogPath = path.join(outputDir, 'aptis_skills_catalog.json');
  let aptisLinks = [];

  if (fs.existsSync(catalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
      const testRegex = /\/learning\/(listening|reading|writing|speaking|grammar)\/\d+\/do-test/i;

      for (const [skillKey, skillData] of Object.entries(catalog)) {
        for (const item of skillData.links || []) {
          if (testRegex.test(item.href)) {
            aptisLinks.push({
              rawSkill: skillKey,
              rawTitle: item.text,
              url: item.href,
            });
          }
        }
      }
    } catch {}
  }

  // Khử trùng danh sách URL
  const uniqueUrls = new Map();
  for (const item of aptisLinks) {
    if (!uniqueUrls.has(item.url)) {
      uniqueUrls.set(item.url, item);
    }
  }

  const targets = Array.from(uniqueUrls.values());
  console.log(`🎯 Tìm thấy ${targets.length} bộ đề thi Aptis thực tế cần bóc tách...`);

  const normalizedExams = [];

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];

    // Xác định chuẩn ExamSkill chính xác từ URL và Title
    const urlLower = item.url.toLowerCase();
    const textLower = item.rawTitle.toLowerCase();
    let mappedSkill = 'FULL_TEST';

    if (urlLower.includes('/speaking/') || textLower.includes('speaking')) {
      mappedSkill = 'SPEAKING';
    } else if (urlLower.includes('/writing/') || textLower.includes('writing')) {
      mappedSkill = 'WRITING';
    } else if (urlLower.includes('/reading/') || textLower.includes('reading')) {
      mappedSkill = 'READING';
    } else if (urlLower.includes('/listening/') || textLower.includes('listening')) {
      mappedSkill = 'LISTENING';
    } else if (urlLower.includes('/grammar/') || textLower.includes('grammar') || textLower.includes('ngữ pháp')) {
      mappedSkill = 'GRAMMAR_VOCABULARY';
    }

    const cleanTitle = cleanExamTitle(item.rawTitle, mappedSkill);
    console.log(`\n[${i + 1}/${targets.length}] 📥 [${mappedSkill}] ${cleanTitle} (${item.url})`);

    try {
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 3000)); // Đợi Blazor render

      const extracted = await page.evaluate(() => {
        const pageTitle = document.title || '';
        const bodyText = document.body.innerText || '';

        const audios = Array.from(document.querySelectorAll('audio, source, [data-audio]'))
          .map((a) => a.src || a.getAttribute('src') || a.getAttribute('data-audio'))
          .filter(Boolean);

        const images = Array.from(document.querySelectorAll('img'))
          .map((img) => img.src)
          .filter((src) => src && !src.includes('avatar') && !src.includes('logo') && !src.includes('icon'));

        const qElements = Array.from(
          document.querySelectorAll('.question-box, .question-item, .task-card, [class*="question-"], .card-body')
        );

        const questions = [];
        qElements.forEach((el, qIdx) => {
          const text = (el.innerText || '').trim();
          if (text.length > 5) {
            const opts = Array.from(el.querySelectorAll('label, .form-check-label, option, li'))
              .map((l) => (l.innerText || '').trim())
              .filter((t) => t.length > 0 && t.length < 150);

            questions.push({
              question_number: qIdx + 1,
              prompt: text.split('\n')[0].substring(0, 300) || `Câu hỏi ${qIdx + 1}`,
              options: opts.length >= 2 ? opts.slice(0, 6) : ['A', 'B', 'C', 'D'],
              correct_answer: null,
            });
          }
        });

        return {
          pageTitle,
          audios: Array.from(new Set(audios)),
          images: Array.from(new Set(images)),
          questions,
          hasContent: questions.length > 0 || bodyText.length > 200,
        };
      });

      if (extracted.hasContent) {
        const matchId = item.url.match(/\/(\d+)\/do-test/);
        const externalId = matchId ? `aptistest_${matchId[1]}` : `aptistest_${i + 1}`;

        const isSpeaking = mappedSkill === 'SPEAKING';
        const isWriting = mappedSkill === 'WRITING';

        const questionsList =
          extracted.questions.length > 0
            ? extracted.questions.map((q) => ({
                ...q,
                question_type: isSpeaking ? 'SPEAKING_AUDIO' : isWriting ? 'SHORT_TEXT' : 'MULTIPLE_CHOICE',
                max_score: 1.0,
              }))
            : [
                {
                  question_number: 1,
                  question_type: isSpeaking ? 'SPEAKING_AUDIO' : isWriting ? 'SHORT_TEXT' : 'MULTIPLE_CHOICE',
                  prompt: cleanTitle,
                  options: isSpeaking || isWriting ? [] : ['A', 'B', 'C', 'D'],
                  correct_answer: null,
                  max_score: 1.0,
                },
              ];

        const examObj = normalizeExam({
          source: 'APTISTEST',
          externalId,
          title: cleanTitle,
          skill: mappedSkill,
          durationMinutes: mappedSkill === 'LISTENING' ? 40 : mappedSkill === 'READING' ? 35 : mappedSkill === 'SPEAKING' ? 12 : 50,
          forecastTag: item.rawTitle.includes('25/10')
            ? 'Đề thi 25/10 (188 Cầu Giấy)'
            : item.rawTitle.includes('28/10')
            ? 'Đề thi 28/10'
            : item.rawTitle.includes('18/10')
            ? 'Đề thi 18/10'
            : null,
          parts: [
            {
              part_number: 1,
              title: `${mappedSkill} Practice Test`,
              audio_url: extracted.audios[0] || null,
              image_url: extracted.images[0] || null,
              questions: questionsList,
            },
          ],
        });

        normalizedExams.push(examObj);

        if (saveDb && prisma) {
          await upsertExam(prisma, examObj);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Lỗi khi mở ${item.url}: ${err.message}`);
    }
  }

  await browser.close();

  const normalizedPath = path.join(outputDir, 'normalized_exams.json');
  fs.writeFileSync(normalizedPath, JSON.stringify(normalizedExams, null, 2), 'utf-8');

  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        source: 'APTISTEST',
        totalExams: normalizedExams.length,
        savedToDb: saveDb,
        crawledAt: new Date().toISOString(),
        examsList: normalizedExams.map((e) => ({
          externalId: e.externalId,
          title: e.title,
          skill: e.skill,
          questionsCount: e.parts.reduce((acc, p) => acc + p.questions.length, 0),
        })),
      },
      null,
      2
    ),
    'utf-8'
  );

  console.log('\n=====================================================');
  console.log(`✅ HOÀN TẤT BÓC TÁCH APTIS TEST: ${normalizedExams.length} ĐỀ APTIS ESOL`);
  console.log(`📁 File Staging JSON: ${normalizedPath}`);
  console.log(`📁 File Thống Kê: ${summaryPath}`);
  console.log('=====================================================\n');

  return {
    source: 'APTISTEST',
    totalExams: normalizedExams.length,
    outputPath: normalizedPath,
  };
}
