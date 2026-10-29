import paramiko
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id, e.title, q.question_number, q.prompt, q.options, q.correct_answer
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
JOIN "Question" q ON q.part_id = ep.id
WHERE e.skill = 'READING' AND (ep.title ILIKE '%Part 1%' OR ep.part_number = 1)
ORDER BY e.title, q.question_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/dump_all_p1.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/dump_all_p1.sql wlafe5vr5fwx6rn3curavktm:/tmp/dump_all_p1.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/dump_all_p1.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
content = stdout.read().decode('utf-8', errors='replace')
with open('backend/scripts/dump_all_p1_out.txt', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dumped", len(content), "bytes to backend/scripts/dump_all_p1_out.txt")
ssh.close()
