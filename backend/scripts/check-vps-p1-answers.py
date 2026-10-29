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
    with sftp.file('/tmp/query.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    
    cmd = 'docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/query.sql'
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    return out

# Query part 1 questions for Đề 01 to Đề 32
sql = """
SELECT e.title as exam_title, p.part_number, q.question_number, q.correct_answer, q.options, q.max_score
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND p.part_number = 1
ORDER BY e.title, q.question_number;
"""

res = run_sql(sql)
lines = [l for l in res.split('\n') if l.strip()]

exam_map = {}
for line in lines:
    parts = line.split('|||')
    if len(parts) >= 6:
        exam_title, part_num, q_num, ans, opts, score = parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]
        if exam_title not in exam_map:
            exam_map[exam_title] = []
        exam_map[exam_title].append({'q': q_num, 'ans': ans, 'opts': opts, 'score': score})

print(f"Total exams with Part 1: {len(exam_map)}")
for title, qs in list(exam_map.items()):
    answers = [q['ans'] for q in qs]
    scores = [q['score'] for q in qs]
    print(f"\n{title} ({len(qs)} questions, scores: {scores[:3]}...):")
    print("  Đáp án:", " - ".join(answers))

ssh.close()
