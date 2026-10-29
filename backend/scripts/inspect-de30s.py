import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id, e.title, q.id as q_id, q.options::text as options_text, q.correct_answer
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.title LIKE 'Đề 33%' OR e.title LIKE 'Đề 34%' OR e.title LIKE 'Đề 36%' OR e.title LIKE 'Đề 37%';
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/chk_de30s.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/chk_de30s.sql wlafe5vr5fwx6rn3curavktm:/tmp/chk_de30s.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/chk_de30s.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
content = stdout.read().decode('utf-8')
ssh.close()

with open('backend/scripts/de30s_options.txt', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Dumped {len(content)} bytes to backend/scripts/de30s_options.txt")
