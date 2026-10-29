import paramiko
import sys

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = """
SELECT id, title, skill, duration_minutes, is_published, created_at
FROM "Exam"
WHERE description = 'Bộ đề trọng điểm Reading Part 1 – Gap Fill từ Aptis Tiên Phong'
   OR title LIKE '%Đề % - Đề %'
   OR title LIKE '%Đề % - Dề %'
ORDER BY title;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_compound.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F " | " < /tmp/q_compound.sql')
out = stdout.read().decode('utf-8', errors='replace').strip()
print(f"Total matching exams: {len(out.splitlines()) if out else 0}")
print(out)

ssh.close()
