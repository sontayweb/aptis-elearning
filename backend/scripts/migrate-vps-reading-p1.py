import paramiko
import sys
import json
import uuid

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/query.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/query.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err and "ERROR" in err:
        print("SQL ERROR:", err)
    return out

print("=== BẮT ĐẦU CHUẨN HÓA DỮ LIỆU READING TRÊN VPS COOLIFY ===")

# 1. DANH SÁCH 16 ĐỀ PART 1 CHUẨN
core_p1_keys = [
    { "code": "01", "answers": ["window", "buy", "market", "cake", "watched"] },
    { "code": "02", "answers": ["live", "share", "class", "drive", "cook"] },
    { "code": "03", "answers": ["near", "friendly", "practices", "say", "then"] },
    { "code": "04", "answers": ["friendly", "walk", "first", "speak", "together"] },
    { "code": "05", "answers": ["clear", "sun", "enjoyable", "working", "read"] },
    { "code": "07", "answers": ["station", "stops", "green", "dinner", "films"] },
    { "code": "08", "answers": ["window", "buy", "market", "cake", "watched"] },
    { "code": "10", "answers": ["morning", "friends", "leave", "good", "food"] },
    { "code": "12", "answers": ["early", "lunch", "go", "car", "sleepy"] },
    { "code": "14", "answers": ["miss", "called", "ready", "meet", "dinner"] },
    { "code": "15", "answers": ["balance", "statement", "think", "slowly", "before"] },
    { "code": "16", "answers": ["just", "too", "to", "some", "give"] },
    { "code": "17", "answers": ["meetings", "park", "shop", "cook", "late"] },
    { "code": "18", "answers": ["great", "boat", "then", "see", "too"] },
    { "code": "19", "answers": ["open", "send", "easy", "so", "page"] },
    { "code": "20", "answers": ["detail", "copy", "busy", "client", "long"] },
]

# 2. XÓA CÁC ĐỀ TRÙNG LẶP VÀ ĐỀ RÁC
print("\n[Bước 1] Dọn dẹp các đề trùng lặp và đề lỗi...")
dup_titles = [
    'Đề 06', 'Đề 09', 'Đề 11', 'Đề 13',
    'Đề 21', 'Đề 22', 'Đề 23', 'Đề 24', 'Đề 25', 'Đề 26', 'Đề 27', 'Đề 28', 'Đề 29', 'Đề 30', 'Đề 31', 'Đề 32',
    'Đề 35'
]

# Format SQL list
dup_in = ", ".join(f"'{t}'" for t in dup_titles)
del_sql = f"""
DO $$
DECLARE
  rec RECORD;
BEGIN
  -- Xóa các đề thi trùng lặp Part 1 đơn lẻ
  FOR rec IN (
    SELECT id, title FROM "Exam" 
    WHERE skill = 'READING' AND (
      title IN ({dup_in}) OR 
      title ILIKE '%Bộ Đề Tủ Part 1%' OR
      title ILIKE '%Bộ Đề Tủ Part 2%'
    )
  ) LOOP
    DELETE FROM "SubmissionAnswer" WHERE question_id IN (
      SELECT q.id FROM "Question" q JOIN "ExamPart" p ON q.part_id = p.id WHERE p.exam_id = rec.id
    );
    DELETE FROM "ExamSubmission" WHERE exam_id = rec.id;
    DELETE FROM "Question" WHERE part_id IN (SELECT id FROM "ExamPart" WHERE exam_id = rec.id);
    DELETE FROM "ExamPart" WHERE exam_id = rec.id;
    DELETE FROM "Exam" WHERE id = rec.id;
    RAISE NOTICE 'Đã xóa đề rác/trùng: %', rec.title;
  END LOOP;
END $$;
"""
print(run_sql(del_sql))
print("✅ Dọn dẹp xong đề trùng lặp và đề rác.")

# 3. CẬP NHẬT 16 ĐỀ PART 1 CHUẨN
print("\n[Bước 2] Chuẩn hóa 16 đề Part 1 cốt lõi (max_score = 2.0)...")

for item in core_p1_keys:
    code = item["code"]
    title = f"Đề {code}"
    answers = item["answers"]
    
    # Lấy questions của đề này
    q_sql = f"""
    SELECT q.id, q.question_number, q.prompt, q.options, q.correct_answer
    FROM "Exam" e
    JOIN "ExamPart" p ON p.exam_id = e.id
    JOIN "Question" q ON q.part_id = p.id
    WHERE e.title = '{title}' AND e.skill = 'READING' AND p.part_number = 1
    ORDER BY q.question_number;
    """
    res = run_sql(q_sql)
    q_lines = [l for l in res.split('\n') if l.strip()]
    
    if len(q_lines) == 5:
        # Cập nhật từng câu
        update_parts = []
        for idx, line in enumerate(q_lines):
            parts = line.split('|||')
            qid = parts[0]
            current_opts_str = parts[3]
            target_ans = answers[idx]
            
            # Đảm bảo target_ans có trong options
            try:
                opts = json.loads(current_opts_str)
                opts_lower = [str(o).lower() for o in opts]
                if target_ans.lower() not in opts_lower:
                    opts.append(target_ans)
                new_opts_json = json.dumps(opts, ensure_ascii=False).replace("'", "''")
            except:
                new_opts_json = json.dumps([target_ans], ensure_ascii=False)
            
            update_sql = f"""
            UPDATE "Question" 
            SET correct_answer = '{target_ans}', 
                options = '{new_opts_json}'::jsonb, 
                max_score = 2.0 
            WHERE id = '{qid}';
            """
            run_sql(update_sql)
        print(f"  ✓ Đã cập nhật {title}: {' - '.join(answers)} (max_score = 2.0)")
    else:
        print(f"  ⚠️ {title} có {len(q_lines)} câu hỏi (cần kiểm tra lại)")

# Cập nhật cả các đề Full Reading · 4 Parts tương ứng
for item in core_p1_keys:
    code = item["code"]
    full_title = f"Đề {code} — Full Reading · 4 Parts"
    answers = item["answers"]
    
    q_sql = f"""
    SELECT q.id, q.question_number, q.options
    FROM "Exam" e
    JOIN "ExamPart" p ON p.exam_id = e.id
    JOIN "Question" q ON q.part_id = p.id
    WHERE e.title = '{full_title}' AND e.skill = 'READING' AND p.part_number = 1
    ORDER BY q.question_number;
    """
    res = run_sql(q_sql)
    q_lines = [l for l in res.split('\n') if l.strip()]
    if len(q_lines) == 5:
        for idx, line in enumerate(q_lines):
            parts = line.split('|||')
            qid = parts[0]
            target_ans = answers[idx]
            try:
                opts = json.loads(parts[2])
                if target_ans.lower() not in [str(o).lower() for o in opts]:
                    opts.append(target_ans)
                new_opts_json = json.dumps(opts, ensure_ascii=False).replace("'", "''")
            except:
                new_opts_json = json.dumps([target_ans], ensure_ascii=False)
            
            run_sql(f"""
            UPDATE "Question" 
            SET correct_answer = '{target_ans}', 
                options = '{new_opts_json}'::jsonb, 
                max_score = 2.0 
            WHERE id = '{qid}';
            """)
        print(f"  ✓ Đã cập nhật Full Exam {full_title}")

ssh.close()
