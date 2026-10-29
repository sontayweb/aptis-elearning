import paramiko
import sys
import json

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = """
SELECT e.id, e.title, ep.part_number, ep.title as part_title, length(ep.passage_text) as passage_len, count(q.id) as q_count
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
LEFT JOIN "Question" q ON q.part_id = ep.id
WHERE e.title LIKE '%07%' AND e.skill = 'READING'
GROUP BY e.id, e.title, ep.part_number, ep.title, ep.passage_text
ORDER BY e.title, ep.part_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_child.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/q_child.sql')
out = stdout.read().decode('utf-8', errors='replace')
print("RESULTS:\n", out)

ssh.close()
