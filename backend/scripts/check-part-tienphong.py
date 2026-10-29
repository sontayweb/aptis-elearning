import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_part_check.sql', 'w') as f:
        f.write(sql)
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/q_part_check.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

sql = """
SELECT p.exam_id, e.title, p.id, p.part_number, p.instructions, p.passage_text
FROM "Question" q
JOIN "ExamPart" p ON p.id = q.part_id
JOIN "Exam" e ON e.id = p.exam_id
WHERE q.prompt LIKE '%tienphongSpace%'
LIMIT 2;
"""
print(run_sql(sql))
ssh.close()
