import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

dup_numbers = ['06', '09', '11', '13', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32']
dup_clauses = " OR ".join([f"title LIKE 'Đề {num}%'" for num in dup_numbers])

sql_find_dups = f"""
SELECT id, title
FROM "Exam"
WHERE skill = 'READING'
  AND ({dup_clauses})
ORDER BY title;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_dups_check.sql', 'wb') as f:
    f.write(sql_find_dups.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_dups_check.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_in.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -t -A -F "|||" -f /tmp/q_in.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
out = stdout.read().decode('utf-8', errors='replace').strip()
print(f"Remaining duplicate exams count: {len(out.splitlines()) if out else 0}")
if out:
    print(out)

ssh.close()
