import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

print("1. Connecting...", flush=True)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)
print("2. Connected!", flush=True)

sql_find_junk = """
SELECT id, title
FROM "Exam"
WHERE skill = 'READING'
  AND (
    description = 'Bộ đề trọng điểm Reading Part 1 – Gap Fill từ Aptis Tiên Phong'
    OR description LIKE '%Bộ đề tủ Part 2 & 3 Text Cohesion%'
    OR title LIKE 'Đề % - Đề %'
    OR title LIKE 'Đề % - Dề %'
    OR title LIKE 'Đề 07 - Games from childhood%'
    OR title LIKE 'Đề 07 - Making films%'
    OR (title LIKE 'Đề % - %' AND duration_minutes <= 15 AND title NOT LIKE '%Full Reading%')
  );
"""

print("3. Uploading SQL...", flush=True)
sftp = ssh.open_sftp()
with sftp.file('/tmp/q_test.sql', 'wb') as f:
    f.write(sql_find_junk.encode('utf-8'))
sftp.close()

print("4. Executing SQL via docker...", flush=True)
cmd = 'docker cp /tmp/q_test.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_in.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -f /tmp/q_in.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace').strip()
err = stderr.read().decode('utf-8', errors='replace').strip()

print(f"5. Done! Result count: {len(out.splitlines()) if out else 0}", flush=True)
if err:
    print("STDERR:", err, flush=True)
print(out[:500], flush=True)

ssh.close()
