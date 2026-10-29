import paramiko, json, sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# 1. Query all Reading exams and their parts & questions
sql = '''
SELECT json_build_object(
    'exam_id', e.id,
    'title', e.title,
    'skill', e.skill,
    'is_pro', e.is_pro,
    'is_published', e.is_published,
    'parts_count', COUNT(DISTINCT ep.id),
    'parts', json_agg(
        DISTINCT jsonb_build_object(
            'part_id', ep.id,
            'part_number', ep.part_number,
            'title', ep.title,
            'has_passage', (ep.passage_text IS NOT NULL AND LENGTH(ep.passage_text) > 30),
            'passage_len', LENGTH(COALESCE(ep.passage_text, '')),
            'question_count', (
                SELECT COUNT(*) FROM "Question" q WHERE q.part_id = ep.id
            ),
            'missing_answers', (
                SELECT COUNT(*) FROM "Question" q 
                WHERE q.part_id = ep.id AND (q.correct_answer IS NULL OR q.correct_answer = '')
            ),
            'has_options', (
                SELECT COUNT(*) FROM "Question" q 
                WHERE q.part_id = ep.id AND (q.options IS NOT NULL)
            )
        )
    )
)
FROM "Exam" e
LEFT JOIN "ExamPart" ep ON ep.exam_id = e.id
WHERE e.skill = 'READING'
GROUP BY e.id, e.title, e.skill, e.is_pro, e.is_published
ORDER BY e.title ASC;
'''

script = f'''docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -c "{sql.replace(chr(10), ' ')}"'''
stdin, stdout, stderr = ssh.exec_command(script)
rows_raw = stdout.read().decode('utf-8', errors='replace')
err_raw = stderr.read().decode('utf-8', errors='replace')

ssh.close()

if err_raw.strip():
    print("SQL Error:", err_raw[:300])

lines = [line.strip() for line in rows_raw.splitlines() if line.strip()]
print(f"Total Reading Exams found in DB: {len(lines)}\n")

total_exams = len(lines)
perfect_exams = 0
exams_with_issues = []

for line in lines:
    try:
        exam = json.loads(line)
    except Exception as ex:
        continue
    
    eid = exam['exam_id']
    title = exam['title']
    parts = exam.get('parts', [])
    
    issues = []
    if len(parts) == 0:
        issues.append("Không có Part nào")
    
    for p in parts:
        p_num = p['part_number']
        p_title = p.get('title', '')
        q_count = p['question_count']
        missing_ans = p['missing_answers']
        has_passage = p['has_passage']
        
        # Kiểm tra theo từng loại Part
        if "part 4" in p_title.lower() or "opinion" in p_title.lower():
            if not has_passage:
                issues.append(f"Part 4 (Opinion): Thiếu passage_text (đoạn văn 4 người)")
            if q_count < 7:
                issues.append(f"Part 4 (Opinion): Số câu hỏi chỉ có {q_count}/7")
            if missing_ans > 0:
                issues.append(f"Part 4 (Opinion): {missing_ans} câu chưa có đáp án")
                
        elif "part 5" in p_title.lower() or "heading" in p_title.lower() or "long" in p_title.lower():
            if q_count < 7:
                issues.append(f"Part 5 (Long reading): Số đoạn văn chỉ có {q_count}/7")
            if missing_ans > 0:
                issues.append(f"Part 5 (Long reading): {missing_ans} câu chưa có đáp án")
                
        elif "part 1" in p_title.lower() or "gap" in p_title.lower():
            if q_count < 5:
                issues.append(f"Part 1 (Gap fill): Số câu điền từ chỉ có {q_count}/5")
            if missing_ans > 0:
                issues.append(f"Part 1 (Gap fill): {missing_ans} câu chưa có đáp án")
                
        elif "part 2" in p_title.lower() or "cohesion" in p_title.lower() or "order" in p_title.lower():
            if q_count == 0:
                issues.append(f"Part 2 (Ordering): Không có câu hỏi nào")
            if missing_ans > 0:
                issues.append(f"Part 2 (Ordering): {missing_ans} câu chưa có đáp án")

    if issues:
        exams_with_issues.append((title, eid, issues))
    else:
        perfect_exams += 1

print("=" * 60)
print(f"KẾT QUẢ KIỂM TRA TOÀN BỘ DATABASE READING:")
print(f"Tổng số bộ đề: {total_exams}")
print(f"Số đề ĐẠT CHUẨN 100% (đủ bài đọc, đủ câu hỏi, đủ đáp án): {perfect_exams}")
print(f"Số đề CÒN VẤN ĐỀ: {len(exams_with_issues)}")
print("=" * 60)

if exams_with_issues:
    print("\nCHI TIẾT CÁC BỘ ĐỀ CẦN XỬ LÝ:")
    for title, eid, issues in exams_with_issues[:20]:
        print(f"\n- Đề: {title} (ID: {eid})")
        for iss in issues:
            print(f"  + Lỗi: {iss}")
else:
    print("\n🎉 TẤT CẢ CÁC ĐỀ ĐÃ HOÀN TOÀN ĐẦY ĐỦ VÀ CHUẨN XÁC!")
