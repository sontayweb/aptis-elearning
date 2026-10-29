import paramiko
import sys
import json

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/query_audit.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/query_audit.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

print("=== 1. KIỂM TRA TẤT CẢ CÁC ĐỀ READING TRONG DATABASE ===")
sql_reading_exams = """
SELECT id, title, type, hot_level, created_at
FROM "Exam"
WHERE skill = 'READING'
ORDER BY title;
"""
res = run_sql(sql_reading_exams)
lines = [l for l in res.split('\n') if l.strip()]
print(f"Tổng số đề Reading: {len(lines)}")
full_reading = []
sub_exams = []
for line in lines:
    parts = line.split('|||')
    if len(parts) >= 3:
        eid, title, etype = parts[0], parts[1], parts[2]
        hot = parts[3] if len(parts) > 3 else '0'
        if 'Full' in title or '4 Parts' in title:
            full_reading.append((eid, title, hot))
        else:
            sub_exams.append((eid, title, hot))

print(f"\n--- Đề Full Reading (4 Parts) ({len(full_reading)} đề) ---")
for eid, title, hot in full_reading:
    print(f"  {title} (hot: {hot}, id: {eid})")

print(f"\n--- Đề lẻ / Sub-exams Reading ({len(sub_exams)} đề) ---")
for eid, title, hot in sub_exams[:30]:
    print(f"  {title} (hot: {hot})")
if len(sub_exams) > 30:
    print(f"  ... và còn {len(sub_exams) - 30} đề khác")

print("\n=== 2. KIỂM TRA ĐIỂM SỐ VÀ ĐÁP ÁN PART 1 (FULL READING) ===")
sql_p1 = """
SELECT e.title, p.part_number, q.question_number, q.correct_answer, q.max_score
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND p.part_number = 1 AND (e.title LIKE '%Full Reading%' OR e.title LIKE '%Đề%')
ORDER BY e.title, q.question_number;
"""
res_p1 = run_sql(sql_p1)
p1_map = {}
for line in res_p1.split('\n'):
    parts = line.split('|||')
    if len(parts) >= 5:
        t, pnum, qnum, ans, score = parts[0], parts[1], parts[2], parts[3], parts[4]
        if t not in p1_map:
            p1_map[t] = []
        p1_map[t].append((qnum, ans, score))

for t in sorted(p1_map.keys()):
    if 'Full Reading' in t:
        qs = p1_map[t]
        answers = " - ".join([q[1] for q in qs])
        scores = [q[2] for q in qs]
        total_score = sum([float(s) for s in scores])
        print(f"{t}:")
        print(f"  Đáp án: {answers}")
        print(f"  Điểm mỗi câu: {scores} (Tổng: {total_score})")

print("\n=== 3. KIỂM TRA CẤU TRÚC VÀ ĐIỂM SỐ PART 2 & PART 3 ===")
sql_p23 = """
SELECT e.title, p.part_number, q.question_number, q.question_type, q.prompt, q.correct_answer, q.options, q.max_score
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND p.part_number IN (2, 3) AND e.title LIKE '%Full Reading%'
ORDER BY e.title, p.part_number, q.question_number
LIMIT 20;
"""
res_p23 = run_sql(sql_p23)
for line in res_p23.split('\n'):
    parts = line.split('|||')
    if len(parts) >= 8:
        t, pnum, qnum, qtype, prompt, ans, opts, score = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7]
        print(f"{t} - Part {pnum} Q{qnum} ({qtype}, max_score: {score}):")
        print(f"  Prompt: {prompt[:80]}...")
        print(f"  Answer: {ans}")
        print(f"  Options length: {len(opts) if opts else 0}")

print("\n=== 4. TÌM KIẾM CÁC BÀI ĐỌC CỤ THỂ NGƯỜI DÙNG NHẮC ĐẾN ===")
target_stories = [
    'Making films',
    'Family sport',
    'coffee shop',
    'famous singer',
    'End-of-term',
    'Eating at a cafe'
]
for story in target_stories:
    sql_search = f"""
    SELECT e.title, p.part_number, q.prompt, q.correct_answer, q.options
    FROM "Exam" e
    JOIN "ExamPart" p ON p.exam_id = e.id
    JOIN "Question" q ON q.part_id = p.id
    WHERE e.skill = 'READING' AND (
        q.prompt ILIKE '%{story}%' OR 
        q.correct_answer ILIKE '%{story}%' OR 
        q.options ILIKE '%{story}%' OR
        e.title ILIKE '%{story}%'
    )
    LIMIT 5;
    """
    res_s = run_sql(sql_search)
    print(f"\n--- Tìm kiếm: '{story}' ---")
    if not res_s.strip():
        print("  ❌ Không tìm thấy kết quả!")
    else:
        for l in res_s.split('\n'):
            parts = l.split('|||')
            if len(parts) >= 4:
                print(f"  Đề: {parts[0]} - Part {parts[1]}")
                print(f"    Prompt: {parts[2][:100] if len(parts) > 2 else ''}...")
                print(f"    Answer: {parts[3] if len(parts) > 3 else ''}")

ssh.close()
