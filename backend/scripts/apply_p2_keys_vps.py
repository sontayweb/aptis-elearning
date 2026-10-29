import json
import re
import sys
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "103.90.227.117"
VPS_USER = "root"
VPS_PASS = "Taovipko0!"
CONTAINER = "wlafe5vr5fwx6rn3curavktm"
DB_NAME = "aptis_kytich_db"

def clean(t):
    if not t: return ""
    t = re.sub(r'<[^>]+>', ' ', str(t))
    t = re.sub(r'["“”\'’]', '', t)
    t = re.sub(r'^\s*\d+[\s\.\:\)]+', '', t.strip())
    t = re.sub(r'\s+', ' ', t).strip().lower()
    return t

def run_clean_sql(sql):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=15)
    
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/cmd.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    
    cmd = f'docker exec -i {CONTAINER} psql -U postgres -d {DB_NAME} -t -A -F "|||" < /tmp/cmd.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    ssh.close()
    if err and "ERROR" in err:
        print("SQL ERROR:", err)
    return out

print("Fetching all Part 2 questions from VPS DB...")
out = run_clean_sql("""
SELECT json_build_object(
  'id', q.id,
  'exam_id', e.id,
  'exam_title', e.title,
  'question_number', q.question_number,
  'prompt', q.prompt,
  'options', q.options,
  'correct_answer', q.correct_answer,
  'explanation', q.explanation
)::text
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
JOIN "Exam" e ON e.id = ep.exam_id
WHERE e.skill = 'READING' AND (
  ep.title LIKE '%Part 2%' OR ep.title LIKE '%Cohesion%' OR e.title LIKE '%Part 2%' OR (e.title LIKE '%Full Reading%' AND ep.part_number = 2)
)
ORDER BY e.title, q.question_number;
""")

rows = []
for line in out.strip().split("\n"):
    if not line.strip() or not line.startswith("{"): continue
    try:
        rows.append(json.loads(line))
    except:
        pass

print(f"Loaded {len(rows)} Part 2 questions.")

updates = []

for r in rows:
    opts = r.get("options") or {}
    sents = opts.get("sentences") or []
    if len(sents) < 4: continue
    
    prompt = r.get("prompt") or ""
    exp = r.get("explanation") or ""
    curr_ans = r.get("correct_answer") or ""
    
    if not exp or len(exp) < 30:
        for other_r in rows:
            if other_r["exam_title"] == r["exam_title"] and other_r.get("explanation"):
                exp = other_r["explanation"]
                break
                
    sections = re.split(r'▸|\n(?=[A-Z0-9\s]+—\s*thứ tự đúng)', exp)
    relevant_exp = exp
    for sec in sections:
        clean_sec_header = sec.split("\n")[0].lower()
        clean_p = prompt.lower()
        if clean_p in clean_sec_header or clean_sec_header in clean_p or any(w in clean_sec_header for w in clean_p.split() if len(w) > 3):
            relevant_exp = sec
            break
            
    ordered_items = []
    for line in relevant_exp.split("\n"):
        if "→" in line:
            left_part = line.split("→")[0].strip()
            num_m = re.match(r'^\s*(\d+)[\.\)]', left_part)
            if num_m:
                num = int(num_m.group(1))
                if num == 0: continue
                s_text = re.sub(r'^\s*\d+[\.\)]\s*', '', left_part).strip(' “"\'\t\r\n.')
                c = clean(s_text)
                if len(c) > 8:
                    ordered_items.append((num, c))
                    
    ordered_items.sort(key=lambda x: x[0])
    ordered_texts = [x[1] for x in ordered_items]
    
    if len(ordered_texts) == 10 and len(sents) == 5:
        if r["question_number"] == 1:
            ordered_texts = ordered_texts[:5]
        else:
            ordered_texts = ordered_texts[5:]
            
    if len(ordered_texts) == len(sents):
        new_key = []
        used_ids = set()
        for ot in ordered_texts:
            matched_id = None
            best_sim = 0
            for s in sents:
                sid = s.get("id") if isinstance(s, dict) else str(s)
                if sid in used_ids: continue
                st = clean(s.get("text", "") if isinstance(s, dict) else s)
                ot_words = set(ot.split())
                st_words = set(st.split())
                overlap = len(ot_words.intersection(st_words))
                if overlap > best_sim and overlap >= 3:
                    best_sim = overlap
                    matched_id = sid
            if matched_id:
                new_key.append(matched_id)
                used_ids.add(matched_id)
                
        if len(new_key) == len(sents):
            updates.append({
                "id": r["id"],
                "exam_title": r["exam_title"],
                "prompt": prompt,
                "qnum": r["question_number"],
                "old_key": curr_ans,
                "new_key": json.dumps(new_key)
            })

print(f"Applying true key updates to {len(updates)} questions on VPS...")

sql_statements = []
for u in updates:
    escaped_key = u["new_key"].replace("'", "''")
    sql_statements.append(f"""
    UPDATE "Question" 
    SET correct_answer = '{escaped_key}', max_score = 5.0 
    WHERE id = '{u["id"]}';
    """)

batch_sql = "\n".join(sql_statements)
res = run_clean_sql(batch_sql)
print("Execution output:", res[:200])
print(f"✅ Hoàn tất cập nhật thành công {len(updates)} câu hỏi Part 2 trên VPS DB!")
