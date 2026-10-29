import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_exec.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    cmd = 'docker cp /tmp/q_exec.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_in.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -f /tmp/q_in.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err and "ERROR" in err:
        print("SQL ERROR:", err, flush=True)
    return out

# 1. Publish tất cả 16 đề Đề XX
print("Step 1: Set is_published = true for Đề 01..20", flush=True)
res = run_sql("""
UPDATE "Exam"
SET is_published = true, duration_minutes = 15
WHERE skill = 'READING' AND title ~ '^Đề\\s*\\d+$' AND title != 'Đề 1';
""")
print("Updated exams:", res, flush=True)

# 2. Cập nhật câu hỏi và đáp án Part 1 cho Đề XX
part1_keys = {
    '01': ["window", "buy", "market", "cake", "watched"],
    '02': ["live", "share", "class", "drive", "cook"],
    '03': ["near", "friendly", "practices", "say", "then"],
    '04': ["friendly", "walk", "first", "speak", "together"],
    '05': ["Clear", "sun", "enjoyable", "working", "read"],
    '07': ["station", "stops", "green", "dinner", "films"],
    '08': ["window", "buy", "market", "cake", "watched"],
    '10': ["morning", "friends", "leave", "good", "food"],
    '12': ["early", "lunch", "go", "car", "sleepy"],
    '14': ["miss", "called", "ready", "meet", "dinner"],
    '15': ["balance", "statement", "think", "slowly", "before"],
    '16': ["just", "too", "to", "some", "give"],
    '17': ["meetings", "park", "shop", "cook", "late"],
    '18': ["great", "boat", "then", "see", "too"],
    '19': ["open", "send", "easy", "so", "page"],
    '20': ["detail", "copy", "busy", "client", "long"],
}

print("Step 2: Updating question keys and 2.0 max_score", flush=True)
for num_str, answers in part1_keys.items():
    de_title = f"Đề {num_str}"
    sql_qs = f"""
    SELECT q.id, q.prompt, q.options::text
    FROM "Question" q
    JOIN "ExamPart" ep ON q.part_id = ep.id
    JOIN "Exam" e ON ep.exam_id = e.id
    WHERE e.skill = 'READING' AND e.title = '{de_title}'
    ORDER BY q.question_number ASC;
    """
    qs_res = run_sql(sql_qs)
    if qs_res:
        lines = qs_res.splitlines()
        for idx, line in enumerate(lines[:5]):
            parts = line.split("|||")
            qid = parts[0].strip()
            prompt = parts[1].strip() if len(parts) > 1 else ""
            opts_str = parts[2].strip() if len(parts) > 2 else "[]"

            clean_prompt = prompt.replace("tienphongSpace", "[gap]").replace("<p>", "").replace("</p>", "").strip()
            ans = answers[idx].strip()

            try:
                opts = json.loads(opts_str)
                if not any(opt.strip().lower() == ans.lower() for opt in opts):
                    opts.append(ans)
                opts_clean = [opt.replace("tienphongSpace", "").strip() for opt in opts if opt.strip()]
                opts_json = json.dumps(opts_clean, ensure_ascii=False).replace("'", "''")
            except:
                opts_json = "[]"

            update_q_sql = f"""
            UPDATE "Question"
            SET correct_answer = '{ans.replace("'", "''")}',
                prompt = '{clean_prompt.replace("'", "''")}',
                options = '{opts_json}'::jsonb,
                max_score = 2.0
            WHERE id = '{qid}';
            """
            run_sql(update_q_sql)
        print(f"  ✅ {de_title}: 5 câu x 2.0đ, key: {', '.join(answers)}", flush=True)

# 3. Kiểm tra danh sách hiển thị
print("Step 3: Checking currently published reading exams", flush=True)
check_sql = """
SELECT id, title, is_published FROM "Exam" WHERE skill = 'READING' AND is_published = true ORDER BY title ASC;
"""
print(run_sql(check_sql), flush=True)

ssh.close()
print("🎉 All done!", flush=True)
