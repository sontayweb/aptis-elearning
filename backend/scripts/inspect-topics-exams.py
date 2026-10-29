import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT id, title, is_published
FROM "Exam"
WHERE skill = 'READING' AND title ~ 'Đề\\s*\\d+\\s*[-–:]'
ORDER BY title ASC;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_topics.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_topics.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_topics.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_topics.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
