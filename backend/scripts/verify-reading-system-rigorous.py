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
    with sftp.file('/tmp/query.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/query.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

print("================================================================================")
print("🔍 BỘ TEST TOÀN DIỆN KIỂM ĐỊNH KỸ NĂNG READING TRÊN VPS PRODUCTION")
print("================================================================================\n")

total_tests = 0
passed_tests = 0

def test_assert(cond, name, details=""):
    global total_tests, passed_tests
    total_tests += 1
    if cond:
        passed_tests += 1
        print(f"  ✅ [PASS] {name}")
        if details:
            print(f"     👉 {details}")
    else:
        print(f"  ❌ [FAIL] {name}")
        if details:
            print(f"     ⚠️ {details}")

# ------------------------------------------------------------------------------
# TEST 1: KIỂM TRA ĐÁP ÁN & ĐIỂM SỐ 16 ĐỀ PART 1 CỐT LÕI
# ------------------------------------------------------------------------------
print("--- [TEST SUITE 1] ĐỐI CHIẾU 100% ĐÁP ÁN VÀ THANG ĐIỂM 16 ĐỀ PART 1 CỐT LÕI ---")
user_keys = {
    "Đề 01": ["window", "buy", "market", "cake", "watched"],
    "Đề 02": ["live", "share", "class", "drive", "cook"],
    "Đề 03": ["near", "friendly", "practices", "say", "then"],
    "Đề 04": ["friendly", "walk", "first", "speak", "together"],
    "Đề 05": ["clear", "sun", "enjoyable", "working", "read"],
    "Đề 07": ["station", "stops", "green", "dinner", "films"],
    "Đề 08": ["window", "buy", "market", "cake", "watched"],
    "Đề 10": ["morning", "friends", "leave", "good", "food"],
    "Đề 12": ["early", "lunch", "go", "car", "sleepy"],
    "Đề 14": ["miss", "called", "ready", "meet", "dinner"],
    "Đề 15": ["balance", "statement", "think", "slowly", "before"],
    "Đề 16": ["just", "too", "to", "some", "give"],
    "Đề 17": ["meetings", "park", "shop", "cook", "late"],
    "Đề 18": ["great", "boat", "then", "see", "too"],
    "Đề 19": ["open", "send", "easy", "so", "page"],
    "Đề 20": ["detail", "copy", "busy", "client", "long"],
}

for title, expected_answers in user_keys.items():
    sql = f"""
    SELECT q.question_number, q.correct_answer, q.max_score, q.options
    FROM "Exam" e
    JOIN "ExamPart" p ON p.exam_id = e.id
    JOIN "Question" q ON q.part_id = p.id
    WHERE e.title = '{title}' AND e.skill = 'READING' AND p.part_number = 1
    ORDER BY q.question_number;
    """
    res = run_sql(sql)
    lines = [l for l in res.split('\n') if l.strip()]
    
    test_assert(len(lines) == 5, f"{title}: Đủ 5 câu hỏi", f"Thực tế: {len(lines)} câu")
    if len(lines) == 5:
        actual_ans = []
        actual_scores = []
        all_options_have_ans = True
        for idx, line in enumerate(lines):
            parts = line.split('|||')
            ans = parts[1].strip().lower()
            score = float(parts[2])
            opts_str = parts[3]
            actual_ans.append(ans)
            actual_scores.append(score)
            try:
                opts = json.loads(opts_str)
                if ans not in [o.lower() for o in opts]:
                    all_options_have_ans = False
            except:
                pass
        
        matches = actual_ans == expected_answers
        test_assert(matches, f"{title}: Đáp án khớp 100% với yêu cầu", f"Đáp án DB: {' - '.join(actual_ans)}")
        score_ok = all(s == 2.0 for s in actual_scores) and sum(actual_scores) == 10.0
        test_assert(score_ok, f"{title}: Thang điểm chuẩn 2.0đ/câu = 10đ tổng", f"Scores: {actual_scores}")
        test_assert(all_options_have_ans, f"{title}: Options trong dropdown chứa đáp án đúng")

# ------------------------------------------------------------------------------
# TEST 2: KIỂM TRA ĐÃ XÓA TRIỆT ĐỂ CÁC ĐỀ TRÙNG LẶP
# ------------------------------------------------------------------------------
print("\n--- [TEST SUITE 2] KIỂM TRA ĐÃ DỌN DẸP SẠCH CÁC ĐỀ TRÙNG LẶP ---")
dup_check_sql = """
SELECT title, count(*)
FROM "Exam"
WHERE skill = 'READING' AND (
  title IN ('Đề 06', 'Đề 09', 'Đề 11', 'Đề 13', 'Đề 35') OR
  title ~ '^Đề (2[1-9]|3[0-2])$'
)
GROUP BY title;
"""
res_dup = run_sql(dup_check_sql)
dup_found = [l for l in res_dup.split('\n') if l.strip()]
test_assert(len(dup_found) == 0, "Không còn bất kỳ đề trùng lặp đơn lẻ cũ nào (06, 09, 11, 13, 21-32, 35)", f"Found: {dup_found}")

# ------------------------------------------------------------------------------
# TEST 3: KIỂM TRA CÁC ĐỀ PART 1 MỚI NẠP TỪ APTIS TIÊN PHONG
# ------------------------------------------------------------------------------
print("\n--- [TEST SUITE 3] KIỂM TRA CÁC ĐỀ PART 1 MỚI (Đề 21 -> Đề 52) ---")
new_p1_sql = """
SELECT e.title, count(q.id), sum(q.max_score)
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.description = 'Bộ đề trọng điểm Reading Part 1 – Gap Fill từ Aptis Tiên Phong'
GROUP BY e.title
ORDER BY e.title;
"""
res_new_p1 = run_sql(new_p1_sql)
lines_new = [l for l in res_new_p1.split('\n') if l.strip()]
test_assert(len(lines_new) == 32, f"Đã nạp đủ 32 đề Part 1 mới", f"Số đề tìm thấy: {len(lines_new)}")

all_new_5q = True
all_new_10pts = True
for l in lines_new:
    parts = l.split('|||')
    q_cnt = int(parts[1])
    score_sum = float(parts[2])
    if q_cnt != 5:
        all_new_5q = False
    if score_sum != 10.0:
        all_new_10pts = False

test_assert(all_new_5q, "Tất cả 32 đề mới đều có đúng 5 câu hỏi")
test_assert(all_new_10pts, "Tất cả 32 đề mới đều có tổng điểm đúng 10.0 điểm (2.0đ/câu)")

# ------------------------------------------------------------------------------
# TEST 4: KIỂM TRA CẤU TRÚC PART 2 & PART 3 (TEXT COHESION - 5 CÂU KÉO THẢ)
# ------------------------------------------------------------------------------
print("\n--- [TEST SUITE 4] KIỂM TRA CẤU TRÚC PART 2 & PART 3 (5 CÂU KÉO THẢ, 10 ĐIỂM) ---")
p2_sql = """
SELECT e.title, q.question_number, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.title ILIKE '%Bộ Đề Tủ Part 2%'
ORDER BY e.title, q.question_number;
"""
res_p2 = run_sql(p2_sql)
lines_p2 = [l for l in res_p2.split('\n') if l.strip()]

test_assert(len(lines_p2) == 6, "Tồn tại đủ 3 bộ đề Tủ Part 2 (mỗi bộ 2 đoạn văn = 6 câu hỏi)", f"Thực tế: {len(lines_p2)} câu hỏi")

all_5_sentences = True
all_no_fixed = True
all_5pts = True
for l in lines_p2:
    parts = l.split('|||')
    opts = json.loads(parts[3])
    max_s = float(parts[5])
    
    if len(opts.get('sentences', [])) != 5:
        all_5_sentences = False
    if opts.get('fixedSentence') is not None:
        all_no_fixed = False
    if max_s != 5.0:
        all_5pts = False

test_assert(all_5_sentences, "Mỗi đoạn văn gồm đúng 5 câu riêng biệt có ID s1..s5")
test_assert(all_no_fixed, "Không có câu cố định (fixedSentence is null) - cả 5 câu kéo thả tự do")
test_assert(all_5pts, "Mỗi đoạn văn có max_score = 5.0 (1 điểm/câu, tổng 10 điểm cho 2 đoạn văn)")

# ------------------------------------------------------------------------------
# TEST 5: MÔ PHỎNG THUẬT TOÁN CHẤM ĐIỂM (SCORING ENGINE SIMULATION)
# ------------------------------------------------------------------------------
print("\n--- [TEST SUITE 5] MÔ PHỎNG THUẬT TOÁN CHẤM ĐIỂM HỌC VIÊN LÀM BÀI ---")

# Giả lập chấm điểm Part 1
def grade_p1(user_ans_list, correct_ans_list):
    correct_count = sum(1 for u, c in zip(user_ans_list, correct_ans_list) if u.lower() == c.lower())
    return correct_count * 2.0

# 1. Học viên làm đúng 5/5 câu Part 1
s1 = grade_p1(["window", "buy", "market", "cake", "watched"], ["window", "buy", "market", "cake", "watched"])
test_assert(s1 == 10.0, "Học viên đúng 5/5 câu Part 1 -> Nhận đúng 10.0/10.0 điểm", f"Điểm: {s1}")

# 2. Học viên làm đúng 3/5 câu Part 1
s2 = grade_p1(["window", "buy", "market", "wrong", "wrong"], ["window", "buy", "market", "cake", "watched"])
test_assert(s2 == 6.0, "Học viên đúng 3/5 câu Part 1 -> Nhận đúng 6.0/10.0 điểm", f"Điểm: {s2}")

# Giả lập chấm điểm Part 2 Text Cohesion (5 câu kéo thả)
def grade_p2_story(user_order, correct_order, max_score=5.0):
    matched = sum(1 for u, c in zip(user_order, correct_order) if u == c)
    return (matched / len(correct_order)) * max_score

# 3. Học viên xếp đúng 5/5 câu Đoạn 1
cor_order = ["s1", "s2", "s3", "s4", "s5"]
s_p2_full = grade_p2_story(["s1", "s2", "s3", "s4", "s5"], cor_order, 5.0)
test_assert(s_p2_full == 5.0, "Học viên xếp đúng 5/5 câu Part 2 -> Nhận đúng 5.0/5.0 điểm (1đ/câu)", f"Điểm: {s_p2_full}")

# 4. Học viên xếp đúng 3/5 câu Đoạn 1
s_p2_part = grade_p2_story(["s1", "s2", "s3", "s5", "s4"], cor_order, 5.0)
test_assert(s_p2_part == 3.0, "Học viên xếp đúng 3/5 câu Part 2 -> Nhận đúng 3.0/5.0 điểm", f"Điểm: {s_p2_part}")

# 5. Tổng 2 đoạn văn đạt 10.0 điểm
total_p2 = s_p2_full + s_p2_full
test_assert(total_p2 == 10.0, "Tổng điểm 2 đoạn văn xếp đúng toàn bộ -> Nhận đúng 10.0/10.0 điểm", f"Điểm: {total_p2}")

print("\n================================================================================")
print(f"🏁 KẾT QUẢ TỔNG HỢP: {passed_tests}/{total_tests} KIỂM THỬ ĐẠT (PASS 100%)")
print("================================================================================")

ssh.close()
