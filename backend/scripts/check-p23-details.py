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
    with sftp.file('/tmp/query_detail.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/query_detail.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

print("=== KIỂM TRA CHI TIẾT ĐỀ 35 ===")
sql_35 = """
SELECT e.id, e.title, p.part_number, p.title as part_title, count(q.id) as question_count
FROM "Exam" e
LEFT JOIN "ExamPart" p ON p.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND (e.title LIKE '%35%' OR e.title LIKE '%Đề 35%')
GROUP BY e.id, e.title, p.part_number, p.title
ORDER BY e.title, p.part_number;
"""
print(run_sql(sql_35))

print("\n=== KIỂM TRA NỘI DUNG CÂU HỎI VÀ ĐÁP ÁN ĐỀ 07, 09, 13, 27, 29 (PART 2 & 3) ===")
target_exams = ['%Đề 07%', '%Đề 09%', '%Đề 13%', '%Đề 27%', '%Đề 29%', '%Đề 31%', '%Đề 35%']
for tex in target_exams:
    sql_p23_detail = f"""
    SELECT e.title, p.part_number, q.question_number, q.prompt, q.correct_answer, q.options, q.max_score
    FROM "Exam" e
    JOIN "ExamPart" p ON p.exam_id = e.id
    JOIN "Question" q ON q.part_id = p.id
    WHERE e.skill = 'READING' AND p.part_number IN (2, 3) AND e.title LIKE '{tex}'
    ORDER BY e.title, p.part_number, q.question_number;
    """
    res = run_sql(sql_p23_detail)
    print(f"\n--- {tex} ---")
    for line in res.split('\n'):
        if not line.strip(): continue
        parts = line.split('|||')
        if len(parts) >= 7:
            title, pnum, qnum, prompt, ans, opts_str, score = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5], parts[6]
            print(f"[{title}] Part {pnum} Q{qnum} (Score: {score}):")
            print(f"  Prompt: {prompt}")
            print(f"  Ans: {ans}")
            try:
                opts = json.loads(opts_str)
                print(f"  Options ({len(opts)} câu):")
                if isinstance(opts, list):
                    for idx, o in enumerate(opts):
                        print(f"    - {o}")
                elif isinstance(opts, dict):
                    for k, v in opts.items():
                        print(f"    - [{k}] {v}")
            except:
                print(f"  Options raw: {opts_str[:150]}...")

ssh.close()
