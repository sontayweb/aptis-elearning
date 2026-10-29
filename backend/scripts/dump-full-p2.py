import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

# 1. First let's inspect the questions of Full Reading Part 2 for De 01..20
sql_get_full = """
SELECT e.title, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.title ILIKE '%Full Reading%' AND (ep.title ILIKE '%Text Cohesion%' OR ep.title ILIKE '%Part 2%' OR ep.part_number = 2)
ORDER BY e.title, q.question_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/get_full_p2.sql', 'wb') as f:
    f.write(sql_get_full.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/get_full_p2.sql wlafe5vr5fwx6rn3curavktm:/tmp/get_full_p2.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/get_full_p2.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
content = stdout.read().decode('utf-8', errors='replace')
with open('backend/scripts/full_p2_dump.txt', 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Dumped {len(content)} bytes of Full Reading Part 2")
ssh.close()
