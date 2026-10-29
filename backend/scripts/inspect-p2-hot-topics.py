import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id, e.title, ep.title as part_title, q.id as q_id, q.prompt, q.options, q.correct_answer
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.title ILIKE '%film%' 
   OR e.title ILIKE '%sport%' 
   OR e.title ILIKE '%coffee%' 
   OR e.title ILIKE '%singer%' 
   OR e.title ILIKE '%project%' 
   OR e.title ILIKE '%cafe%'
ORDER BY e.title;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_p2_topics.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_p2_topics.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_p2_topics.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_p2_topics.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
content = stdout.read().decode('utf-8', errors='replace')
with open('backend/scripts/p2_topics_out.txt', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Dumped {len(content)} bytes to backend/scripts/p2_topics_out.txt")
ssh.close()
