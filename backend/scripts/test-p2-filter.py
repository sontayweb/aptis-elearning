import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8')
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('103.90.227.117', port=22, username='root', password='Taovipko0!')

sql = """
SELECT e.id, e.title, ep.title as part_title
FROM "Exam" e
JOIN "ExamPart" ep ON ep.exam_id = e.id
WHERE e.skill = 'READING' AND e.is_published = true AND ep.title LIKE '%Text Cohesion%'
ORDER BY e.title ASC;
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/q_p2_test.sql', 'wb') as f:
    f.write(sql.encode('utf-8'))
sftp.close()

cmd = 'docker cp /tmp/q_p2_test.sql wlafe5vr5fwx6rn3curavktm:/tmp/q_p2_test.sql && docker exec wlafe5vr5fwx6rn3curavktm psql -U postgres -d aptis_kytich_db -f /tmp/q_p2_test.sql'
stdin, stdout, stderr = ssh.exec_command(cmd)
print(stdout.read().decode('utf-8', errors='replace'))
ssh.close()
