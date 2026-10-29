import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT q.id, q.question_number, q.prompt, q.options, q.correct_answer, q.max_score
FROM "Question" q
JOIN "ExamPart" ep ON ep.id = q.part_id
WHERE ep.exam_id = 'aebb3f72-9280-4bc7-a9cc-d503c46b08be'
ORDER BY q.question_number;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_de3.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_de3.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_de3.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_de3.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print("STDOUT:", stdout.read().decode('utf-8', errors='replace'))
print("STDERR:", stderr.read().decode('utf-8', errors='replace'))
ssh.close()
