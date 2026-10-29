import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT q.id, e.title, q.options::text
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE e.skill = 'READING' AND ep.title LIKE '%Text Cohesion%' AND e.title ~ 'Đề\\s*\\d+\\s*[-–:]'
LIMIT 5;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_p2_opts.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_p2_opts.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_p2_opts.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_p2_opts.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
