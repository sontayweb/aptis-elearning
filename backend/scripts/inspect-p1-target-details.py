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

# Sample inspection of Đề 03, Đề 07, Đề 08, Đề 12, Đề 18
print("--- DETAILS OF Đề 03, 07, 08, 12, 18 ---")
sql = """
SELECT e.title, p.part_number, q.question_number, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Exam" e
JOIN "ExamPart" p ON p.exam_id = e.id
JOIN "Question" q ON q.part_id = p.id
WHERE e.skill = 'READING' AND p.part_number = 1 AND e.title IN ('Đề 03', 'Đề 07', 'Đề 08', 'Đề 12', 'Đề 18')
ORDER BY e.title, q.question_number;
"""
res = run_sql(sql)
for line in res.split('\n'):
    print(line)

ssh.close()
