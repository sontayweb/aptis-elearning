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
    with sftp.file('/tmp/audit_script.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/audit_script.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

print("================================================================================")
print("1. KIỂM TRA ĐỀ 35 VÀ CÁC ĐỀ TỪ 01 ĐẾN 35 (DANH SÁCH EXAM TRONG DB)")
print("================================================================================")
sql = """
SELECT id, title, skill, type, hot_level
FROM "Exam"
WHERE skill = 'READING' AND (title LIKE 'Đề%' OR title LIKE '%Reading%')
ORDER BY title;
"""
res = run_sql(sql)
de_map = {}
for line in res.split('\n'):
    if not line.strip(): continue
    parts = line.split('|||')
    if len(parts) >= 5:
        de_map[parts[1]] = {'id': parts[0], 'type': parts[3], 'hot': parts[4]}

print(f"Tổng số đề Reading bắt đầu bằng 'Đề' hoặc có 'Reading': {len(de_map)}")
for title in sorted(de_map.keys()):
    if 'Full Reading' in title:
        print(f"  [FULL] {title} -> ID: {de_map[title]['id']}, Hot: {de_map[title]['hot']}")

print("\nKiểm tra cụ thể Đề 35:")
found_35 = [t for t in de_map.keys() if '35' in t]
print("Các đề có chứa số 35:", found_35)
for t in found_35:
    eid = de_map[t]['id']
    parts_info = run_sql(f"""
    SELECT p.part_number, p.title, count(q.id) as q_count
    FROM "ExamPart" p
    LEFT JOIN "Question" q ON q.part_id = p.id
    WHERE p.exam_id = '{eid}'
    GROUP BY p.part_number, p.title
    ORDER BY p.part_number;
    """)
    print(f"  Chi tiết đề '{t}':")
    for pi in parts_info.split('\n'):
        print(f"    {pi}")

print("\n================================================================================")
print("2. ĐỐI SOÁT ĐÁP ÁN VÀ ĐIỂM SỐ PART 1 (01 ĐẾN 32)")
print("================================================================================")
user_p1_keys = {
    1: "window - buy - market - cake - watched",
    2: "live - share - class - drive - cook",
    3: "near - friendly - practices - say - then",
    4: "friendly - walk - first - speak - together",
    5: "Clear - sun - enjoyable - working - read",
    6: "bị trùng xoá đề này đi",
    7: "station - stops - green - dinner - films",
    8: "window - buy - market - cake - watched",
    9: "trùng với 03",
    10: "morning - friends - leave - good - food",
    11: "trùng với 04",
    12: "early - lunch - go - car - sleepy",
    13: "trùng với 05",
    14: "miss - called - ready - meet - dinner",
    15: "balance - statement - think - slowly - before",
    16: "just - too - to - some - give",
    17: "meetings - park - shop - cook - late",
    18: "great - boat - then - see - too",
    19: "open - send - easy - so - page",
    20: "detail - copy - busy - client - long",
    21: "trùng với 12",
    22: "trùng với 14",
    23: "trùng với 15",
    24: "trùng với 16",
    25: "trùng với 17",
    26: "trùng với 18",
    27: "trùng với 20",
    28: "trùng với 07",
    29: "trùng với 01",
    30: "trùng với 10",
    31: "trùng với 04",
    32: "trùng với 12",
    35: "đang bị lỗi"
}

sql_p1_all = """
SELECT e.title, q.question_number, q.correct_answer, q.max_score
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND p.part_number = 1 AND e.title LIKE '%Full Reading%'
ORDER BY e.title, q.question_number;
"""
res_p1_all = run_sql(sql_p1_all)
db_p1 = {}
for line in res_p1_all.split('\n'):
    if not line.strip(): continue
    p = line.split('|||')
    if len(p) >= 4:
        title, qnum, ans, score = p[0], int(p[1]), p[2], float(p[3])
        if title not in db_p1:
            db_p1[title] = {'ans': [], 'scores': []}
        db_p1[title]['ans'].append(ans)
        db_p1[title]['scores'].append(score)

print(f"{'Đề':<10} | {'Trạng thái trong DB':<25} | {'Đáp án DB':<45} | {'Yêu cầu User':<45} | {'Điểm/câu':<10}")
print("-" * 145)
for i in range(1, 33):
    t_full = f"Đề {i:02d} — Full Reading · 4 Parts"
    user_req = user_p1_keys.get(i, "")
    if t_full in db_p1:
        ans_str = " - ".join(db_p1[t_full]['ans'])
        scores_str = str(db_p1[t_full]['scores'][0])
        status = "Tồn tại"
        if "trùng" in user_req:
            status = "⚠️ TRÙNG (CHƯA XOÁ)"
        elif "xoá" in user_req:
            status = "⚠️ CẦN XOÁ (CHƯA XOÁ)"
        print(f"Đề {i:02d}     | {status:<25} | {ans_str:<45} | {user_req:<45} | {scores_str}")
    else:
        print(f"Đề {i:02d}     | ❌ KHÔNG CÓ TRONG DB      | {'':<45} | {user_req:<45} | -")

print("\n================================================================================")
print("3. KIỂM TRA ĐỘ HOT VÀ NỘI DUNG 8 BÀI ĐỌC PART 2 & PART 3")
print("================================================================================")
stories = [
    ("Making films", ["%Making films%"]),
    ("Family sport days", ["%Family sport%"]),
    ("My visit to a new coffee shop", ["%new coffee shop%", "%My visit to a new coffee%"]),
    ("A famous singer", ["%famous singer%"]),
    ("New coffee shop", ["%New coffee shop%"]),
    ("End-of-term project", ["%End-of-term%", "%End of term%"]),
    ("Eating at a cafe", ["%Eating at a cafe%"])
]

for s_name, patterns in stories:
    print(f"\n--- BÀI: {s_name} ---")
    where_clauses = " OR ".join([f"q.prompt ILIKE '{pat}' OR p.title ILIKE '{pat}' OR e.title ILIKE '{pat}'" for pat in patterns])
    sql_story = f"""
    SELECT e.title, e.hot_level, p.part_number, q.question_number, q.prompt, q.correct_answer, q.options, q.max_score
    FROM "Exam" e
    JOIN "ExamPart" p ON p.exam_id = e.id
    JOIN "Question" q ON q.part_id = p.id
    WHERE e.skill = 'READING' AND ({where_clauses})
    ORDER BY e.title, p.part_number;
    """
    res_story = run_sql(sql_story)
    if not res_story.strip():
        print("  ❌ KHÔNG TÌM THẤY TRONG DB!")
    else:
        for line in res_story.split('\n'):
            if not line.strip(): continue
            parts = line.split('|||')
            if len(parts) >= 8:
                etitle, hot, pnum, qnum, prompt, ans, opts_str, score = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6], parts[7]
                print(f"  * Đề: {etitle} (Hot level hiện tại: {hot})")
                print(f"    Part {pnum} Q{qnum} | Điểm: {score}")
                print(f"    Đáp án hiện tại: {ans}")
                try:
                    opts = json.loads(opts_str)
                    has_fixed = opts.get('fixedSentence') is not None
                    s_count = len(opts.get('sentences', []))
                    print(f"    Cấu trúc: {s_count} câu kéo thả | Câu cố định: {'Có: ' + str(opts.get('fixedSentence')) if has_fixed else 'Không (5 câu tự do)'}")
                    for s in opts.get('sentences', []):
                        print(f"      [{s['id']}] {s['text']}")
                except Exception as ex:
                    print(f"    Lỗi parse options: {ex}")

print("\n================================================================================")
print("4. KIỂM TRA HỆ THỐNG CRAWLER CHO 'APTIS TIÊN PHONG'")
print("================================================================================")
ssh.close()
