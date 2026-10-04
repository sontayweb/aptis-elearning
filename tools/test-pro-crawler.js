import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const session = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/aptiskytich/session.json'), 'utf-8'));
  const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'sources/aptiskytich/config.json'), 'utf-8'));
  const supabaseUrl = config.supabaseUrl;
  const anonKey = config.anonKey;
  const token = session.accessToken;

  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  console.log('=====================================================');
  console.log('🔍 KHÁM PHÁ CHI TIẾT TÀI NGUYÊN PRO TRÊN APTIS KỲ TÍCH');
  console.log('=====================================================\n');

  // 1. Kiểm tra quyền truy cập trực tiếp vào các bảng quan trọng
  const tables = [
    'exam_sets',
    'exam_questions',
    'questions',
    'full_tests',
    'dictation_sets',
    'dictation_sentences',
    'vocab_lists',
    'vocab_items',
    'key_du_doan',
    'user_subscriptions',
    'profiles'
  ];

  console.log('--- 1. Kiểm tra phân quyền truy cập Bảng (Tables) ---');
  for (const table of tables) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=3`, { headers });
      if (res.ok) {
        const data = await res.json();
        console.log(`✅ [Table] ${table.padEnd(20)}: HTTP ${res.status} | Đọc thành công ${data.length} dòng mẫu`);
        if (data.length > 0) {
          fs.writeFileSync(path.join(__dirname, `data/aptiskytich/sample_${table}.json`), JSON.stringify(data, null, 2));
        }
      } else {
        const err = await res.text();
        console.log(`❌ [Table] ${table.padEnd(20)}: HTTP ${res.status} | ${err.substring(0, 100)}`);
      }
    } catch (e) {
      console.log(`⚠️ [Table] ${table.padEnd(20)}: Lỗi fetch: ${e.message}`);
    }
  }

  // 2. Thử nghiệm các RPC chuyên biệt cho đề thi và câu hỏi
  console.log('\n--- 2. Kiểm tra các RPC nghiệp vụ (Functions/RPC) ---');
  const rpcs = [
    'get_full_tests',
    'get_dictation_levels',
    'get_dictation_sets',
    'get_showcase_board',
    'get_intro_video',
    'get_exam_questions',
    'get_exam_set',
    'get_exam_details',
    'get_key_du_doan',
    'get_predictive_keys'
  ];

  for (const rpc of rpcs) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpc}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({})
      });
      const text = await res.text();
      console.log(`• [RPC] ${rpc.padEnd(25)}: HTTP ${res.status} | Phản hồi: ${text.substring(0, 120)}`);
    } catch (e) {
      console.log(`• [RPC] ${rpc.padEnd(25)}: Lỗi fetch: ${e.message}`);
    }
  }
}

main().catch(console.error);
