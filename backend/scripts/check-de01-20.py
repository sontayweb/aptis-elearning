import paramiko
import sys

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

sql = """
SELECT e.title as exam_title, q.question_number, q.correct_answer, q.options, q.max_score
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND p.part_number = 1 AND (e.title ~ '^Đề (0[1-9]|1[0-9]|20)$')
ORDER BY e.title, q.question_number;
"""

res = run_sql(sql)
lines = [l for l in res.split('\n') if l.strip()]

exam_map = {}
for line in lines:
    parts = line.split('|||')
    if len(parts) >= 5:
        exam_title, q_num, ans, opts, score = parts[0], parts[1], parts[2], parts[3], parts[4]
        if exam_title not in exam_map:
            exam_map[exam_title] = []
        exam_map[exam_title].append({'q': q_num, 'ans': ans, 'opts': opts, 'score': score})

for title in sorted(exam_map.keys()):
    qs = exam_map[title]
    answers = [q['ans'] for q in qs]
    print(f"{title}: {' - '.join(answers)}")

ssh.close()
