import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = """
SELECT q.id, e.title, q.prompt, q.options::text
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE q.options::text LIKE '%fixed here%'
   OR q.options::text LIKE '%Sentence 1%'
LIMIT 10;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_fh.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/q_fh.sql')
out = stdout.read().decode('utf-8', errors='replace')
print("MATCHING QUESTIONS IN DB:\n", out)
ssh.close()
