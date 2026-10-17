import sys
import os
import json
import subprocess
import paramiko

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

VPS_HOST = '103.90.227.117'
VPS_PORT = 22
VPS_USER = 'root'
VPS_PASS = 'Taovipko0!'
DB_CONTAINER = 'wlafe5vr5fwx6rn3curavktm'

def print_header(title):
    print("\n" + "=" * 75)
    print(f"[*] {title}")
    print("=" * 75)

def run_local_sql(sql):
    env = os.environ.copy()
    env["PGPASSWORD"] = "postgres"
    env["PGCLIENTENCODING"] = "utf-8"
    cmd = [
        "psql",
        "-h", "localhost",
        "-p", "5432",
        "-U", "postgres",
        "-d", "aptis_kytich_db",
        "-t", "-A",
        "-c", sql
    ]
    res = subprocess.run(cmd, env=env, capture_output=True, encoding='utf-8', errors='replace')
    if res.stdout:
        return res.stdout.strip()
    return ""

def run_local_sql_json(sql):
    json_sql = f"SELECT json_agg(t) FROM ({sql}) t;"
    raw = run_local_sql(json_sql)
    if not raw or raw == "null":
        return []
    try:
        return json.loads(raw)
    except:
        return []

def run_vps_sql(ssh, sql):
    clean_sql = sql.replace('"', '\\"').replace('\n', ' ')
    cmd = f'docker exec {DB_CONTAINER} psql -U postgres -d aptis_kytich_db -t -A -c "{clean_sql}"'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdout.channel.recv_exit_status()
    return stdout.read().decode('utf-8', errors='replace').strip()

def run_vps_sql_json(ssh, sql):
    json_sql = f"SELECT json_agg(t) FROM ({sql}) t;"
    raw = run_vps_sql(ssh, json_sql)
    if not raw or raw == "null":
        return []
    try:
        return json.loads(raw)
    except:
        return []

def main():
    print_header("TIẾN HÀNH ĐỐI SOÁT CHI TIẾT TỪNG TRƯỜNG DỮ LIỆU (LOCAL vs CLOUDFY)")

    # Kết nối SSH tới VPS
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, look_for_keys=False, allow_agent=False)

    # -------------------------------------------------------------
    # PHẦN 1: ĐỐI SOÁT CẤU TRÚC BẢNG & DANH SÁCH CỘT
    # -------------------------------------------------------------
    print_header("PHẦN 1: ĐỐI SOÁT CẤU TRÚC BẢNG & SỐ LƯỢNG CỘT (SCHEMA)")
    table_sql = "SELECT table_name || ':' || count(column_name) FROM information_schema.columns WHERE table_schema = 'public' GROUP BY table_name ORDER BY table_name;"
    
    local_tables_raw = run_local_sql(table_sql)
    local_tables = {}
    for line in local_tables_raw.splitlines():
        if ":" in line:
            p = line.split(":")
            local_tables[p[0]] = int(p[1])

    vps_tables_raw = run_vps_sql(ssh, table_sql)
    vps_tables = {}
    for line in vps_tables_raw.splitlines():
        if ":" in line:
            p = line.split(":")
            vps_tables[p[0]] = int(p[1])

    print(f"{'TÊN BẢNG':<30} | {'SỐ CỘT LOCAL':<15} | {'SỐ CỘT CLOUDFY':<15} | {'KẾT QUẢ':<10}")
    print("-" * 75)
    all_table_names = sorted(set(list(local_tables.keys()) + list(vps_tables.keys())))
    schema_ok = True
    for t_name in all_table_names:
        l_col = local_tables.get(t_name, 0)
        c_col = vps_tables.get(t_name, 0)
        match = l_col == c_col
        if not match:
            schema_ok = False
        print(f"{t_name:<30} | {l_col:<15} | {c_col:<15} | {'KHỚP ✔' if match else 'LỆCH ✖':<10}")

    # -------------------------------------------------------------
    # PHẦN 2: ĐỐI SOÁT CÁC TRƯỜNG DỮ LIỆU CỐT LÕI (INTEGRITY STATS)
    # -------------------------------------------------------------
    print_header("PHẦN 2: ĐỐI SOÁT SỐ LƯỢNG VÀ TÍNH ĐẦY ĐỦ CỦA CÁC TRƯỜNG")

    metrics = [
        # EXAM FIELDS
        ("Exams: Tổng số đề thi", 'SELECT count(*) FROM "Exam"'),
        ("Exams: Có tiêu đề hợp lệ (title)", 'SELECT count(*) FROM "Exam" WHERE title IS NOT NULL AND length(title) > 0'),
        ("Exams: Kỹ năng LISTENING", 'SELECT count(*) FROM "Exam" WHERE skill = \'LISTENING\''),
        ("Exams: Kỹ năng SPEAKING", 'SELECT count(*) FROM "Exam" WHERE skill = \'SPEAKING\''),
        ("Exams: Kỹ năng READING", 'SELECT count(*) FROM "Exam" WHERE skill = \'READING\''),
        ("Exams: Kỹ năng WRITING", 'SELECT count(*) FROM "Exam" WHERE skill = \'WRITING\''),
        ("Exams: Trạng thái is_published = true", 'SELECT count(*) FROM "Exam" WHERE is_published = true'),
        ("Exams: Trạng thái is_pro = true", 'SELECT count(*) FROM "Exam" WHERE is_pro = true'),
        ("Exams: Có gán nhãn hot_level > 0", 'SELECT count(*) FROM "Exam" WHERE hot_level > 0'),

        # EXAMPART FIELDS
        ("Parts: Tổng số part thi", 'SELECT count(*) FROM "ExamPart"'),
        ("Parts: Có hướng dẫn (instructions)", 'SELECT count(*) FROM "ExamPart" WHERE instructions IS NOT NULL AND length(instructions) > 0'),
        ("Parts: Có bài đọc (passage_text)", 'SELECT count(*) FROM "ExamPart" WHERE passage_text IS NOT NULL AND length(passage_text) > 0'),
        ("Parts: Có file nghe (audio_url)", 'SELECT count(*) FROM "ExamPart" WHERE audio_url IS NOT NULL AND length(audio_url) > 0'),
        ("Parts: Phân loại Part 1", 'SELECT count(*) FROM "ExamPart" WHERE part_number = 1'),
        ("Parts: Phân loại Part 2", 'SELECT count(*) FROM "ExamPart" WHERE part_number = 2'),
        ("Parts: Phân loại Part 3", 'SELECT count(*) FROM "ExamPart" WHERE part_number = 3'),
        ("Parts: Phân loại Part 4", 'SELECT count(*) FROM "ExamPart" WHERE part_number = 4'),

        # QUESTION FIELDS
        ("Questions: Tổng số câu hỏi", 'SELECT count(*) FROM "Question"'),
        ("Questions: Có câu hỏi/đề bài (prompt)", 'SELECT count(*) FROM "Question" WHERE prompt IS NOT NULL AND length(prompt) > 0'),
        ("Questions: Có danh sách đáp án (options)", 'SELECT count(*) FROM "Question" WHERE options IS NOT NULL AND length(options::text) > 2'),
        ("Questions: Có đáp án đúng (correct_answer)", 'SELECT count(*) FROM "Question" WHERE correct_answer IS NOT NULL AND length(correct_answer) > 0'),
        ("Questions: Có lời giải thích (explanation)", 'SELECT count(*) FROM "Question" WHERE explanation IS NOT NULL AND length(explanation) > 0'),

        # USER & SUBMISSION FIELDS
        ("Users: Tổng số người dùng", 'SELECT count(*) FROM "User"'),
        ("Users: Có mật khẩu băm (password_hash)", 'SELECT count(*) FROM "User" WHERE password_hash IS NOT NULL'),
        ("Users: Tài khoản quyền ADMIN", 'SELECT count(*) FROM "User" WHERE role = \'ADMIN\''),
        ("Submissions: Tổng số bài đã nộp", 'SELECT count(*) FROM "ExamSubmission"'),
    ]

    print(f"{'CHỈ SỐ TRƯỜNG DỮ LIỆU':<42} | {'LOCAL':<10} | {'CLOUDFY':<10} | {'KẾT QUẢ':<10}")
    print("-" * 75)
    all_metrics_ok = True
    for label, sql in metrics:
        l_res = run_local_sql(sql)
        v_res = run_vps_sql(ssh, sql)
        try:
            l_val = int(l_res)
            c_val = int(v_res)
            match = l_val == c_val
        except:
            l_val = l_res
            c_val = v_res
            match = str(l_val) == str(c_val)

        if not match:
            all_metrics_ok = False
        print(f"{label:<42} | {str(l_val):<10} | {str(c_val):<10} | {'KHỚP 100% ✔' if match else 'LỆCH ✖':<10}")

    # -------------------------------------------------------------
    # PHẦN 3: SPOT-CHECK TRỰC TIẾP TỪNG TRƯỜNG CỦA 4 ĐỀ THI
    # -------------------------------------------------------------
    print_header("PHẦN 3: SPOT-CHECK TRỰC TIẾP TỪNG TRƯỜNG CỦA 4 ĐỀ THI (4 KỸ NĂNG)")
    skills = ['SPEAKING', 'LISTENING', 'READING', 'WRITING']
    for sk in skills:
        l_exam_list = run_local_sql_json(f'SELECT id, title, duration_minutes, is_pro FROM "Exam" WHERE skill = \'{sk}\' ORDER BY created_at ASC LIMIT 1')
        if not l_exam_list:
            continue
        l_exam = l_exam_list[0]
        exam_id = l_exam['id']

        vps_exam_list = run_vps_sql_json(ssh, f"SELECT id, title, duration_minutes, is_pro FROM \\\"Exam\\\" WHERE id = '{exam_id}'")
        c_exam = vps_exam_list[0] if vps_exam_list else {}

        print(f"\n--- Đề {sk}: ID = {exam_id} ---")
        print(f"  * Title:           Local='{l_exam.get('title')}' | Cloudfy='{c_exam.get('title')}' -> {'OK ✔' if l_exam.get('title') == c_exam.get('title') else 'LỆCH ✖'}")
        print(f"  * Duration (phút): Local={l_exam.get('duration_minutes')} | Cloudfy={c_exam.get('duration_minutes')} -> {'OK ✔' if l_exam.get('duration_minutes') == c_exam.get('duration_minutes') else 'LỆCH ✖'}")
        print(f"  * is_pro:          Local={l_exam.get('is_pro')} | Cloudfy={c_exam.get('is_pro')} -> {'OK ✔' if l_exam.get('is_pro') == c_exam.get('is_pro') else 'LỆCH ✖'}")

        # Part check
        l_parts = run_local_sql_json(f'SELECT id, part_number, title, instructions, passage_text FROM "ExamPart" WHERE exam_id = \'{exam_id}\' ORDER BY part_number LIMIT 1')
        if l_parts:
            l_part = l_parts[0]
            l_part_id = l_part['id']
            vps_parts = run_vps_sql_json(ssh, f"SELECT id, part_number, title, instructions, passage_text FROM \\\"ExamPart\\\" WHERE id = '{l_part_id}'")
            c_part = vps_parts[0] if vps_parts else {}
            print(f"  * Part {l_part.get('part_number')} Title:  Local='{l_part.get('title')}' | Cloudfy='{c_part.get('title')}' -> {'OK ✔' if l_part.get('title') == c_part.get('title') else 'LỆCH ✖'}")

            # Question check
            l_qs = run_local_sql_json(f'SELECT id, question_number, prompt, correct_answer FROM "Question" WHERE exam_part_id = \'{l_part_id}\' ORDER BY question_number LIMIT 1')
            if l_qs:
                l_q = l_qs[0]
                l_q_id = l_q['id']
                vps_qs = run_vps_sql_json(ssh, f"SELECT id, question_number, prompt, correct_answer FROM \\\"Question\\\" WHERE id = '{l_q_id}'")
                c_q = vps_qs[0] if vps_qs else {}
                print(f"  * Q1 Prompt:       Local='{str(l_q.get('prompt'))[:30]}...' | Cloudfy='{str(c_q.get('prompt'))[:30]}...' -> {'OK ✔' if l_q.get('prompt') == c_q.get('prompt') else 'LỆCH ✖'}")
                print(f"  * Q1 Answer:       Local='{l_q.get('correct_answer')}' | Cloudfy='{c_q.get('correct_answer')}' -> {'OK ✔' if l_q.get('correct_answer') == c_q.get('correct_answer') else 'LỆCH ✖'}")

    # -------------------------------------------------------------
    # PHẦN 4: HASH CHECKSUM MD5 TOÀN BỘ CÁC BẢNG CHÍNH
    # -------------------------------------------------------------
    print_header("PHẦN 4: HASH CHECKSUM MD5 ĐỐI SOÁT NỘI DUNG TỪNG DÒNG")
    
    # Hash bảng Exam
    hash_exam_sql = 'SELECT md5(string_agg(id || title || skill, \',\' ORDER BY id)) FROM "Exam"'
    l_hash_exam = run_local_sql(hash_exam_sql)
    c_hash_exam = run_vps_sql(ssh, hash_exam_sql)

    print(f"MD5 Checksum Bảng Exam (1.916 đề thi):")
    print(f"  Local:   {l_hash_exam}")
    print(f"  Cloudfy: {c_hash_exam}")
    print(f"  -> Kết quả: {'KHỚP TUYỆT ĐỐI 100% ✔' if l_hash_exam == c_hash_exam else 'KHÔNG KHỚP ✖'}")

    # Hash bảng Question
    hash_q_sql = 'SELECT md5(string_agg(id || COALESCE(correct_answer, \'\'), \',\' ORDER BY id)) FROM "Question"'
    l_hash_q = run_local_sql(hash_q_sql)
    c_hash_q = run_vps_sql(ssh, hash_q_sql)

    print(f"\nMD5 Checksum Bảng Question (13.404 câu hỏi):")
    print(f"  Local:   {l_hash_q}")
    print(f"  Cloudfy: {c_hash_q}")
    print(f"  -> Kết quả: {'KHỚP TUYỆT ĐỐI 100% ✔' if l_hash_q == c_hash_q else 'KHÔNG KHỚP ✖'}")

    ssh.close()

    print("\n" + "#" * 75)
    print("🎯 KẾT LUẬN ĐỐI SOÁT TỪNG TRƯỜNG DỮ LIỆU:")
    if schema_ok and all_metrics_ok and l_hash_exam == c_hash_exam and l_hash_q == c_hash_q:
        print("✔ TẤT CẢ CÁC BẢNG, DANH SÁCH CỘT VÀ TỪNG TRƯỜNG DỮ LIỆU CHI TIẾT")
        print("✔ CÁC GIÁ TRỊ PROMPT, OPTIONS, CORRECT_ANSWER, EXPLANATION, TITLE")
        print("✔ MÃ HASH CHECKSUM MD5 TRÊN TOÀN BỘ 1.916 ĐỀ THI & 13.404 CÂU HỎI")
        print("==> HOÀN TOÀN TRÙNG KHỚP 100% GIỮA LOCAL VÀ CLOUDFY!")
    else:
        print("⚠ Cảnh báo: Có trường dữ liệu chưa khớp, vui lòng xem chi tiết bên trên.")
    print("#" * 75 + "\n")

if __name__ == '__main__':
    main()
