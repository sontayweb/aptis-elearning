import json
import re
import sys
import os
import glob
import paramiko

sys.stdout.reconfigure(encoding='utf-8')

VPS_HOST = "103.90.227.117"
VPS_USER = "root"
VPS_PASS = "Taovipko0!"
CONTAINER = "wlafe5vr5fwx6rn3curavktm"
DB_NAME = "aptis_kytich_db"

def run_remote_sql(sql_command):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, username=VPS_USER, password=VPS_PASS, timeout=30)
    cmd = f'docker exec -i {CONTAINER} psql -U postgres -d {DB_NAME}'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    stdin.write(sql_command + "\n")
    stdin.flush()
    stdin.channel.shutdown_write()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    ssh.close()
    if err and "ERROR:" in err:
        raise RuntimeError(err)
    return out

def build_uuid_map():
    print("📁 [1/5] Đang nạp từ điển ánh xạ UUID từ tools/data...")
    uuid_map = {}
    
    def extract_answers(obj):
        if isinstance(obj, dict):
            if 'id' in obj and 'content' in obj and isinstance(obj['id'], str) and isinstance(obj['content'], str):
                if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', obj['id'], re.I):
                    clean_c = obj['content'].replace('<[^>]+>', ' ').strip()
                    if clean_c:
                        uuid_map[obj['id'].lower()] = clean_c
            for v in obj.values():
                extract_answers(v)
        elif isinstance(obj, list):
            for item in obj:
                extract_answers(item)

    for fpath in glob.glob('tools/data/**/*.json', recursive=True):
        try:
            with open(fpath, 'r', encoding='utf-8') as f:
                d = json.load(f)
                extract_answers(d)
        except Exception:
            pass

    # Ánh xạ bổ sung đã kiểm chứng cho các câu hỏi đặc thù
    manual_overrides = {
        'bbdc328f-3d0f-4783-acba-158c129ffe90': 'been',
        '9fb3d50b-0645-41d3-9dc8-c18d557eb157': 'would',
        '64a5a100-ec14-47e5-a7d2-297ec9e3b3fa': 'leave',
        '3e85b6a8-1d53-4c99-84d3-9ce9b725c9be': 'suggest',
        '8847409b-065b-4370-8490-699da625ff29': 'travel by bus',
        '97dc6891-3e1e-4a57-bfca-c8ec5bd2bb17': 'walk alone',
        '06082272-8471-4c32-95c9-d96cc8b316b5': 'walk with a friend',
        'fb3326d5-5d06-4ed7-be75-4c5fa956a46f': 'Environmental problems require more concern than social and economic ones.',
        'f25cb4e7-b8fa-412b-832c-4c0db55e9f8c': 'She believes that they are under target',
    }
    for k, v in manual_overrides.items():
        uuid_map[k.lower()] = v

    print(f"   ✓ Đã sẵn sàng từ điển ánh xạ gồm {len(uuid_map)} mục UUID.")
    return uuid_map

def main():
    print("==========================================================================")
    print("🚀 BẮT ĐẦU TIẾN TRÌNH CHUẨN HÓA ĐÁP ÁN (DATABASE MIGRATION TO CANONICAL TEXT)")
    print("==========================================================================")
    
    uuid_map = build_uuid_map()

    print("\n🔍 [2/5] Đang truy vấn danh sách câu hỏi cần chuẩn hóa trên VPS PostgreSQL...")
    fetch_sql = """
    SELECT q.id, q.correct_answer, q.options::text, q.question_type, e.skill
    FROM "Question" q
    JOIN "ExamPart" ep ON q.part_id = ep.id
    JOIN "Exam" e ON ep.exam_id = e.id
    WHERE q.correct_answer ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       OR q.correct_answer ~ '^[0-9]+$';
    """
    raw_data = run_remote_sql(fetch_sql)
    lines = [l.strip() for l in raw_data.strip().split('\n') if l.strip()]
    data_lines = [l for l in lines[2:] if not l.startswith('(') and '|' in l]

    print(f"   ✓ Tìm thấy {len(data_lines)} câu hỏi cần xem xét chuẩn hóa.")

    updates = [] # list of (qid, new_answer)
    null_updates = [] # list of qid (writing/speaking with '0')

    uuid_count = 0
    numeric_count = 0

    for l in data_lines:
        parts = [p.strip() for p in l.split('|')]
        if len(parts) >= 5:
            qid = parts[0]
            ans = parts[1]
            raw_opts = parts[2]
            q_type = parts[3]
            skill = parts[4]

            # 1. Xử lý UUID
            if re.match(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', ans, re.I):
                u_lower = ans.lower()
                if u_lower in uuid_map:
                    canonical = uuid_map[u_lower]
                    updates.append((qid, canonical))
                    uuid_count += 1
                else:
                    # Tra cứu trong raw_opts nếu có
                    try:
                        opts = json.loads(raw_opts)
                        if isinstance(opts, list):
                            for o in opts:
                                if isinstance(o, dict) and str(o.get('id', '')).lower() == u_lower:
                                    canonical = str(o.get('content', '')).strip()
                                    if canonical:
                                        updates.append((qid, canonical))
                                        uuid_count += 1
                                        break
                    except Exception:
                        pass

            # 2. Xử lý Numeric index
            elif re.match(r'^\d+$', ans):
                try:
                    opts = json.loads(raw_opts) if raw_opts else []
                    idx = int(ans)
                    if isinstance(opts, list) and 0 <= idx < len(opts):
                        item = opts[idx]
                        canonical = str(item.get('content', item) if isinstance(item, dict) else item).strip()
                        updates.append((qid, canonical))
                        numeric_count += 1
                    elif (skill in ['WRITING', 'SPEAKING'] or q_type in ['ESSAY', 'SHORT_TEXT', 'SPEAKING_AUDIO']) and len(opts) == 0:
                        null_updates.append(qid)
                except Exception:
                    pass

    print(f"\n📊 [3/5] Thống kê câu hỏi chuẩn bị cập nhật:")
    print(f"   • Đáp án dạng UUID chuyển sang Text: {uuid_count} câu")
    print(f"   • Đáp án dạng Chỉ số mảng (0, 1, 2) chuyển sang Text: {numeric_count} câu")
    print(f"   • Tổng số câu hỏi trắc nghiệm khách quan được chuẩn hóa: {len(updates)} câu")
    print(f"   • Câu tự luận Writing/Speaking dọn dẹp '0' về NULL: {len(null_updates)} câu")

    print("\n💾 [4/5] Đang thực thi Migration theo từng Batch an toàn (Transaction)...")
    batch_size = 500
    total_batches = (len(updates) + batch_size - 1) // batch_size

    for b_idx in range(total_batches):
        batch = updates[b_idx * batch_size : (b_idx + 1) * batch_size]
        sql_parts = ["BEGIN;"]
        for qid, new_ans in batch:
            # Escape single quote for SQL
            escaped_ans = new_ans.replace("'", "''")
            sql_parts.append(f"UPDATE \"Question\" SET correct_answer = '{escaped_ans}' WHERE id = '{qid}';")
        sql_parts.append("COMMIT;")
        batch_sql = "\n".join(sql_parts)
        run_remote_sql(batch_sql)
        print(f"   ✓ Đã hoàn thành Batch {b_idx + 1}/{total_batches} ({len(batch)} câu).")

    # Dọn dẹp writing/speaking '0' -> NULL
    if null_updates:
        print(f"   • Đang dọn dẹp {len(null_updates)} câu tự luận Writing/Speaking...")
        for i in range(0, len(null_updates), 1000):
            chunk = null_updates[i:i+1000]
            ids_str = "', '".join(chunk)
            sql_clean = f"UPDATE \"Question\" SET correct_answer = NULL WHERE id IN ('{ids_str}');"
            run_remote_sql(sql_clean)

    # 5. Tái tính điểm cho các bài nộp cũ
    print("\n🔄 [5/5] Đang quét và tái tính điểm (Recalculate) cho các bài nộp cũ...")
    # Lấy các submission đã nộp
    recalc_sql = """
    UPDATE "SubmissionAnswer" sa
    SET score = q.max_score
    FROM "Question" q
    WHERE sa.question_id = q.id
      AND sa.score = 0
      AND sa.selected_option IS NOT NULL
      AND TRIM(LOWER(sa.selected_option)) = TRIM(LOWER(q.correct_answer));
    """
    res = run_remote_sql(recalc_sql)
    print(f"   ✓ Cập nhật câu trả lời đúng của học viên: {res.strip()}")

    # Cập nhật lại total_score trên bảng ExamSubmission
    update_subs_sql = """
    WITH new_scores AS (
      SELECT submission_id, COALESCE(SUM(score), 0) as calc_total
      FROM "SubmissionAnswer"
      GROUP BY submission_id
    )
    UPDATE "ExamSubmission" es
    SET total_score = ns.calc_total,
        listening_score = CASE WHEN e.skill = 'LISTENING' THEN ns.calc_total ELSE es.listening_score END,
        reading_score = CASE WHEN e.skill = 'READING' THEN ns.calc_total ELSE es.reading_score END
    FROM new_scores ns
    JOIN "Exam" e ON es.exam_id = e.id
    WHERE es.id = ns.submission_id
      AND es.status = 'GRADED';
    """
    res_sub = run_remote_sql(update_subs_sql)
    print(f"   ✓ Đồng bộ lại tổng điểm các bài thi đã nộp: {res_sub.strip()}")

    print("\n==========================================================================")
    print("🎉 TIẾN TRÌNH CHUẨN HÓA CSDL (TASK 2) ĐÃ HOÀN THÀNH XUẤT SẮC!")
    print("==========================================================================")

if __name__ == '__main__':
    main()

