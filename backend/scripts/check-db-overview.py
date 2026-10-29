import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = """
SELECT 'Exam by skill' as category, skill::text, count(*) as count
FROM "Exam"
GROUP BY skill
UNION ALL
SELECT 'Users' as category, role::text, count(*) as count
FROM "User"
GROUP BY role
UNION ALL
SELECT 'Submissions' as category, status::text, count(*) as count
FROM "ExamSubmission"
GROUP BY status;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_db_overview.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/q_db_overview.sql')
out = stdout.read().decode('utf-8', errors='replace')
print("DB OVERVIEW:\n", out)

ssh.close()
