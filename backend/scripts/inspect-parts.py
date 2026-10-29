import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT ep.part_number, ep.title, ep.instructions
FROM "ExamPart" ep
JOIN "Exam" e ON ep.exam_id = e.id
WHERE e.title = 'Đề 01 — Full Reading · 4 Parts'
ORDER BY ep.part_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_parts.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_parts.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_parts.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_parts.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
