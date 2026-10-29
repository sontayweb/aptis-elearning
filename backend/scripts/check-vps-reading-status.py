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
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if err:
        print("STDERR:", err)
    return out

print("--- EXAM COLUMNS ---")
print(run_sql("""
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Exam'
ORDER BY ordinal_position;
"""))

print("\n--- ALL READING EXAMS (TITLE & ID) ---")
print(run_sql("""
SELECT id, title, is_published, hot_level
FROM "Exam"
WHERE skill = 'READING'
ORDER BY title;
"""))

ssh.close()
