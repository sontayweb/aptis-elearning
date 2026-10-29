import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id as exam_id, e.title as exam_title, ep.id as part_id, ep.title as part_title,
       q.id as q_id, q.prompt, q.question_type, q.max_score, q.options, q.correct_answer
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND (ep.title ILIKE '%Text Cohesion%' OR ep.title ILIKE '%Part 2%' OR ep.part_number = 2)
ORDER BY e.title;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_all_p2.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_all_p2.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_all_p2.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_all_p2.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
content = stdout.read().decode('utf-8', errors='replace')
with open('backend/scripts/all_p2_dump.txt', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Dumped {len(content)} bytes to backend/scripts/all_p2_dump.txt")
ssh.close()
