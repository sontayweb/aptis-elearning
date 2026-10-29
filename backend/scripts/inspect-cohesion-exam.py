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

sql = """
SELECT q.question_number, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Question" q
JOIN "ExamPart" p ON q.part_id = p.id
WHERE p.exam_id = '34ff844c-08b0-4971-b6fd-87b66dcd3e51'
ORDER BY q.question_number;
"""
res = run_sql(sql)
for l in res.split('\n'):
    parts = l.split('|||')
    if len(parts) >= 5:
        print(f"Q#{parts[0]} - Prompt: {parts[1]}")
        print(f"  Options: {parts[2][:120]}...")
        print(f"  Correct: {parts[3]}")
        print(f"  Score: {parts[4]}")

ssh.close()
