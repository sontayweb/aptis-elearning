import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

def run_sql(sql):
    sftp = ssh.open_sftp()
    with sftp.file('/tmp/q_48.sql', 'wb') as f:
        f.write(sql.encode('utf-8'))
    sftp.close()
    stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" < /tmp/q_48.sql')
    return stdout.read().decode('utf-8', errors='replace').strip()

eid = '9db34976-63d5-41d8-99c7-055443b5c4c6'

print("=== EXAM DETAILS ===")
sql_e = f'SELECT id, title, skill, type, source, hot_level, created_at, updated_at FROM "Exam" WHERE id = \'{eid}\';'
print(run_sql(sql_e))

print("\n=== ALL EXAMS WITH TITLE LIKE %48% OR %39% ===")
sql_list = """
SELECT id, title, skill, type, source, created_at
FROM "Exam"
WHERE title LIKE '%48%' OR title LIKE '%39%'
ORDER BY title;
"""
print(run_sql(sql_list))

ssh.close()
