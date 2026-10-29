import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT q.max_score, count(q.id)
FROM "Question" q
JOIN "ExamPart" ep ON q.part_id = ep.id
JOIN "Exam" e ON ep.exam_id = e.id
WHERE e.skill = 'READING' AND ep.part_number = 1
GROUP BY q.max_score;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/chk_p1.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = "docker cp /tmp/chk_p1.sql wlafe5vr5fwx6rn3curavktm:/tmp/chk_p1.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/chk_p1.sql"
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Part 1 max_score distribution:")
print(stdout.read().decode('utf-8'))
ssh.close()
