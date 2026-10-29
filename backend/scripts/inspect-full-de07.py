import paramiko
import sys
import json

if sys.platform.startswith('win'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!', look_for_keys=False, allow_agent=False)

sql = """
SELECT ep.part_number, ep.title, ep.passage_text, q.question_number, q.question_type, q.prompt, q.options::text, q.correct_answer
FROM "ExamPart" ep
JOIN "Question" q ON q.part_id = ep.id
WHERE ep.exam_id = 'a9c8bccc-2d79-4b2f-b91d-75f93acee636' AND ep.part_number = 5
ORDER BY q.question_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_de07.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

stdin, stdout, stderr = ssh.exec_command('docker exec -i wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db < /tmp/q_de07.sql')
out = stdout.read().decode('utf-8', errors='replace')
print("EXAM 07 FULL DETAILS:\n", out[:4000])

ssh.close()
